import { prisma } from '../database/prisma/PrismaClient.js';
import { PrismaCheckinRepository } from '../database/repositories/PrismaCheckinRepository.js';

import {
  GetCheckinStatsUseCase,
  SearchTicketsUseCase,
  ValidateTicketUseCase,
  ManualCheckinUseCase,
  UndoCheckinUseCase,
  GetCheckinHistoryUseCase,
} from '../../application/use-cases/checkin/index.js';

export class CheckinUseCaseFactory {
  private static checkinRepository = new PrismaCheckinRepository(prisma);

  static getCheckinStatsUseCase(): GetCheckinStatsUseCase {
    return new GetCheckinStatsUseCase(this.checkinRepository);
  }

  static searchTicketsUseCase(): SearchTicketsUseCase {
    return new SearchTicketsUseCase(this.checkinRepository);
  }

  static validateTicketUseCase(): ValidateTicketUseCase {
    return new ValidateTicketUseCase(this.checkinRepository);
  }

  static manualCheckinUseCase(): ManualCheckinUseCase {
    return new ManualCheckinUseCase(this.checkinRepository);
  }

  static undoCheckinUseCase(): UndoCheckinUseCase {
    return new UndoCheckinUseCase(this.checkinRepository);
  }

  static getCheckinHistoryUseCase(): GetCheckinHistoryUseCase {
    return new GetCheckinHistoryUseCase(this.checkinRepository);
  }
}
