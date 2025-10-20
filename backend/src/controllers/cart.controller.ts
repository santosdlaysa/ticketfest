import { Request, Response } from 'express';
import { CartService } from '../services/cart.service.js';
import { validate, addToCartSchema, updateCartItemSchema } from '../utils/validation.js';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response) {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await cartService.getCart(userId, sessionId);
    res.status(200).json(cart);
  }

  async addToCart(req: Request, res: Response) {
    const { ticketId, quantity } = validate(addToCartSchema)(req.body);
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await cartService.addToCart(ticketId, quantity, userId, sessionId);
    res.status(200).json(cart);
  }

  async updateCartItem(req: Request, res: Response) {
    const { itemId } = req.params;
    const { quantity } = validate(updateCartItemSchema)(req.body);
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await cartService.updateCartItem(itemId, quantity, userId, sessionId);
    res.status(200).json(cart);
  }

  async removeFromCart(req: Request, res: Response) {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const cart = await cartService.removeFromCart(itemId, userId, sessionId);
    res.status(200).json(cart);
  }

  async clearCart(req: Request, res: Response) {
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const result = await cartService.clearCart(userId, sessionId);
    res.status(200).json(result);
  }
}
