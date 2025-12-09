export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PIX = 'PIX',
}

export interface PayoutProps {
  id: string;
  organizerAccountId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  payoutMethod: PayoutMethod;
  bankCode?: string;
  accountNumber?: string;
  agencyNumber?: string;
  externalId?: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export class Payout {
  private constructor(private props: PayoutProps) {}

  static create(
    props: Pick<PayoutProps, 'organizerAccountId' | 'amount' | 'payoutMethod'> & {
      fee?: number;
      bankCode?: string;
      accountNumber?: string;
      agencyNumber?: string;
    }
  ): Payout {
    if (props.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const fee = props.fee ?? 0;
    if (fee < 0) {
      throw new Error('Fee must be non-negative');
    }

    const netAmount = props.amount - fee;
    if (netAmount <= 0) {
      throw new Error('Net amount must be positive after fee deduction');
    }

    return new Payout({
      id: crypto.randomUUID(),
      organizerAccountId: props.organizerAccountId,
      amount: props.amount,
      fee,
      netAmount,
      status: PayoutStatus.PENDING,
      payoutMethod: props.payoutMethod,
      bankCode: props.bankCode,
      accountNumber: props.accountNumber,
      agencyNumber: props.agencyNumber,
      requestedAt: new Date(),
    });
  }

  static restore(props: PayoutProps): Payout {
    return new Payout(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get organizerAccountId(): string {
    return this.props.organizerAccountId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get fee(): number {
    return this.props.fee;
  }

  get netAmount(): number {
    return this.props.netAmount;
  }

  get status(): PayoutStatus {
    return this.props.status;
  }

  get payoutMethod(): PayoutMethod {
    return this.props.payoutMethod;
  }

  get bankCode(): string | undefined {
    return this.props.bankCode;
  }

  get accountNumber(): string | undefined {
    return this.props.accountNumber;
  }

  get agencyNumber(): string | undefined {
    return this.props.agencyNumber;
  }

  get externalId(): string | undefined {
    return this.props.externalId;
  }

  get requestedAt(): Date {
    return this.props.requestedAt;
  }

  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get failedAt(): Date | undefined {
    return this.props.failedAt;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  // Business Logic Methods

  isPending(): boolean {
    return this.props.status === PayoutStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.props.status === PayoutStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.props.status === PayoutStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.props.status === PayoutStatus.FAILED;
  }

  isCancelled(): boolean {
    return this.props.status === PayoutStatus.CANCELLED;
  }

  canProcess(): boolean {
    return this.props.status === PayoutStatus.PENDING;
  }

  canCancel(): boolean {
    return this.props.status === PayoutStatus.PENDING;
  }

  /**
   * Inicia o processamento do saque
   */
  startProcessing(): void {
    if (!this.canProcess()) {
      throw new Error(`Cannot process payout in status: ${this.props.status}`);
    }
    this.props.status = PayoutStatus.PROCESSING;
    this.props.processedAt = new Date();
  }

  /**
   * Marca o saque como concluído
   */
  complete(externalId?: string): void {
    if (this.props.status !== PayoutStatus.PROCESSING) {
      throw new Error(`Cannot complete payout in status: ${this.props.status}`);
    }
    this.props.status = PayoutStatus.COMPLETED;
    this.props.completedAt = new Date();
    if (externalId) {
      this.props.externalId = externalId;
    }
  }

  /**
   * Marca o saque como falho
   */
  fail(reason: string): void {
    if (this.props.status !== PayoutStatus.PROCESSING && this.props.status !== PayoutStatus.PENDING) {
      throw new Error(`Cannot fail payout in status: ${this.props.status}`);
    }
    this.props.status = PayoutStatus.FAILED;
    this.props.failedAt = new Date();
    this.props.failureReason = reason;
  }

  /**
   * Cancela o saque
   */
  cancel(): void {
    if (!this.canCancel()) {
      throw new Error(`Cannot cancel payout in status: ${this.props.status}`);
    }
    this.props.status = PayoutStatus.CANCELLED;
  }

  /**
   * Define o ID externo (do gateway de pagamento)
   */
  setExternalId(externalId: string): void {
    this.props.externalId = externalId;
  }

  toJSON(): PayoutProps {
    return { ...this.props };
  }
}
