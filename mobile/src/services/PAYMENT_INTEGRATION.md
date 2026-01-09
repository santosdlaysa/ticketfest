# Payment Integration - Pagar.me

This document describes how the mobile app integrates with the Pagar.me payment gateway through the backend API.

## Overview

The payment service (`paymentService.ts`) has been updated to make real API calls to the backend instead of using mock/simulated data. All payment processing is handled by the backend which integrates with Pagar.me.

## Architecture

```
Mobile App -> Backend API -> Pagar.me Gateway
```

The mobile app **never** directly communicates with Pagar.me. All payment operations go through the backend for security.

## Backend API Endpoints

### 1. Create Card Token
**POST** `/api/orders/card-token`

Tokenizes credit/debit card data using Pagar.me before processing payment.

**Request:**
```json
{
  "number": "4111111111111111",
  "holderName": "JOHN DOE",
  "expMonth": 12,
  "expYear": 25,
  "cvv": "123"
}
```

**Response:**
```json
{
  "token": "tok_...",
  "brand": "visa",
  "lastFourDigits": "1111"
}
```

### 2. Create Order with Payment
**POST** `/api/orders`

Creates an order and processes payment in a single transaction.

**Request:**
```json
{
  "items": [
    { "ticketId": "uuid", "quantity": 2 }
  ],
  "paymentMethod": "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO",
  "cardToken": "tok_..." // Required for card payments
  "installments": 1 // Optional, for credit card only
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "total": 100.00,
    "paymentStatus": "PENDING" | "PAID" | "FAILED",
    "status": "PENDING" | "CONFIRMED" | "CANCELLED",
    // ... other order fields
  },
  "payment": {
    "pix": { // For PIX payments
      "qrCode": "00020126...", // Copy-paste code
      "qrCodeUrl": "https://...", // Image URL for QR code
      "chargeId": "ch_...",
      "expiresAt": "2024-01-01T00:00:00.000Z"
    },
    "card": { // For card payments
      "chargeId": "ch_...",
      "status": "paid" | "pending" | "failed",
      "amount": 100.00
    },
    "boleto": { // For boleto payments
      "chargeId": "ch_...",
      "boletoUrl": "https://...",
      "barcode": "23793...",
      "linhaDigitavel": "23793.38128...",
      "dueDate": "2024-01-04T00:00:00.000Z"
    }
  }
}
```

### 3. Check Payment Status
**GET** `/api/orders/:id/check-payment`

Checks the current payment status (useful for PIX polling).

**Response:**
```json
{
  "paymentStatus": "PENDING" | "PAID" | "FAILED",
  "chargeId": "ch_...",
  "paidAt": "2024-01-01T00:00:00.000Z" // if paid
}
```

### 4. Get Order by ID
**GET** `/api/orders/:id`

Retrieves order details including payment status.

**Response:** Full Order object (see order type)

## Payment Flows

### Credit/Debit Card Payment

1. User enters card details in the form
2. App calls `createCardToken()` to tokenize card with Pagar.me
3. App calls `processCardPayment()` which:
   - Creates order with card token
   - Backend processes payment with Pagar.me
   - Returns payment result
4. If approved:
   - Clear cart
   - Show success screen
5. If declined:
   - Show error message
   - Keep user on card form to retry

**Code Example:**
```typescript
const cartItems = cart.items.map(item => ({
  ticketId: item.ticket.id,
  quantity: item.quantity,
}));

const cardData = {
  number: '4111111111111111',
  holderName: 'JOHN DOE',
  expiryMonth: '12',
  expiryYear: '25',
  cvv: '123',
};

const result = await processCardPayment(
  cartItems,
  cardData,
  1, // installments
  'CREDIT_CARD'
);

if (result.success && result.status === 'approved') {
  // Payment approved!
  await clearCart();
  showSuccess();
}
```

### PIX Payment

1. User selects PIX as payment method
2. App calls `generatePixPayment()` which:
   - Creates order with PIX payment method
   - Backend generates PIX QR code with Pagar.me
   - Returns QR code (text) and QR code URL (image)
3. App displays QR code for user to scan
4. User pays via their banking app
5. Pagar.me sends webhook to backend when paid
6. Backend updates order status to PAID
7. User clicks "Já paguei" button
8. App calls `checkPixPayment()` to verify payment
9. If paid:
   - Clear cart
   - Show success screen
10. If not paid yet:
    - Show "wait and try again" message

**Code Example:**
```typescript
const cartItems = cart.items.map(item => ({
  ticketId: item.ticket.id,
  quantity: item.quantity,
}));

// Generate PIX
const result = await generatePixPayment(cartItems);

if (result.success) {
  // Show QR code
  displayQRCode(result.qrCodeUrl);
  displayCopyCode(result.pixCode);

  // User pays...

  // Check payment status
  const status = await checkPixPayment(result.orderId);
  if (status.paid) {
    // Payment confirmed!
  }
}
```

### Boleto Payment

1. User selects Boleto as payment method
2. App calls `generateBoletoPayment()` which:
   - Creates order with Boleto payment method
   - Backend generates Boleto with Pagar.me
   - Returns barcode and URL
3. App displays barcode for user to copy
4. User pays via internet banking or bank branch
5. Pagar.me sends webhook to backend when paid (usually 1-2 business days)
6. Backend updates order status to PAID
7. User receives email notification when paid

