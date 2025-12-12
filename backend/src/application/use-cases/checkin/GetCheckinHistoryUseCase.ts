import { ICheckinRepository, CheckinHistoryItem } from '../../../domain/repositories/ICheckinRepository.js';

export interface GetCheckinHistoryInput {
  eventId: string;
  limit?: number;
}

export interface GetCheckinHistoryOutput {
  history: CheckinHistoryItem[];
  total: number;
}

export class GetCheckinHistoryUseCase {
  constructor(
    private checkinRepository: ICheckinRepository
  ) {}

  async execute(input: GetCheckinHistoryInput): Promise<GetCheckinHistoryOutput> {
    const history = await this.checkinRepository.getCheckinHistory(
      input.eventId,
      input.limit ?? 50
    );

    return {
      history,
      total: history.length,
    };
  }
}
