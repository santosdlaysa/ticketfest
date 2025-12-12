export interface TicketBatchProps {
  id: string;
  ticketId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  salesStart: Date;
  salesEnd: Date;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TicketBatch {
  private constructor(private props: TicketBatchProps) {}

  static create(
    props: Pick<TicketBatchProps, 'ticketId' | 'name' | 'price' | 'quantity' | 'salesStart' | 'salesEnd'> &
    Partial<Omit<TicketBatchProps, 'id' | 'createdAt' | 'updatedAt'>>
  ): TicketBatch {
    if (props.price < 0) {
      throw new Error('Price cannot be negative');
    }
    if (props.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    if (props.salesStart >= props.salesEnd) {
      throw new Error('Sales start must be before sales end');
    }

    return new TicketBatch({
      id: crypto.randomUUID(),
      ticketId: props.ticketId,
      name: props.name,
      price: props.price,
      quantity: props.quantity,
      sold: props.sold ?? 0,
      salesStart: props.salesStart,
      salesEnd: props.salesEnd,
      isActive: props.isActive ?? true,
      order: props.order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: TicketBatchProps): TicketBatch {
    return new TicketBatch(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get ticketId(): string {
    return this.props.ticketId;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): number {
    return this.props.price;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get sold(): number {
    return this.props.sold;
  }

  get salesStart(): Date {
    return this.props.salesStart;
  }

  get salesEnd(): Date {
    return this.props.salesEnd;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get order(): number {
    return this.props.order;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get available(): number {
    return this.props.quantity - this.props.sold;
  }

  get isSoldOut(): boolean {
    return this.available <= 0;
  }

  get isOnSale(): boolean {
    const now = new Date();
    return this.props.isActive &&
           now >= this.props.salesStart &&
           now <= this.props.salesEnd &&
           !this.isSoldOut;
  }

  get salesProgress(): number {
    return (this.props.sold / this.props.quantity) * 100;
  }

  // Business Logic
  canPurchase(quantity: number): boolean {
    return this.isOnSale && this.available >= quantity;
  }

  purchase(quantity: number): void {
    if (!this.canPurchase(quantity)) {
      throw new Error('Cannot purchase: batch not available or insufficient quantity');
    }
    this.props.sold += quantity;
    this.props.updatedAt = new Date();
  }

  refund(quantity: number): void {
    if (quantity > this.props.sold) {
      throw new Error('Cannot refund more than sold');
    }
    this.props.sold -= quantity;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  update(data: {
    name?: string;
    price?: number;
    quantity?: number;
    salesStart?: Date;
    salesEnd?: Date;
    order?: number;
  }): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new Error('Price cannot be negative');
      }
      this.props.price = data.price;
    }
    if (data.quantity !== undefined) {
      if (data.quantity < this.props.sold) {
        throw new Error('Cannot reduce quantity below sold amount');
      }
      this.props.quantity = data.quantity;
    }
    if (data.salesStart !== undefined) {
      this.props.salesStart = data.salesStart;
    }
    if (data.salesEnd !== undefined) {
      this.props.salesEnd = data.salesEnd;
    }
    if (data.order !== undefined) {
      this.props.order = data.order;
    }

    if (this.props.salesStart >= this.props.salesEnd) {
      throw new Error('Sales start must be before sales end');
    }

    this.props.updatedAt = new Date();
  }

  toJSON(): TicketBatchProps {
    return { ...this.props };
  }
}
