import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  event_id: string | null;
  min_purchase: number | null;
  active: boolean;
  created_at: Date;
}

export interface CreateCouponData {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number;
  validFrom: Date;
  validUntil: Date;
  eventId?: string;
  minPurchase?: number;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    description: string | null;
  };
  discount?: number;
  error?: string;
}

export class CouponService {
  async create(data: CreateCouponData, organizerId: string): Promise<Coupon> {
    // Check if code already exists
    const existing = await query<Coupon>(
      'SELECT id FROM coupons WHERE UPPER(code) = UPPER($1)',
      [data.code]
    );

    if (existing.rows.length > 0) {
      throw new AppError(409, 'Coupon code already exists');
    }

    // If event-specific, verify organizer owns the event
    if (data.eventId) {
      const event = await query<{ organizer_id: string }>(
        'SELECT organizer_id FROM events WHERE id = $1',
        [data.eventId]
      );

      if (event.rows.length === 0) {
        throw new AppError(404, 'Event not found');
      }

      if (event.rows[0].organizer_id !== organizerId) {
        throw new AppError(403, 'Not authorized to create coupon for this event');
      }
    }

    const result = await query<Coupon>(
      `INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_until, event_id, min_purchase)
       VALUES (UPPER($1), $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.code,
        data.description || null,
        data.discountType,
        data.discountValue,
        data.maxUses || null,
        data.validFrom,
        data.validUntil,
        data.eventId || null,
        data.minPurchase || null,
      ]
    );

    logger.info('Coupon created', {
      type: 'coupon',
      action: 'create',
      couponId: result.rows[0].id,
      code: data.code,
    });

    return result.rows[0];
  }

  async validate(code: string, subtotal: number, eventId?: string): Promise<ValidateCouponResult> {
    const result = await query<Coupon>(
      'SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)',
      [code]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'Cupom nao encontrado' };
    }

    const coupon = result.rows[0];

    // Check if active
    if (!coupon.active) {
      return { valid: false, error: 'Cupom inativo' };
    }

    // Check validity dates
    const now = new Date();
    if (now < new Date(coupon.valid_from)) {
      return { valid: false, error: 'Cupom ainda nao esta valido' };
    }

    if (now > new Date(coupon.valid_until)) {
      return { valid: false, error: 'Cupom expirado' };
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { valid: false, error: 'Cupom esgotado' };
    }

    // Check event restriction
    if (coupon.event_id && eventId && coupon.event_id !== eventId) {
      return { valid: false, error: 'Cupom nao valido para este evento' };
    }

    // Check minimum purchase
    if (coupon.min_purchase !== null && subtotal < Number(coupon.min_purchase)) {
      return {
        valid: false,
        error: `Compra minima de R$ ${Number(coupon.min_purchase).toFixed(2)} necessaria`,
      };
    }

    // Calculate discount
    let discount: number;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = subtotal * (Number(coupon.discount_value) / 100);
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal);
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
        description: coupon.description,
      },
      discount: Math.round(discount * 100) / 100,
    };
  }

  async apply(couponId: string): Promise<void> {
    await query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
      [couponId]
    );

    logger.info('Coupon applied', {
      type: 'coupon',
      action: 'apply',
      couponId,
    });
  }

  async revert(couponId: string): Promise<void> {
    await query(
      'UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE id = $1',
      [couponId]
    );

    logger.info('Coupon usage reverted', {
      type: 'coupon',
      action: 'revert',
      couponId,
    });
  }

  async getByOrganizer(organizerId: string) {
    const result = await query<Coupon>(
      `SELECT c.*, e.name as event_name
       FROM coupons c
       LEFT JOIN events e ON c.event_id = e.id
       WHERE c.event_id IS NULL OR e.organizer_id = $1
       ORDER BY c.created_at DESC`,
      [organizerId]
    );

    return result.rows.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      maxUses: c.max_uses,
      usedCount: c.used_count,
      validFrom: c.valid_from,
      validUntil: c.valid_until,
      eventId: c.event_id,
      eventName: (c as any).event_name,
      minPurchase: c.min_purchase ? Number(c.min_purchase) : null,
      active: c.active,
      createdAt: c.created_at,
    }));
  }

  async getByEvent(eventId: string) {
    const result = await query<Coupon>(
      'SELECT * FROM coupons WHERE event_id = $1 OR event_id IS NULL ORDER BY created_at DESC',
      [eventId]
    );

    return result.rows.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      maxUses: c.max_uses,
      usedCount: c.used_count,
      validFrom: c.valid_from,
      validUntil: c.valid_until,
      active: c.active,
    }));
  }

  async update(
    couponId: string,
    data: Partial<CreateCouponData> & { active?: boolean },
    organizerId: string
  ) {
    // Verify ownership
    const coupon = await query<Coupon & { organizer_id: string }>(
      `SELECT c.*, e.organizer_id
       FROM coupons c
       LEFT JOIN events e ON c.event_id = e.id
       WHERE c.id = $1`,
      [couponId]
    );

    if (coupon.rows.length === 0) {
      throw new AppError(404, 'Coupon not found');
    }

    if (coupon.rows[0].organizer_id && coupon.rows[0].organizer_id !== organizerId) {
      throw new AppError(403, 'Not authorized');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.discountValue !== undefined) {
      updates.push(`discount_value = $${paramIndex++}`);
      values.push(data.discountValue);
    }
    if (data.maxUses !== undefined) {
      updates.push(`max_uses = $${paramIndex++}`);
      values.push(data.maxUses);
    }
    if (data.validFrom !== undefined) {
      updates.push(`valid_from = $${paramIndex++}`);
      values.push(data.validFrom);
    }
    if (data.validUntil !== undefined) {
      updates.push(`valid_until = $${paramIndex++}`);
      values.push(data.validUntil);
    }
    if (data.minPurchase !== undefined) {
      updates.push(`min_purchase = $${paramIndex++}`);
      values.push(data.minPurchase);
    }
    if (data.active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(data.active);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No fields to update');
    }

    values.push(couponId);

    const result = await query<Coupon>(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async delete(couponId: string, organizerId: string) {
    // Verify ownership
    const coupon = await query<{ organizer_id: string }>(
      `SELECT e.organizer_id
       FROM coupons c
       LEFT JOIN events e ON c.event_id = e.id
       WHERE c.id = $1`,
      [couponId]
    );

    if (coupon.rows.length === 0) {
      throw new AppError(404, 'Coupon not found');
    }

    if (coupon.rows[0].organizer_id && coupon.rows[0].organizer_id !== organizerId) {
      throw new AppError(403, 'Not authorized');
    }

    await query('DELETE FROM coupons WHERE id = $1', [couponId]);

    logger.info('Coupon deleted', {
      type: 'coupon',
      action: 'delete',
      couponId,
    });
  }
}

export const couponService = new CouponService();
