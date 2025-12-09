import { OrganizerAccount } from '../../../domain/entities/OrganizerAccount.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';

export class VerifyOrganizerAccountUseCase {
  constructor(
    private organizerAccountRepository: IOrganizerAccountRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(
    accountId: string,
    adminUserId: string,
    requestContext?: { ip?: string; userAgent?: string }
  ): Promise<OrganizerAccount> {
    // Buscar conta do organizador
    const account = await this.organizerAccountRepository.findById(accountId);
    if (!account) {
      throw new Error('Organizer account not found');
    }

    // Verificar se já está verificada
    if (account.isVerified()) {
      throw new Error('Account is already verified');
    }

    // Verificar se tem os dados necessários
    if (!account.hasBankDetails() && !account.hasExternalAccount()) {
      throw new Error('Account must have bank details or external account before verification');
    }

    // Guardar dados anteriores
    const previousData = account.toJSON();

    // Verificar a conta
    account.verify();

    // Salvar
    const updatedAccount = await this.organizerAccountRepository.update(account);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'organizer_account',
      entityId: account.id,
      action: 'verify',
      userId: adminUserId,
      previousData: previousData as unknown as Record<string, unknown>,
      newData: updatedAccount.toJSON() as unknown as Record<string, unknown>,
      metadata: { verifiedBy: adminUserId },
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return updatedAccount;
  }
}
