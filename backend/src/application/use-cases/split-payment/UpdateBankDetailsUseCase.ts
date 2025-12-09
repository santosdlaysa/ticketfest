import { OrganizerAccount, BankDetails } from '../../../domain/entities/OrganizerAccount.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';

export class UpdateBankDetailsUseCase {
  constructor(
    private organizerAccountRepository: IOrganizerAccountRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(
    userId: string,
    bankDetails: BankDetails,
    requestContext?: { ip?: string; userAgent?: string }
  ): Promise<OrganizerAccount> {
    // Buscar conta do organizador
    const account = await this.organizerAccountRepository.findByUserId(userId);
    if (!account) {
      throw new Error('Organizer account not found');
    }

    // Guardar dados anteriores para auditoria
    const previousData = account.toJSON();

    // Atualizar dados bancários (isso também invalida a verificação)
    account.updateBankDetails(bankDetails);

    // Salvar
    const updatedAccount = await this.organizerAccountRepository.update(account);

    // Log de auditoria
    await this.auditLogRepository.create({
      entityType: 'organizer_account',
      entityId: account.id,
      action: 'update_bank_details',
      userId,
      previousData: previousData as unknown as Record<string, unknown>,
      newData: updatedAccount.toJSON() as unknown as Record<string, unknown>,
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return updatedAccount;
  }
}
