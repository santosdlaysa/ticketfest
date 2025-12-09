import { z } from 'zod';

// ============================================
// Organizer Account DTOs
// ============================================

export const createOrganizerAccountSchema = z.object({
  bankCode: z.string().min(3).max(5).optional(),
  bankName: z.string().min(2).max(100).optional(),
  accountType: z.enum(['CHECKING', 'SAVINGS']).optional(),
  accountNumber: z.string().min(1).max(20).optional(),
  accountDigit: z.string().min(1).max(2).optional(),
  agencyNumber: z.string().min(1).max(10).optional(),
  agencyDigit: z.string().max(2).optional(),
  holderName: z.string().min(2).max(150).optional(),
  holderDocument: z
    .string()
    .regex(/^(\d{11}|\d{14})$/, 'Document must be CPF (11 digits) or CNPJ (14 digits)')
    .optional(),
  holderType: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
});

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

export type CreateOrganizerAccountDTO = z.infer<typeof createOrganizerAccountSchema>;
export type UpdateBankDetailsDTO = z.infer<typeof updateBankDetailsSchema>;

// ============================================
// Split Rule DTOs
// ============================================

export const createSplitRuleSchema = z
  .object({
    eventId: z.string().uuid(),
    platformPercentage: z.number().min(0).max(100),
    organizerPercentage: z.number().min(0).max(100),
    platformFixedFee: z.number().min(0).default(0),
  })
  .refine(
    (data) => Math.abs(data.platformPercentage + data.organizerPercentage - 100) < 0.01,
    {
      message: 'Platform and organizer percentages must sum to 100%',
    }
  );

export const updateSplitRuleSchema = z
  .object({
    platformPercentage: z.number().min(0).max(100),
    organizerPercentage: z.number().min(0).max(100),
    platformFixedFee: z.number().min(0).optional(),
  })
  .refine(
    (data) => Math.abs(data.platformPercentage + data.organizerPercentage - 100) < 0.01,
    {
      message: 'Platform and organizer percentages must sum to 100%',
    }
  );

export type CreateSplitRuleDTO = z.infer<typeof createSplitRuleSchema>;
export type UpdateSplitRuleDTO = z.infer<typeof updateSplitRuleSchema>;

// ============================================
// Payout DTOs
// ============================================

export const createPayoutSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payoutMethod: z.enum(['BANK_TRANSFER', 'PIX']),
});

export const processPayoutSchema = z.object({
  payoutId: z.string().uuid(),
});

export type CreatePayoutDTO = z.infer<typeof createPayoutSchema>;
export type ProcessPayoutDTO = z.infer<typeof processPayoutSchema>;

// ============================================
// Query DTOs
// ============================================

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PaginationDTO = z.infer<typeof paginationSchema>;
export type DateRangeDTO = z.infer<typeof dateRangeSchema>;

// ============================================
// Response DTOs (para tipagem)
// ============================================

export interface OrganizerAccountResponse {
  id: string;
  userId: string;
  verified: boolean;
  verifiedAt?: string;
  bankCode?: string;
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  agencyNumber?: string;
  holderName?: string;
  holderDocument?: string;
  holderType?: string;
  availableBalance: number;
  pendingBalance: number;
  hasStripeAccount: boolean;
  hasPagarmeAccount: boolean;
  hasMercadoPagoAccount: boolean;
  hasAsaasAccount: boolean;
  createdAt: string;
}

export interface SplitRuleResponse {
  id: string;
  eventId: string;
  organizerAccountId: string;
  platformPercentage: number;
  organizerPercentage: number;
  platformFixedFee: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SplitTransactionResponse {
  id: string;
  orderId: string;
  splitRuleId: string;
  organizerAccountId: string;
  totalAmount: number;
  platformAmount: number;
  organizerAmount: number;
  platformFee: number;
  status: string;
  externalId?: string;
  createdAt: string;
  processedAt?: string;
}

export interface PayoutResponse {
  id: string;
  organizerAccountId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  payoutMethod: string;
  bankCode?: string;
  accountNumber?: string;
  agencyNumber?: string;
  externalId?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface BalanceSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}
