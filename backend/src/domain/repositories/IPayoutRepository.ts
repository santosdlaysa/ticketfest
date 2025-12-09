import { Payout } from '../entities/Payout.js';
import { PayoutStatus } from '../entities/Payout.js';

export interface IPayoutRepository {
  create(payout: Payout): Promise<Payout>;
  findById(id: string): Promise<Payout | null>;
  findByOrganizerAccountId(organizerAccountId: string): Promise<Payout[]>;
  findByStatus(status: PayoutStatus): Promise<Payout[]>;
  update(payout: Payout): Promise<Payout>;

  // Aggregations
  sumCompletedByOrganizerAccount(organizerAccountId: string): Promise<number>;
  sumPendingByOrganizerAccount(organizerAccountId: string): Promise<number>;

  // Queries with filters
  findByOrganizerAccountIdWithPagination(
    organizerAccountId: string,
    limit: number,
    offset: number
  ): Promise<{ payouts: Payout[]; total: number }>;

  findPendingPayouts(): Promise<Payout[]>;
}
