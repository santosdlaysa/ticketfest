import { OrganizerAccount, BankDetails } from '../../../domain/entities/OrganizerAccount.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';
import { SplitPaymentService } from '../../../infrastructure/services/SplitPaymentService.js';

export interface CreateOrganizerAccountInput {
  userId: string;
  bankDetails?: BankDetails;
  createStripeAccount?: boolean;
}

export class CreateOrganizerAccountUseCase {
  constructor(
    private organizerAccountRepository: IOrganizerAccountRepository,
    private splitPaymentService: SplitPaymentService,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(input: CreateOrganizerAccountInput, requestContext?: { ip?: string; userAgent?: string }): Promise<OrganizerAccount> {
    // Verificar se já existe conta para este usuário
    const existingAccount = await this.organizerAccountRepository.findByUserId(input.userId);
    if (existingAccount) {
      throw new Error('Organizer account already exists for this user');
    }

    // Criar a conta do organizador
    const account = OrganizerAccount.create({
      userId: input.userId,
    });

    // Se forneceu dados bancários, atualizar
    if (input.bankDetails) {
      account.updateBankDetails(input.bankDetails);
    }

    // Se solicitou criação de conta Stripe
    if (input.createStripeAccount) {
      // Precisaria do email do usuário aqui
      // Por enquanto, apenas cria a conta local
    }

    // Salvar no banco
    const savedAccount = await this.organizerAccountRepository.create(account);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'organizer_account',
      entityId: savedAccount.id,
      action: 'create',
      userId: input.userId,
      newData: savedAccount.toJSON() as unknown as Record<string, unknown>,
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return savedAccount;
  }
}
