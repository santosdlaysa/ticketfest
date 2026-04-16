import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { pagarmeService, PagarmeBankAccount, PagarmeRecipientRequest } from '../services/pagarme.service.js';

interface BankDetails {
  bankCode: string;
  bankName: string;
  accountType: 'CHECKING' | 'SAVINGS';
  accountNumber: string;
  accountDigit: string;
  agencyNumber: string;
  agencyDigit?: string;
  holderName: string;
  holderDocument: string;
  holderType: 'INDIVIDUAL' | 'COMPANY';
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pixKey?: string;
}

interface CompanyInfo {
  companyName: string;
  tradingName?: string;
  cnpj: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZipCode?: string;
  taxRegime?: string;
}

export class OrganizerAccountController {
  /**
   * Get current user's organizer account
   */
  async getMyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const result = await query(
        `SELECT * FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Organizer account not found' });
      }

      const account = result.rows[0];
      return res.json(this.formatAccount(account));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Create organizer account for current user
   */
  async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { companyInfo, bankDetails } = req.body as {
        companyInfo?: CompanyInfo;
        bankDetails?: BankDetails;
      };

      // Check if account already exists
      const existing = await query(
        `SELECT id FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (existing.rows.length > 0) {
        throw new AppError(400, 'Organizer account already exists');
      }

      // Create account
      const result = await query(
        `INSERT INTO organizer_accounts (
          user_id,
          company_name,
          trading_name,
          cnpj,
          company_email,
          company_phone,
          company_address,
          company_city,
          company_state,
          company_zip_code,
          tax_regime,
          bank_code,
          bank_name,
          account_type,
          account_number,
          account_digit,
          agency_number,
          agency_digit,
          holder_name,
          holder_document,
          holder_type,
          pix_key_type,
          pix_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *`,
        [
          userId,
          companyInfo?.companyName || null,
          companyInfo?.tradingName || null,
          companyInfo?.cnpj || null,
          companyInfo?.companyEmail || null,
          companyInfo?.companyPhone || null,
          companyInfo?.companyAddress || null,
          companyInfo?.companyCity || null,
          companyInfo?.companyState || null,
          companyInfo?.companyZipCode || null,
          companyInfo?.taxRegime || null,
          bankDetails?.bankCode || null,
          bankDetails?.bankName || null,
          bankDetails?.accountType || null,
          bankDetails?.accountNumber || null,
          bankDetails?.accountDigit || null,
          bankDetails?.agencyNumber || null,
          bankDetails?.agencyDigit || null,
          bankDetails?.holderName || null,
          bankDetails?.holderDocument || null,
          bankDetails?.holderType || null,
          bankDetails?.pixKeyType || null,
          bankDetails?.pixKey || null,
        ]
      );

      // Update user role to ORGANIZER
      await query(
        `UPDATE users SET role = 'ORGANIZER' WHERE id = $1 AND role = 'USER'`,
        [userId]
      );

      // Attempt to create Pagar.me recipient (only if bank data was provided)
      await this.syncRecipient(userId, result.rows[0]);

      // Re-read to get the latest row (including pagarme_recipient_id)
      const refreshed = await query(
        `SELECT * FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      return res.status(201).json(this.formatAccount(refreshed.rows[0] || result.rows[0]));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update company info
   */
  async updateCompanyInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const companyInfo = req.body as CompanyInfo;

      const result = await query(
        `UPDATE organizer_accounts SET
          company_name = COALESCE($2, company_name),
          trading_name = COALESCE($3, trading_name),
          cnpj = COALESCE($4, cnpj),
          company_email = COALESCE($5, company_email),
          company_phone = COALESCE($6, company_phone),
          company_address = COALESCE($7, company_address),
          company_city = COALESCE($8, company_city),
          company_state = COALESCE($9, company_state),
          company_zip_code = COALESCE($10, company_zip_code),
          tax_regime = COALESCE($11, tax_regime),
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          companyInfo.companyName,
          companyInfo.tradingName,
          companyInfo.cnpj,
          companyInfo.companyEmail,
          companyInfo.companyPhone,
          companyInfo.companyAddress,
          companyInfo.companyCity,
          companyInfo.companyState,
          companyInfo.companyZipCode,
          companyInfo.taxRegime,
        ]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      return res.json(this.formatAccount(result.rows[0]));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update bank details
   */
  async updateBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const bankDetails = req.body as BankDetails;

      // When bank details change, account needs re-verification
      const result = await query(
        `UPDATE organizer_accounts SET
          bank_code = $2,
          bank_name = $3,
          account_type = $4,
          account_number = $5,
          account_digit = $6,
          agency_number = $7,
          agency_digit = $8,
          holder_name = $9,
          holder_document = $10,
          holder_type = $11,
          pix_key_type = $12,
          pix_key = $13,
          verified = FALSE,
          verified_at = NULL,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          bankDetails.bankCode,
          bankDetails.bankName,
          bankDetails.accountType,
          bankDetails.accountNumber,
          bankDetails.accountDigit,
          bankDetails.agencyNumber,
          bankDetails.agencyDigit || null,
          bankDetails.holderName,
          bankDetails.holderDocument,
          bankDetails.holderType,
          bankDetails.pixKeyType || null,
          bankDetails.pixKey || null,
        ]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      // Create or update Pagar.me recipient with new bank account
      await this.syncRecipient(userId, result.rows[0]);

      const refreshed = await query(
        `SELECT * FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      return res.json(this.formatAccount(refreshed.rows[0] || result.rows[0]));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Request account verification
   */
  async requestVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const account = await query(
        `SELECT * FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (account.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      const acc = account.rows[0];

      // Check if has bank details
      if (!acc.bank_code || !acc.account_number || !acc.agency_number || !acc.holder_name || !acc.holder_document) {
        throw new AppError(400, 'Bank details are required for verification');
      }

      // Try to (re-)create the Pagar.me recipient if not created yet
      const recipientId = await this.syncRecipient(userId, acc);

      return res.json({
        message: 'Verification request submitted. You will be notified once verified.',
        status: 'pending_verification',
        pagarmeRecipientId: recipientId,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Verify an organizer account
   */
  async verifyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const { accountId } = req.params;

      if (userRole !== 'ADMIN') {
        throw new AppError(403, 'Only admins can verify accounts');
      }

      const result = await query(
        `UPDATE organizer_accounts SET
          verified = TRUE,
          verified_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [accountId]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      return res.json(this.formatAccount(result.rows[0]));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: List all organizer accounts
   */
  async listAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const { verified, limit = 20, offset = 0 } = req.query;

      if (userRole !== 'ADMIN') {
        throw new AppError(403, 'Only admins can list all accounts');
      }

      let whereClause = '';
      const params: any[] = [];

      if (verified !== undefined) {
        whereClause = 'WHERE oa.verified = $1';
        params.push(verified === 'true');
      }

      const result = await query(
        `SELECT oa.*, u.name as user_name, u.email as user_email
         FROM organizer_accounts oa
         JOIN users u ON oa.user_id = u.id
         ${whereClause}
         ORDER BY oa.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      const countResult = await query(
        `SELECT COUNT(*) as count FROM organizer_accounts ${whereClause.replace('oa.', '')}`,
        params
      );

      return res.json({
        accounts: result.rows.map(acc => ({
          ...this.formatAccount(acc),
          user: {
            name: acc.user_name,
            email: acc.user_email
          }
        })),
        total: parseInt(countResult.rows[0].count, 10),
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get balance details
   */
  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const result = await query(
        `SELECT available_balance, pending_balance FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      const { available_balance, pending_balance } = result.rows[0];

      return res.json({
        availableBalance: available_balance,
        pendingBalance: pending_balance,
        totalBalance: available_balance + pending_balance
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Build Pagar.me bank account payload from DB row.
   * Returns null if required bank fields are missing.
   */
  private buildBankAccount(acc: any): PagarmeBankAccount | null {
    if (!acc.bank_code || !acc.account_number || !acc.account_digit || !acc.agency_number || !acc.holder_name || !acc.holder_document || !acc.account_type || !acc.holder_type) {
      return null;
    }

    return {
      holder_name: acc.holder_name,
      holder_type: acc.holder_type === 'COMPANY' ? 'company' : 'individual',
      holder_document: String(acc.holder_document).replace(/\D/g, ''),
      bank: String(acc.bank_code).padStart(3, '0'),
      branch_number: String(acc.agency_number).replace(/\D/g, ''),
      branch_check_digit: acc.agency_digit ? String(acc.agency_digit).replace(/\D/g, '') : undefined,
      account_number: String(acc.account_number).replace(/\D/g, ''),
      account_check_digit: String(acc.account_digit).replace(/\D/g, ''),
      type: acc.account_type === 'SAVINGS' ? 'savings' : 'checking',
    };
  }

  /**
   * Create or update Pagar.me recipient from DB row.
   * Saves returned recipient id into organizer_accounts.pagarme_recipient_id.
   * Safe: logs errors but never throws - recipient creation can be retried.
   */
  private async syncRecipient(userId: string, acc: any): Promise<string | null> {
    const bankAccount = this.buildBankAccount(acc);
    if (!bankAccount) {
      return acc.pagarme_recipient_id || null;
    }

    const ownerName = acc.holder_name || acc.company_name || 'Organizador';
    const ownerEmail = acc.company_email || '';
    const doc = String(acc.holder_document || acc.cnpj || '').replace(/\D/g, '');
    if (!doc || !ownerEmail) {
      console.warn(`[syncRecipient] skipped for user ${userId}: missing email or document`);
      return acc.pagarme_recipient_id || null;
    }

    const recipientType: 'individual' | 'corporation' =
      acc.holder_type === 'COMPANY' ? 'corporation' : 'individual';

    try {
      if (acc.pagarme_recipient_id) {
        // Update bank account only - simpler and most common case
        await pagarmeService.updateRecipientBankAccount(acc.pagarme_recipient_id, bankAccount);
        return acc.pagarme_recipient_id;
      }

      const payload: PagarmeRecipientRequest = {
        name: ownerName,
        email: ownerEmail,
        document: doc,
        type: recipientType,
        code: acc.id,
        default_bank_account: bankAccount,
      };

      const created = await pagarmeService.createRecipient(payload);

      await query(
        `UPDATE organizer_accounts SET pagarme_recipient_id = $1, updated_at = NOW() WHERE user_id = $2`,
        [created.id, userId]
      );

      return created.id;
    } catch (err: any) {
      console.error('[syncRecipient] Pagar.me error:', err?.message || err);
      return acc.pagarme_recipient_id || null;
    }
  }

  private formatAccount(acc: any) {
    return {
      id: acc.id,
      userId: acc.user_id,
      verified: acc.verified,
      verifiedAt: acc.verified_at,
      pagarmeRecipientId: acc.pagarme_recipient_id,
      readyToReceive: Boolean(acc.pagarme_recipient_id && acc.bank_code && acc.account_number),
      companyInfo: {
        companyName: acc.company_name,
        tradingName: acc.trading_name,
        cnpj: acc.cnpj,
        companyEmail: acc.company_email,
        companyPhone: acc.company_phone,
        companyAddress: acc.company_address,
        companyCity: acc.company_city,
        companyState: acc.company_state,
        companyZipCode: acc.company_zip_code,
        taxRegime: acc.tax_regime,
      },
      bankDetails: {
        bankCode: acc.bank_code,
        bankName: acc.bank_name,
        accountType: acc.account_type,
        accountNumber: acc.account_number,
        accountDigit: acc.account_digit,
        agencyNumber: acc.agency_number,
        agencyDigit: acc.agency_digit,
        holderName: acc.holder_name,
        holderDocument: acc.holder_document,
        holderType: acc.holder_type,
        pixKeyType: acc.pix_key_type,
        pixKey: acc.pix_key,
      },
      balance: {
        available: acc.available_balance,
        pending: acc.pending_balance,
      },
      createdAt: acc.created_at,
      updatedAt: acc.updated_at,
    };
  }
}

export const organizerAccountController = new OrganizerAccountController();
