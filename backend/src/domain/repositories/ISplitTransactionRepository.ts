import { SplitTransaction } from '../entities/SplitTransaction.js';
import { SplitStatus } from '../entities/SplitTransaction.js';

export interface ISplitTransactionRepository {
  create(transaction: SplitTransaction): Promise<SplitTransaction>;
  findById(id: string): Promise<SplitTransaction | null>;
  findByOrderId(orderId: string): Promise<SplitTransaction | null>;
  findByOrganizerAccountId(organizerAccountId: string): Promise<SplitTransaction[]>;
  findByStatus(status: SplitStatus): Promise<SplitTransaction[]>;
  update(transaction: SplitTransaction): Promise<SplitTransaction>;

  // Aggregations
  sumCompletedByOrganizerAccount(organizerAccountId: string): Promise<number>;
  sumPendingByOrganizerAccount(organizerAccountId: string): Promise<number>;

  // Queries with filters
  findByOrganizerAccountIdWithPagination(
    organizerAccountId: string,
    limit: number,
    offset: number
  ): Promise<{ transactions: SplitTransaction[]; total: number }>;
}
