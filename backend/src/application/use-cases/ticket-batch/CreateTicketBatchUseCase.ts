import { TicketBatch } from '../../../domain/entities/TicketBatch.js';
import { ITicketBatchRepository } from '../../../domain/repositories/ITicketBatchRepository.js';
import { ITicketRepository } from '../../../domain/repositories/ITicketRepository.js';

export interface CreateTicketBatchInput {
  ticketId: string;
  name: string;
  price: number;
  quantity: number;
  salesStart: Date;
  salesEnd: Date;
  order?: number;
}

export interface CreateTicketBatchOutput {
  id: string;
  ticketId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  salesStart: Date;
  salesEnd: Date;
  isActive: boolean;
  order: number;
}

export class CreateTicketBatchUseCase {
  constructor(
    private ticketBatchRepository: ITicketBatchRepository,
    private ticketRepository: ITicketRepository
  ) {}

  async execute(input: CreateTicketBatchInput): Promise<CreateTicketBatchOutput> {
    // Verify ticket exists
    const ticket = await this.ticketRepository.findById(input.ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get existing batches to determine order
    const existingBatches = await this.ticketBatchRepository.findByTicketId(input.ticketId);
    const maxOrder = existingBatches.reduce((max, b) => Math.max(max, b.order), -1);

    // Create batch
    const batch = TicketBatch.create({
      ticketId: input.ticketId,
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      salesStart: input.salesStart,
      salesEnd: input.salesEnd,
      order: input.order ?? maxOrder + 1,
    });

    const savedBatch = await this.ticketBatchRepository.create(batch);

    return {
      id: savedBatch.id,
      ticketId: savedBatch.ticketId,
      name: savedBatch.name,
      price: savedBatch.price,
      quantity: savedBatch.quantity,
      sold: savedBatch.sold,
      available: savedBatch.available,
      salesStart: savedBatch.salesStart,
      salesEnd: savedBatch.salesEnd,
      isActive: savedBatch.isActive,
      order: savedBatch.order,
    };
  }
}