**Code Example:**
```typescript
const cartItems = cart.items.map(item => ({
  ticketId: item.ticket.id,
  quantity: item.quantity,
}));

const result = await generateBoletoPayment(cartItems);

if (result.success) {
  // Show boleto details
  displayBarcode(result.boletoBarcode);
  displayBoletoUrl(result.boletoUrl);

  // Clear cart (boleto will be confirmed via webhook)
  await clearCart();
  showSuccess();
}
```

## Payment Service Functions

### `createCardToken(cardData: CardData)`

Tokenizes card data securely with Pagar.me.

**Parameters:**
- `cardData.number` - Card number (with or without spaces)
- `cardData.holderName` - Cardholder name
- `cardData.expiryMonth` - Expiry month (MM)
- `cardData.expiryYear` - Expiry year (YY)
- `cardData.cvv` - CVV code

**Returns:**
```typescript
{
  token: string;
  brand: string; // visa, mastercard, etc.
  lastFourDigits: string;
}
```

### `processCardPayment(cartItems, cardData, installments, paymentMethod)`

Processes credit or debit card payment.

**Parameters:**
- `cartItems` - Array of `{ ticketId, quantity }`
- `cardData` - Card data object
- `installments` - Number of installments (credit card only)
- `paymentMethod` - 'CREDIT_CARD' or 'DEBIT_CARD'

**Returns:**
```typescript
{
  success: boolean;
  paymentId: string;
  status: 'approved' | 'pending' | 'rejected';
  message: string;
}
```

### `generatePixPayment(cartItems)`

Generates PIX payment QR code.

**Parameters:**
- `cartItems` - Array of `{ ticketId, quantity }`

**Returns:**
```typescript
{
  success: boolean;
  paymentId: string;
  status: 'pending';
  message: string;
  pixCode: string; // Copy-paste code
  pixQrCode: string; // Image URL
  qrCodeUrl: string; // Image URL (same as pixQrCode)
  orderId: string;
  chargeId: string;
}
```

### `checkPixPayment(orderId)`

Checks if PIX payment has been confirmed.

**Parameters:**
- `orderId` - Order ID

**Returns:**
```typescript
{
  paid: boolean;
  status: string; // PENDING, PAID, FAILED, etc.
  message: string;
}
```

### `generateBoletoPayment(cartItems)`

Generates Boleto payment.

**Parameters:**
- `cartItems` - Array of `{ ticketId, quantity }`

**Returns:**
```typescript
{
  success: boolean;
  paymentId: string;
  status: 'pending';
  message: string;
  boletoBarcode: string;
  boletoUrl: string;
}
```

## Error Handling

All payment functions handle errors and return user-friendly messages:

```typescript
try {
  const result = await processCardPayment(...);
  if (!result.success) {
    // Show error to user
    Alert.alert('Pagamento recusado', result.message);
  }
} catch (error) {
  // Network or unexpected error
  Alert.alert('Erro', error.message || 'Falha ao processar pagamento');
}
```

Common error messages:
- "Número do cartão inválido"
- "Cartão expirado"
- "CVV inválido"
- "Cartão recusado pela operadora"
- "Saldo insuficiente"
- "CPF é obrigatório para pagamento via PIX ou Boleto"
- "Erro ao processar dados do cartão"

## Security Notes

1. **Card data is tokenized**: Card details are only sent to Pagar.me via the backend tokenization endpoint
2. **No card data storage**: Card numbers, CVV, etc. are never stored in the database
3. **PCI compliance**: All card processing is handled by Pagar.me (PCI DSS Level 1 certified)
4. **HTTPS only**: All API calls use HTTPS encryption
5. **Webhook verification**: Backend verifies webhook signatures from Pagar.me

## Testing

### Test Cards (Pagar.me)

**Approved:**
- Visa: 4111 1111 1111 1111
- Mastercard: 5555 5555 5555 4444
- Any future expiry date, any CVV

**Declined:**
- 4000 0000 0000 0002 - Card declined
- 4000 0000 0000 9995 - Insufficient funds

**PIX Testing:**
- PIX payments in sandbox mode auto-approve after 30 seconds
- Or use the Pagar.me dashboard to manually approve

**Boleto Testing:**
- Boleto in sandbox mode can be manually approved in Pagar.me dashboard

## Configuration

### Backend Environment Variables

Required in `.env`:
```
PAGARME_SECRET_KEY=sk_test_...
PAGARME_PUBLIC_KEY=pk_test_...
PAGARME_WEBHOOK_SECRET=whsec_...
```

### Mobile App Configuration

API URL is configured in `src/services/api.ts`:
```typescript
const API_URL = __DEV__
  ? 'http://192.168.100.136:3000/api'  // Local development
  : 'https://api.ticketfest.com/api';   // Production
```

## Troubleshooting

### "CPF é obrigatório para pagamento via PIX ou Boleto"

User must update their profile with a valid CPF before using PIX or Boleto.

### PIX QR code not generated

Check backend logs for Pagar.me API errors. Common issues:
- Invalid CPF format
- Missing customer data

### Card payment always fails

Check:
1. Card token is being created successfully
2. Backend Pagar.me credentials are correct
3. Test card numbers are correct

### Payment status stuck on PENDING

For PIX:
- Webhook may not be configured correctly
- User hasn't actually paid yet

For Card:
- Payment may be under review by Pagar.me
- Check Pagar.me dashboard for details
