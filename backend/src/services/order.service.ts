import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { QRCodeService } from './qrcode.service.js';
import { PaymentService } from './payment.service.js';
import { EmailService } from './email.service.js';

const qrCodeService = new QRCodeService();
const paymentService = new PaymentService();
const emailService = new EmailService();

export interface CreateOrderData {
  items: Array<{
    ticketId: string;
    quantity: number;
  }>;
  couponCode?: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
}

export class OrderService {
  async createOrder(data: CreateOrderData, userId: string) {
    // Validate and get tickets
    const tickets = await Promise.all(
      data.items.map(async (item) => {
        const ticket = await prisma.ticket.findUnique({
          where: { id: item.ticketId },
          include: { event: true },
        });

        if (!ticket) {
          throw new AppError(404, `Ticket ${item.ticketId} not found`);
        }

        const available = ticket.quantity - ticket.sold;
        if (available < item.quantity) {
          throw new AppError(400, `Only ${available} tickets available for ${ticket.name}`);
        }

        // Check sales period
        const now = new Date();
        if (now < ticket.salesStart || now > ticket.salesEnd) {
          throw new AppError(400, `Ticket ${ticket.name} is not available for sale`);
        }

        return { ticket, quantity: item.quantity };
      })
    );

    // Ensure all tickets are from the same event
    const eventIds = new Set(tickets.map((t) => t.ticket.eventId));
    if (eventIds.size > 1) {
      throw new AppError(400, 'All tickets must be from the same event');
    }

    const eventId = tickets[0].ticket.eventId;

    // Calculate totals
    let subtotal = tickets.reduce((sum, t) => sum + t.ticket.price * t.quantity, 0);
    let discount = 0;

    // Apply coupon if provided
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode },
      });

      if (!coupon || !coupon.active) {
        throw new AppError(404, 'Invalid coupon code');
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        throw new AppError(400, 'Coupon expired or not yet valid');
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new AppError(400, 'Coupon usage limit reached');
      }

      if (coupon.eventId && coupon.eventId !== eventId) {
        throw new AppError(400, 'Coupon not valid for this event');
      }

      if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        throw new AppError(400, `Minimum purchase of R$ ${coupon.minPurchase} required`);
      }

      // Calculate discount
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
      } else {
        discount = coupon.discountValue;
      }

      // Update coupon usage
      await prisma.coupon.update({
        where: { code: data.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = subtotal - discount;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          eventId,
          subtotal,
          discount,
          total,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PENDING',
          status: 'PENDING',
          couponCode: data.couponCode,
        },
      });

      // Create order items
      for (const { ticket, quantity } of tickets) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            ticketId: ticket.id,
            quantity,
            price: ticket.price,
          },
        });

        // Generate QR codes for each ticket instance
        for (let i = 0; i < quantity; i++) {
          const qrData = {
            ticketId: ticket.id,
            orderId: newOrder.id,
            userId,
            eventId,
            timestamp: Date.now(),
          };

          const { code, data: encryptedData } = await qrCodeService.generateQRCode(qrData);

          await tx.ticketInstance.create({
            data: {
              orderItemId: orderItem.id,
              ticketId: ticket.id,
              qrCode: code,
              qrCodeData: encryptedData,
            },
          });
        }

        // Update ticket sold count
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { sold: { increment: quantity } },
        });
      }

      return newOrder;
    });

    // Process payment
    let paymentData: any = {};

    if (data.paymentMethod === 'CREDIT_CARD' || data.paymentMethod === 'DEBIT_CARD') {
      const paymentIntent = await paymentService.createPaymentIntent(total, 'brl', {
        orderId: order.id,
        userId,
      });
      paymentData = { paymentIntent };

      // Update order with payment ID
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: paymentIntent.id },
      });
    } else if (data.paymentMethod === 'PIX') {
      const pixData = await paymentService.generatePixPayment(total, order.id);
      paymentData = { pix: pixData };
    } else if (data.paymentMethod === 'BOLETO') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const boletoData = await paymentService.generateBoleto(total, order.id, {
        name: user!.name,
        cpf: user!.cpf || '',
        email: user!.email,
      });
      paymentData = { boleto: boletoData };
    }

    // Get full order with relations
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        event: true,
        items: {
          include: {
            ticket: true,
            ticketInstances: true,
          },
        },
      },
    });

    return {
      order: fullOrder,
      payment: paymentData,
    };
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            ticket: true,
            ticketInstances: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Check permission
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    return order;
  }

  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            images: true,
          },
        },
        items: {
          include: {
            ticket: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async confirmPayment(orderId: string, paymentId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        user: true,
        items: {
          include: {
            ticket: true,
            ticketInstances: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Verify payment with payment gateway
    const paymentStatus = await paymentService.verifyPayment(paymentId);

    if (paymentStatus.status !== 'paid') {
      throw new AppError(400, 'Payment not confirmed');
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paidAt: new Date(),
      },
    });

    // Send confirmation email
    await emailService.sendOrderConfirmation(order.user.email, {
      orderId: order.id,
      eventName: order.event.name,
      eventDate: order.event.date.toLocaleDateString('pt-BR'),
      tickets: order.items.map((item) => ({
        name: item.ticket.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
    });

    // Send tickets with QR codes
    const tickets = order.items.flatMap((item) =>
      item.ticketInstances.map((instance) => ({
        eventName: order.event.name,
        ticketName: item.ticket.name,
        qrCode: instance.qrCode,
      }))
    );

    await emailService.sendTickets(order.user.email, tickets);

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    if (order.status === 'CANCELLED') {
      throw new AppError(400, 'Order already cancelled');
    }

    // Process refund if paid
    if (order.paymentStatus === 'PAID' && order.paymentId) {
      await paymentService.processRefund(order.paymentId);
    }

    // Update order and restore ticket counts
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
        },
      });

      // Restore ticket counts
      for (const item of order.items) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { sold: { decrement: item.quantity } },
        });
      }
    });

    return { message: 'Order cancelled successfully' };
  }
}
