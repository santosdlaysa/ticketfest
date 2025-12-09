import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { SplitCalculation } from '../../domain/entities/SplitRule.js';

/**
 * Tipos de gateway de pagamento suportados
 */
export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAGARME = 'PAGARME',
  MERCADOPAGO = 'MERCADOPAGO',
  ASAAS = 'ASAAS',
}

/**
 * Interface para criação de conta conectada
 */
export interface CreateConnectedAccountParams {
  email: string;
  country?: string;
  type?: 'express' | 'standard' | 'custom';
  businessType?: 'individual' | 'company';
  metadata?: Record<string, string>;
}

/**
 * Interface para criação de payment intent com split
 */
export interface CreateSplitPaymentParams {
  amount: number;
  currency?: string;
  organizerAccountId: string; // ID da conta do organizador no gateway
  platformAmount: number;
  organizerAmount: number;
  metadata?: Record<string, string>;
}

/**
 * Interface para transferência de fundos
 */
export interface TransferParams {
  amount: number;
  destinationAccountId: string;
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Interface para criação de payout (saque)
 */
export interface CreatePayoutParams {
  accountId: string;
  amount: number;
  currency?: string;
  method?: 'standard' | 'instant';
  metadata?: Record<string, string>;
}

/**
 * Resultado de operações do serviço
 */
export interface SplitPaymentResult {
  success: boolean;
  externalId?: string;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Serviço de pagamento dividido
 * Suporta múltiplos gateways: Stripe Connect, Pagar.me, Mercado Pago, Asaas
 */
export class SplitPaymentService {
  private stripe: Stripe | null = null;
  private activeGateway: PaymentGateway = PaymentGateway.STRIPE;

