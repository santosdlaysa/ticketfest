import { SplitTransaction } from '../../../domain/entities/SplitTransaction.js';
import { ISplitTransactionRepository } from '../../../domain/repositories/ISplitTransactionRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';

/**
 * Use case para completar uma transação de split após confirmação do pagamento
 * Libera o saldo pendente para saldo disponível do organizador
 */
export class CompleteSplitTransactionUseCase {
  constructor(
    private splitTransactionRepository: ISplitTransactionRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(orderId: string, externalPaymentId?: string): Promise<SplitTransaction> {
    // Buscar transação de split pelo orderId
    const splitTransaction = await this.splitTransactionRepository.findByOrderId(orderId);
    if (!splitTransaction) {
      throw new Error('Split transaction not found for this order');
    }

    // Verificar se pode ser processada
    if (!splitTransaction.canProcess()) {
      throw new Error(`Cannot complete split transaction in status: ${splitTransaction.status}`);
    }

    // Guardar dados anteriores
    const previousData = splitTransaction.toJSON();

    // Marcar como em processamento
    splitTransaction.startProcessing();

    // Buscar conta do organizador
    const organizerAccount = await this.organizerAccountRepository.findById(
      splitTransaction.organizerAccountId
    );
    if (!organizerAccount) {
      splitTransaction.fail();
      await this.splitTransactionRepository.update(splitTransaction);
      throw new Error('Organizer account not found');
    }

    try {
      // Liberar saldo pendente para disponível
      organizerAccount.releasePendingToAvailable(splitTransaction.organizerAmount);
      await this.organizerAccountRepository.update(organizerAccount);

      // Marcar transação como concluída
      splitTransaction.complete(externalPaymentId);
      const updatedTransaction = await this.splitTransactionRepository.update(splitTransaction);

      // Log de auditoria
      await this.auditLogRepository.create({
        entityType: 'split_transaction',
        entityId: splitTransaction.id,
        action: 'complete',
        previousData: previousData as unknown as Record<string, unknown>,
        newData: updatedTransaction.toJSON() as unknown as Record<string, unknown>,
        metadata: {
          externalPaymentId,
          organizerAmount: splitTransaction.organizerAmount,
        },
      });

      return updatedTransaction;
    } catch (error) {
      // Em caso de erro, marcar como falha
      splitTransaction.fail();
      await this.splitTransactionRepository.update(splitTransaction);
      throw error;
    }
  }
}
