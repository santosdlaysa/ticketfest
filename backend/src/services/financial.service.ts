import { query } from '../config/database.js';

// Platform fee rate (10%)
const PLATFORM_FEE_RATE = 0.10;

// Payout processing fee
const PAYOUT_FEE_FLAT = 3.50; // R$ 3,50 per payout

interface OrganizerBalance {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingPayouts: number;
}

interface BalanceBreakdown {
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  pendingOrders: number;
  paidOut: number;
  availableForPayout: number;
}

export class FinancialService {
  /**
   * Get organizer's financial balance
   */
  async getOrganizerBalance(userId: string): Promise<OrganizerBalance> {
    // If no organizer account exists, calculate from orders directly
    // Get total earnings from paid orders (after platform fee)
    const earningsResult = await query<{ total_earnings: string; pending_orders: string }>(
      `SELECT
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total * (1 - $2) ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PENDING' THEN o.total * (1 - $2) ELSE 0 END), 0) as pending_orders
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE e.organizer_id = $1`,
      [userId, PLATFORM_FEE_RATE]
    );

    // Get total withdrawn (completed payouts)
    const payoutsResult = await query<{ total_withdrawn: string; pending_payouts: string }>(
      `SELECT
        COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.net_amount ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(CASE WHEN p.status IN ('PENDING', 'PROCESSING') THEN p.net_amount ELSE 0 END), 0) as pending_payouts
       FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       WHERE oa.user_id = $1`,
      [userId]
    );

    const totalEarnings = parseFloat(earningsResult.rows[0]?.total_earnings || '0');
    const pendingOrders = parseFloat(earningsResult.rows[0]?.pending_orders || '0');
    const totalWithdrawn = parseFloat(payoutsResult.rows[0]?.total_withdrawn || '0');
    const pendingPayouts = parseFloat(payoutsResult.rows[0]?.pending_payouts || '0');

    // Available balance = total earnings - withdrawn - pending payouts
    const availableBalance = totalEarnings - totalWithdrawn - pendingPayouts;

    return {
      availableBalance: Math.max(0, availableBalance),
      pendingBalance: pendingOrders,
      totalEarnings,
      totalWithdrawn,
      pendingPayouts,
    };
  }

  /**
   * Get detailed balance breakdown
   */
  async getBalanceBreakdown(userId: string): Promise<BalanceBreakdown> {
    const revenueResult = await query<{ gross: string; pending: string }>(
      `SELECT
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total ELSE 0 END), 0) as gross,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PENDING' THEN o.total ELSE 0 END), 0) as pending
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE e.organizer_id = $1`,
      [userId]
    );

    const payoutsResult = await query<{ paid_out: string }>(
      `SELECT COALESCE(SUM(p.net_amount), 0) as paid_out
       FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       WHERE oa.user_id = $1 AND p.status = 'COMPLETED'`,
      [userId]
    );

    const grossRevenue = parseFloat(revenueResult.rows[0]?.gross || '0');
    const pendingOrders = parseFloat(revenueResult.rows[0]?.pending || '0');
    const platformFees = grossRevenue * PLATFORM_FEE_RATE;
    const netRevenue = grossRevenue - platformFees;
    const paidOut = parseFloat(payoutsResult.rows[0]?.paid_out || '0');

    return {
      grossRevenue,
      platformFees,
      netRevenue,
      pendingOrders,
      paidOut,
      availableForPayout: Math.max(0, netRevenue - paidOut),
    };
  }

  /**
   * Get organizer's payout history
   */
  async getPayoutHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const payoutsResult = await query<any>(
      `SELECT p.*, oa.company_name
       FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       WHERE oa.user_id = $1
       ORDER BY p.requested_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, skip]
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM payouts p
       JOIN organizer_accounts oa ON p.organizer_account_id = oa.id
       WHERE oa.user_id = $1`,
      [userId]
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
        failedReason: p.failed_reason,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get revenue by event for organizer
   */
  async getRevenueByEvent(userId: string) {
    const result = await query<any>(
      `SELECT e.id, e.name, e.date, e.status,
              COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total ELSE 0 END), 0) as gross_revenue,
              COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total * $2 ELSE 0 END), 0) as platform_fee,
              COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total * (1 - $2) ELSE 0 END), 0) as net_revenue,
              COUNT(CASE WHEN o.payment_status = 'PAID' THEN 1 END) as paid_orders,
              COUNT(CASE WHEN o.payment_status = 'PENDING' THEN 1 END) as pending_orders
       FROM events e
       LEFT JOIN orders o ON e.id = o.event_id
       WHERE e.organizer_id = $1
       GROUP BY e.id, e.name, e.date, e.status
       ORDER BY e.date DESC`,
      [userId, PLATFORM_FEE_RATE]
    );

    return result.rows.map((row: any) => ({
      eventId: row.id,
      eventName: row.name,
      eventDate: row.date,
      eventStatus: row.status,
      grossRevenue: parseFloat(row.gross_revenue),
      platformFee: parseFloat(row.platform_fee),
      netRevenue: parseFloat(row.net_revenue),
      paidOrders: parseInt(row.paid_orders, 10),
      pendingOrders: parseInt(row.pending_orders, 10),
    }));
  }

  /**
   * Check if organizer can request payout
   */
  async canRequestPayout(userId: string, amount: number): Promise<{ canRequest: boolean; reason?: string }> {
    const balance = await this.getOrganizerBalance(userId);

    // Minimum payout amount
    const MIN_PAYOUT = 20.0;

    if (amount < MIN_PAYOUT) {
      return { canRequest: false, reason: `Valor minimo para saque e R$ ${MIN_PAYOUT.toFixed(2)}` };
    }

    if (amount > balance.availableBalance) {
      return { canRequest: false, reason: `Saldo disponivel insuficiente. Disponivel: R$ ${balance.availableBalance.toFixed(2)}` };
    }

    // Check if has pending payouts
    if (balance.pendingPayouts > 0) {
      return { canRequest: false, reason: 'Voce possui um saque pendente. Aguarde o processamento.' };
    }

    return { canRequest: true };
  }

  /**
   * Calculate payout fee and net amount
   */
  calculatePayoutFee(amount: number): { fee: number; netAmount: number } {
    const fee = PAYOUT_FEE_FLAT;
    const netAmount = Math.max(0, amount - fee);
    return { fee, netAmount };
  }
}

export const financialService = new FinancialService();
