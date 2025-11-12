import { IOrderRepository } from '../../../domain/repositories/IOrderRepository.js';
import { IPaymentService, IEmailService } from './CreateOrderUseCase.js';
import { Order } from '../../../domain/entities/Order.js';

export class ConfirmPaymentUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private paymentService: IPaymentService,
    private emailService: IEmailService
  ) {}

  async execute(orderId: string, paymentId: string): Promise<any> {
    const orderData = await this.orderRepository.findOrderWithDetails(orderId);

    if (!orderData) {
      throw new Error('Order not found');
    }

    // Restore order entity
    const order = Order.restore({
      id: orderData.id,
      userId: orderData.userId,
      eventId: orderData.eventId,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      paymentId: orderData.paymentId,
      status: orderData.status,
      couponCode: orderData.couponCode,
      createdAt: orderData.createdAt,
      paidAt: orderData.paidAt,
    });

    // Verify payment with payment gateway
    const paymentStatus = await this.paymentService.verifyPayment(paymentId);

    if (paymentStatus.status !== 'paid') {
      throw new Error('Payment not confirmed');
    }

    // Update order
    order.confirmPayment(paymentId);
    const updatedOrder = await this.orderRepository.update(order);

    // Send confirmation email
    await this.emailService.sendOrderConfirmation(orderData.user.email, {
      orderId: orderData.id,
      eventName: orderData.event.name,
      eventDate: new Date(orderData.event.date).toLocaleDateString('pt-BR'),
      tickets: orderData.items.map((item: any) => ({
        name: item.ticket.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: orderData.total,
    });

    // Send tickets with QR codes
    const tickets = orderData.items.flatMap((item: any) =>
      item.ticketInstances.map((instance: any) => ({
        eventName: orderData.event.name,
        ticketName: item.ticket.name,
        qrCode: instance.qrCode,
      }))
    );

    await this.emailService.sendTickets(orderData.user.email, tickets);

    return updatedOrder;
  }
}
