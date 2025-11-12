import { Coupon } from '../entities/Coupon.js';

export interface ICouponRepository {
  create(coupon: Coupon): Promise<Coupon>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  update(coupon: Coupon): Promise<Coupon>;
  delete(id: string): Promise<void>;
}
