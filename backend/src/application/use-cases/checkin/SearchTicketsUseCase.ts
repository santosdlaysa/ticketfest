import {
  ICheckinRepository,
  CheckinSearchParams,
  CheckinSearchResult,
} from '../../../domain/repositories/ICheckinRepository.js';

export type SearchTicketsInput = CheckinSearchParams;
export type SearchTicketsOutput = CheckinSearchResult;

export class SearchTicketsUseCase {
  constructor(
    private checkinRepository: ICheckinRepository
  ) {}

  async execute(input: SearchTicketsInput): Promise<SearchTicketsOutput> {
    return this.checkinRepository.searchTickets(input);
  }
}
