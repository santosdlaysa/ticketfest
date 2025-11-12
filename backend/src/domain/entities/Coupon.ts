export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export interface CouponProps {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  eventId?: string;
  minPurchase?: number;
  active: boolean;
  createdAt: Date;
}

export class Coupon {
  private constructor(private props: CouponProps) {}

  static create(
    props: Omit<CouponProps, 'id' | 'usedCount' | 'createdAt'> & { id?: string }
  ): Coupon {
    return new Coupon({
      ...props,
      id: props.id || crypto.randomUUID(),
      usedCount: 0,
      createdAt: new Date(),
    });
  }

  static restore(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get discountType(): DiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get maxUses(): number | undefined {
    return this.props.maxUses;
  }

  get usedCount(): number {
    return this.props.usedCount;
  }

  get validFrom(): Date {
    return this.props.validFrom;
  }

  get validUntil(): Date {
    return this.props.validUntil;
  }

  get eventId(): string | undefined {
    return this.props.eventId;
  }

  get minPurchase(): number | undefined {
    return this.props.minPurchase;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isValid(eventId?: string, purchaseAmount?: number): boolean {
    const now = new Date();

    if (!this.props.active) return false;
    if (now < this.props.validFrom || now > this.props.validUntil) return false;
    if (this.props.maxUses && this.props.usedCount >= this.props.maxUses) return false;
    if (this.props.eventId && this.props.eventId !== eventId) return false;
    if (this.props.minPurchase && purchaseAmount && purchaseAmount < this.props.minPurchase) return false;

    return true;
  }

  calculateDiscount(subtotal: number): number {
    if (this.props.discountType === DiscountType.PERCENTAGE) {
      return (subtotal * this.props.discountValue) / 100;
    }
    return this.props.discountValue;
  }

  incrementUsage(): void {
    this.props.usedCount += 1;
  }

  deactivate(): void {
    this.props.active = false;
  }

  activate(): void {
    this.props.active = true;
  }

  toJSON(): CouponProps {
    return { ...this.props };
  }
}
