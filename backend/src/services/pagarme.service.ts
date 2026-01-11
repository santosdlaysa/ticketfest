import { env } from '../config/env.js';

// Pagar.me API v5 Types
export interface PagarmeCustomer {
  name: string;
  email: string;
  document: string;
  document_type?: 'CPF' | 'CNPJ';
  type: 'individual' | 'company';
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
  address?: {
    street: string;
    number: string;
    complement?: string;
    zip_code: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface PagarmeItem {
  amount: number; // in cents
  description: string;
  quantity: number;
  code?: string;
}

export interface PagarmeCreditCardPayment {
  payment_method: 'credit_card';
  credit_card: {
    installments: number;
    statement_descriptor?: string;
    card?: {
      number: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      cvv: string;
      billing_address?: {
        street: string;
        number: string;
        complement?: string;
        zip_code: string;
        neighborhood: string;
        city: string;
        state: string;
        country: string;
      };
    };
    card_token?: string;
    card_id?: string;
  };
}

export interface PagarmeDebitCardPayment {
  payment_method: 'debit_card';
  debit_card: {
    statement_descriptor?: string;
    card?: {
      number: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      cvv: string;
      billing_address?: {
        street: string;
        number: string;
        complement?: string;
        zip_code: string;
        neighborhood: string;
        city: string;
        state: string;
        country: string;
      };
    };
    card_token?: string;
    card_id?: string;
    authentication?: {
      type: 'threed_secure';
      threed_secure: {
        mpi: string;
        cavv: string;
        eci: string;
        transaction_id: string;
        success_url: string;
      };
    };
  };
}

export interface PagarmePixPayment {
  payment_method: 'pix';
  pix: {
    expires_in: number; // seconds
    additional_information?: Array<{
      name: string;
      value: string;
    }>;
  };
}

export interface PagarmeBoletoPayment {
  payment_method: 'boleto';
  boleto: {
    bank: string; // '001' = Banco do Brasil, '104' = Caixa, '237' = Bradesco, '341' = Itau, '033' = Santander
    instructions: string;
    due_at: string; // ISO date
    nosso_numero?: string;
    type?: 'DM' | 'DS' | 'NP' | 'RC';
    document_number?: string;
    interest?: {
      type: 'flat' | 'percentage';
      days: number;
      amount?: number;
    };
    fine?: {
      type: 'flat' | 'percentage';
      days: number;
      amount?: number;
    };
  };
}

export type PagarmePayment = PagarmeCreditCardPayment | PagarmeDebitCardPayment | PagarmePixPayment | PagarmeBoletoPayment;

export interface PagarmeOrderRequest {
  customer: PagarmeCustomer;
  items: PagarmeItem[];
  payments: PagarmePayment[];
  code?: string;
  closed?: boolean;
  metadata?: Record<string, string>;
}

export interface PagarmeCharge {
  id: string;
  code: string;
  gateway_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'canceled' | 'processing' | 'failed' | 'overpaid' | 'underpaid' | 'waiting_payment';
  currency: string;
  payment_method: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  last_transaction?: {
    id: string;
    transaction_type: string;
    gateway_id: string;
    amount: number;
    status: string;
    success: boolean;
    // PIX fields
    qr_code?: string;
    qr_code_url?: string;
    expires_at?: string;
    // Boleto fields
    url?: string;
    pdf?: string;
    line?: string;
    barcode?: string;
    due_at?: string;
    nosso_numero?: string;
    // Common
    created_at: string;
    updated_at: string;
    // Error response
    gateway_response?: {
      code: string;
      errors?: Array<{ message: string }>;
    };
  };
}

export interface PagarmeOrderResponse {
  id: string;
  code: string;
  amount: number;
  currency: string;
  closed: boolean;
  status: 'pending' | 'paid' | 'canceled' | 'failed';
  created_at: string;
  updated_at: string;
  customer: PagarmeCustomer & { id: string };
  charges: PagarmeCharge[];
}

export interface PagarmeTokenRequest {
  type: 'card';
  card: {
    number: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
    billing_address?: {
      street: string;
      number: string;
      complement?: string;
      zip_code: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
    };
  };
}

export interface PagarmeTokenResponse {
  id: string;
  type: string;
  created_at: string;
  expires_at: string;
  card: {
    first_six_digits: string;
    last_four_digits: string;
    brand: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
  };
}

export class PagarmeService {
  private apiUrl = 'https://api.pagar.me/core/v5';
  private secretKey: string | null = null;
  private publicKey: string | null = null;

  constructor() {
    this.secretKey = env.PAGARME_SECRET_KEY || null;
    this.publicKey = env.PAGARME_PUBLIC_KEY || null;

    if (!this.secretKey) {
      console.warn('⚠️  Pagar.me not configured. Using mock payment service.');
    }
  }

  private getAuthHeader(): string {
    // Basic auth: secretKey:'' (empty password)
    const credentials = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json() as T & { message?: string };

    if (!response.ok) {
      console.error('Pagar.me API Error:', data);
      throw new Error(data.message || `Pagar.me API error: ${response.status}`);
    }

    return data as T;
  }

  /**
   * Create a card token (for frontend tokenization)
   */
  async createCardToken(cardData: PagarmeTokenRequest['card']): Promise<PagarmeTokenResponse> {
    if (!this.publicKey) {
      // Mock token for development
      return {
        id: `mock_token_${Date.now()}`,
        type: 'card',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        card: {
          first_six_digits: cardData.number.slice(0, 6),
          last_four_digits: cardData.number.slice(-4),
          brand: 'visa',
          holder_name: cardData.holder_name,
          exp_month: cardData.exp_month,
          exp_year: cardData.exp_year,
        },
      };
    }

    // Token creation uses public key
    const url = `${this.apiUrl}/tokens?appId=${this.publicKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ type: 'card', card: cardData }),
    });

    const data = await response.json() as PagarmeTokenResponse & { message?: string };

    if (!response.ok) {
      console.error('Pagar.me Token Error:', data);
      throw new Error(data.message || 'Failed to create card token');
    }

    return data as PagarmeTokenResponse;
  }

  /**
   * Create an order with credit card payment
   */
  async createCreditCardOrder(
    customer: PagarmeCustomer,
    items: PagarmeItem[],
    cardToken: string,
    installments: number = 1,
    metadata?: Record<string, string>
  ): Promise<PagarmeOrderResponse> {
    if (!this.secretKey) {
      return this.mockOrderResponse('credit_card', items, metadata);
    }

    const orderRequest: PagarmeOrderRequest = {
      customer,
      items,
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            installments,
            statement_descriptor: 'LUMERA',
            card_token: cardToken,
          },
        },
      ],
      metadata,
    };

    return this.request<PagarmeOrderResponse>('/orders', 'POST', orderRequest);
  }

  /**
   * Create an order with debit card payment
   */
  async createDebitCardOrder(
    customer: PagarmeCustomer,
    items: PagarmeItem[],
    cardToken: string,
    metadata?: Record<string, string>
  ): Promise<PagarmeOrderResponse> {
    if (!this.secretKey) {
      return this.mockOrderResponse('debit_card', items, metadata);
    }

    const orderRequest: PagarmeOrderRequest = {
      customer,
      items,
      payments: [
        {
          payment_method: 'debit_card',
          debit_card: {
            statement_descriptor: 'LUMERA',
            card_token: cardToken,
          },
        } as any, // debit_card type
      ],
      metadata,
    };

    return this.request<PagarmeOrderResponse>('/orders', 'POST', orderRequest);
  }

  /**
   * Create an order with PIX payment
   */
  async createPixOrder(
    customer: PagarmeCustomer,
    items: PagarmeItem[],
    expiresInSeconds: number = 3600, // 1 hour default
    metadata?: Record<string, string>
  ): Promise<PagarmeOrderResponse> {
    if (!this.secretKey) {
      return this.mockPixOrderResponse(items, expiresInSeconds, metadata);
    }

    const orderRequest: PagarmeOrderRequest = {
      customer,
      items,
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: expiresInSeconds,
            additional_information: [
              { name: 'Plataforma', value: 'Lumera' },
            ],
          },
        },
      ],
      metadata,
    };

    console.log('Creating PIX order with Pagar.me:', JSON.stringify(orderRequest, null, 2));
    const response = await this.request<PagarmeOrderResponse>('/orders', 'POST', orderRequest);
    console.log('Pagar.me PIX order response:', JSON.stringify(response, null, 2));

    // Log detalhado da transação PIX
    const charge = response.charges?.[0];
    const transaction = charge?.last_transaction;
    console.log('PIX Transaction details:', {
      qr_code: transaction?.qr_code,
      qr_code_url: transaction?.qr_code_url,
      pix_provider_tid: (transaction as any)?.pix_provider_tid,
      end_to_end_id: (transaction as any)?.end_to_end_id,
      all_keys: transaction ? Object.keys(transaction) : [],
    });

    return response;
  }

  /**
   * Create an order with Boleto payment
   */
  async createBoletoOrder(
    customer: PagarmeCustomer,
    items: PagarmeItem[],
    daysToExpire: number = 3,
    instructions?: string,
    metadata?: Record<string, string>
  ): Promise<PagarmeOrderResponse> {
    if (!this.secretKey) {
      return this.mockBoletoOrderResponse(items, daysToExpire, metadata);
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToExpire);
    const dueAt = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const orderRequest: PagarmeOrderRequest = {
      customer,
      items,
      payments: [
        {
          payment_method: 'boleto',
          boleto: {
            bank: '104', // Caixa - commonly used for boletos
            instructions: instructions || 'Pagar ate a data de vencimento. Apos o vencimento, multa de 2% e juros de 1% ao mes.',
            due_at: dueAt,
            type: 'DM', // Duplicata Mercantil
            interest: {
              type: 'percentage',
              days: 1,
              amount: 100, // 1% per month = 100 basis points
            },
            fine: {
              type: 'percentage',
              days: 1,
              amount: 200, // 2% fine = 200 basis points
            },
          },
        } as PagarmeBoletoPayment,
      ],
      metadata,
    };

    return this.request<PagarmeOrderResponse>('/orders', 'POST', orderRequest);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<PagarmeOrderResponse> {
    if (!this.secretKey) {
      return this.mockOrderResponse('credit_card', [], { orderId });
    }

    return this.request<PagarmeOrderResponse>(`/orders/${orderId}`);
  }

  /**
   * Get charge by ID
   */
  async getCharge(chargeId: string): Promise<PagarmeCharge> {
    if (!this.secretKey) {
      return {
        id: chargeId,
        code: 'mock',
        gateway_id: 'mock',
        amount: 0,
        status: 'paid',
        currency: 'BRL',
        payment_method: 'credit_card',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return this.request<PagarmeCharge>(`/charges/${chargeId}`);
  }

  /**
   * Cancel/Refund a charge
   */
  async cancelCharge(chargeId: string, amount?: number): Promise<PagarmeCharge> {
    if (!this.secretKey) {
      console.log(`Mock refund for charge ${chargeId}`);
      return {
        id: chargeId,
        code: 'mock',
        gateway_id: 'mock',
        amount: amount || 0,
        status: 'canceled',
        currency: 'BRL',
        payment_method: 'credit_card',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const body = amount ? { amount } : {};
    return this.request<PagarmeCharge>(`/charges/${chargeId}`, 'DELETE', body);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!env.PAGARME_WEBHOOK_SECRET) {
      // In production, webhook secret is REQUIRED for security
      if (process.env.NODE_ENV === 'production') {
        console.error('SECURITY: Webhook secret not configured in production!');
        return false;
      }
      console.warn('Webhook secret not configured, skipping verification (dev only)');
      return true;
    }

    if (!signature) {
      console.error('SECURITY: Webhook request missing signature');
      return false;
    }

    // Pagar.me uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', env.PAGARME_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  // Mock responses for development
  private mockOrderResponse(
    paymentMethod: string,
    items: PagarmeItem[],
    _metadata?: Record<string, string>
  ): PagarmeOrderResponse {
    const totalAmount = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const now = new Date().toISOString();
    const orderId = `mock_order_${Date.now()}`;
    const chargeId = `mock_charge_${Date.now()}`;

    return {
      id: orderId,
      code: orderId,
      amount: totalAmount,
      currency: 'BRL',
      closed: true,
      status: 'paid', // Auto-approve for dev
      created_at: now,
      updated_at: now,
      customer: {
        id: 'mock_customer',
        name: 'Mock Customer',
        email: 'mock@example.com',
        document: '00000000000',
        type: 'individual',
      },
      charges: [
        {
          id: chargeId,
          code: chargeId,
          gateway_id: 'mock_gateway',
          amount: totalAmount,
          status: 'paid',
          currency: 'BRL',
          payment_method: paymentMethod,
          paid_at: now,
          created_at: now,
          updated_at: now,
        },
      ],
    };
  }

  private mockPixOrderResponse(
    items: PagarmeItem[],
    expiresInSeconds: number,
    _metadata?: Record<string, string>
  ): PagarmeOrderResponse {
    const totalAmount = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const now = new Date().toISOString();
    const orderId = `mock_pix_${Date.now()}`;
    const chargeId = `mock_pix_charge_${Date.now()}`;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // Generate mock PIX code
    const mockPixCode = `00020126580014br.gov.bcb.pix0136${orderId}520400005303986540${(totalAmount / 100).toFixed(2)}5802BR5925LUMERA LTDA6009SAO PAULO62070503***6304`;

    return {
      id: orderId,
      code: orderId,
      amount: totalAmount,
      currency: 'BRL',
      closed: true,
      status: 'pending',
      created_at: now,
      updated_at: now,
      customer: {
        id: 'mock_customer',
        name: 'Mock Customer',
        email: 'mock@example.com',
        document: '00000000000',
        type: 'individual',
      },
      charges: [
        {
          id: chargeId,
          code: chargeId,
          gateway_id: 'mock_gateway',
          amount: totalAmount,
          status: 'waiting_payment',
          currency: 'BRL',
          payment_method: 'pix',
          created_at: now,
          updated_at: now,
          last_transaction: {
            id: `mock_tx_${Date.now()}`,
            transaction_type: 'pix',
            gateway_id: 'mock',
            amount: totalAmount,
            status: 'waiting_payment',
            success: true,
            qr_code: mockPixCode,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockPixCode)}`,
            expires_at: expiresAt,
            created_at: now,
            updated_at: now,
          },
        },
      ],
    };
  }

  private mockBoletoOrderResponse(
    items: PagarmeItem[],
    daysToExpire: number,
    _metadata?: Record<string, string>
  ): PagarmeOrderResponse {
    const totalAmount = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const now = new Date().toISOString();
    const orderId = `mock_boleto_${Date.now()}`;
    const chargeId = `mock_boleto_charge_${Date.now()}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToExpire);
    const dueAt = dueDate.toISOString();

    // Generate mock boleto barcode (47 digits for Linha Digitavel)
    const bankCode = '104'; // Caixa
    const currency = '9'; // Real
    const checkDigit = '1';
    const dueDateFactor = Math.floor((dueDate.getTime() - new Date('1997-10-07').getTime()) / (1000 * 60 * 60 * 24));
    const amountStr = Math.round(totalAmount).toString().padStart(10, '0');
    const randomField = Date.now().toString().slice(-15).padStart(25, '0');

    const mockBarcode = `${bankCode}${currency}${checkDigit}${dueDateFactor.toString().padStart(4, '0')}${amountStr}${randomField}`;
    const mockLinhaDigitavel = `${bankCode}.${mockBarcode.slice(3, 8)} ${mockBarcode.slice(8, 18)}.${mockBarcode.slice(18, 19)} ${mockBarcode.slice(19, 29)}.${mockBarcode.slice(29, 30)} ${mockBarcode.slice(30, 31)} ${mockBarcode.slice(31)}`;

    return {
      id: orderId,
      code: orderId,
      amount: totalAmount,
      currency: 'BRL',
      closed: true,
      status: 'pending',
      created_at: now,
      updated_at: now,
      customer: {
        id: 'mock_customer',
        name: 'Mock Customer',
        email: 'mock@example.com',
        document: '00000000000',
        type: 'individual',
      },
      charges: [
        {
          id: chargeId,
          code: chargeId,
          gateway_id: 'mock_gateway',
          amount: totalAmount,
          status: 'waiting_payment',
          currency: 'BRL',
          payment_method: 'boleto',
          created_at: now,
          updated_at: now,
          last_transaction: {
            id: `mock_tx_${Date.now()}`,
            transaction_type: 'boleto',
            gateway_id: 'mock',
            amount: totalAmount,
            status: 'waiting_payment',
            success: true,
            url: `https://lumera.com/boleto/${orderId}`,
            pdf: `https://lumera.com/boleto/${orderId}.pdf`,
            line: mockLinhaDigitavel,
            barcode: mockBarcode,
            due_at: dueAt,
            nosso_numero: orderId.slice(-10),
            created_at: now,
            updated_at: now,
          },
        },
      ],
    };
  }

  /**
   * Check if service is configured for production
   */
  isConfigured(): boolean {
    return !!this.secretKey;
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }
}

// Export singleton instance
export const pagarmeService = new PagarmeService();
