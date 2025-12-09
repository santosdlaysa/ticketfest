import { PrismaClient } from '@prisma/client';
import { SplitTransaction, SplitStatus } from '../../../domain/entities/SplitTransaction.js';
import { ISplitTransactionRepository } from '../../../domain/repositories/ISplitTransactionRepository.js';

export class PrismaSplitTransactionRepository implements ISplitTransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(transaction: SplitTransaction): Promise<SplitTransaction> {
    const data = transaction.toJSON();

    const created = await this.prisma.splitTransaction.create({
      data: {
        id: data.id,
        orderId: data.orderId,
        splitRuleId: data.splitRuleId,
        organizerAccountId: data.organizerAccountId,
        totalAmount: data.totalAmount,
        platformAmount: data.platformAmount,
        organizerAmount: data.organizerAmount,
        platformFee: data.platformFee,
        status: data.status,
        externalId: data.externalId,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<SplitTransaction | null> {
    const transaction = await this.prisma.splitTransaction.findUnique({
      where: { id },
    });

    return transaction ? this.toDomain(transaction) : null;
  }

  async findByOrderId(orderId: string): Promise<SplitTransaction | null> {
    const transaction = await this.prisma.splitTransaction.findFirst({
      where: { orderId },
    });

    return transaction ? this.toDomain(transaction) : null;
  }

  async findByOrganizerAccountId(organizerAccountId: string): Promise<SplitTransaction[]> {
    const transactions = await this.prisma.splitTransaction.findMany({
      where: { organizerAccountId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) => this.toDomain(t));
  }

  async findByStatus(status: SplitStatus): Promise<SplitTransaction[]> {
    const transactions = await this.prisma.splitTransaction.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) => this.toDomain(t));
  }

  async update(transaction: SplitTransaction): Promise<SplitTransaction> {
    const data = transaction.toJSON();

    const updated = await this.prisma.splitTransaction.update({
      where: { id: data.id },
      data: {
        status: data.status,
        externalId: data.externalId,
        processedAt: data.processedAt,
      },
    });

    return this.toDomain(updated);
  }

  async sumCompletedByOrganizerAccount(organizerAccountId: string): Promise<number> {
    const result = await this.prisma.splitTransaction.aggregate({
      where: {
        organizerAccountId,
        status: 'COMPLETED',
      },
      _sum: {
        organizerAmount: true,
      },
    });

    return result._sum.organizerAmount ?? 0;
  }

  async sumPendingByOrganizerAccount(organizerAccountId: string): Promise<number> {
    const result = await this.prisma.splitTransaction.aggregate({
      where: {
        organizerAccountId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      _sum: {
        organizerAmount: true,
      },
    });

    return result._sum.organizerAmount ?? 0;
  }

  async findByOrganizerAccountIdWithPagination(
    organizerAccountId: string,
    limit: number,
    offset: number
  ): Promise<{ transactions: SplitTransaction[]; total: number }> {
    const [transactions, total] = await Promise.all([
      this.prisma.splitTransaction.findMany({
        where: { organizerAccountId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.splitTransaction.count({
        where: { organizerAccountId },
      }),
    ]);

    return {
      transactions: transactions.map((t) => this.toDomain(t)),
      total,
    };
  }

  private toDomain(data: any): SplitTransaction {
    return SplitTransaction.restore({
      id: data.id,
      orderId: data.orderId,
      splitRuleId: data.splitRuleId,
      organizerAccountId: data.organizerAccountId,
      totalAmount: data.totalAmount,
      platformAmount: data.platformAmount,
      organizerAmount: data.organizerAmount,
      platformFee: data.platformFee,
      status: data.status as SplitStatus,
      externalId: data.externalId ?? undefined,
      createdAt: data.createdAt,
      processedAt: data.processedAt ?? undefined,
    });
  }
}
