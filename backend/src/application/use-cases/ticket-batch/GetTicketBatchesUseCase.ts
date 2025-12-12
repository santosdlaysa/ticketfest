import { ITicketBatchRepository } from '../../../domain/repositories/ITicketBatchRepository.js';

export interface GetTicketBatchesInput {
  ticketId: string;
  activeOnly?: boolean;
}

export interface TicketBatchDTO {
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
  isOnSale: boolean;
  isSoldOut: boolean;
  salesProgress: number;
  order: number;
}

export interface GetTicketBatchesOutput {
  batches: TicketBatchDTO[];
  currentBatch: TicketBatchDTO | null;
  totalQuantity: number;
  totalSold: number;
  totalAvailable: number;
}

export class GetTicketBatchesUseCase {
  constructor(
    private ticketBatchRepository: ITicketBatchRepository
  ) {}

  async execute(input: GetTicketBatchesInput): Promise<GetTicketBatchesOutput> {
    const batches = input.activeOnly
      ? await this.ticketBatchRepository.findActiveByTicketId(input.ticketId)
      : await this.ticketBatchRepository.findByTicketId(input.ticketId);

    const currentBatch = await this.ticketBatchRepository.findCurrentBatch(input.ticketId);

    const batchDTOs: TicketBatchDTO[] = batches.map((batch) => ({
      id: batch.id,
      ticketId: batch.ticketId,
      name: batch.name,
      price: batch.price,
      quantity: batch.quantity,
      sold: batch.sold,
      available: batch.available,
      salesStart: batch.salesStart,
      salesEnd: batch.salesEnd,
      isActive: batch.isActive,
      isOnSale: batch.isOnSale,
      isSoldOut: batch.isSoldOut,
      salesProgress: batch.salesProgress,
      order: batch.order,
    }));

    const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
    const totalSold = batches.reduce((sum, b) => sum + b.sold, 0);
    const totalAvailable = batches.reduce((sum, b) => sum + b.available, 0);

    return {
      batches: batchDTOs,
      currentBatch: currentBatch
        ? {
            id: currentBatch.id,
            ticketId: currentBatch.ticketId,
            name: currentBatch.name,
            price: currentBatch.price,
            quantity: currentBatch.quantity,
            sold: currentBatch.sold,
            available: currentBatch.available,
            salesStart: currentBatch.salesStart,
            salesEnd: currentBatch.salesEnd,
            isActive: currentBatch.isActive,
            isOnSale: currentBatch.isOnSale,
            isSoldOut: currentBatch.isSoldOut,
            salesProgress: currentBatch.salesProgress,
            order: currentBatch.order,
          }
        : null,
      totalQuantity,
      totalSold,
      totalAvailable,
    };
  }
}
