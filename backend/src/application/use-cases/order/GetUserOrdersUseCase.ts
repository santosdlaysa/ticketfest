import { IOrderRepository } from '../../../domain/repositories/IOrderRepository.js';

export class GetUserOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(userId: string): Promise<any[]> {
    const orders = await this.orderRepository.findUserOrdersWithDetails(userId);
    return orders;
  }
}