  constructor() {
    // Inicializa Stripe se configurado
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
      });
    } else {
      console.warn('⚠️  Stripe not configured. Using mock split payment service.');
    }
  }

  /**
   * Define o gateway de pagamento ativo
   */
  setActiveGateway(gateway: PaymentGateway): void {
    this.activeGateway = gateway;
  }

  /**
   * Retorna o gateway de pagamento ativo
   */
  getActiveGateway(): PaymentGateway {
    return this.activeGateway;
  }

  // ============================================
  // STRIPE CONNECT
  // ============================================

  /**
   * Cria uma conta conectada no Stripe (Express ou Standard)
   */
  async createStripeConnectedAccount(
    params: CreateConnectedAccountParams
  ): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return this.mockCreateConnectedAccount(params);
    }

    try {
      const account = await this.stripe.accounts.create({
        type: params.type || 'express',
        country: params.country || 'BR',
        email: params.email,
        business_type: params.businessType || 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: params.metadata,
      });

      return {
        success: true,
        externalId: account.id,
        data: {
          accountId: account.id,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        },
      };
    } catch (error: any) {
      console.error('Stripe create account error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gera link de onboarding para conta Stripe
   */
  async createStripeAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return {
        success: true,
        data: {
          url: `https://mock.stripe.com/onboarding/${accountId}`,
        },
      };
    }

    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return {
        success: true,
        data: {
          url: accountLink.url,
          expiresAt: accountLink.expires_at,
        },
      };
    } catch (error: any) {
      console.error('Stripe account link error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cria um Payment Intent com split automático (Stripe)
   */
  async createStripeSplitPayment(params: CreateSplitPaymentParams): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return this.mockCreateSplitPayment(params);
    }

    try {
      // Cria o payment intent com split
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Converte para centavos
        currency: params.currency || 'brl',
        automatic_payment_methods: {
          enabled: true,
        },
        // Split: transfere para a conta conectada após pagamento
        transfer_data: {
          destination: params.organizerAccountId,
          amount: Math.round(params.organizerAmount * 100), // Valor do organizador em centavos
        },
        // A diferença (platformAmount) fica na conta da plataforma
        metadata: {
          ...params.metadata,
          platformAmount: params.platformAmount.toString(),
          organizerAmount: params.organizerAmount.toString(),
        },
      });

      return {
        success: true,
        externalId: paymentIntent.id,
        data: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      };
    } catch (error: any) {
      console.error('Stripe split payment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transfere fundos para uma conta conectada (manual)
   */
  async createStripeTransfer(params: TransferParams): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return this.mockTransfer(params);
    }

    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency || 'brl',
        destination: params.destinationAccountId,
        metadata: params.metadata,
      });

      return {
        success: true,
        externalId: transfer.id,
        data: {
          transferId: transfer.id,
          amount: transfer.amount / 100,
          currency: transfer.currency,
        },
      };
    } catch (error: any) {
      console.error('Stripe transfer error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cria um payout (saque) para uma conta conectada
   */
  async createStripePayout(params: CreatePayoutParams): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return this.mockPayout(params);
    }

    try {
      const payout = await this.stripe.payouts.create(
        {
          amount: Math.round(params.amount * 100),
          currency: params.currency || 'brl',
          method: params.method || 'standard',
          metadata: params.metadata,
        },
        {
          stripeAccount: params.accountId,
        }
      );

      return {
        success: true,
        externalId: payout.id,
        data: {
          payoutId: payout.id,
          amount: payout.amount / 100,
          currency: payout.currency,
          status: payout.status,
          arrivalDate: payout.arrival_date,
        },
      };
    } catch (error: any) {
      console.error('Stripe payout error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verifica o status de uma conta conectada
   */
  async getStripeAccountStatus(accountId: string): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return {
        success: true,
        data: {
          accountId,
          detailsSubmitted: true,
          chargesEnabled: true,
          payoutsEnabled: true,
        },
      };
    }

    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        success: true,
        data: {
          accountId: account.id,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirements: account.requirements,
        },
      };
    } catch (error: any) {
      console.error('Stripe get account error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtém o saldo de uma conta conectada
   */
  async getStripeAccountBalance(accountId: string): Promise<SplitPaymentResult> {
    if (!this.stripe) {
      return {
        success: true,
        data: {
          available: [{ amount: 0, currency: 'brl' }],
          pending: [{ amount: 0, currency: 'brl' }],
        },
      };
    }

    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });

      return {
        success: true,
        data: {
          available: balance.available.map((b) => ({
            amount: b.amount / 100,
            currency: b.currency,
          })),
          pending: balance.pending.map((b) => ({
            amount: b.amount / 100,
            currency: b.currency,
          })),
        },
      };
    } catch (error: any) {
      console.error('Stripe get balance error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // PAGAR.ME SPLIT
  // ============================================

  /**
   * Cria um recebedor no Pagar.me
   * Implementação placeholder - precisa ser adaptada para API real
   */
  async createPagarmeRecipient(params: {
    name: string;
    email: string;
    document: string;
    bankAccount: {
      bankCode: string;
      agencia: string;
      conta: string;
      contaDv: string;
      type: 'checking' | 'savings';
      documentNumber: string;
      legalName: string;
    };
  }): Promise<SplitPaymentResult> {
    // TODO: Implementar integração real com Pagar.me
    console.log('Pagar.me createRecipient mock:', params);

    return {
      success: true,
      externalId: `re_mock_${Date.now()}`,
      data: {
        recipientId: `re_mock_${Date.now()}`,
        status: 'active',
      },
    };
  }

  /**
   * Cria uma transação com split no Pagar.me
   */
  async createPagarmeSplitTransaction(params: {
    amount: number;
    paymentMethod: 'credit_card' | 'boleto' | 'pix';
    splitRules: Array<{
      recipientId: string;
      amount: number;
      liable: boolean;
      chargeProcessingFee: boolean;
    }>;
  }): Promise<SplitPaymentResult> {
    // TODO: Implementar integração real com Pagar.me
    console.log('Pagar.me split transaction mock:', params);

    return {
      success: true,
      externalId: `tr_mock_${Date.now()}`,
      data: {
        transactionId: `tr_mock_${Date.now()}`,
        status: 'pending',
      },
    };
  }

  // ============================================
  // MERCADO PAGO SPLIT
  // ============================================

  /**
   * Cria uma conta de vendedor no Mercado Pago
   */
  async createMercadoPagoSeller(params: {
    email: string;
    firstName: string;
    lastName: string;
    identification: { type: string; number: string };
  }): Promise<SplitPaymentResult> {
    // TODO: Implementar integração real com Mercado Pago
    console.log('MercadoPago createSeller mock:', params);

    return {
      success: true,
      externalId: `mp_mock_${Date.now()}`,
      data: {
        userId: `mp_mock_${Date.now()}`,
        status: 'active',
      },
    };
  }

  /**
   * Cria um pagamento com split no Mercado Pago
   */
  async createMercadoPagoSplitPayment(params: {
    amount: number;
    description: string;
    applicationFee: number;
    sponsorId: string;
  }): Promise<SplitPaymentResult> {
    // TODO: Implementar integração real com Mercado Pago
    console.log('MercadoPago split payment mock:', params);

    return {
      success: true,
      externalId: `pay_mock_${Date.now()}`,
      data: {
        paymentId: `pay_mock_${Date.now()}`,
        status: 'pending',
      },
    };
  }

  // ============================================
  // ASAAS SPLIT
  // ============================================

  /**
   * Cria uma subconta no Asaas
   */
  async createAsaasSubaccount(params: {
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      province: string;
      postalCode: string;
    };
  }): Promise<SplitPaymentResult> {
    // TODO: Implementar integração real com Asaas
    console.log('Asaas createSubaccount mock:', params);

    return {
      success: true,
      externalId: `asaas_mock_${Date.now()}`,
      data: {
        walletId: `asaas_mock_${Date.now()}`,
        status: 'active',
      },
    };
  }

  /**
   * Cria uma cobrança com split no Asaas
   */
  async createAsaasSplitCharge(params: {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    value: number;
    split: Array<{
      walletId: string;
      fixedValue?: number;
      percentualValue?: number;
    }>;
  }): Promise<SplitPaymentResult> {
    // TODO: Implementar integração real com Asaas
    console.log('Asaas split charge mock:', params);

    return {
      success: true,
      externalId: `chg_mock_${Date.now()}`,
      data: {
        chargeId: `chg_mock_${Date.now()}`,
        status: 'PENDING',
      },
    };
  }

  // ============================================
  // MÉTODOS UTILITÁRIOS
  // ============================================

  /**
   * Processa um split automaticamente baseado no gateway ativo
   */
  async processSplitPayment(
    amount: number,
    splitCalculation: SplitCalculation,
    organizerExternalAccountId: string,
    metadata?: Record<string, string>
  ): Promise<SplitPaymentResult> {
    switch (this.activeGateway) {
      case PaymentGateway.STRIPE:
        return this.createStripeSplitPayment({
          amount,
          organizerAccountId: organizerExternalAccountId,
          platformAmount: splitCalculation.platformAmount,
          organizerAmount: splitCalculation.organizerAmount,
          metadata,
        });

      case PaymentGateway.PAGARME:
        return this.createPagarmeSplitTransaction({
          amount: Math.round(amount * 100),
          paymentMethod: 'credit_card',
          splitRules: [
            {
              recipientId: organizerExternalAccountId,
              amount: Math.round(splitCalculation.organizerAmount * 100),
              liable: true,
              chargeProcessingFee: false,
            },
          ],
        });

      case PaymentGateway.MERCADOPAGO:
        return this.createMercadoPagoSplitPayment({
          amount,
          description: 'Ticket purchase',
          applicationFee: splitCalculation.platformAmount,
          sponsorId: organizerExternalAccountId,
        });

      case PaymentGateway.ASAAS:
        return this.createAsaasSplitCharge({
          customer: 'customer_id', // Precisaria passar o customer
          billingType: 'PIX',
          value: amount,
          split: [
            {
              walletId: organizerExternalAccountId,
              fixedValue: splitCalculation.organizerAmount,
            },
          ],
        });

      default:
        return {
          success: false,
          error: `Gateway ${this.activeGateway} not supported`,
        };
    }
  }

  // ============================================
  // MOCK METHODS (para desenvolvimento)
  // ============================================

  private mockCreateConnectedAccount(params: CreateConnectedAccountParams): SplitPaymentResult {
    console.log('Mock: Creating connected account for', params.email);
    const mockId = `acct_mock_${Date.now()}`;
    return {
      success: true,
      externalId: mockId,
      data: {
        accountId: mockId,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      },
    };
  }

  private mockCreateSplitPayment(params: CreateSplitPaymentParams): SplitPaymentResult {
    console.log('Mock: Creating split payment', params);
    const mockId = `pi_mock_${Date.now()}`;
    return {
      success: true,
      externalId: mockId,
      data: {
        paymentIntentId: mockId,
        clientSecret: `${mockId}_secret_mock`,
        amount: params.amount,
        currency: params.currency || 'brl',
      },
    };
  }

  private mockTransfer(params: TransferParams): SplitPaymentResult {
    console.log('Mock: Creating transfer', params);
    const mockId = `tr_mock_${Date.now()}`;
    return {
      success: true,
      externalId: mockId,
      data: {
        transferId: mockId,
        amount: params.amount,
        currency: params.currency || 'brl',
      },
    };
  }

  private mockPayout(params: CreatePayoutParams): SplitPaymentResult {
    console.log('Mock: Creating payout', params);
    const mockId = `po_mock_${Date.now()}`;
    return {
      success: true,
      externalId: mockId,
      data: {
        payoutId: mockId,
        amount: params.amount,
        currency: params.currency || 'brl',
        status: 'pending',
        arrivalDate: Math.floor(Date.now() / 1000) + 86400 * 2, // +2 dias
      },
    };
  }
}
