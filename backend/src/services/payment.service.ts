import { pagarmeService, PagarmeCustomer, PagarmeItem, PagarmeOrderResponse } from './pagarme.service.js';

export interface PaymentIntent {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
}

export interface PixPaymentData {
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: Date;
  chargeId: string;
  orderId: string;
}

export interface CardPaymentData {
  orderId: string;
  chargeId: string;
  status: 'pending' | 'paid' | 'failed';
  amount: number;
}

export interface BoletoPaymentData {
  orderId: string;
  chargeId: string;
  boletoUrl: string;
  boletoPdf: string;
  barcode: string;
  linhaDigitavel: string;
  dueDate: Date;
  amount: number;
}

export interface CustomerData {
  name: string;
  email: string;
  document: string; // CPF
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    zipCode: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

export class PaymentService {
  /**
   * Format customer data for Pagar.me
   */
  private formatCustomer(customer: CustomerData): PagarmeCustomer {
    const phoneParts = customer.phone?.replace(/\D/g, '');

    return {
      name: customer.name,
      email: customer.email,
      document: customer.document.replace(/\D/g, ''),
      document_type: customer.document.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
      type: customer.document.replace(/\D/g, '').length > 11 ? 'company' : 'individual',
      phones: phoneParts ? {
        mobile_phone: {
          country_code: '55',
          area_code: phoneParts.slice(0, 2),
          number: phoneParts.slice(2),
        },
      } : undefined,
      address: customer.address ? {
        street: customer.address.street,
        number: customer.address.number,
        complement: customer.address.complement,
        zip_code: customer.address.zipCode.replace(/\D/g, ''),
        neighborhood: customer.address.neighborhood,
        city: customer.address.city,
        state: customer.address.state,
        country: 'BR',
      } : undefined,
    };
  }

  /**
   * Format items for Pagar.me
   */
  private formatItems(items: Array<{ name: string; quantity: number; price: number; id?: string }>): PagarmeItem[] {
    return items.map((item) => ({
      amount: Math.round(item.price * 100), // Convert to cents
      description: item.name,
      quantity: item.quantity,
      code: item.id,
    }));
  }

  /**
   * Create credit card payment
   */
  async createCreditCardPayment(
    customer: CustomerData,
    items: Array<{ name: string; quantity: number; price: number; id?: string }>,
    cardToken: string,
    installments: number = 1,
    metadata?: Record<string, string>
  ): Promise<CardPaymentData> {
    const pagarmeCustomer = this.formatCustomer(customer);
    const pagarmeItems = this.formatItems(items);

    const order = await pagarmeService.createCreditCardOrder(
      pagarmeCustomer,
      pagarmeItems,
      cardToken,
      installments,
      metadata
    );

    const charge = order.charges[0];

    return {
      orderId: order.id,
      chargeId: charge.id,
      status: this.mapChargeStatus(charge.status),
      amount: order.amount / 100, // Convert from cents
    };
  }

  /**
   * Create debit card payment
   */
  async createDebitCardPayment(
    customer: CustomerData,
    items: Array<{ name: string; quantity: number; price: number; id?: string }>,
    cardToken: string,
    metadata?: Record<string, string>
  ): Promise<CardPaymentData> {
    const pagarmeCustomer = this.formatCustomer(customer);
    const pagarmeItems = this.formatItems(items);

    const order = await pagarmeService.createDebitCardOrder(
      pagarmeCustomer,
      pagarmeItems,
      cardToken,
      metadata
    );

    const charge = order.charges[0];

    return {
      orderId: order.id,
      chargeId: charge.id,
      status: this.mapChargeStatus(charge.status),
      amount: order.amount / 100,
    };
  }

