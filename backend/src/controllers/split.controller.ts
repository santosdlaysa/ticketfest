import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

// Default platform fee percentage (can be overridden by env)
const DEFAULT_PLATFORM_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '8');
const DEFAULT_PLATFORM_FIXED_FEE = parseFloat(process.env.PLATFORM_FIXED_FEE || '0');

export class SplitController {
  /**
   * Get split rule for an event
   */
  async getSplitRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verify user has access to this event
      const event = await query(
        `SELECT organizer_id FROM events WHERE id = $1`,
        [eventId]
      );

      if (event.rows.length === 0) {
        throw new AppError(404, 'Event not found');
      }

      if (userRole !== 'ADMIN' && event.rows[0].organizer_id !== userId) {
        throw new AppError(403, 'You do not have permission to view this split rule');
      }

      const result = await query(
        `SELECT sr.*, oa.company_name, oa.verified
         FROM split_rules sr
         JOIN organizer_accounts oa ON sr.organizer_account_id = oa.id
         WHERE sr.event_id = $1`,
        [eventId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Split rule not found for this event' });
      }

      return res.json(this.formatSplitRule(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create split rule for an event
   */
  async createSplitRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const {
        platformPercentage = DEFAULT_PLATFORM_PERCENTAGE,
        organizerPercentage = 100 - DEFAULT_PLATFORM_PERCENTAGE,
        platformFixedFee = DEFAULT_PLATFORM_FIXED_FEE,
      } = req.body;

      // Verify event exists and user owns it
      const event = await query(
        `SELECT organizer_id FROM events WHERE id = $1`,
        [eventId]
      );

      if (event.rows.length === 0) {
        throw new AppError(404, 'Event not found');
      }

      if (userRole !== 'ADMIN' && event.rows[0].organizer_id !== userId) {
        throw new AppError(403, 'You do not have permission to create split rule for this event');
      }

      // Check if split rule already exists
      const existing = await query(
        `SELECT id FROM split_rules WHERE event_id = $1`,
        [eventId]
      );

      if (existing.rows.length > 0) {
        throw new AppError(400, 'Split rule already exists for this event');
      }

      // Get organizer account
      const organizerAccount = await query(
        `SELECT id, verified FROM organizer_accounts WHERE user_id = $1`,
        [event.rows[0].organizer_id]
      );

      if (organizerAccount.rows.length === 0) {
        throw new AppError(400, 'Organizer must have an organizer account to create split rules');
      }

      // Validate percentages
      const totalPercentage = platformPercentage + organizerPercentage;
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new AppError(400, 'Platform and organizer percentages must sum to 100%');
      }

      // Admin can set any percentage, organizers use default minimum
      if (userRole !== 'ADMIN' && platformPercentage < DEFAULT_PLATFORM_PERCENTAGE) {
        throw new AppError(400, `Platform percentage must be at least ${DEFAULT_PLATFORM_PERCENTAGE}%`);
      }

      const result = await query(
        `INSERT INTO split_rules (
          event_id,
          organizer_account_id,
          platform_percentage,
          organizer_percentage,
          platform_fixed_fee,
          active
        ) VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING *`,
        [
          eventId,
          organizerAccount.rows[0].id,
          platformPercentage,
          organizerPercentage,
          platformFixedFee,
        ]
      );

      return res.status(201).json(this.formatSplitRule(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update split rule (admin only - to change percentages)
   */
  async updateSplitRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userRole = req.user!.role;
      const { platformPercentage, organizerPercentage, platformFixedFee, active } = req.body;

      if (userRole !== 'ADMIN') {
        throw new AppError(403, 'Only admins can update split rules');
      }

      // Validate percentages if provided
      if (platformPercentage !== undefined && organizerPercentage !== undefined) {
        const totalPercentage = platformPercentage + organizerPercentage;
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new AppError(400, 'Platform and organizer percentages must sum to 100%');
        }
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (platformPercentage !== undefined) {
        updates.push(`platform_percentage = $${paramIndex++}`);
        values.push(platformPercentage);
      }
      if (organizerPercentage !== undefined) {
        updates.push(`organizer_percentage = $${paramIndex++}`);
        values.push(organizerPercentage);
      }
      if (platformFixedFee !== undefined) {
        updates.push(`platform_fixed_fee = $${paramIndex++}`);
        values.push(platformFixedFee);
      }
      if (active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(active);
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No fields to update');
      }

      updates.push('updated_at = NOW()');
      values.push(eventId);

      const result = await query(
        `UPDATE split_rules SET ${updates.join(', ')} WHERE event_id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Split rule not found');
      }

      return res.json(this.formatSplitRule(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate split preview (show how much platform and organizer will receive)
   */
  async calculateSplit(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { amount } = req.query;

      if (!amount || isNaN(Number(amount))) {
        throw new AppError(400, 'Amount is required and must be a number');
      }

      const totalAmount = parseFloat(amount as string);

      const result = await query(
        `SELECT * FROM split_rules WHERE event_id = $1 AND active = TRUE`,
        [eventId]
      );

      let platformPercentage = DEFAULT_PLATFORM_PERCENTAGE;
      let organizerPercentage = 100 - DEFAULT_PLATFORM_PERCENTAGE;
      let platformFixedFee = DEFAULT_PLATFORM_FIXED_FEE;

      if (result.rows.length > 0) {
        const rule = result.rows[0];
        platformPercentage = rule.platform_percentage;
        organizerPercentage = rule.organizer_percentage;
        platformFixedFee = rule.platform_fixed_fee;
      }

      const platformPercentageAmount = (totalAmount * platformPercentage) / 100;
      const platformAmount = platformPercentageAmount + platformFixedFee;
      const organizerAmount = totalAmount - platformAmount;

      return res.json({
        totalAmount,
        platformPercentage,
        organizerPercentage,
        platformFixedFee,
        platformAmount: Math.round(platformAmount * 100) / 100,
        organizerAmount: Math.round(organizerAmount * 100) / 100,
        hasCustomRule: result.rows.length > 0,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get split transactions for an event (organizer view)
   */
  async getSplitTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { limit = 50, offset = 0 } = req.query;

      // Verify user has access
      const event = await query(
        `SELECT organizer_id FROM events WHERE id = $1`,
        [eventId]
      );

      if (event.rows.length === 0) {
        throw new AppError(404, 'Event not found');
      }

      if (userRole !== 'ADMIN' && event.rows[0].organizer_id !== userId) {
        throw new AppError(403, 'You do not have permission to view these transactions');
      }

      const result = await query(
        `SELECT st.*, o.id as order_id, o.created_at as order_date
         FROM split_transactions st
         JOIN orders o ON st.order_id = o.id
         JOIN split_rules sr ON st.split_rule_id = sr.id
         WHERE sr.event_id = $1
         ORDER BY st.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        [eventId]
      );

      const countResult = await query(
        `SELECT COUNT(*) as count
         FROM split_transactions st
         JOIN split_rules sr ON st.split_rule_id = sr.id
         WHERE sr.event_id = $1`,
        [eventId]
      );

      // Calculate totals
      const totalsResult = await query(
        `SELECT
           SUM(st.total_amount) as total_amount,
           SUM(st.platform_amount) as total_platform,
           SUM(st.organizer_amount) as total_organizer
         FROM split_transactions st
         JOIN split_rules sr ON st.split_rule_id = sr.id
         WHERE sr.event_id = $1 AND st.status = 'COMPLETED'`,
        [eventId]
      );

      return res.json({
        transactions: result.rows.map(t => ({
          id: t.id,
          orderId: t.order_id,
          totalAmount: t.total_amount,
          platformAmount: t.platform_amount,
          organizerAmount: t.organizer_amount,
          platformFee: t.platform_fee,
          status: t.status,
          orderDate: t.order_date,
          createdAt: t.created_at,
          processedAt: t.processed_at,
        })),
        totals: {
          totalAmount: totalsResult.rows[0]?.total_amount || 0,
          totalPlatform: totalsResult.rows[0]?.total_platform || 0,
          totalOrganizer: totalsResult.rows[0]?.total_organizer || 0,
        },
        total: parseInt(countResult.rows[0].count, 10),
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform default settings
   */
  async getPlatformDefaults(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.json({
        platformPercentage: DEFAULT_PLATFORM_PERCENTAGE,
        organizerPercentage: 100 - DEFAULT_PLATFORM_PERCENTAGE,
        platformFixedFee: DEFAULT_PLATFORM_FIXED_FEE,
      });
    } catch (error) {
      next(error);
    }
  }

  private formatSplitRule(rule: any) {
    return {
      id: rule.id,
      eventId: rule.event_id,
      organizerAccountId: rule.organizer_account_id,
      platformPercentage: rule.platform_percentage,
      organizerPercentage: rule.organizer_percentage,
      platformFixedFee: rule.platform_fixed_fee,
      active: rule.active,
      organizerVerified: rule.verified,
      companyName: rule.company_name,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
    };
  }
}

export const splitController = new SplitController();
