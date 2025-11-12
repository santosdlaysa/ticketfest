import { Order } from '../entities/Order.js';

export interface OrderItem {
  ticketId: string;
  quantity: number;
  price: number;
}

export interface TicketInstance {
  ticketId: string;
  orderItemId: string;
  qrCode: string;
  qrCodeData: string;
}

export interface IOrderRepository {
  create(order: Order, items: OrderItem[]): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  update(order: Order): Promise<Order>;
  createTicketInstance(instance: TicketInstance): Promise<void>;
  findOrderWithDetails(id: string): Promise<any>;
  findUserOrdersWithDetails(userId: string): Promise<any[]>;
}