  /**
   * Create PIX payment
   */
  async createPixPayment(
    customer: CustomerData,
    items: Array<{ name: string; quantity: number; price: number; id?: string }>,
    expiresInSeconds: number = 3600,
    metadata?: Record<string, string>
  ): Promise<PixPaymentData> {
    const pagarmeCustomer = this.formatCustomer(customer);
    const pagarmeItems = this.formatItems(items);

    const order = await pagarmeService.createPixOrder(
      pagarmeCustomer,
      pagarmeItems,
      expiresInSeconds,
      metadata
    );

    const charge = order.charges[0];
    const transaction = charge.last_transaction;

    if (!transaction?.qr_code) {
      throw new Error('PIX QR code not generated');
    }

    return {
      qrCode: transaction.qr_code,
      qrCodeUrl: transaction.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(transaction.qr_code)}`,
      expiresAt: new Date(transaction.expires_at || Date.now() + expiresInSeconds * 1000),
      chargeId: charge.id,
      orderId: order.id,
    };
  }

  /**
   * Create Boleto payment
   */
  async createBoletoPayment(
    customer: CustomerData,
    items: Array<{ name: string; quantity: number; price: number; id?: string }>,
    daysToExpire: number = 3,
    instructions?: string,
    metadata?: Record<string, string>
  ): Promise<BoletoPaymentData> {
    const pagarmeCustomer = this.formatCustomer(customer);
    const pagarmeItems = this.formatItems(items);

    const order = await pagarmeService.createBoletoOrder(
      pagarmeCustomer,
      pagarmeItems,
      daysToExpire,
      instructions,
      metadata
    );

    const charge = order.charges[0];
    const transaction = charge.last_transaction;

    if (!transaction?.line && !transaction?.barcode) {
      throw new Error('Boleto data not generated');
    }

    return {
      orderId: order.id,
      chargeId: charge.id,
      boletoUrl: transaction.url || '',
      boletoPdf: transaction.pdf || '',
      barcode: transaction.barcode || '',
      linhaDigitavel: transaction.line || '',
      dueDate: new Date(transaction.due_at || Date.now() + daysToExpire * 24 * 60 * 60 * 1000),
      amount: order.amount / 100,
    };
  }

  /**
   * Create card token (for frontend)
   */
  async createCardToken(cardData: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
  }): Promise<{ token: string; brand: string; lastFourDigits: string }> {
    const result = await pagarmeService.createCardToken({
      number: cardData.number.replace(/\D/g, ''),
      holder_name: cardData.holderName,
      exp_month: cardData.expMonth,
      exp_year: cardData.expYear,
      cvv: cardData.cvv,
    });

    return {
      token: result.id,
      brand: result.card.brand,
      lastFourDigits: result.card.last_four_digits,
    };
  }

  /**
   * Verify payment status
   */
  async verifyPayment(chargeId: string): Promise<{
    status: 'pending' | 'paid' | 'failed';
    amount?: number;
    paidAt?: Date;
  }> {
    const charge = await pagarmeService.getCharge(chargeId);

    return {
      status: this.mapChargeStatus(charge.status),
      amount: charge.amount / 100,
      paidAt: charge.paid_at ? new Date(charge.paid_at) : undefined,
    };
  }

  /**
   * Process refund
   */
  async processRefund(chargeId: string, amount?: number): Promise<boolean> {
    try {
      const amountInCents = amount ? Math.round(amount * 100) : undefined;
      await pagarmeService.cancelCharge(chargeId, amountInCents);
      return true;
    } catch (error) {
      console.error('Refund error:', error);
      return false;
    }
  }

  /**
   * Get order details from Pagar.me
   */
  async getOrderDetails(orderId: string): Promise<PagarmeOrderResponse> {
    return pagarmeService.getOrder(orderId);
  }

  /**
   * Map Pagar.me charge status to our status
   */
  private mapChargeStatus(status: string): 'pending' | 'paid' | 'failed' {
    switch (status) {
      case 'paid':
      case 'overpaid':
        return 'paid';
      case 'pending':
      case 'processing':
      case 'waiting_payment':
        return 'pending';
      case 'canceled':
      case 'failed':
      case 'underpaid':
      default:
        return 'failed';
    }
  }

  /**
   * Check if payment service is configured
   */
  isConfigured(): boolean {
    return pagarmeService.isConfigured();
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string | null {
    return pagarmeService.getPublicKey();
  }

  // =====================
  // Legacy methods (for backward compatibility)
  // =====================

  /**
   * @deprecated Use createCreditCardPayment instead
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'brl',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    // Mock for legacy compatibility
    return {
      id: `legacy_${Date.now()}`,
      clientSecret: `secret_${Date.now()}`,
      amount,
      currency,
      status: 'pending',
    };
  }

  /**
   * @deprecated Use createPixPayment instead
   */
  async generatePixPayment(
    amount: number,
    orderId: string
  ): Promise<{ qrCode: string; qrCodeText: string; expiresAt: Date }> {
    const mockPixCode = `00020126580014br.gov.bcb.pix0136${orderId}520400005303986540${amount.toFixed(2)}5802BR5925LUMERA LTDA6009SAO PAULO62070503***6304`;

    return {
      qrCode: mockPixCode,
      qrCodeText: mockPixCode,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * @deprecated Use processRefund with chargeId
   */
  async generateBoleto(
    amount: number,
    orderId: string,
    customerData: { name: string; cpf: string; email: string }
  ): Promise<{ boletoUrl: string; barcode: string; dueDate: Date }> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    return {
      boletoUrl: `https://lumera.com/boleto/${orderId}`,
      barcode: `23793381286000000${Math.floor(amount * 100)}00000000${orderId.slice(0, 10)}`,
      dueDate,
    };
  }
}
