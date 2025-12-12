import { ICheckinRepository, CheckinStats } from '../../../domain/repositories/ICheckinRepository.js';

export interface GetCheckinStatsInput {
  eventId: string;
}

export type GetCheckinStatsOutput = CheckinStats;

export class GetCheckinStatsUseCase {
  constructor(
    private checkinRepository: ICheckinRepository
  ) {}

  async execute(input: GetCheckinStatsInput): Promise<GetCheckinStatsOutput> {
    return this.checkinRepository.getEventStats(input.eventId);
  }
}
