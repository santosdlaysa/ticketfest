import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  validate,
  createSplitRuleSchema,
  updateSplitRuleSchema,
  updateBankDetailsSchema,
  createPayoutSchema,
} from '../utils/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

// Repositories
import { PrismaOrganizerAccountRepository } from '../infrastructure/database/repositories/PrismaOrganizerAccountRepository.js';
import { PrismaSplitRuleRepository } from '../infrastructure/database/repositories/PrismaSplitRuleRepository.js';
import { PrismaSplitTransactionRepository } from '../infrastructure/database/repositories/PrismaSplitTransactionRepository.js';
import { PrismaPayoutRepository } from '../infrastructure/database/repositories/PrismaPayoutRepository.js';
import { PrismaAuditLogRepository } from '../infrastructure/database/repositories/PrismaAuditLogRepository.js';

// Services
import { SplitPaymentService } from '../infrastructure/services/SplitPaymentService.js';

// Use Cases
import { CreateOrganizerAccountUseCase } from '../application/use-cases/split-payment/CreateOrganizerAccountUseCase.js';
import { UpdateBankDetailsUseCase } from '../application/use-cases/split-payment/UpdateBankDetailsUseCase.js';
import { VerifyOrganizerAccountUseCase } from '../application/use-cases/split-payment/VerifyOrganizerAccountUseCase.js';
import { CreateSplitRuleUseCase } from '../application/use-cases/split-payment/CreateSplitRuleUseCase.js';
import { UpdateSplitRuleUseCase } from '../application/use-cases/split-payment/UpdateSplitRuleUseCase.js';
import { CreatePayoutUseCase } from '../application/use-cases/split-payment/CreatePayoutUseCase.js';
import { ProcessPayoutUseCase } from '../application/use-cases/split-payment/ProcessPayoutUseCase.js';
import { GetPayoutsUseCase } from '../application/use-cases/split-payment/GetPayoutsUseCase.js';

// Types
import { AccountType, HolderType } from '../domain/entities/OrganizerAccount.js';
import { PayoutMethod } from '../domain/entities/Payout.js';

const prisma = new PrismaClient();

// Repositories instances
const organizerAccountRepository = new PrismaOrganizerAccountRepository(prisma);
const splitRuleRepository = new PrismaSplitRuleRepository(prisma);
const splitTransactionRepository = new PrismaSplitTransactionRepository(prisma);
const payoutRepository = new PrismaPayoutRepository(prisma);
const auditLogRepository = new PrismaAuditLogRepository(prisma);

// Services
const splitPaymentService = new SplitPaymentService();

export class SplitPaymentController {
  // ============================================
  // ORGANIZER ACCOUNT ENDPOINTS
  // ============================================

