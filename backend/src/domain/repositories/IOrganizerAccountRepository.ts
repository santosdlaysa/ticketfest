import { OrganizerAccount } from '../entities/OrganizerAccount.js';

export interface IOrganizerAccountRepository {
  create(account: OrganizerAccount): Promise<OrganizerAccount>;
  findById(id: string): Promise<OrganizerAccount | null>;
  findByUserId(userId: string): Promise<OrganizerAccount | null>;
  findByStripeAccountId(stripeAccountId: string): Promise<OrganizerAccount | null>;
  findByPagarmeRecipientId(recipientId: string): Promise<OrganizerAccount | null>;
  update(account: OrganizerAccount): Promise<OrganizerAccount>;
  delete(id: string): Promise<void>;
  findAllVerified(): Promise<OrganizerAccount[]>;
  findAllPendingVerification(): Promise<OrganizerAccount[]>;
}
