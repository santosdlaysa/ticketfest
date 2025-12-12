import { TicketBatch } from '../entities/TicketBatch.js';

export interface ITicketBatchRepository {
  create(batch: TicketBatch): Promise<TicketBatch>;
  findById(id: string): Promise<TicketBatch | null>;
  findByTicketId(ticketId: string): Promise<TicketBatch[]>;
  findActiveByTicketId(ticketId: string): Promise<TicketBatch[]>;
  findCurrentBatch(ticketId: string): Promise<TicketBatch | null>;
  update(batch: TicketBatch): Promise<TicketBatch>;
  delete(id: string): Promise<void>;
  deleteByTicketId(ticketId: string): Promise<void>;
  incrementSold(id: string, quantity: number): Promise<void>;
  decrementSold(id: string, quantity: number): Promise<void>;
}
