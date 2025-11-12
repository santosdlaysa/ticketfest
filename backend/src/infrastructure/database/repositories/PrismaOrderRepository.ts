import { PrismaClient } from '@prisma/client';
import { Order, PaymentStatus, OrderStatus } from '../../../domain/entities/Order.js';
import { IOrderRepository, OrderItem, TicketInstance } from '../../../domain/repositories/IOrderRepository.js';

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private prisma: PrismaClient) {}

  async create(order: Order, items: OrderItem[]): Promise<Order> {
    const orderData = order.toJSON();

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          id: orderData.id,
          userId: orderData.userId,
          eventId: orderData.eventId,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          total: orderData.total,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentStatus,
          status: orderData.status,
          couponCode: orderData.couponCode,
          paymentId: orderData.paymentId,
        },
      });

      // Create order items
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            ticketId: item.ticketId,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      return newOrder;
    });

    return Order.restore({
      id: createdOrder.id,
      userId: createdOrder.userId,
      eventId: createdOrder.eventId,
      subtotal: createdOrder.subtotal,
      discount: createdOrder.discount,
      total: createdOrder.total,
      paymentMethod: createdOrder.paymentMethod as any,
      paymentStatus: createdOrder.paymentStatus as PaymentStatus,
      paymentId: createdOrder.paymentId || undefined,
      status: createdOrder.status as OrderStatus,
      couponCode: createdOrder.couponCode || undefined,
      createdAt: createdOrder.createdAt,
      paidAt: createdOrder.paidAt || undefined,
    });
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) return null;

    return Order.restore({
      id: order.id,
      userId: order.userId,
      eventId: order.eventId,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod as any,
      paymentStatus: order.paymentStatus as PaymentStatus,
      paymentId: order.paymentId || undefined,
      status: order.status as OrderStatus,
      couponCode: order.couponCode || undefined,
      createdAt: order.createdAt,
      paidAt: order.paidAt || undefined,
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) =>
      Order.restore({
        id: order.id,
        userId: order.userId,
        eventId: order.eventId,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod as any,
        paymentStatus: order.paymentStatus as PaymentStatus,
        paymentId: order.paymentId || undefined,
        status: order.status as OrderStatus,
        couponCode: order.couponCode || undefined,
        createdAt: order.createdAt,
        paidAt: order.paidAt || undefined,
      })
    );
  }

  async update(order: Order): Promise<Order> {
    const orderData = order.toJSON();

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderData.id },
      data: {
        paymentStatus: orderData.paymentStatus,
        status: orderData.status,
        paymentId: orderData.paymentId,
        paidAt: orderData.paidAt,
      },
    });

    return Order.restore({
      id: updatedOrder.id,
      userId: updatedOrder.userId,
      eventId: updatedOrder.eventId,
      subtotal: updatedOrder.subtotal,
      discount: updatedOrder.discount,
      total: updatedOrder.total,
      paymentMethod: updatedOrder.paymentMethod as any,
      paymentStatus: updatedOrder.paymentStatus as PaymentStatus,
      paymentId: updatedOrder.paymentId || undefined,
      status: updatedOrder.status as OrderStatus,
      couponCode: updatedOrder.couponCode || undefined,
      createdAt: updatedOrder.createdAt,
      paidAt: updatedOrder.paidAt || undefined,
    });
  }

  async createTicketInstance(instance: TicketInstance): Promise<void> {
    await this.prisma.ticketInstance.create({
      data: {
        ticketId: instance.ticketId,
        orderItemId: instance.orderItemId,
        qrCode: instance.qrCode,
        qrCodeData: instance.qrCodeData,
      },
    });
  }

  async findOrderWithDetails(id: string): Promise<any> {
    return await this.prisma.order.findUnique({
      where: { id },
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
  }

  async findUserOrdersWithDetails(userId: string): Promise<any[]> {
    return await this.prisma.order.findMany({
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
  }
}
