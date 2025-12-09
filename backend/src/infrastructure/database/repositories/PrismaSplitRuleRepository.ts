import { PrismaClient } from '@prisma/client';
import { SplitRule } from '../../../domain/entities/SplitRule.js';
import { ISplitRuleRepository } from '../../../domain/repositories/ISplitRuleRepository.js';

export class PrismaSplitRuleRepository implements ISplitRuleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(splitRule: SplitRule): Promise<SplitRule> {
    const data = splitRule.toJSON();

    const created = await this.prisma.splitRule.create({
      data: {
        id: data.id,
        eventId: data.eventId,
        organizerAccountId: data.organizerAccountId,
        platformPercentage: data.platformPercentage,
        organizerPercentage: data.organizerPercentage,
        platformFixedFee: data.platformFixedFee,
        active: data.active,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<SplitRule | null> {
    const splitRule = await this.prisma.splitRule.findUnique({
      where: { id },
    });

    return splitRule ? this.toDomain(splitRule) : null;
  }

  async findByEventId(eventId: string): Promise<SplitRule | null> {
    const splitRule = await this.prisma.splitRule.findUnique({
      where: { eventId },
    });

    return splitRule ? this.toDomain(splitRule) : null;
  }

  async findByOrganizerAccountId(organizerAccountId: string): Promise<SplitRule[]> {
    const splitRules = await this.prisma.splitRule.findMany({
      where: { organizerAccountId },
      orderBy: { createdAt: 'desc' },
    });

    return splitRules.map((sr) => this.toDomain(sr));
  }

  async update(splitRule: SplitRule): Promise<SplitRule> {
    const data = splitRule.toJSON();

    const updated = await this.prisma.splitRule.update({
      where: { id: data.id },
      data: {
        platformPercentage: data.platformPercentage,
        organizerPercentage: data.organizerPercentage,
        platformFixedFee: data.platformFixedFee,
        active: data.active,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.splitRule.delete({
      where: { id },
    });
  }

  async findAllActive(): Promise<SplitRule[]> {
    const splitRules = await this.prisma.splitRule.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    return splitRules.map((sr) => this.toDomain(sr));
  }

  private toDomain(data: any): SplitRule {
    return SplitRule.restore({
      id: data.id,
      eventId: data.eventId,
      organizerAccountId: data.organizerAccountId,
      platformPercentage: data.platformPercentage,
      organizerPercentage: data.organizerPercentage,
      platformFixedFee: data.platformFixedFee,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
