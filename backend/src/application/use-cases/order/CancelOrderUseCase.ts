import { Order } from '../../../domain/entities/Order.js';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository.js';
import { ITicketRepository } from '../../../domain/repositories/ITicketRepository.js';
import { IPaymentService } from './CreateOrderUseCase.js';

export class CancelOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private ticketRepository: ITicketRepository,
    private paymentService: IPaymentService
  ) {}

  async execute(orderId: string, userId: string, userRole: string): Promise<{ message: string }> {
    const orderData = await this.orderRepository.findOrderWithDetails(orderId);

    if (!orderData) {
      throw new Error('Order not found');
    }

    if (userRole !== 'ADMIN' && orderData.userId !== userId) {
      throw new Error('Unauthorized');
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

    if (order.isCancelled()) {
      throw new Error('Order already cancelled');
    }

    // Process refund if paid
    if (order.isPaid() && order.paymentId) {
      await this.paymentService.processRefund(order.paymentId);
      order.refund();
    }

    // Cancel order
    order.cancel();
    await this.orderRepository.update(order);

    // Restore ticket counts
    for (const item of orderData.items) {
      const ticket = await this.ticketRepository.findById(item.ticketId);
      if (ticket) {
        ticket.decrementSold(item.quantity);
        await this.ticketRepository.update(ticket);
      }
    }

    return { message: 'Order cancelled successfully' };
  }
}
