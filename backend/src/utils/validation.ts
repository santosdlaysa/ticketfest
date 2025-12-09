import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF must have 11 digits').optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Event validation schemas
export const createEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(3),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category: z.string(),
  images: z.array(z.string().url()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).default('DRAFT'),
});

export const updateEventSchema = createEventSchema.partial();

// Ticket validation schemas
export const createTicketSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  salesStart: z.string().datetime(),
  salesEnd: z.string().datetime(),
  features: z.array(z.string()).default([]),
});

// Cart validation schemas
export const addToCartSchema = z.object({
  ticketId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(10),
});

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      ticketId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']),
});

// Coupon validation schemas
export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().min(0),
  maxUses: z.number().int().min(1).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  eventId: z.string().uuid().optional(),
  minPurchase: z.number().min(0).optional(),
});

// Split Payment validation schemas
export const createSplitRuleSchema = z
  .object({
    eventId: z.string().uuid(),
    platformPercentage: z.number().min(0).max(100),
    organizerPercentage: z.number().min(0).max(100),
    platformFixedFee: z.number().min(0).default(0),
  })
  .refine(
    (data) => Math.abs(data.platformPercentage + data.organizerPercentage - 100) < 0.01,
    { message: 'Platform and organizer percentages must sum to 100%' }
  );

export const updateSplitRuleSchema = z
  .object({
    platformPercentage: z.number().min(0).max(100),
    organizerPercentage: z.number().min(0).max(100),
    platformFixedFee: z.number().min(0).optional(),
  })
  .refine(
    (data) => Math.abs(data.platformPercentage + data.organizerPercentage - 100) < 0.01,
    { message: 'Platform and organizer percentages must sum to 100%' }
  );

export const updateBankDetailsSchema = z.object({
  bankCode: z.string().min(3).max(5),
  bankName: z.string().min(2).max(100),
  accountType: z.enum(['CHECKING', 'SAVINGS']),
  accountNumber: z.string().min(1).max(20),
  accountDigit: z.string().min(1).max(2),
  agencyNumber: z.string().min(1).max(10),
  agencyDigit: z.string().max(2).optional(),
  holderName: z.string().min(2).max(150),
  holderDocument: z
    .string()
    .regex(/^(\d{11}|\d{14})$/, 'Document must be CPF (11 digits) or CNPJ (14 digits)'),
  holderType: z.enum(['INDIVIDUAL', 'COMPANY']),
});

export const createPayoutSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payoutMethod: z.enum(['BANK_TRANSFER', 'PIX']),
});

// Helper function to validate request body
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    return schema.parse(data);
  };
};
