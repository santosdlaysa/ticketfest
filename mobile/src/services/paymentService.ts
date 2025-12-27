/**
 * Real Payment Service - Pagar.me Integration
 *
 * This service handles all payment operations by calling the backend API endpoints
 * which integrate with Pagar.me payment gateway.
 *
 * Backend endpoints used:
 * - POST /api/orders - Create order with payment (handles PIX, Card, Boleto)
 * - POST /api/orders/card-token - Tokenize credit/debit card
 * - GET /api/orders/:id/check-payment - Check payment status
 * - POST /api/orders/:id/confirm-payment - Confirm payment
 */

import { ordersApi } from './api';

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: 'approved' | 'pending' | 'rejected';
  message: string;
  pixCode?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
}

export interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

/**
 * Tokenize credit/debit card using Pagar.me
 * This is called before processing card payments to securely tokenize card data
 */
export const createCardToken = async (cardData: CardData): Promise<{
  token: string;
  brand: string;
  lastFourDigits: string;
}> => {
  try {
    const result = await ordersApi.createCardToken({
      number: cardData.number.replace(/\s/g, ''),
      holderName: cardData.holderName,
      expMonth: parseInt(cardData.expiryMonth, 10),
      expYear: parseInt(cardData.expiryYear, 10),
      cvv: cardData.cvv,
    });

    return result;
  } catch (error: any) {
    console.error('Error creating card token:', error);
    const errorMessage = error.response?.data?.error || 'Erro ao processar dados do cartão';
    throw new Error(errorMessage);
  }
};

/**
 * Process credit card payment
 *
 * Flow:
 * 1. Tokenize the card using Pagar.me
 * 2. Create order with card token
 * 3. Backend processes payment with Pagar.me
 * 4. Return payment result
 */
export const processCardPayment = async (
  cartItems: Array<{ ticketId: string; quantity: number }>,
  cardData: CardData,
  installments: number = 1,
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' = 'CREDIT_CARD'
): Promise<PaymentResult> => {
  try {
    // Step 1: Tokenize the card
    const { token, brand, lastFourDigits } = await createCardToken(cardData);

    // Step 2: Create order with card token
    const response = await ordersApi.create({
      items: cartItems,
      paymentMethod,
      cardToken: token,
      installments,
    });

    // Step 3: Check payment status from response
    const { order, payment } = response;

    if (payment?.card) {
      const cardPayment = payment.card;

      if (cardPayment.status === 'paid') {
        return {
          success: true,
          paymentId: cardPayment.chargeId,
          status: 'approved',
          message: 'Pagamento aprovado com sucesso!',
        };
      } else if (cardPayment.status === 'pending') {
        return {
          success: true,
          paymentId: cardPayment.chargeId,
          status: 'pending',
          message: 'Pagamento em processamento...',
        };
      } else {
        return {
          success: false,
          paymentId: cardPayment.chargeId || '',
          status: 'rejected',
          message: 'Pagamento recusado. Verifique os dados do cartão.',
        };
      }
    }

    // Fallback
    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: 'Erro ao processar pagamento',
    };
  } catch (error: any) {
    console.error('Card payment error:', error);

    const errorMessage = error.response?.data?.error || error.message || 'Erro ao processar pagamento';

    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: errorMessage,
    };
  }
};

/**
 * Generate PIX payment
 *
 * Flow:
 * 1. Create order with PIX payment method
 * 2. Backend generates PIX QR code with Pagar.me
 * 3. Return PIX code and QR code URL
 *
 * Note: Payment confirmation happens via webhook when user pays
 */
export const generatePixPayment = async (
  cartItems: Array<{ ticketId: string; quantity: number }>
): Promise<PaymentResult & { orderId?: string; chargeId?: string; qrCodeUrl?: string }> => {
  try {
    const response = await ordersApi.create({
      items: cartItems,
      paymentMethod: 'PIX',
    });

    const { order, payment } = response;

    if (payment?.pix) {
      const pixPayment = payment.pix;

      return {
        success: true,
        paymentId: pixPayment.chargeId,
        status: 'pending',
        message: 'PIX gerado com sucesso! Escaneie o QR Code ou copie o código.',
        pixCode: pixPayment.qrCode,
        pixQrCode: pixPayment.qrCodeUrl, // URL da imagem do QR code
        qrCodeUrl: pixPayment.qrCodeUrl,
        orderId: order.id,
        chargeId: pixPayment.chargeId,
      };
    }

    throw new Error('PIX payment data not returned from backend');
  } catch (error: any) {
    console.error('PIX payment error:', error);

    const errorMessage = error.response?.data?.error || error.message || 'Erro ao gerar PIX';

    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: errorMessage,
    };
  }
};

/**
 * Check PIX payment status
 *
 * This is used to poll the payment status after user scans the QR code
 */
export const checkPixPayment = async (orderId: string): Promise<{
  paid: boolean;
  status: string;
  message: string;
}> => {
  try {
    const result = await ordersApi.getById(orderId);

    const isPaid = result.paymentStatus === 'PAID';

    return {
      paid: isPaid,
      status: result.paymentStatus,
      message: isPaid ? 'Pagamento confirmado!' : 'Aguardando pagamento...',
    };
  } catch (error: any) {
    console.error('Error checking PIX payment:', error);

    return {
      paid: false,
      status: 'UNKNOWN',
      message: 'Erro ao verificar pagamento',
    };
  }
};

/**
 * Confirm PIX payment
 *
 * @deprecated Use checkPixPayment instead
 */
export const confirmPixPayment = async (paymentId: string): Promise<PaymentResult> => {
  // This is handled by webhook in production
  // Client should poll checkPixPayment instead
  return {
    success: true,
    paymentId,
    status: 'pending',
    message: 'Aguardando confirmação do pagamento...',
  };
};

/**
 * Generate Boleto payment
 *
 * Flow:
 * 1. Create order with Boleto payment method
 * 2. Backend generates Boleto with Pagar.me
 * 3. Return Boleto URL and barcode
 */
export const generateBoletoPayment = async (
  cartItems: Array<{ ticketId: string; quantity: number }>
): Promise<PaymentResult> => {
  try {
    const response = await ordersApi.create({
      items: cartItems,
      paymentMethod: 'BOLETO',
    });

    const { order, payment } = response;

    if (payment?.boleto) {
      const boletoPayment = payment.boleto;

      return {
        success: true,
        paymentId: boletoPayment.chargeId,
        status: 'pending',
        message: 'Boleto gerado com sucesso! Vencimento em 3 dias úteis.',
        boletoBarcode: boletoPayment.barcode,
        boletoUrl: boletoPayment.boletoUrl,
      };
    }

    throw new Error('Boleto payment data not returned from backend');
  } catch (error: any) {
    console.error('Boleto payment error:', error);

    const errorMessage = error.response?.data?.error || error.message || 'Erro ao gerar boleto';

    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: errorMessage,
    };
  }
};

// Formata número do cartão para exibição
export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

// Detecta bandeira do cartão
export const getCardBrand = (number: string): string => {
  const cleaned = number.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  if (/^(?:2131|1800|35)/.test(cleaned)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
  if (/^(636368|636369|5067|4576|4011)/.test(cleaned)) return 'elo';
  if (/^(606282|3841)/.test(cleaned)) return 'hipercard';

  return 'unknown';
};

// Ícones das bandeiras
export const cardBrandIcons: Record<string, string> = {
  visa: 'credit-card',
  mastercard: 'credit-card',
  amex: 'credit-card',
  elo: 'credit-card',
  hipercard: 'credit-card',
  unknown: 'credit-card-outline',
};
