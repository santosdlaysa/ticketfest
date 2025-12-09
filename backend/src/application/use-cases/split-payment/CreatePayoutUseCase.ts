import { Payout, PayoutMethod } from '../../../domain/entities/Payout.js';
import { IPayoutRepository } from '../../../domain/repositories/IPayoutRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';

export interface CreatePayoutInput {
  organizerId: string; // userId do organizador
  amount: number;
  payoutMethod: PayoutMethod;
}

/**
 * Use case para solicitar saque (withdraw) do saldo disponível
 */
export class CreatePayoutUseCase {
  constructor(
    private payoutRepository: IPayoutRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(
    input: CreatePayoutInput,
    requestContext?: { ip?: string; userAgent?: string }
  ): Promise<Payout> {
    // Buscar conta do organizador
    const organizerAccount = await this.organizerAccountRepository.findByUserId(input.organizerId);
    if (!organizerAccount) {
      throw new Error('Organizer account not found');
    }

    // Verificar se a conta está verificada
    if (!organizerAccount.isVerified()) {
      throw new Error('Organizer account must be verified to request payouts');
    }

    // Verificar se tem dados bancários
    if (!organizerAccount.hasBankDetails()) {
      throw new Error('Bank details must be configured to request payouts');
    }

    // Verificar se pode sacar o valor
    if (!organizerAccount.canWithdraw(input.amount)) {
      throw new Error(
        `Insufficient balance. Available: ${organizerAccount.availableBalance}, Requested: ${input.amount}`
      );
    }

    // Calcular taxa de saque (se houver)
    const fee = this.calculatePayoutFee(input.amount, input.payoutMethod);

    // Criar o payout
    const payout = Payout.create({
      organizerAccountId: organizerAccount.id,
      amount: input.amount,
      fee,
      payoutMethod: input.payoutMethod,
      bankCode: organizerAccount.bankCode,
      accountNumber: organizerAccount.accountNumber,
      agencyNumber: organizerAccount.agencyNumber,
    });

    // Deduzir do saldo disponível
    organizerAccount.deductAvailableBalance(input.amount);
    await this.organizerAccountRepository.update(organizerAccount);

    // Salvar o payout
    const savedPayout = await this.payoutRepository.create(payout);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'payout',
      entityId: savedPayout.id,
      action: 'create',
      userId: input.organizerId,
      newData: savedPayout.toJSON() as unknown as Record<string, unknown>,
      metadata: {
        previousBalance: organizerAccount.availableBalance + input.amount,
        newBalance: organizerAccount.availableBalance,
      },
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return savedPayout;
  }

  private calculatePayoutFee(amount: number, method: PayoutMethod): number {
    // Taxa de saque pode variar por método
    // Por enquanto, usando valores fixos de exemplo
    switch (method) {
      case PayoutMethod.PIX:
        return 0; // PIX geralmente sem taxa
      case PayoutMethod.BANK_TRANSFER:
        return amount < 100 ? 3.5 : 0; // Taxa para valores pequenos
      default:
        return 0;
    }
  }
}
