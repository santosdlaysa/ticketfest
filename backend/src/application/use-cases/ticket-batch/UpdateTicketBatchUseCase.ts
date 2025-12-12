import { ITicketBatchRepository } from '../../../domain/repositories/ITicketBatchRepository.js';

export interface UpdateTicketBatchInput {
  batchId: string;
  name?: string;
  price?: number;
  quantity?: number;
  salesStart?: Date;
  salesEnd?: Date;
  isActive?: boolean;
  order?: number;
}

export interface UpdateTicketBatchOutput {
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

export class UpdateTicketBatchUseCase {
  constructor(
    private ticketBatchRepository: ITicketBatchRepository
  ) {}

  async execute(input: UpdateTicketBatchInput): Promise<UpdateTicketBatchOutput> {
    const batch = await this.ticketBatchRepository.findById(input.batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    // Update fields
    if (input.isActive !== undefined) {
      if (input.isActive) {
        batch.activate();
      } else {
        batch.deactivate();
      }
    }

    batch.update({
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      salesStart: input.salesStart,
      salesEnd: input.salesEnd,
      order: input.order,
    });

    const updatedBatch = await this.ticketBatchRepository.update(batch);

    return {
      id: updatedBatch.id,
      ticketId: updatedBatch.ticketId,
      name: updatedBatch.name,
      price: updatedBatch.price,
      quantity: updatedBatch.quantity,
      sold: updatedBatch.sold,
      available: updatedBatch.available,
      salesStart: updatedBatch.salesStart,
      salesEnd: updatedBatch.salesEnd,
      isActive: updatedBatch.isActive,
      order: updatedBatch.order,
    };
  }
}
