import { Request, Response } from 'express';
import { OrderUseCaseFactory } from '../../../infrastructure/factories/OrderUseCaseFactory.js';
import { validate, createOrderSchema } from '../../../utils/validation.js';

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const data = validate(createOrderSchema)(req.body);
    const userId = req.user!.id;

    const useCase = OrderUseCaseFactory.createOrderUseCase();
    const result = await useCase.execute(data, userId);

    res.status(201).json(result);
  }

  async getOrderById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const useCase = OrderUseCaseFactory.getOrderByIdUseCase();
    const order = await useCase.execute(id, userId, userRole);

    res.status(200).json(order);
  }

  async getUserOrders(req: Request, res: Response) {
    const userId = req.user!.id;

    const useCase = OrderUseCaseFactory.getUserOrdersUseCase();
    const orders = await useCase.execute(userId);

    res.status(200).json(orders);
  }

  async confirmPayment(req: Request, res: Response) {
    const { id } = req.params;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const useCase = OrderUseCaseFactory.confirmPaymentUseCase();
    const order = await useCase.execute(id, paymentId);

    res.status(200).json(order);
  }

  async cancelOrder(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const useCase = OrderUseCaseFactory.cancelOrderUseCase();
    const result = await useCase.execute(id, userId, userRole);

    res.status(200).json(result);
  }
}
