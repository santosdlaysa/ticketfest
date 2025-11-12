export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
}

export interface OrderProps {
  id: string;
  userId: string;
  eventId: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  status: OrderStatus;
  couponCode?: string;
  createdAt: Date;
  paidAt?: Date;
}

export class Order {
  private constructor(private props: OrderProps) {}

  static create(
    props: Omit<OrderProps, 'id' | 'paymentStatus' | 'status' | 'createdAt'> & { id?: string }
  ): Order {
    return new Order({
      ...props,
      id: props.id || crypto.randomUUID(),
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
    });
  }

  static restore(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get discount(): number {
    return this.props.discount;
  }

  get total(): number {
    return this.props.total;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  get paymentId(): string | undefined {
    return this.props.paymentId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get couponCode(): string | undefined {
    return this.props.couponCode;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }

  isConfirmed(): boolean {
    return this.props.status === OrderStatus.CONFIRMED;
  }

  isCancelled(): boolean {
    return this.props.status === OrderStatus.CANCELLED;
  }

  isPaid(): boolean {
    return this.props.paymentStatus === PaymentStatus.PAID;
  }

  confirmPayment(paymentId?: string): void {
    if (this.props.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Payment already confirmed');
    }
    if (this.props.status === OrderStatus.CANCELLED) {
      throw new Error('Cannot confirm payment for cancelled order');
    }

    this.props.paymentStatus = PaymentStatus.PAID;
    this.props.status = OrderStatus.CONFIRMED;
    this.props.paidAt = new Date();

    if (paymentId) {
      this.props.paymentId = paymentId;
    }
  }

  cancel(): void {
    if (this.props.status === OrderStatus.CANCELLED) {
      throw new Error('Order already cancelled');
    }
    this.props.status = OrderStatus.CANCELLED;
  }

  refund(): void {
    if (this.props.paymentStatus !== PaymentStatus.PAID) {
      throw new Error('Cannot refund unpaid order');
    }
    this.props.paymentStatus = PaymentStatus.REFUNDED;
  }

  setPaymentFailed(): void {
    this.props.paymentStatus = PaymentStatus.FAILED;
  }

  toJSON(): OrderProps {
    return { ...this.props };
  }
}
