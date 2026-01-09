import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { CartService } from '../services/cart.service.js';
import { validate, addToCartSchema, updateCartItemSchema } from '../utils/validation.js';

const cartService = new CartService();

function getSessionId(req: Request, res: Response): string {
  let sessionId = req.headers['x-session-id'] as string;

  console.log('[Cart] Received sessionId from header:', sessionId);

  if (!sessionId) {
    sessionId = randomUUID();
    console.log('[Cart] Created new sessionId:', sessionId);
  }

  // Always return the session ID in the response header
  res.setHeader('X-Session-Id', sessionId);

  return sessionId;
}

export class CartController {
  async getCart(req: Request, res: Response) {
    // Always use sessionId for cart consistency (sessionId takes priority)
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await cartService.getCart(userId, sessionId);
    res.status(200).json(cart);
  }

  async addToCart(req: Request, res: Response) {
    const { ticketId, quantity } = validate(addToCartSchema)(req.body);
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await cartService.addToCart(ticketId, quantity, userId, sessionId);
    res.status(200).json(cart);
  }

  async updateCartItem(req: Request, res: Response) {
    const { itemId } = req.params;
    const { quantity } = validate(updateCartItemSchema)(req.body);
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await cartService.updateCartItem(itemId, quantity, userId, sessionId);
    res.status(200).json(cart);
  }

  async removeFromCart(req: Request, res: Response) {
    const { itemId } = req.params;
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const cart = await cartService.removeFromCart(itemId, userId, sessionId);
    res.status(200).json(cart);
  }

  async clearCart(req: Request, res: Response) {
    const sessionId = getSessionId(req, res);
    const userId = req.user?.id;

    const result = await cartService.clearCart(userId, sessionId);
    res.status(200).json(result);
  }
}
