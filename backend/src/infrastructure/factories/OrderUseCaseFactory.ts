import { prisma } from '../database/prisma/PrismaClient.js';
import { PrismaOrderRepository } from '../database/repositories/PrismaOrderRepository.js';
import { PrismaTicketRepository } from '../database/repositories/PrismaTicketRepository.js';
import { PrismaCouponRepository } from '../database/repositories/PrismaCouponRepository.js';
import { QRCodeService } from '../services/QRCodeService.js';
import { PaymentService } from '../services/PaymentService.js';
import { EmailService } from '../services/EmailService.js';
import { CreateOrderUseCase } from '../../application/use-cases/order/CreateOrderUseCase.js';
import { GetOrderByIdUseCase } from '../../application/use-cases/order/GetOrderByIdUseCase.js';
import { GetUserOrdersUseCase } from '../../application/use-cases/order/GetUserOrdersUseCase.js';
import { ConfirmPaymentUseCase } from '../../application/use-cases/order/ConfirmPaymentUseCase.js';
import { CancelOrderUseCase } from '../../application/use-cases/order/CancelOrderUseCase.js';

export class OrderUseCaseFactory {
  private static orderRepository = new PrismaOrderRepository(prisma);
  private static ticketRepository = new PrismaTicketRepository(prisma);
  private static couponRepository = new PrismaCouponRepository(prisma);
  private static qrCodeService = new QRCodeService();
  private static paymentService = new PaymentService();
  private static emailService = new EmailService();

  static createOrderUseCase(): CreateOrderUseCase {
    return new CreateOrderUseCase(
      this.orderRepository,
      this.ticketRepository,
      this.couponRepository,
      this.qrCodeService,
      this.paymentService
    );
  }

  static getOrderByIdUseCase(): GetOrderByIdUseCase {
    return new GetOrderByIdUseCase(this.orderRepository);
  }

  static getUserOrdersUseCase(): GetUserOrdersUseCase {
    return new GetUserOrdersUseCase(this.orderRepository);
  }

  static confirmPaymentUseCase(): ConfirmPaymentUseCase {
    return new ConfirmPaymentUseCase(
      this.orderRepository,
      this.paymentService,
      this.emailService
    );
  }

  static cancelOrderUseCase(): CancelOrderUseCase {
    return new CancelOrderUseCase(
      this.orderRepository,
      this.ticketRepository,
      this.paymentService
    );
  }
}
