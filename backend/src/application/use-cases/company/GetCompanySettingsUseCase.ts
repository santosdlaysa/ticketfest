import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { CompanySettingsProps } from '../../../domain/entities/CompanySettings.js';

export interface GetCompanySettingsInput {
  userId: string;
}

export interface GetCompanySettingsOutput {
  id: string;
  userId: string;
  verified: boolean;
  companySettings: CompanySettingsProps;
  bankDetails: {
    bankCode?: string;
    bankName?: string;
    accountType?: string;
    accountNumber?: string;
    accountDigit?: string;
    agencyNumber?: string;
    agencyDigit?: string;
    holderName?: string;
    holderDocument?: string;
    holderType?: string;
  };
  availableBalance: number;
  pendingBalance: number;
}

export class GetCompanySettingsUseCase {
  constructor(
    private organizerAccountRepository: IOrganizerAccountRepository
  ) {}

  async execute(input: GetCompanySettingsInput): Promise<GetCompanySettingsOutput | null> {
    const account = await this.organizerAccountRepository.findByUserId(input.userId);

    if (!account) {
      return null;
    }

    const data = account.toJSON();

    return {
      id: data.id,
      userId: data.userId,
      verified: data.verified,
      companySettings: {
        companyName: (data as any).companyName,
        tradingName: (data as any).tradingName,
        cnpj: (data as any).cnpj,
        companyEmail: (data as any).companyEmail,
        companyPhone: (data as any).companyPhone,
        companyAddress: (data as any).companyAddress,
        companyCity: (data as any).companyCity,
        companyState: (data as any).companyState,
        companyZipCode: (data as any).companyZipCode,
        taxRegime: (data as any).taxRegime,
      },
      bankDetails: {
        bankCode: data.bankCode,
        bankName: data.bankName,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        accountDigit: data.accountDigit,
        agencyNumber: data.agencyNumber,
        agencyDigit: data.agencyDigit,
        holderName: data.holderName,
        holderDocument: data.holderDocument,
        holderType: data.holderType,
      },
      availableBalance: data.availableBalance,
      pendingBalance: data.pendingBalance,
    };
  }
}
