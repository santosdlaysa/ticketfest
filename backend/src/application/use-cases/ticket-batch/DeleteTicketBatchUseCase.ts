import { ITicketBatchRepository } from '../../../domain/repositories/ITicketBatchRepository.js';

export interface DeleteTicketBatchInput {
  batchId: string;
}

export class DeleteTicketBatchUseCase {
  constructor(
    private ticketBatchRepository: ITicketBatchRepository
  ) {}

  async execute(input: DeleteTicketBatchInput): Promise<void> {
    const batch = await this.ticketBatchRepository.findById(input.batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    // Cannot delete if tickets have been sold
    if (batch.sold > 0) {
      throw new Error('Cannot delete batch with sold tickets');
    }

    await this.ticketBatchRepository.delete(input.batchId);
  }
}
