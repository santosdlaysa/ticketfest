import { Request, Response } from 'express';
import { OrderService } from '../services/order.service.js';
import { validate, createOrderSchema } from '../utils/validation.js';

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const data = validate(createOrderSchema)(req.body);
    const userId = req.user!.id;

    const result = await orderService.createOrder(data, userId);
    res.status(201).json(result);
  }

  async getOrderById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const order = await orderService.getOrderById(id, userId, userRole);
    res.status(200).json(order);
  }

  async getUserOrders(req: Request, res: Response) {
    const userId = req.user!.id;
    const orders = await orderService.getUserOrders(userId);
    res.status(200).json(orders);
  }

  async confirmPayment(req: Request, res: Response) {
    const { id } = req.params;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const order = await orderService.confirmPayment(id, paymentId);
    res.status(200).json(order);
  }

  async cancelOrder(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = await orderService.cancelOrder(id, userId, userRole);
    res.status(200).json(result);
  }
}
