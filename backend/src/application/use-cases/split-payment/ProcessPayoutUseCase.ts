import { Payout } from '../../../domain/entities/Payout.js';
import { IPayoutRepository } from '../../../domain/repositories/IPayoutRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';
import { SplitPaymentService } from '../../../infrastructure/services/SplitPaymentService.js';

/**
 * Use case para processar um payout (executar a transferência)
 * Geralmente executado por um job/cron ou admin
 */
export class ProcessPayoutUseCase {
  constructor(
    private payoutRepository: IPayoutRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private splitPaymentService: SplitPaymentService,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(payoutId: string, adminUserId?: string): Promise<Payout> {
    // Buscar o payout
    const payout = await this.payoutRepository.findById(payoutId);
    if (!payout) {
      throw new Error('Payout not found');
    }

    // Verificar se pode ser processado
    if (!payout.canProcess()) {
      throw new Error(`Cannot process payout in status: ${payout.status}`);
    }

    // Guardar dados anteriores
    const previousData = payout.toJSON();

    // Buscar conta do organizador
    const organizerAccount = await this.organizerAccountRepository.findById(
      payout.organizerAccountId
    );
    if (!organizerAccount) {
      payout.fail('Organizer account not found');
      await this.payoutRepository.update(payout);
      throw new Error('Organizer account not found');
    }

    // Marcar como em processamento
    payout.startProcessing();
    await this.payoutRepository.update(payout);

    try {
      // Processar o payout via gateway
      let result;

      if (organizerAccount.stripeAccountId) {
        // Processar via Stripe
        result = await this.splitPaymentService.createStripePayout({
          accountId: organizerAccount.stripeAccountId,
          amount: payout.netAmount,
          method: 'standard',
          metadata: {
            payoutId: payout.id,
            organizerAccountId: organizerAccount.id,
          },
        });
      } else {
        // Mock para outros gateways ou transferência manual
        result = {
          success: true,
          externalId: `manual_${Date.now()}`,
        };
      }

      if (!result.success) {
        payout.fail(result.error || 'Payment processing failed');
        await this.payoutRepository.update(payout);

        // Devolver o valor ao saldo disponível
        organizerAccount.refundToAvailable(payout.amount);
        await this.organizerAccountRepository.update(organizerAccount);

        throw new Error(result.error || 'Payment processing failed');
      }

      // Marcar como concluído
      payout.complete(result.externalId);
      const updatedPayout = await this.payoutRepository.update(payout);

      // Log de auditoria
      await this.auditLogRepository.create({
        entityType: 'payout',
        entityId: payout.id,
        action: 'process',
        userId: adminUserId,
        previousData: previousData as unknown as Record<string, unknown>,
        newData: updatedPayout.toJSON() as unknown as Record<string, unknown>,
        metadata: {
          externalId: result.externalId,
          processedBy: adminUserId || 'system',
        },
      });

      return updatedPayout;
    } catch (error: any) {
      // Em caso de erro não tratado
      if (payout.isProcessing()) {
        payout.fail(error.message);
        await this.payoutRepository.update(payout);

        // Devolver o valor ao saldo disponível
        organizerAccount.refundToAvailable(payout.amount);
        await this.organizerAccountRepository.update(organizerAccount);
      }
      throw error;
    }
  }
}
