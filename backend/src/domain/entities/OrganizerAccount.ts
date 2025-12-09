export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum HolderType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export interface BankDetails {
  bankCode: string;
  bankName: string;
  accountType: AccountType;
  accountNumber: string;
  accountDigit: string;
  agencyNumber: string;
  agencyDigit?: string;
  holderName: string;
  holderDocument: string; // CPF ou CNPJ
  holderType: HolderType;
}

export interface OrganizerAccountProps {
  id: string;
  userId: string;
  verified: boolean;
  verifiedAt?: Date;
  bankCode?: string;
  bankName?: string;
  accountType?: AccountType;
  accountNumber?: string;
  accountDigit?: string;
  agencyNumber?: string;
  agencyDigit?: string;
  holderName?: string;
  holderDocument?: string;
  holderType?: HolderType;
  stripeAccountId?: string;
  pagarmeRecipientId?: string;
  mercadoPagoUserId?: string;
  asaasWalletId?: string;
  availableBalance: number;
  pendingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizerAccount {
  private constructor(private props: OrganizerAccountProps) {}

  static create(
    props: Pick<OrganizerAccountProps, 'userId'> & Partial<Omit<OrganizerAccountProps, 'id' | 'createdAt' | 'updatedAt'>>
  ): OrganizerAccount {
    return new OrganizerAccount({
      id: crypto.randomUUID(),
      userId: props.userId,
      verified: props.verified ?? false,
      verifiedAt: props.verifiedAt,
      bankCode: props.bankCode,
      bankName: props.bankName,
      accountType: props.accountType,
      accountNumber: props.accountNumber,
      accountDigit: props.accountDigit,
      agencyNumber: props.agencyNumber,
      agencyDigit: props.agencyDigit,
      holderName: props.holderName,
      holderDocument: props.holderDocument,
      holderType: props.holderType,
      stripeAccountId: props.stripeAccountId,
      pagarmeRecipientId: props.pagarmeRecipientId,
      mercadoPagoUserId: props.mercadoPagoUserId,
      asaasWalletId: props.asaasWalletId,
      availableBalance: props.availableBalance ?? 0,
      pendingBalance: props.pendingBalance ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: OrganizerAccountProps): OrganizerAccount {
    return new OrganizerAccount(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get verified(): boolean {
    return this.props.verified;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get bankCode(): string | undefined {
    return this.props.bankCode;
  }

  get bankName(): string | undefined {
    return this.props.bankName;
  }

  get accountType(): AccountType | undefined {
    return this.props.accountType;
  }

  get accountNumber(): string | undefined {
    return this.props.accountNumber;
  }

  get accountDigit(): string | undefined {
    return this.props.accountDigit;
  }

  get agencyNumber(): string | undefined {
    return this.props.agencyNumber;
  }

  get agencyDigit(): string | undefined {
    return this.props.agencyDigit;
  }

  get holderName(): string | undefined {
    return this.props.holderName;
  }

  get holderDocument(): string | undefined {
    return this.props.holderDocument;
  }

  get holderType(): HolderType | undefined {
    return this.props.holderType;
  }

  get stripeAccountId(): string | undefined {
    return this.props.stripeAccountId;
  }

  get pagarmeRecipientId(): string | undefined {
    return this.props.pagarmeRecipientId;
  }

  get mercadoPagoUserId(): string | undefined {
    return this.props.mercadoPagoUserId;
  }

  get asaasWalletId(): string | undefined {
    return this.props.asaasWalletId;
  }

  get availableBalance(): number {
    return this.props.availableBalance;
  }

  get pendingBalance(): number {
    return this.props.pendingBalance;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods

  isVerified(): boolean {
    return this.props.verified;
  }

  hasBankDetails(): boolean {
    return !!(
      this.props.bankCode &&
      this.props.accountNumber &&
      this.props.agencyNumber &&
      this.props.holderName &&
      this.props.holderDocument
    );
  }

  hasExternalAccount(): boolean {
    return !!(
      this.props.stripeAccountId ||
      this.props.pagarmeRecipientId ||
      this.props.mercadoPagoUserId ||
      this.props.asaasWalletId
    );
  }

  canReceivePayments(): boolean {
    return this.isVerified() && (this.hasBankDetails() || this.hasExternalAccount());
  }

  canWithdraw(amount: number): boolean {
    return this.isVerified() && this.props.availableBalance >= amount && amount > 0;
  }

  verify(): void {
    if (this.props.verified) {
      throw new Error('Account already verified');
    }
    if (!this.hasBankDetails() && !this.hasExternalAccount()) {
      throw new Error('Account must have bank details or external account to be verified');
    }
    this.props.verified = true;
    this.props.verifiedAt = new Date();
    this.props.updatedAt = new Date();
  }

  unverify(): void {
    this.props.verified = false;
    this.props.verifiedAt = undefined;
    this.props.updatedAt = new Date();
  }

  updateBankDetails(bankDetails: BankDetails): void {
    this.props.bankCode = bankDetails.bankCode;
    this.props.bankName = bankDetails.bankName;
    this.props.accountType = bankDetails.accountType;
    this.props.accountNumber = bankDetails.accountNumber;
    this.props.accountDigit = bankDetails.accountDigit;
    this.props.agencyNumber = bankDetails.agencyNumber;
    this.props.agencyDigit = bankDetails.agencyDigit;
    this.props.holderName = bankDetails.holderName;
    this.props.holderDocument = bankDetails.holderDocument;
    this.props.holderType = bankDetails.holderType;
    this.props.updatedAt = new Date();

    // If bank details change, require re-verification
    if (this.props.verified) {
      this.props.verified = false;
      this.props.verifiedAt = undefined;
    }
  }

  setStripeAccountId(accountId: string): void {
    this.props.stripeAccountId = accountId;
    this.props.updatedAt = new Date();
  }

  setPagarmeRecipientId(recipientId: string): void {
    this.props.pagarmeRecipientId = recipientId;
    this.props.updatedAt = new Date();
  }

  setMercadoPagoUserId(userId: string): void {
    this.props.mercadoPagoUserId = userId;
    this.props.updatedAt = new Date();
  }

  setAsaasWalletId(walletId: string): void {
    this.props.asaasWalletId = walletId;
    this.props.updatedAt = new Date();
  }

  addPendingBalance(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.props.pendingBalance += amount;
    this.props.updatedAt = new Date();
  }

  releasePendingToAvailable(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (this.props.pendingBalance < amount) {
      throw new Error('Insufficient pending balance');
    }
    this.props.pendingBalance -= amount;
    this.props.availableBalance += amount;
    this.props.updatedAt = new Date();
  }

  deductAvailableBalance(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (this.props.availableBalance < amount) {
      throw new Error('Insufficient available balance');
    }
    this.props.availableBalance -= amount;
    this.props.updatedAt = new Date();
  }

  refundToAvailable(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.props.availableBalance += amount;
    this.props.updatedAt = new Date();
  }

  toJSON(): OrganizerAccountProps {
    return { ...this.props };
  }
}
