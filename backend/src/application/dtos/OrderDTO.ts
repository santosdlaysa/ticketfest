import { PaymentMethod } from '../../domain/entities/Order.js';

export interface CreateOrderDTO {
  items: Array<{
    ticketId: string;
    quantity: number;
  }>;
  couponCode?: string;
  paymentMethod: PaymentMethod;
}

export interface ConfirmPaymentDTO {
  orderId: string;
  paymentId: string;
}

export interface CancelOrderDTO {
  orderId: string;
  userId: string;
  userRole: string;
}
