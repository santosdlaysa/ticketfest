import { Request, Response, NextFunction } from 'express';
import { couponService } from '../services/coupon.service.js';

export class CouponController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, eventId, minPurchase } = req.body;

      if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const coupon = await couponService.create(
        {
          code,
          description,
          discountType,
          discountValue,
          maxUses,
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil),
          eventId,
          minPurchase,
        },
        userId
      );

      return res.status(201).json(coupon);
    } catch (error) {
      return next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, subtotal, eventId } = req.body;

      if (!code || subtotal === undefined) {
        return res.status(400).json({ error: 'Code and subtotal are required' });
      }

      const result = await couponService.validate(code, subtotal, eventId);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  async getByOrganizer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const coupons = await couponService.getByOrganizer(userId);
      return res.json(coupons);
    } catch (error) {
      return next(error);
    }
  }

  async getByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const coupons = await couponService.getByEvent(eventId);
      return res.json(coupons);
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { couponId } = req.params;
      const coupon = await couponService.update(couponId, req.body, userId);
      return res.json(coupon);
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { couponId } = req.params;
      await couponService.delete(couponId, userId);
      return res.json({ message: 'Coupon deleted' });
    } catch (error) {
      return next(error);
    }
  }
}

export const couponController = new CouponController();
