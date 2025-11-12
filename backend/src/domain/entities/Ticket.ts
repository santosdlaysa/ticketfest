export interface TicketProps {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
  salesStart: Date;
  salesEnd: Date;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Ticket {
  private constructor(private props: TicketProps) {}

  static create(props: Omit<TicketProps, 'id' | 'sold' | 'createdAt' | 'updatedAt'> & { id?: string }): Ticket {
    const now = new Date();
    return new Ticket({
      ...props,
      id: props.id || crypto.randomUUID(),
      sold: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: TicketProps): Ticket {
    return new Ticket(props);
  }

  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
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

  get features(): string[] {
    return this.props.features;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  getAvailableQuantity(): number {
    return this.props.quantity - this.props.sold;
  }

  isAvailable(): boolean {
    const now = new Date();
    return (
      this.getAvailableQuantity() > 0 &&
      now >= this.props.salesStart &&
      now <= this.props.salesEnd
    );
  }

  canSell(requestedQuantity: number): boolean {
    return this.getAvailableQuantity() >= requestedQuantity;
  }

  incrementSold(quantity: number): void {
    if (!this.canSell(quantity)) {
      throw new Error('Insufficient tickets available');
    }
    this.props.sold += quantity;
    this.props.updatedAt = new Date();
  }

  decrementSold(quantity: number): void {
    if (this.props.sold < quantity) {
      throw new Error('Cannot decrement sold count below zero');
    }
    this.props.sold -= quantity;
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Omit<TicketProps, 'id' | 'eventId' | 'sold' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
  }

  toJSON(): TicketProps {
    return { ...this.props };
  }
}
