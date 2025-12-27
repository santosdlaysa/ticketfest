import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { financialService } from './financial.service.js';

interface PayoutRequest {
  amount: number;
  payoutMethod: 'PIX' | 'TED';
  pixKey?: string;
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  bankCode?: string;
  agencyNumber?: string;
  accountNumber?: string;
  accountType?: 'CHECKING' | 'SAVINGS';
}

export interface Payout {
  id: string;
  organizerAccountId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payoutMethod: string;
  bankCode?: string;
  accountNumber?: string;
  agencyNumber?: string;
  externalId?: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failedReason?: string;
}

export class PayoutService {
  /**
   * Request a new payout
   */
  async requestPayout(userId: string, data: PayoutRequest): Promise<Payout> {
    // Check if organizer can request payout
    const { canRequest, reason } = await financialService.canRequestPayout(userId, data.amount);
    if (!canRequest) {
      throw new AppError(400, reason || 'Nao foi possivel solicitar o saque');
    }

    // Get or create organizer account
    let accountResult = await query<{ id: string }>(
      'SELECT id FROM organizer_accounts WHERE user_id = $1',
      [userId]
    );

    let organizerAccountId: string;

    if (accountResult.rows.length === 0) {
      // Create organizer account if not exists
      const userResult = await query<{ name: string; email: string; cpf: string }>(
        'SELECT name, email, cpf FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError(404, 'Usuario nao encontrado');
      }

      const user = userResult.rows[0];
      const createAccountResult = await query<{ id: string }>(
        `INSERT INTO organizer_accounts (user_id, company_name, company_email, bank_code, agency_number, account_number, account_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, user.name, user.email, data.bankCode, data.agencyNumber, data.accountNumber, data.accountType || 'CHECKING']
      );
      organizerAccountId = createAccountResult.rows[0].id;
    } else {
      organizerAccountId = accountResult.rows[0].id;

      // Update bank info if provided
      if (data.bankCode || data.accountNumber) {
        await query(
          `UPDATE organizer_accounts SET
            bank_code = COALESCE($2, bank_code),
            agency_number = COALESCE($3, agency_number),
            account_number = COALESCE($4, account_number),
            account_type = COALESCE($5, account_type),
            pix_key = COALESCE($6, pix_key),
            pix_key_type = COALESCE($7, pix_key_type)
           WHERE id = $1`,
          [organizerAccountId, data.bankCode, data.agencyNumber, data.accountNumber, data.accountType, data.pixKey, data.pixKeyType]
        );
      }
    }

    // Calculate fee
    const { fee, netAmount } = financialService.calculatePayoutFee(data.amount);

    // Create payout request
    const payoutResult = await query<any>(
      `INSERT INTO payouts (
        organizer_account_id, amount, fee, net_amount, status, payout_method,
        bank_code, account_number, agency_number
      ) VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8)
      RETURNING *`,
      [
        organizerAccountId,
        data.amount,
        fee,
        netAmount,
        data.payoutMethod,
        data.bankCode,
        data.accountNumber,
        data.agencyNumber,
      ]
    );

    const payout = payoutResult.rows[0];

    // Send confirmation email
    const userResult = await query<{ email: string; name: string }>(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      // TODO: Add sendPayoutRequestEmail to EmailService
      console.log(`Payout request email would be sent to ${user.email}`);
    }

    return {
      id: payout.id,
      organizerAccountId: payout.organizer_account_id,
      amount: payout.amount,
      fee: payout.fee,
      netAmount: payout.net_amount,
      status: payout.status,
      payoutMethod: payout.payout_method,
      bankCode: payout.bank_code,
      accountNumber: payout.account_number,
      agencyNumber: payout.agency_number,
      requestedAt: payout.requested_at,
    };
  }

  /**
   * Get payout by ID
   */
  async getPayoutById(payoutId: string): Promise<Payout | null> {
    const result = await query<any>(
      `SELECT p.*, oa.user_id, u.name as user_name, u.email as user_email
       FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       JOIN users u ON oa.user_id = u.id
       WHERE p.id = $1`,
      [payoutId]
    );

    if (result.rows.length === 0) return null;

    const p = result.rows[0];
    return {
      id: p.id,
      organizerAccountId: p.organizer_account_id,
      amount: p.amount,
      fee: p.fee,
      netAmount: p.net_amount,
      status: p.status,
      payoutMethod: p.payout_method,
      bankCode: p.bank_code,
      accountNumber: p.account_number,
      agencyNumber: p.agency_number,
      externalId: p.external_id,
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
      completedAt: p.completed_at,
      failedAt: p.failed_at,
      failedReason: p.failed_reason,
    };
  }

  /**
   * Get all payouts (admin)
   */
  async getAllPayouts(filters: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(status);
    }

    if (startDate) {
      conditions.push(`p.requested_at >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`p.requested_at <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const payoutsResult = await query<any>(
      `SELECT p.*, oa.company_name, u.id as user_id, u.name as user_name, u.email as user_email
       FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       JOIN users u ON oa.user_id = u.id
       ${whereClause}
       ORDER BY p.requested_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM payouts p
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      payouts: payoutsResult.rows.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        fee: p.fee,
        netAmount: p.net_amount,
        status: p.status,
        payoutMethod: p.payout_method,
        bankCode: p.bank_code,
        accountNumber: p.account_number ? `****${p.account_number.slice(-4)}` : null,
        agencyNumber: p.agency_number,
        requestedAt: p.requested_at,
        processedAt: p.processed_at,
        completedAt: p.completed_at,
        failedAt: p.failed_at,
        organizer: {
          id: p.user_id,
          name: p.user_name || p.company_name,
          email: p.user_email,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve payout (admin)
   */
  async approvePayout(payoutId: string, _adminId: string): Promise<Payout> {
    const payout = await this.getPayoutById(payoutId);
    if (!payout) {
      throw new AppError(404, 'Saque nao encontrado');
    }

    if (payout.status !== 'PENDING') {
      throw new AppError(400, 'Este saque ja foi processado');
    }

    // Update to PROCESSING
    await query(
      `UPDATE payouts SET status = 'PROCESSING', processed_at = NOW() WHERE id = $1`,
      [payoutId]
    );

    // In a real implementation, this would trigger the actual bank transfer
    // For now, we'll simulate by setting it to COMPLETED
    // TODO: Integrate with real payment processor for transfers

    // Simulate processing
    await query(
      `UPDATE payouts SET status = 'COMPLETED', completed_at = NOW(), external_id = $2 WHERE id = $1`,
      [payoutId, `payout_${Date.now()}`]
    );

    // Send notification email
    const userResult = await query<{ email: string; name: string }>(
      `SELECT u.email, u.name FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       JOIN users u ON oa.user_id = u.id
       WHERE p.id = $1`,
      [payoutId]
    );

    if (userResult.rows.length > 0) {
      console.log(`Payout approved notification would be sent to ${userResult.rows[0].email}`);
    }

    return (await this.getPayoutById(payoutId))!;
  }

  /**
   * Reject payout (admin)
   */
  async rejectPayout(payoutId: string, _adminId: string, reason: string): Promise<Payout> {
    const payout = await this.getPayoutById(payoutId);
    if (!payout) {
      throw new AppError(404, 'Saque nao encontrado');
    }

    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
      throw new AppError(400, 'Este saque nao pode ser rejeitado');
    }

    await query(
      `UPDATE payouts SET status = 'FAILED', failed_at = NOW(), failed_reason = $2 WHERE id = $1`,
      [payoutId, reason]
    );

    // Send notification email
    const userResult = await query<{ email: string; name: string }>(
      `SELECT u.email, u.name FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       JOIN users u ON oa.user_id = u.id
       WHERE p.id = $1`,
      [payoutId]
    );

    if (userResult.rows.length > 0) {
      console.log(`Payout rejected notification would be sent to ${userResult.rows[0].email}: ${reason}`);
    }

    return (await this.getPayoutById(payoutId))!;
  }

  /**
   * Cancel payout (organizer)
   */
  async cancelPayout(payoutId: string, userId: string): Promise<Payout> {
    // Verify ownership
    const ownerResult = await query<{ user_id: string }>(
      `SELECT oa.user_id FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       WHERE p.id = $1`,
      [payoutId]
    );

    if (ownerResult.rows.length === 0) {
      throw new AppError(404, 'Saque nao encontrado');
    }

    if (ownerResult.rows[0].user_id !== userId) {
      throw new AppError(403, 'Voce nao tem permissao para cancelar este saque');
    }

    const payout = await this.getPayoutById(payoutId);
    if (!payout) {
      throw new AppError(404, 'Saque nao encontrado');
    }

    if (payout.status !== 'PENDING') {
      throw new AppError(400, 'Este saque ja esta sendo processado e nao pode ser cancelado');
    }

    await query(
      `UPDATE payouts SET status = 'CANCELLED' WHERE id = $1`,
      [payoutId]
    );

    return (await this.getPayoutById(payoutId))!;
  }

  /**
   * Get organizer's payouts
   */
  async getOrganizerPayouts(userId: string, page: number = 1, limit: number = 10) {
    return financialService.getPayoutHistory(userId, page, limit);
  }
}

export const payoutService = new PayoutService();
