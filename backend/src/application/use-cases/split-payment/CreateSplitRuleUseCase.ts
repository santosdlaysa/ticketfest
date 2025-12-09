import { SplitRule } from '../../../domain/entities/SplitRule.js';
import { ISplitRuleRepository } from '../../../domain/repositories/ISplitRuleRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';

export interface CreateSplitRuleInput {
  eventId: string;
  organizerId: string; // userId do organizador
  platformPercentage: number;
  organizerPercentage: number;
  platformFixedFee?: number;
}

export class CreateSplitRuleUseCase {
  constructor(
    private splitRuleRepository: ISplitRuleRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(
    input: CreateSplitRuleInput,
    requestingUserId: string,
    requestContext?: { ip?: string; userAgent?: string }
  ): Promise<SplitRule> {
    // Verificar se já existe regra para este evento
    const existingRule = await this.splitRuleRepository.findByEventId(input.eventId);
    if (existingRule) {
      throw new Error('Split rule already exists for this event');
    }

    // Buscar conta do organizador
    const organizerAccount = await this.organizerAccountRepository.findByUserId(input.organizerId);
    if (!organizerAccount) {
      throw new Error('Organizer account not found. Organizer must create an account first.');
    }

    // Verificar se a conta está verificada
    if (!organizerAccount.isVerified()) {
      throw new Error('Organizer account must be verified before creating split rules');
    }

    // Criar a regra de split
    const splitRule = SplitRule.create({
      eventId: input.eventId,
      organizerAccountId: organizerAccount.id,
      platformPercentage: input.platformPercentage,
      organizerPercentage: input.organizerPercentage,
      platformFixedFee: input.platformFixedFee ?? 0,
    });

    // Salvar
    const savedRule = await this.splitRuleRepository.create(splitRule);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'split_rule',
      entityId: savedRule.id,
      action: 'create',
      userId: requestingUserId,
      newData: savedRule.toJSON() as unknown as Record<string, unknown>,
      metadata: {
        eventId: input.eventId,
        organizerId: input.organizerId,
      },
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return savedRule;
  }
}
