import { PrismaClient } from '@prisma/client';
import {
  IAuditLogRepository,
  AuditLogData,
  CreateAuditLogParams,
} from '../../../domain/repositories/IAuditLogRepository.js';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(params: CreateAuditLogParams): Promise<AuditLogData> {
    const created = await this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        previousData: params.previousData ?? undefined,
        newData: params.newData ?? undefined,
        metadata: params.metadata ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    return this.toDomain(created);
  }

  async findByEntityId(entityType: string, entityId: string): Promise<AuditLogData[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => this.toDomain(l));
  }

  async findByUserId(userId: string, limit: number = 100): Promise<AuditLogData[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => this.toDomain(l));
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLogData[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => this.toDomain(l));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLogData[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => this.toDomain(l));
  }

  private toDomain(data: any): AuditLogData {
    return {
      id: data.id,
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId ?? undefined,
      previousData: data.previousData as Record<string, unknown> | undefined,
      newData: data.newData as Record<string, unknown> | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      ipAddress: data.ipAddress ?? undefined,
      userAgent: data.userAgent ?? undefined,
      createdAt: data.createdAt,
    };
  }
}
