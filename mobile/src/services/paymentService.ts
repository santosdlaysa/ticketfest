// Serviço de pagamento simulado
// Em produção, substituir por integração real com Stripe, MercadoPago, PagSeguro, etc.

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

// Simula delay de processamento
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gera código PIX fake (copia e cola)
const generatePixCode = (amount: number, orderId: string): string => {
  const pixData = {
    version: '01',
    key: '11999999999',
    name: 'Lumera PAGAMENTOS',
    city: 'SAO PAULO',
    amount: amount.toFixed(2),
    txid: orderId.slice(0, 25),
  };

  // Simula um código PIX EMV
  return `00020126580014br.gov.bcb.pix0136${pixData.key}5204000053039865404${pixData.amount}5802BR5925${pixData.name}6009${pixData.city}62070503***6304`;
};

// Gera dados para QR Code do PIX
const generatePixQrCodeData = (amount: number, orderId: string): string => {
  return JSON.stringify({
    type: 'PIX',
    amount,
    orderId,
    merchant: 'Lumera',
    timestamp: Date.now(),
  });
};

// Gera código de barras do boleto fake
const generateBoletoBarcode = (): string => {
  const random = () => Math.floor(Math.random() * 10);
  let barcode = '23793';
  for (let i = 0; i < 42; i++) {
    barcode += random();
  }
  return barcode;
};

// Valida número do cartão (Luhn Algorithm simplificado)
const validateCardNumber = (number: string): boolean => {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;

  // Aceita qualquer cartão para simulação
  return /^\d+$/.test(cleaned);
};

// Valida CVV
const validateCvv = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

// Valida data de expiração
const validateExpiry = (month: string, year: string): boolean => {
  const now = new Date();
  const expiry = new Date(parseInt('20' + year), parseInt(month) - 1);
  return expiry > now;
};

// Processa pagamento com cartão
export const processCardPayment = async (
  amount: number,
  cardData: CardData,
  orderId: string
): Promise<PaymentResult> => {
  // Simula tempo de processamento
  await delay(2000);

  // Validações
  if (!validateCardNumber(cardData.number)) {
    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: 'Número do cartão inválido',
    };
  }

  if (!validateCvv(cardData.cvv)) {
    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: 'CVV inválido',
    };
  }

  if (!validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: 'Cartão expirado',
    };
  }

  // Simula alguns cenários de erro baseado no número do cartão
  const cardNumber = cardData.number.replace(/\s/g, '');

  // Cartão que sempre falha (para teste)
  if (cardNumber.startsWith('4000000000000002')) {
    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: 'Cartão recusado pela operadora',
    };
  }

  // Cartão com saldo insuficiente (para teste)
  if (cardNumber.startsWith('4000000000009995')) {
    return {
      success: false,
      paymentId: '',
      status: 'rejected',
      message: 'Saldo insuficiente',
    };
  }

  // Pagamento aprovado
  return {
    success: true,
    paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'approved',
    message: 'Pagamento aprovado com sucesso!',
  };
};

// Gera pagamento PIX
export const generatePixPayment = async (
  amount: number,
  orderId: string
): Promise<PaymentResult> => {
  // Simula tempo de geração
  await delay(1000);

  const pixCode = generatePixCode(amount, orderId);
  const pixQrCode = generatePixQrCodeData(amount, orderId);

  return {
    success: true,
    paymentId: `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    message: 'PIX gerado com sucesso! Escaneie o QR Code ou copie o código.',
    pixCode,
    pixQrCode,
  };
};

// Simula confirmação do PIX (em produção seria via webhook)
export const confirmPixPayment = async (paymentId: string): Promise<PaymentResult> => {
  await delay(1500);

  return {
    success: true,
    paymentId,
    status: 'approved',
    message: 'Pagamento PIX confirmado!',
  };
};

// Gera boleto
export const generateBoletoPayment = async (
  amount: number,
  orderId: string
): Promise<PaymentResult> => {
  await delay(1000);

  const barcode = generateBoletoBarcode();

  return {
    success: true,
    paymentId: `bol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    message: 'Boleto gerado com sucesso! Vencimento em 3 dias úteis.',
    boletoBarcode: barcode,
    boletoUrl: `https://Lumera.com/boleto/${orderId}`,
  };
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
