import { PrismaClient } from '@prisma/client';
import { Payout, PayoutStatus, PayoutMethod } from '../../../domain/entities/Payout.js';
import { IPayoutRepository } from '../../../domain/repositories/IPayoutRepository.js';

export class PrismaPayoutRepository implements IPayoutRepository {
  constructor(private prisma: PrismaClient) {}

  async create(payout: Payout): Promise<Payout> {
    const data = payout.toJSON();

    const created = await this.prisma.payout.create({
      data: {
        id: data.id,
        organizerAccountId: data.organizerAccountId,
        amount: data.amount,
        fee: data.fee,
        netAmount: data.netAmount,
        status: data.status,
        payoutMethod: data.payoutMethod,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        agencyNumber: data.agencyNumber,
        externalId: data.externalId,
        requestedAt: data.requestedAt,
        processedAt: data.processedAt,
        completedAt: data.completedAt,
        failedAt: data.failedAt,
        failureReason: data.failureReason,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<Payout | null> {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    return payout ? this.toDomain(payout) : null;
  }

  async findByOrganizerAccountId(organizerAccountId: string): Promise<Payout[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { organizerAccountId },
      orderBy: { requestedAt: 'desc' },
    });

    return payouts.map((p) => this.toDomain(p));
  }

  async findByStatus(status: PayoutStatus): Promise<Payout[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { status },
      orderBy: { requestedAt: 'desc' },
    });

    return payouts.map((p) => this.toDomain(p));
  }

  async update(payout: Payout): Promise<Payout> {
    const data = payout.toJSON();

    const updated = await this.prisma.payout.update({
      where: { id: data.id },
      data: {
        status: data.status,
        externalId: data.externalId,
        processedAt: data.processedAt,
        completedAt: data.completedAt,
        failedAt: data.failedAt,
        failureReason: data.failureReason,
      },
    });

    return this.toDomain(updated);
  }

  async sumCompletedByOrganizerAccount(organizerAccountId: string): Promise<number> {
    const result = await this.prisma.payout.aggregate({
      where: {
        organizerAccountId,
        status: 'COMPLETED',
      },
      _sum: {
        netAmount: true,
      },
    });

    return result._sum.netAmount ?? 0;
  }

  async sumPendingByOrganizerAccount(organizerAccountId: string): Promise<number> {
    const result = await this.prisma.payout.aggregate({
      where: {
        organizerAccountId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? 0;
  }

  async findByOrganizerAccountIdWithPagination(
    organizerAccountId: string,
    limit: number,
    offset: number
  ): Promise<{ payouts: Payout[]; total: number }> {
    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { organizerAccountId },
        orderBy: { requestedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payout.count({
        where: { organizerAccountId },
      }),
    ]);

    return {
      payouts: payouts.map((p) => this.toDomain(p)),
      total,
    };
  }

  async findPendingPayouts(): Promise<Payout[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { status: 'PENDING' },
      orderBy: { requestedAt: 'asc' },
    });

    return payouts.map((p) => this.toDomain(p));
  }

  private toDomain(data: any): Payout {
    return Payout.restore({
      id: data.id,
      organizerAccountId: data.organizerAccountId,
      amount: data.amount,
      fee: data.fee,
      netAmount: data.netAmount,
      status: data.status as PayoutStatus,
      payoutMethod: data.payoutMethod as PayoutMethod,
      bankCode: data.bankCode ?? undefined,
      accountNumber: data.accountNumber ?? undefined,
      agencyNumber: data.agencyNumber ?? undefined,
      externalId: data.externalId ?? undefined,
      requestedAt: data.requestedAt,
      processedAt: data.processedAt ?? undefined,
      completedAt: data.completedAt ?? undefined,
      failedAt: data.failedAt ?? undefined,
      failureReason: data.failureReason ?? undefined,
    });
  }
}
