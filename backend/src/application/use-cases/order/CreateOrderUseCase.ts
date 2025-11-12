import { Order, PaymentMethod } from '../../../domain/entities/Order.js';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository.js';
import { ITicketRepository } from '../../../domain/repositories/ITicketRepository.js';
import { ICouponRepository } from '../../../domain/repositories/ICouponRepository.js';
import { CreateOrderDTO } from '../../dtos/OrderDTO.js';

export interface IQRCodeService {
  generateQRCode(data: any): Promise<{ code: string; data: string }>;
}

export interface IPaymentService {
  createPaymentIntent(amount: number, currency: string, metadata: any): Promise<any>;
  generatePixPayment(amount: number, orderId: string): Promise<any>;
  generateBoleto(amount: number, orderId: string, customerData: any): Promise<any>;
}

export interface IEmailService {
  sendOrderConfirmation(email: string, data: any): Promise<void>;
  sendTickets(email: string, tickets: any[]): Promise<void>;
}

export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private ticketRepository: ITicketRepository,
    private couponRepository: ICouponRepository,
    private qrCodeService: IQRCodeService,
    private paymentService: IPaymentService
  ) {}

  async execute(data: CreateOrderDTO, userId: string): Promise<any> {
    // Validate and get tickets
    const ticketsData = await Promise.all(
      data.items.map(async (item) => {
        const ticket = await this.ticketRepository.findById(item.ticketId);

        if (!ticket) {
          throw new Error(`Ticket ${item.ticketId} not found`);
        }

        if (!ticket.canSell(item.quantity)) {
          const available = ticket.getAvailableQuantity();
          throw new Error(`Only ${available} tickets available for ${ticket.name}`);
        }

        // Check sales period
        if (!ticket.isAvailable()) {
          throw new Error(`Ticket ${ticket.name} is not available for sale`);
        }

        return { ticket, quantity: item.quantity };
      })
    );

    // Ensure all tickets are from the same event
    const eventIds = new Set(ticketsData.map((t) => t.ticket.eventId));
    if (eventIds.size > 1) {
      throw new Error('All tickets must be from the same event');
    }

    const eventId = ticketsData[0].ticket.eventId;

    // Calculate totals
    let subtotal = ticketsData.reduce(
      (sum, t) => sum + t.ticket.price * t.quantity,
      0
    );
    let discount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (data.couponCode) {
      coupon = await this.couponRepository.findByCode(data.couponCode);

      if (!coupon || !coupon.active) {
        throw new Error('Invalid coupon code');
      }

      if (!coupon.isValid(eventId, subtotal)) {
        throw new Error('Coupon is not valid for this purchase');
      }

      discount = coupon.calculateDiscount(subtotal);
      coupon.incrementUsage();
      await this.couponRepository.update(coupon);
    }

    const total = subtotal - discount;

    // Create order
    const order = Order.create({
      userId,
      eventId,
      subtotal,
      discount,
      total,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode,
    });

    // Create order items
    const orderItems = ticketsData.map((t) => ({
      ticketId: t.ticket.id,
      quantity: t.quantity,
      price: t.ticket.price,
    }));

    const createdOrder = await this.orderRepository.create(order, orderItems);

    // Generate QR codes and update ticket sold count
    for (const { ticket, quantity } of ticketsData) {
      // This would be handled in the repository with a transaction
      ticket.incrementSold(quantity);
      await this.ticketRepository.update(ticket);
    }

    // Process payment
    let paymentData: any = {};

    if (
      data.paymentMethod === PaymentMethod.CREDIT_CARD ||
      data.paymentMethod === PaymentMethod.DEBIT_CARD
    ) {
      const paymentIntent = await this.paymentService.createPaymentIntent(
        total,
        'brl',
        {
          orderId: createdOrder.id,
          userId,
        }
      );
      paymentData = { paymentIntent };
    } else if (data.paymentMethod === PaymentMethod.PIX) {
      const pixData = await this.paymentService.generatePixPayment(
        total,
        createdOrder.id
      );
      paymentData = { pix: pixData };
    } else if (data.paymentMethod === PaymentMethod.BOLETO) {
      // Would need to get user data
      const boletoData = await this.paymentService.generateBoleto(
        total,
        createdOrder.id,
        { name: '', cpf: '', email: '' }
      );
      paymentData = { boleto: boletoData };
    }

    // Get full order with relations
    const fullOrder = await this.orderRepository.findOrderWithDetails(
      createdOrder.id
    );

    return {
      order: fullOrder,
      payment: paymentData,
    };
  }
}
