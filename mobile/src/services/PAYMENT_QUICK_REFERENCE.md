# Payment Service Quick Reference

## Import
```typescript
import {
  processCardPayment,
  generatePixPayment,
  generateBoletoPayment,
  checkPixPayment,
  formatCardNumber,
  getCardBrand,
} from '../../services/paymentService';
```

## Credit Card Payment

```typescript
// Prepare cart items
const cartItems = cart.items.map(item => ({
  ticketId: item.ticket.id,
  quantity: item.quantity,
}));

// Prepare card data
const cardData = {
  number: '4111111111111111',
  holderName: 'JOHN DOE',
  expiryMonth: '12',
  expiryYear: '25',
  cvv: '123',
};

// Process payment
const result = await processCardPayment(
  cartItems,
  cardData,
  1, // installments (1-12)
  'CREDIT_CARD'
);

// Handle result
if (result.success && result.status === 'approved') {
  await clearCart();
  showSuccess();
} else {
  Alert.alert('Error', result.message);
}
```

## Debit Card Payment

```typescript
const result = await processCardPayment(
  cartItems,
  cardData,
  1, // always 1 for debit
  'DEBIT_CARD'
);
```

## PIX Payment

```typescript
// Generate PIX
const result = await generatePixPayment(cartItems);

if (result.success) {
  // Display QR code
  setPixCode(result.pixCode); // For copy-paste
  setPixQrUrl(result.qrCodeUrl); // For image display
  setOrderId(result.orderId); // For status checking

  // Show PIX screen
  showPixScreen();
}

// Later, when user clicks "I paid"
const status = await checkPixPayment(orderId);

if (status.paid) {
  await clearCart();
  showSuccess();
} else {
  Alert.alert('Waiting', 'Payment not confirmed yet');
}
```

## Boleto Payment

```typescript
const result = await generateBoletoPayment(cartItems);

if (result.success) {
  // Display boleto
  setBoletoBarcode(result.boletoBarcode);
  setBoletoUrl(result.boletoUrl);

  // Show boleto screen
  await clearCart(); // Clear immediately
  showBoletoScreen();
}
```

## Helper Functions

### Format Card Number
```typescript
const formatted = formatCardNumber('4111111111111111');
// Returns: "4111 1111 1111 1111"
```

### Get Card Brand
```typescript
const brand = getCardBrand('4111111111111111');
// Returns: "visa"

// Supported brands:
// - visa
// - mastercard
// - amex
// - elo
// - hipercard
// - discover
// - jcb
// - diners
// - unknown
```

## Error Handling

```typescript
try {
  const result = await processCardPayment(...);

  if (!result.success) {
    // Payment failed
    Alert.alert('Payment Failed', result.message);
  }
} catch (error) {
  // Network or unexpected error
  Alert.alert('Error', error.message || 'Failed to process payment');
}
```

## Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Número do cartão inválido" | Invalid card number | Check card number format |
| "Cartão expirado" | Card has expired | Use valid expiry date |
| "CVV inválido" | Invalid CVV | Check CVV format (3-4 digits) |
| "Cartão recusado pela operadora" | Card declined by bank | Try different card |
| "Saldo insuficiente" | Insufficient funds | Add funds or try different card |
| "CPF é obrigatório para pagamento via PIX ou Boleto" | User profile missing CPF | Update user profile with CPF |
| "Erro ao processar dados do cartão" | Card tokenization failed | Check card details |

## Response Types

### PaymentResult
```typescript
{
  success: boolean;
  paymentId: string;
  status: 'approved' | 'pending' | 'rejected';
  message: string;

  // For PIX
  pixCode?: string;
  pixQrCode?: string;
  qrCodeUrl?: string;
  orderId?: string;
  chargeId?: string;

  // For Boleto
  boletoBarcode?: string;
  boletoUrl?: string;
}
```

### PIX Status Check
```typescript
{
  paid: boolean;
  status: string; // 'PENDING', 'PAID', 'FAILED'
  message: string;
}
```

## Best Practices

1. **Always validate inputs** before calling payment functions
2. **Show loading states** during payment processing
3. **Clear cart only after successful payment** (or for boleto)
4. **Handle all error cases** with user-friendly messages
5. **Never store card data** - use tokenization
6. **Use secure connections** (HTTPS) for all API calls
7. **Test with test cards** in development/sandbox mode

## Test Cards (Sandbox)

### Approved Cards
```
Visa:       4111 1111 1111 1111
Mastercard: 5555 5555 5555 4444
Exp:        Any future date
CVV:        Any 3 digits
```

### Declined Cards
```
Declined:            4000 0000 0000 0002
Insufficient Funds:  4000 0000 0000 9995
```

## Backend Endpoints

All payment operations call these backend endpoints:

```
POST /api/orders/card-token          - Tokenize card
POST /api/orders                      - Create order + payment
GET  /api/orders/:id                  - Get order details
GET  /api/orders/:id/check-payment    - Check payment status
```

## Flow Diagrams

### Card Payment Flow
```
1. User enters card details
2. App calls processCardPayment()
3. Backend tokenizes card with Pagar.me
4. Backend creates order
5. Backend processes payment with Pagar.me
6. App receives result (approved/declined)
7. If approved: clear cart, show success
8. If declined: show error, allow retry
```

### PIX Payment Flow
```
1. User selects PIX
2. App calls generatePixPayment()
3. Backend creates order
4. Backend generates PIX with Pagar.me
5. App displays QR code
6. User scans and pays in banking app
7. Pagar.me sends webhook to backend
8. Backend updates order status to PAID
9. User clicks "I paid"
10. App calls checkPixPayment()
11. If paid: clear cart, show success
12. If not: show "wait and try again"
```

### Boleto Payment Flow
```
1. User selects Boleto
2. App calls generateBoletoPayment()
3. Backend creates order
4. Backend generates boleto with Pagar.me
5. App displays barcode and URL
6. App clears cart (boleto confirmed via webhook)
7. User pays boleto at bank
8. Pagar.me sends webhook to backend (1-2 days)
9. Backend updates order status to PAID
10. User receives email notification
```