  /**
   * POST /api/split/account
   * Cria uma conta de organizador para o usuário atual
   */
  async createOrganizerAccount(req: Request, res: Response) {
    const userId = req.user!.id;

    const useCase = new CreateOrganizerAccountUseCase(
      organizerAccountRepository,
      splitPaymentService,
      auditLogRepository
    );

    const account = await useCase.execute(
      { userId },
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    res.status(201).json({
      message: 'Organizer account created successfully',
      account: this.formatOrganizerAccount(account),
    });
  }

  /**
   * GET /api/split/account
   * Obtém a conta de organizador do usuário atual
   */
  async getOrganizerAccount(req: Request, res: Response) {
    const userId = req.user!.id;

    const account = await organizerAccountRepository.findByUserId(userId);
    if (!account) {
      throw new AppError(404, 'Organizer account not found');
    }

    res.json({
      account: this.formatOrganizerAccount(account),
    });
  }

  /**
   * PUT /api/split/account/bank-details
   * Atualiza dados bancários do organizador
   */
  async updateBankDetails(req: Request, res: Response) {
    const userId = req.user!.id;
    const data = validate(updateBankDetailsSchema)(req.body);

    const useCase = new UpdateBankDetailsUseCase(organizerAccountRepository, auditLogRepository);

    const account = await useCase.execute(
      userId,
      {
        bankCode: data.bankCode,
        bankName: data.bankName,
        accountType: data.accountType as AccountType,
        accountNumber: data.accountNumber,
        accountDigit: data.accountDigit,
        agencyNumber: data.agencyNumber,
        agencyDigit: data.agencyDigit,
        holderName: data.holderName,
        holderDocument: data.holderDocument,
        holderType: data.holderType as HolderType,
      },
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    res.json({
      message: 'Bank details updated successfully',
      account: this.formatOrganizerAccount(account),
    });
  }

  /**
   * POST /api/split/account/:id/verify (ADMIN only)
   * Verifica uma conta de organizador
   */
  async verifyOrganizerAccount(req: Request, res: Response) {
    const { id } = req.params;
    const adminUserId = req.user!.id;

    const useCase = new VerifyOrganizerAccountUseCase(organizerAccountRepository, auditLogRepository);

    const account = await useCase.execute(id, adminUserId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Organizer account verified successfully',
      account: this.formatOrganizerAccount(account),
    });
  }

  // ============================================
  // SPLIT RULE ENDPOINTS
  // ============================================

  /**
   * POST /api/events/:id/split-rules
   * Define regras de split para um evento
   */
  async createSplitRule(req: Request, res: Response) {
    const { id: eventId } = req.params;
    const userId = req.user!.id;

    const data = validate(createSplitRuleSchema)({ ...req.body, eventId });

    // Verificar se o usuário é o organizador do evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    // Permitir apenas organizador do evento ou admin
    if (event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Only event organizer or admin can create split rules');
    }

    const useCase = new CreateSplitRuleUseCase(
      splitRuleRepository,
      organizerAccountRepository,
      auditLogRepository
    );

    const splitRule = await useCase.execute(
      {
        eventId: data.eventId,
        organizerId: event.organizerId,
        platformPercentage: data.platformPercentage,
        organizerPercentage: data.organizerPercentage,
        platformFixedFee: data.platformFixedFee,
      },
      userId,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    res.status(201).json({
      message: 'Split rule created successfully',
      splitRule: this.formatSplitRule(splitRule),
    });
  }

  /**
   * GET /api/events/:id/split-rules
   * Obtém regras de split de um evento
   */
  async getSplitRule(req: Request, res: Response) {
    const { id: eventId } = req.params;

    const splitRule = await splitRuleRepository.findByEventId(eventId);
    if (!splitRule) {
      throw new AppError(404, 'Split rule not found for this event');
    }

    res.json({
      splitRule: this.formatSplitRule(splitRule),
    });
  }

  /**
   * PUT /api/events/:id/split-rules
   * Atualiza regras de split de um evento
   */
  async updateSplitRule(req: Request, res: Response) {
    const { id: eventId } = req.params;
    const userId = req.user!.id;

    const data = validate(updateSplitRuleSchema)(req.body);

    // Verificar permissão
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Only event organizer or admin can update split rules');
    }

    const useCase = new UpdateSplitRuleUseCase(splitRuleRepository, auditLogRepository);

    const splitRule = await useCase.execute(
      eventId,
      {
        platformPercentage: data.platformPercentage,
        organizerPercentage: data.organizerPercentage,
        platformFixedFee: data.platformFixedFee,
      },
      userId,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    res.json({
      message: 'Split rule updated successfully',
      splitRule: this.formatSplitRule(splitRule),
    });
  }

  // ============================================
  // PAYOUT ENDPOINTS
  // ============================================

  /**
   * GET /api/payouts/:organizerId
   * Lista repasses de um organizador
   */
  async getPayouts(req: Request, res: Response) {
    const { organizerId } = req.params;
    const userId = req.user!.id;

    // Verificar se é o próprio organizador ou admin
    if (organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Access denied');
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const useCase = new GetPayoutsUseCase(
      payoutRepository,
      organizerAccountRepository,
      splitTransactionRepository
    );

    const result = await useCase.execute({
      organizerId,
      limit,
      offset,
    });

    res.json(result);
  }

  /**
   * POST /api/payouts/:organizerId/withdraw
   * Solicita saque do saldo disponível
   */
  async createPayout(req: Request, res: Response) {
    const { organizerId } = req.params;
    const userId = req.user!.id;

    // Verificar se é o próprio organizador
    if (organizerId !== userId) {
      throw new AppError(403, 'Only the account owner can request withdrawals');
    }

    const data = validate(createPayoutSchema)(req.body);

    const useCase = new CreatePayoutUseCase(
      payoutRepository,
      organizerAccountRepository,
      auditLogRepository
    );

    const payout = await useCase.execute(
      {
        organizerId,
        amount: data.amount,
        payoutMethod: data.payoutMethod as PayoutMethod,
      },
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    res.status(201).json({
      message: 'Withdrawal request created successfully',
      payout: this.formatPayout(payout),
    });
  }

  /**
   * POST /api/payouts/:payoutId/process (ADMIN only)
   * Processa um saque pendente
   */
  async processPayout(req: Request, res: Response) {
    const { payoutId } = req.params;
    const adminUserId = req.user!.id;

    const useCase = new ProcessPayoutUseCase(
      payoutRepository,
      organizerAccountRepository,
      splitPaymentService,
      auditLogRepository
    );

    const payout = await useCase.execute(payoutId, adminUserId);

    res.json({
      message: 'Payout processed successfully',
      payout: this.formatPayout(payout),
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatOrganizerAccount(account: any) {
    const data = account.toJSON ? account.toJSON() : account;
    return {
      id: data.id,
      userId: data.userId,
      verified: data.verified,
      verifiedAt: data.verifiedAt?.toISOString(),
      bankCode: data.bankCode,
      bankName: data.bankName,
      accountType: data.accountType,
      accountNumber: data.accountNumber ? this.maskNumber(data.accountNumber) : undefined,
      agencyNumber: data.agencyNumber,
      holderName: data.holderName,
      holderDocument: data.holderDocument ? this.maskDocument(data.holderDocument) : undefined,
      holderType: data.holderType,
      availableBalance: data.availableBalance,
      pendingBalance: data.pendingBalance,
      hasStripeAccount: !!data.stripeAccountId,
      hasPagarmeAccount: !!data.pagarmeRecipientId,
      hasMercadoPagoAccount: !!data.mercadoPagoUserId,
      hasAsaasAccount: !!data.asaasWalletId,
      createdAt: data.createdAt?.toISOString(),
    };
  }

  private formatSplitRule(rule: any) {
    const data = rule.toJSON ? rule.toJSON() : rule;
    return {
      id: data.id,
      eventId: data.eventId,
      organizerAccountId: data.organizerAccountId,
      platformPercentage: data.platformPercentage,
      organizerPercentage: data.organizerPercentage,
      platformFixedFee: data.platformFixedFee,
      active: data.active,
      createdAt: data.createdAt?.toISOString(),
      updatedAt: data.updatedAt?.toISOString(),
    };
  }

  private formatPayout(payout: any) {
    const data = payout.toJSON ? payout.toJSON() : payout;
    return {
      id: data.id,
      organizerAccountId: data.organizerAccountId,
      amount: data.amount,
      fee: data.fee,
      netAmount: data.netAmount,
      status: data.status,
      payoutMethod: data.payoutMethod,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber ? this.maskNumber(data.accountNumber) : undefined,
      agencyNumber: data.agencyNumber,
      externalId: data.externalId,
      requestedAt: data.requestedAt?.toISOString(),
      processedAt: data.processedAt?.toISOString(),
      completedAt: data.completedAt?.toISOString(),
      failedAt: data.failedAt?.toISOString(),
      failureReason: data.failureReason,
    };
  }

  private maskNumber(value: string): string {
    if (value.length <= 4) return value;
    return '*'.repeat(value.length - 4) + value.slice(-4);
  }

  private maskDocument(doc: string): string {
    if (doc.length === 11) {
      // CPF: ***.***.***-XX
      return `***.***.***.${doc.slice(-2)}`;
    }
    if (doc.length === 14) {
      // CNPJ: **.***.***/****.XX
      return `**.***.***/****.${doc.slice(-2)}`;
    }
    return this.maskNumber(doc);
  }
}

export const splitPaymentController = new SplitPaymentController();
