export interface AuditLogData {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditLogRepository {
  create(params: CreateAuditLogParams): Promise<AuditLogData>;
  findByEntityId(entityType: string, entityId: string): Promise<AuditLogData[]>;
  findByUserId(userId: string, limit?: number): Promise<AuditLogData[]>;
  findByAction(action: string, limit?: number): Promise<AuditLogData[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLogData[]>;
}
