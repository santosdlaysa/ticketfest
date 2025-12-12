// CompanySettings extends OrganizerAccount with company-specific data
// This is a value object that represents company settings within OrganizerAccount

export interface CompanySettingsProps {
  companyName?: string;       // Razão social
  tradingName?: string;       // Nome fantasia
  cnpj?: string;              // CNPJ da empresa
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZipCode?: string;
  taxRegime?: string;         // Simples, Lucro Presumido, etc
}

export class CompanySettings {
  private constructor(private props: CompanySettingsProps) {}

  static create(props: CompanySettingsProps): CompanySettings {
    // Validate CNPJ format if provided
    if (props.cnpj && !CompanySettings.isValidCNPJ(props.cnpj)) {
      throw new Error('Invalid CNPJ format');
    }

    return new CompanySettings({
      companyName: props.companyName?.trim(),
      tradingName: props.tradingName?.trim(),
      cnpj: props.cnpj ? CompanySettings.formatCNPJ(props.cnpj) : undefined,
      companyEmail: props.companyEmail?.trim().toLowerCase(),
      companyPhone: props.companyPhone?.replace(/\D/g, ''),
      companyAddress: props.companyAddress?.trim(),
      companyCity: props.companyCity?.trim(),
      companyState: props.companyState?.toUpperCase(),
      companyZipCode: props.companyZipCode?.replace(/\D/g, ''),
      taxRegime: props.taxRegime,
    });
  }

  static restore(props: CompanySettingsProps): CompanySettings {
    return new CompanySettings(props);
  }

  // Getters
  get companyName(): string | undefined {
    return this.props.companyName;
  }

  get tradingName(): string | undefined {
    return this.props.tradingName;
  }

  get cnpj(): string | undefined {
    return this.props.cnpj;
  }

  get companyEmail(): string | undefined {
    return this.props.companyEmail;
  }

  get companyPhone(): string | undefined {
    return this.props.companyPhone;
  }

  get companyAddress(): string | undefined {
    return this.props.companyAddress;
  }

  get companyCity(): string | undefined {
    return this.props.companyCity;
  }

  get companyState(): string | undefined {
    return this.props.companyState;
  }

  get companyZipCode(): string | undefined {
    return this.props.companyZipCode;
  }

  get taxRegime(): string | undefined {
    return this.props.taxRegime;
  }

  // Validation
  static isValidCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // CNPJ validation algorithm
    let sum = 0;
    let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weight[i];
    }

    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cleaned[12]) !== digit1) return false;

    sum = 0;
    weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weight[i];
    }

    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(cleaned[13]) === digit2;
  }

  static formatCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  static formatCNPJDisplay(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  // Business Logic
  isComplete(): boolean {
    return !!(
      this.props.companyName &&
      this.props.cnpj &&
      this.props.companyEmail &&
      this.props.companyAddress &&
      this.props.companyCity &&
      this.props.companyState
    );
  }

  getFullAddress(): string | undefined {
    if (!this.props.companyAddress) return undefined;

    const parts = [
      this.props.companyAddress,
      this.props.companyCity,
      this.props.companyState,
      this.props.companyZipCode,
    ].filter(Boolean);

    return parts.join(', ');
  }

  toJSON(): CompanySettingsProps {
    return { ...this.props };
  }
}

// Tax regime options
export const TAX_REGIMES = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
  { value: 'mei', label: 'MEI' },
] as const;

export type TaxRegime = typeof TAX_REGIMES[number]['value'];
