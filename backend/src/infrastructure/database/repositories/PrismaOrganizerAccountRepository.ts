import { PrismaClient } from '@prisma/client';
import {
  OrganizerAccount,
  AccountType,
  HolderType,
} from '../../../domain/entities/OrganizerAccount.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';

export class PrismaOrganizerAccountRepository implements IOrganizerAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async create(account: OrganizerAccount): Promise<OrganizerAccount> {
    const data = account.toJSON();

    const created = await this.prisma.organizerAccount.create({
      data: {
        id: data.id,
        userId: data.userId,
        verified: data.verified,
        verifiedAt: data.verifiedAt,
        bankCode: data.bankCode,
        bankName: data.bankName,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        accountDigit: data.accountDigit,
        agencyNumber: data.agencyNumber,
        agencyDigit: data.agencyDigit,
        holderName: data.holderName,
        holderDocument: data.holderDocument,
        holderType: data.holderType,
        stripeAccountId: data.stripeAccountId,
        pagarmeRecipientId: data.pagarmeRecipientId,
        mercadoPagoUserId: data.mercadoPagoUserId,
        asaasWalletId: data.asaasWalletId,
        availableBalance: data.availableBalance,
        pendingBalance: data.pendingBalance,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<OrganizerAccount | null> {
    const account = await this.prisma.organizerAccount.findUnique({
      where: { id },
    });

    return account ? this.toDomain(account) : null;
  }

  async findByUserId(userId: string): Promise<OrganizerAccount | null> {
    const account = await this.prisma.organizerAccount.findUnique({
      where: { userId },
    });

    return account ? this.toDomain(account) : null;
  }

  async findByStripeAccountId(stripeAccountId: string): Promise<OrganizerAccount | null> {
    const account = await this.prisma.organizerAccount.findUnique({
      where: { stripeAccountId },
    });

    return account ? this.toDomain(account) : null;
  }

  async findByPagarmeRecipientId(recipientId: string): Promise<OrganizerAccount | null> {
    const account = await this.prisma.organizerAccount.findUnique({
      where: { pagarmeRecipientId: recipientId },
    });

    return account ? this.toDomain(account) : null;
  }

  async update(account: OrganizerAccount): Promise<OrganizerAccount> {
    const data = account.toJSON();

    const updated = await this.prisma.organizerAccount.update({
      where: { id: data.id },
      data: {
        verified: data.verified,
        verifiedAt: data.verifiedAt,
        bankCode: data.bankCode,
        bankName: data.bankName,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        accountDigit: data.accountDigit,
        agencyNumber: data.agencyNumber,
        agencyDigit: data.agencyDigit,
        holderName: data.holderName,
        holderDocument: data.holderDocument,
        holderType: data.holderType,
        stripeAccountId: data.stripeAccountId,
        pagarmeRecipientId: data.pagarmeRecipientId,
        mercadoPagoUserId: data.mercadoPagoUserId,
        asaasWalletId: data.asaasWalletId,
        availableBalance: data.availableBalance,
        pendingBalance: data.pendingBalance,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organizerAccount.delete({
      where: { id },
    });
  }

  async findAllVerified(): Promise<OrganizerAccount[]> {
    const accounts = await this.prisma.organizerAccount.findMany({
      where: { verified: true },
    });

    return accounts.map((a) => this.toDomain(a));
  }

  async findAllPendingVerification(): Promise<OrganizerAccount[]> {
    const accounts = await this.prisma.organizerAccount.findMany({
      where: {
        verified: false,
        OR: [
          { bankCode: { not: null } },
          { stripeAccountId: { not: null } },
          { pagarmeRecipientId: { not: null } },
          { mercadoPagoUserId: { not: null } },
          { asaasWalletId: { not: null } },
        ],
      },
    });

    return accounts.map((a) => this.toDomain(a));
  }

  private toDomain(data: any): OrganizerAccount {
    return OrganizerAccount.restore({
      id: data.id,
      userId: data.userId,
      verified: data.verified,
      verifiedAt: data.verifiedAt ?? undefined,
      bankCode: data.bankCode ?? undefined,
      bankName: data.bankName ?? undefined,
      accountType: data.accountType as AccountType | undefined,
      accountNumber: data.accountNumber ?? undefined,
      accountDigit: data.accountDigit ?? undefined,
      agencyNumber: data.agencyNumber ?? undefined,
      agencyDigit: data.agencyDigit ?? undefined,
      holderName: data.holderName ?? undefined,
      holderDocument: data.holderDocument ?? undefined,
      holderType: data.holderType as HolderType | undefined,
      stripeAccountId: data.stripeAccountId ?? undefined,
      pagarmeRecipientId: data.pagarmeRecipientId ?? undefined,
      mercadoPagoUserId: data.mercadoPagoUserId ?? undefined,
      asaasWalletId: data.asaasWalletId ?? undefined,
      availableBalance: data.availableBalance,
      pendingBalance: data.pendingBalance,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
