import { SplitTransaction, SplitStatus } from '../../../domain/entities/SplitTransaction.js';
import { ISplitTransactionRepository } from '../../../domain/repositories/ISplitTransactionRepository.js';
import { ISplitRuleRepository } from '../../../domain/repositories/ISplitRuleRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';
import { SplitPaymentService } from '../../../infrastructure/services/SplitPaymentService.js';

export interface ProcessSplitPaymentInput {
  orderId: string;
  eventId: string;
  totalAmount: number;
}

export class ProcessSplitPaymentUseCase {
  constructor(
    private splitTransactionRepository: ISplitTransactionRepository,
    private splitRuleRepository: ISplitRuleRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private splitPaymentService: SplitPaymentService,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(input: ProcessSplitPaymentInput): Promise<SplitTransaction> {
    // Verificar se já existe transação para este pedido
    const existingTransaction = await this.splitTransactionRepository.findByOrderId(input.orderId);
    if (existingTransaction) {
      throw new Error('Split transaction already exists for this order');
    }

    // Buscar regra de split do evento
    const splitRule = await this.splitRuleRepository.findByEventId(input.eventId);
    if (!splitRule) {
      throw new Error('No split rule found for this event');
    }

    if (!splitRule.isActive()) {
      throw new Error('Split rule is not active');
    }

    // Buscar conta do organizador
    const organizerAccount = await this.organizerAccountRepository.findById(
      splitRule.organizerAccountId
    );
    if (!organizerAccount) {
      throw new Error('Organizer account not found');
    }

    if (!organizerAccount.isVerified()) {
      throw new Error('Organizer account is not verified');
    }

    // Calcular o split
    const splitCalculation = splitRule.calculateSplit(input.totalAmount);

    // Criar a transação de split
    const splitTransaction = SplitTransaction.create({
      orderId: input.orderId,
      splitRuleId: splitRule.id,
      organizerAccountId: organizerAccount.id,
      totalAmount: splitCalculation.totalAmount,
      platformAmount: splitCalculation.platformAmount,
      organizerAmount: splitCalculation.organizerAmount,
      platformFee: splitCalculation.platformFee,
    });

    // Salvar a transação (status PENDING)
    const savedTransaction = await this.splitTransactionRepository.create(splitTransaction);

    // Atualizar saldo pendente do organizador
    organizerAccount.addPendingBalance(splitCalculation.organizerAmount);
    await this.organizerAccountRepository.update(organizerAccount);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'split_transaction',
      entityId: savedTransaction.id,
      action: 'create',
      newData: savedTransaction.toJSON() as unknown as Record<string, unknown>,
      metadata: {
        orderId: input.orderId,
        eventId: input.eventId,
        splitCalculation,
      },
    });

    return savedTransaction;
  }
}
