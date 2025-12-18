import { Request, Response, NextFunction } from 'express';
import { payoutService } from '../services/payout.service.js';
import { financialService } from '../services/financial.service.js';

export class PayoutController {
  /**
   * Get organizer's financial balance
   * GET /payouts/balance
   */
  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const balance = await financialService.getOrganizerBalance(userId);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed balance breakdown
   * GET /payouts/balance/breakdown
   */
  async getBalanceBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const breakdown = await financialService.getBalanceBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue by event
   * GET /payouts/revenue-by-event
   */
  async getRevenueByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const revenue = await financialService.getRevenueByEvent(userId);
      res.json(revenue);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request a new payout
   * POST /payouts/request
   */
  async requestPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { amount, payoutMethod, pixKey, pixKeyType, bankCode, agencyNumber, accountNumber, accountType } = req.body;

      const payout = await payoutService.requestPayout(userId, {
        amount,
        payoutMethod,
        pixKey,
        pixKeyType,
        bankCode,
        agencyNumber,
        accountNumber,
        accountType,
      });

      res.status(201).json({
        message: 'Solicitacao de saque criada com sucesso',
        payout,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer's payout history
   * GET /payouts
   */
  async getMyPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await payoutService.getOrganizerPayouts(userId, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payout by ID
   * GET /payouts/:id
   */
  async getPayoutById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const payout = await payoutService.getPayoutById(id);

      if (!payout) {
        return res.status(404).json({ error: 'Saque nao encontrado' });
      }

      res.json(payout);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a pending payout
   * POST /payouts/:id/cancel
   */
  async cancelPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const payout = await payoutService.cancelPayout(id, userId);

      res.json({
        message: 'Saque cancelado com sucesso',
        payout,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if can request payout
   * GET /payouts/can-request?amount=X
   */
  async canRequestPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const amount = parseFloat(req.query.amount as string) || 0;

      const result = await financialService.canRequestPayout(userId, amount);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate payout fee
   * GET /payouts/calculate-fee?amount=X
   */
  async calculateFee(req: Request, res: Response, next: NextFunction) {
    try {
      const amount = parseFloat(req.query.amount as string) || 0;
      const result = financialService.calculatePayoutFee(amount);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const payoutController = new PayoutController();
