import { IOrderRepository } from '../../../domain/repositories/IOrderRepository.js';

export class GetOrderByIdUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, userId: string, userRole: string): Promise<any> {
    const order = await this.orderRepository.findOrderWithDetails(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Check permission
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return order;
  }
}
