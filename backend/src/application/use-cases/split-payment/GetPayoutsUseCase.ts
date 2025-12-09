import { Payout } from '../../../domain/entities/Payout.js';
import { IPayoutRepository } from '../../../domain/repositories/IPayoutRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { ISplitTransactionRepository } from '../../../domain/repositories/ISplitTransactionRepository.js';
import { BalanceSummary, PaginatedResponse, PayoutResponse } from '../../dtos/SplitPaymentDTO.js';

export interface GetPayoutsInput {
  organizerId: string;
  limit?: number;
  offset?: number;
}

export interface GetPayoutsOutput {
  payouts: PaginatedResponse<PayoutResponse>;
  balance: BalanceSummary;
}

export class GetPayoutsUseCase {
  constructor(
    private payoutRepository: IPayoutRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private splitTransactionRepository: ISplitTransactionRepository
  ) {}

  async execute(input: GetPayoutsInput): Promise<GetPayoutsOutput> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    // Buscar conta do organizador
    const organizerAccount = await this.organizerAccountRepository.findByUserId(input.organizerId);
    if (!organizerAccount) {
      throw new Error('Organizer account not found');
    }

    // Buscar payouts com paginação
    const { payouts, total } = await this.payoutRepository.findByOrganizerAccountIdWithPagination(
      organizerAccount.id,
      limit,
      offset
    );

    // Calcular totais
    const totalWithdrawn = await this.payoutRepository.sumCompletedByOrganizerAccount(
      organizerAccount.id
    );
    const totalEarned = await this.splitTransactionRepository.sumCompletedByOrganizerAccount(
      organizerAccount.id
    );

    // Formatar resposta
    const payoutResponses: PayoutResponse[] = payouts.map((p) => this.toResponse(p));

    return {
      payouts: {
        data: payoutResponses,
        total,
        limit,
        offset,
        hasMore: offset + payouts.length < total,
      },
      balance: {
        availableBalance: organizerAccount.availableBalance,
        pendingBalance: organizerAccount.pendingBalance,
        totalEarned,
        totalWithdrawn,
      },
    };
  }

  private toResponse(payout: Payout): PayoutResponse {
    const data = payout.toJSON();
    return {
      id: data.id,
      organizerAccountId: data.organizerAccountId,
      amount: data.amount,
      fee: data.fee,
      netAmount: data.netAmount,
      status: data.status,
      payoutMethod: data.payoutMethod,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber ? this.maskAccountNumber(data.accountNumber) : undefined,
      agencyNumber: data.agencyNumber,
      externalId: data.externalId,
      requestedAt: data.requestedAt.toISOString(),
      processedAt: data.processedAt?.toISOString(),
      completedAt: data.completedAt?.toISOString(),
      failedAt: data.failedAt?.toISOString(),
      failureReason: data.failureReason,
    };
  }

  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }
}
