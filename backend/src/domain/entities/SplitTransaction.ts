export enum SplitStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface SplitTransactionProps {
  id: string;
  orderId: string;
  splitRuleId: string;
  organizerAccountId: string;
  totalAmount: number;
  platformAmount: number;
  organizerAmount: number;
  platformFee: number;
  status: SplitStatus;
  externalId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export class SplitTransaction {
  private constructor(private props: SplitTransactionProps) {}

  static create(
    props: Omit<SplitTransactionProps, 'id' | 'status' | 'createdAt'> & {
      id?: string;
    }
  ): SplitTransaction {
    // Validações
    if (props.totalAmount <= 0) {
      throw new Error('Total amount must be positive');
    }
    if (props.platformAmount < 0) {
      throw new Error('Platform amount must be non-negative');
    }
    if (props.organizerAmount < 0) {
      throw new Error('Organizer amount must be non-negative');
    }

    // Validar que os valores batem
    const calculatedTotal = props.platformAmount + props.organizerAmount;
    if (Math.abs(calculatedTotal - props.totalAmount) > 0.01) {
      throw new Error('Platform and organizer amounts must sum to total amount');
    }

    return new SplitTransaction({
      id: props.id || crypto.randomUUID(),
      orderId: props.orderId,
      splitRuleId: props.splitRuleId,
      organizerAccountId: props.organizerAccountId,
      totalAmount: props.totalAmount,
      platformAmount: props.platformAmount,
      organizerAmount: props.organizerAmount,
      platformFee: props.platformFee,
      status: SplitStatus.PENDING,
      externalId: props.externalId,
      createdAt: new Date(),
      processedAt: undefined,
    });
  }

  static restore(props: SplitTransactionProps): SplitTransaction {
    return new SplitTransaction(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get splitRuleId(): string {
    return this.props.splitRuleId;
  }

  get organizerAccountId(): string {
    return this.props.organizerAccountId;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get platformAmount(): number {
    return this.props.platformAmount;
  }

  get organizerAmount(): number {
    return this.props.organizerAmount;
  }

  get platformFee(): number {
    return this.props.platformFee;
  }

  get status(): SplitStatus {
    return this.props.status;
  }

  get externalId(): string | undefined {
    return this.props.externalId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }

  // Business Logic Methods

  isPending(): boolean {
    return this.props.status === SplitStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.props.status === SplitStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.props.status === SplitStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.props.status === SplitStatus.FAILED;
  }

  isRefunded(): boolean {
    return this.props.status === SplitStatus.REFUNDED;
  }

  canProcess(): boolean {
    return this.props.status === SplitStatus.PENDING;
  }

  canRefund(): boolean {
    return this.props.status === SplitStatus.COMPLETED;
  }

  /**
   * Marca a transação como em processamento
   */
  startProcessing(): void {
    if (!this.canProcess()) {
      throw new Error(`Cannot process split transaction in status: ${this.props.status}`);
    }
    this.props.status = SplitStatus.PROCESSING;
  }

  /**
   * Marca a transação como concluída
   */
  complete(externalId?: string): void {
    if (this.props.status !== SplitStatus.PROCESSING && this.props.status !== SplitStatus.PENDING) {
      throw new Error(`Cannot complete split transaction in status: ${this.props.status}`);
    }
    this.props.status = SplitStatus.COMPLETED;
    this.props.processedAt = new Date();
    if (externalId) {
      this.props.externalId = externalId;
    }
  }

  /**
   * Marca a transação como falha
   */
  fail(): void {
    if (this.props.status !== SplitStatus.PROCESSING && this.props.status !== SplitStatus.PENDING) {
      throw new Error(`Cannot fail split transaction in status: ${this.props.status}`);
    }
    this.props.status = SplitStatus.FAILED;
    this.props.processedAt = new Date();
  }

  /**
   * Marca a transação como estornada
   */
  refund(): void {
    if (!this.canRefund()) {
      throw new Error(`Cannot refund split transaction in status: ${this.props.status}`);
    }
    this.props.status = SplitStatus.REFUNDED;
  }

  /**
   * Define o ID externo (do gateway de pagamento)
   */
  setExternalId(externalId: string): void {
    this.props.externalId = externalId;
  }

  toJSON(): SplitTransactionProps {
    return { ...this.props };
  }
}
