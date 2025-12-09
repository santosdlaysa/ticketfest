import { SplitRule } from '../../../domain/entities/SplitRule.js';
import { ISplitRuleRepository } from '../../../domain/repositories/ISplitRuleRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';

export interface UpdateSplitRuleInput {
  platformPercentage: number;
  organizerPercentage: number;
  platformFixedFee?: number;
}

export class UpdateSplitRuleUseCase {
  constructor(
    private splitRuleRepository: ISplitRuleRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(
    eventId: string,
    input: UpdateSplitRuleInput,
    requestingUserId: string,
    requestContext?: { ip?: string; userAgent?: string }
  ): Promise<SplitRule> {
    // Buscar regra existente
    const splitRule = await this.splitRuleRepository.findByEventId(eventId);
    if (!splitRule) {
      throw new Error('Split rule not found for this event');
    }

    // Guardar dados anteriores
    const previousData = splitRule.toJSON();

    // Atualizar porcentagens
    splitRule.updatePercentages(input.platformPercentage, input.organizerPercentage);

    // Atualizar taxa fixa se fornecida
    if (input.platformFixedFee !== undefined) {
      splitRule.updatePlatformFixedFee(input.platformFixedFee);
    }

    // Salvar
    const updatedRule = await this.splitRuleRepository.update(splitRule);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'split_rule',
      entityId: splitRule.id,
      action: 'update',
      userId: requestingUserId,
      previousData: previousData as unknown as Record<string, unknown>,
      newData: updatedRule.toJSON() as unknown as Record<string, unknown>,
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return updatedRule;
  }
}
