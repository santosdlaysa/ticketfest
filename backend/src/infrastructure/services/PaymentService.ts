import Stripe from 'stripe';
import { env } from '../config/env.js';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export class PaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
      });
    } else {
      console.warn('⚠️  Stripe not configured. Using mock payment service.');
    }
  }

  /**
   * Create payment intent for credit card
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'brl',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    if (!this.stripe) {
      // Mock payment for development
      return {
        id: `mock_pi_${Date.now()}`,
        clientSecret: `mock_secret_${Date.now()}`,
        amount,
        currency,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    };
  }

  /**
   * Generate PIX payment
   */
  async generatePixPayment(
    amount: number,
    orderId: string
  ): Promise<{ qrCode: string; qrCodeText: string; expiresAt: Date }> {
    // This is a simplified version. In production, you would integrate with
    // a Brazilian payment gateway that supports PIX (e.g., Mercado Pago, PagSeguro)

    const mockPixCode = `00020126580014br.gov.bcb.pix0136${orderId}520400005303986540${amount.toFixed(
      2
    )}5802BR5925TICKETFEST LTDA6014SAO PAULO62070503***6304`;

    return {
      qrCode: mockPixCode,
      qrCodeText: mockPixCode,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  /**
   * Generate Boleto payment
   */
  async generateBoleto(
    amount: number,
    orderId: string,
    customerData: {
      name: string;
      cpf: string;
      email: string;
    }
  ): Promise<{ boletoUrl: string; barcode: string; dueDate: Date }> {
    // Mock implementation
    // In production, integrate with Brazilian payment gateways

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days to pay

    return {
      boletoUrl: `https://ticketfest.com/boleto/${orderId}`,
      barcode: `23793381286000000${Math.floor(amount * 100)}00000000${orderId.slice(0, 10)}`,
      dueDate,
    };
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string): Promise<{
    status: 'pending' | 'paid' | 'failed';
    amount?: number;
  }> {
    if (!this.stripe) {
      // Mock: auto-approve for development
      return {
        status: 'paid',
        amount: 0,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      let status: 'pending' | 'paid' | 'failed';
      if (paymentIntent.status === 'succeeded') {
        status = 'paid';
      } else if (
        paymentIntent.status === 'processing' ||
        paymentIntent.status === 'requires_payment_method'
      ) {
        status = 'pending';
      } else {
        status = 'failed';
      }

      return {
        status,
        amount: paymentIntent.amount / 100,
      };
    } catch (error) {
      return {
        status: 'failed',
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number): Promise<boolean> {
    if (!this.stripe) {
      console.log(`Mock refund processed for payment ${paymentId}`);
      return true;
    }

    try {
      await this.stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return true;
    } catch (error) {
      console.error('Refund error:', error);
      return false;
    }
  }
}
