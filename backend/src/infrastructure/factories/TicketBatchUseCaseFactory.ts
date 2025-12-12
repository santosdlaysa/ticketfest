import { prisma } from '../database/prisma/PrismaClient.js';
import { PrismaTicketBatchRepository } from '../database/repositories/PrismaTicketBatchRepository.js';
import { PrismaTicketRepository } from '../database/repositories/PrismaTicketRepository.js';

import {
  CreateTicketBatchUseCase,
  GetTicketBatchesUseCase,
  UpdateTicketBatchUseCase,
  DeleteTicketBatchUseCase,
} from '../../application/use-cases/ticket-batch/index.js';

export class TicketBatchUseCaseFactory {
  private static ticketBatchRepository = new PrismaTicketBatchRepository(prisma);
  private static ticketRepository = new PrismaTicketRepository(prisma);

  static createTicketBatchUseCase(): CreateTicketBatchUseCase {
    return new CreateTicketBatchUseCase(
      this.ticketBatchRepository,
      this.ticketRepository
    );
  }

  static getTicketBatchesUseCase(): GetTicketBatchesUseCase {
    return new GetTicketBatchesUseCase(this.ticketBatchRepository);
  }

  static updateTicketBatchUseCase(): UpdateTicketBatchUseCase {
    return new UpdateTicketBatchUseCase(this.ticketBatchRepository);
  }

  static deleteTicketBatchUseCase(): DeleteTicketBatchUseCase {
    return new DeleteTicketBatchUseCase(this.ticketBatchRepository);
  }
}
