import { IOrderRepository } from '../../../domain/repositories/IOrderRepository.js';
import { ISplitTransactionRepository } from '../../../domain/repositories/ISplitTransactionRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IPaymentService, IEmailService } from './CreateOrderUseCase.js';
import { Order } from '../../../domain/entities/Order.js';

export class ConfirmPaymentUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private paymentService: IPaymentService,
    private emailService: IEmailService,
    // Split Payment dependencies (optional for backward compatibility)
    private splitTransactionRepository?: ISplitTransactionRepository,
    private organizerAccountRepository?: IOrganizerAccountRepository
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

    // ============================================
    // COMPLETE SPLIT TRANSACTION
    // ============================================
    if (this.splitTransactionRepository && this.organizerAccountRepository) {
      try {
        // Find split transaction for this order
        const splitTransaction = await this.splitTransactionRepository.findByOrderId(orderId);

        if (splitTransaction && splitTransaction.canProcess()) {
          // Get organizer account
          const organizerAccount = await this.organizerAccountRepository.findById(
            splitTransaction.organizerAccountId
          );

          if (organizerAccount) {
            // Start processing
            splitTransaction.startProcessing();

            // Release pending balance to available
            organizerAccount.releasePendingToAvailable(splitTransaction.organizerAmount);
            await this.organizerAccountRepository.update(organizerAccount);

            // Complete the split transaction
            splitTransaction.complete(paymentId);
            await this.splitTransactionRepository.update(splitTransaction);

            console.log(`Split transaction completed for order ${orderId}. Organizer received: ${splitTransaction.organizerAmount}`);
          }
        }
      } catch (error) {
        // Log error but don't fail the payment confirmation
        console.error('Split transaction completion error:', error);
      }
    }

    return updatedOrder;
  }
}
