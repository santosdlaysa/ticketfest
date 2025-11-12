import { PrismaClient } from '@prisma/client';
import { Coupon, DiscountType } from '../../../domain/entities/Coupon.js';
import { ICouponRepository } from '../../../domain/repositories/ICouponRepository.js';

export class PrismaCouponRepository implements ICouponRepository {
  constructor(private prisma: PrismaClient) {}

  async create(coupon: Coupon): Promise<Coupon> {
    const couponData = coupon.toJSON();

    const createdCoupon = await this.prisma.coupon.create({
      data: {
        id: couponData.id,
        code: couponData.code,
        description: couponData.description,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        maxUses: couponData.maxUses,
        usedCount: couponData.usedCount,
        validFrom: couponData.validFrom,
        validUntil: couponData.validUntil,
        eventId: couponData.eventId,
        minPurchase: couponData.minPurchase,
        active: couponData.active,
      },
    });

    return this.toEntity(createdCoupon);
  }

  async findById(id: string): Promise<Coupon | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) return null;
    return this.toEntity(coupon);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) return null;
    return this.toEntity(coupon);
  }

  async update(coupon: Coupon): Promise<Coupon> {
    const couponData = coupon.toJSON();

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: couponData.id },
      data: {
        description: couponData.description,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        maxUses: couponData.maxUses,
        usedCount: couponData.usedCount,
        validFrom: couponData.validFrom,
        validUntil: couponData.validUntil,
        eventId: couponData.eventId,
        minPurchase: couponData.minPurchase,
        active: couponData.active,
      },
    });

    return this.toEntity(updatedCoupon);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.coupon.delete({
      where: { id },
    });
  }

  private toEntity(data: any): Coupon {
    return Coupon.restore({
      id: data.id,
      code: data.code,
      description: data.description || undefined,
      discountType: data.discountType as DiscountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses || undefined,
      usedCount: data.usedCount,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      eventId: data.eventId || undefined,
      minPurchase: data.minPurchase || undefined,
      active: data.active,
      createdAt: data.createdAt,
    });
  }
}
