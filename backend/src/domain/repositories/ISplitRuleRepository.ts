import { SplitRule } from '../entities/SplitRule.js';

export interface ISplitRuleRepository {
  create(splitRule: SplitRule): Promise<SplitRule>;
  findById(id: string): Promise<SplitRule | null>;
  findByEventId(eventId: string): Promise<SplitRule | null>;
  findByOrganizerAccountId(organizerAccountId: string): Promise<SplitRule[]>;
  update(splitRule: SplitRule): Promise<SplitRule>;
  delete(id: string): Promise<void>;
  findAllActive(): Promise<SplitRule[]>;
}
