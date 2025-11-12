export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface EventProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  category: string;
  status: EventStatus;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Event {
  private constructor(private props: EventProps) {}

  static create(props: Omit<EventProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Event {
    const now = new Date();
    return new Event({
      ...props,
      id: props.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: EventProps): Event {
    return new Event(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string {
    return this.props.description;
  }

  get date(): Date {
    return this.props.date;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get location(): string {
    return this.props.location;
  }

  get address(): string {
    return this.props.address;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }

  get images(): string[] {
    return this.props.images;
  }

  get category(): string {
    return this.props.category;
  }

  get status(): EventStatus {
    return this.props.status;
  }

  get organizerId(): string {
    return this.props.organizerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPublished(): boolean {
    return this.props.status === EventStatus.PUBLISHED;
  }

  isCancelled(): boolean {
    return this.props.status === EventStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.props.status === EventStatus.COMPLETED;
  }

  publish(): void {
    if (this.props.status !== EventStatus.DRAFT) {
      throw new Error('Only draft events can be published');
    }
    this.props.status = EventStatus.PUBLISHED;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === EventStatus.COMPLETED) {
      throw new Error('Cannot cancel completed events');
    }
    this.props.status = EventStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.props.status !== EventStatus.PUBLISHED) {
      throw new Error('Only published events can be marked as completed');
    }
    this.props.status = EventStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Omit<EventProps, 'id' | 'slug' | 'organizerId' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
  }

  toJSON(): EventProps {
    return { ...this.props };
  }
}
