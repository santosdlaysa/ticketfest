# 💳 Lumera - Checkout Setup Guide

## 📋 Overview

O sistema de checkout do Lumera agora está 100% funcional com suporte para múltiplos métodos de pagamento:
- 💳 **Cartão de Crédito** (via Stripe)
- 📱 **PIX** (com QR Code)
- 📄 **Boleto Bancário**

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd web
npm install
```

Isso instalará automaticamente as novas dependências Stripe:
- `@stripe/stripe-js`
- `@stripe/react-stripe-js`

### 2. Configurar Stripe

#### Obter sua Chave Stripe

1. Crie uma conta gratuita em: https://dashboard.stripe.com/register
2. Acesse: https://dashboard.stripe.com/apikeys
3. Copie sua **Publishable key** (começa com `pk_test_...`)

#### Adicionar ao .env.local

Edite o arquivo `web/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_AQUI
```

⚠️ **Importante:** Nunca commite a chave de produção (`pk_live_...`) no repositório!

### 3. Iniciar o Sistema

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd web
npm run dev
```

---

## 🧪 Testar o Checkout

### Fluxo Completo

1. Acesse http://localhost:3001
2. Navegue para um evento
3. Selecione ingressos e quantidade
4. Clique em "Adicionar ao Carrinho"
5. Vá para o carrinho (ícone no header)
6. Clique em "Finalizar Compra"
7. Preencha os dados pessoais
8. Escolha um método de pagamento:

#### Teste PIX
- Selecione "PIX"
- Clique em "Confirmar Pedido"
- Você verá o QR Code e código para copiar

#### Teste Boleto
- Selecione "Boleto Bancário"
- Clique em "Confirmar Pedido"
- Você verá o botão para download

#### Teste Cartão de Crédito (Stripe)
- Selecione "Cartão de Crédito"
- Clique em "Continuar para Pagamento"
- Preencha os dados do cartão (use números de teste abaixo)
- Clique em "Pagar"

### Cartões de Teste Stripe

**Aprovado:**
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura (ex: 12/25)
CVV: Qualquer 3 dígitos (ex: 123)
Nome: Seu nome
```

**Recusado:**
```
Número: 4000 0000 0000 0002
Data: Qualquer data futura
CVV: Qualquer 3 dígitos
```

**Autenticação 3D Secure:**
```
Número: 4000 0025 0000 3155
Data: Qualquer data futura
CVV: Qualquer 3 dígitos
```

**Mais cartões de teste:** https://stripe.com/docs/testing

---

## 📁 Arquivos Criados

### Páginas

1. **`web/src/pages/checkout.tsx`**
   - Página principal de checkout
   - Formulário de dados pessoais
   - Seleção de método de pagamento
   - Integração com Stripe Elements
   - Validação com React Hook Form

2. **`web/src/pages/checkout/success.tsx`**
   - Página de confirmação
   - Instruções específicas por método
   - Detalhes do pedido
   - Links para próximos passos

### Componentes

3. **`web/src/components/checkout/StripePaymentForm.tsx`**
   - Formulário seguro de cartão de crédito
   - Stripe Elements (CardNumber, CardExpiry, CardCvc)
   - Validação em tempo real
   - Tratamento de erros

---

## 🔧 Configuração Avançada

### Stripe Webhooks (Produção)

Para processar pagamentos assíncronos em produção, configure webhooks:

1. Acesse: https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://sua-api.com/api/webhooks/stripe`
3. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copie o webhook secret
5. Adicione ao `.env` do backend:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Variáveis de Ambiente

#### Frontend (`web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Backend (`backend/.env`)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🎨 Customização

### Estilos do Stripe Elements

Edite em `web/src/components/checkout/StripePaymentForm.tsx`:

```typescript
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937', // Cor do texto
      '::placeholder': {
        color: '#9ca3af', // Cor do placeholder
      },
    },
    invalid: {
      color: '#ef4444', // Cor de erro
    },
  },
};
```

### Métodos de Pagamento

Para adicionar/remover métodos, edite `web/src/pages/checkout.tsx`:

```typescript
interface CheckoutForm {
  // ...
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'NOVO_METODO';
}
```

---

## 🐛 Troubleshooting

### Erro: "Stripe has not been properly initialized"

**Solução:**
1. Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está no `.env.local`
2. Reinicie o servidor Next.js: `npm run dev`

### Erro: "No such publishable key"

**Solução:**
1. Verifique se a chave começa com `pk_test_` ou `pk_live_`
2. Certifique-se de copiar a chave completa
3. Não use aspas na variável de ambiente

### Checkout redireciona para login

**Solução:**
- O checkout requer autenticação
- Faça login ou crie uma conta primeiro
- Usuário de teste: `user@Lumera.com` / `password123`

### Cartão de crédito não aparece

**Solução:**
1. Selecione "Cartão de Crédito" na lista
2. Clique em "Continuar para Pagamento"
3. O formulário aparecerá abaixo

---

## 📊 Status da Implementação

### ✅ Completo

- [x] Página de checkout
- [x] Formulário de dados pessoais
- [x] Validação de campos (CPF, telefone, email)
- [x] Seleção de método de pagamento
- [x] Integração Stripe Elements
- [x] Suporte PIX com QR Code
- [x] Suporte Boleto
- [x] Página de sucesso
- [x] Instruções por método
- [x] Design responsivo
- [x] Tratamento de erros
- [x] Estados de loading

### 🔄 Pendente

- [ ] Visualização dos ingressos comprados
- [ ] Página "Meus Pedidos"
- [ ] Download de PDF dos ingressos
- [ ] Email com ingressos (backend já envia)

---

## 🔐 Segurança

### Dados do Cartão

✅ **Seguros:** Os dados do cartão NUNCA passam pelo seu servidor
✅ **PCI Compliant:** Stripe Elements é certificado PCI DSS Level 1
✅ **Criptografado:** Comunicação via HTTPS com o Stripe

### Dados Pessoais

- CPF, telefone e email são enviados ao backend
- Armazenados com segurança no PostgreSQL
- Use HTTPS em produção
- Considere criptografar dados sensíveis

---

## 📞 Suporte

### Documentação Stripe
- Guia: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- React: https://stripe.com/docs/stripe-js/react

### Problemas?
1. Verifique os logs do navegador (F12)
2. Verifique os logs do backend
3. Consulte: https://stripe.com/docs/testing

---

## 🎯 Próximos Passos

Após testar o checkout:

1. **Implementar área do usuário**
   - Página "Meus Ingressos"
   - Página "Meus Pedidos"
   - Download de PDF

2. **Configurar produção**
   - Trocar chaves de teste pelas de produção
   - Configurar webhooks
   - Deploy do sistema

3. **Testes finais**
   - Testar fluxo completo
   - Validar todos os métodos
   - Verificar emails

---

**Versão:** 1.1.0
**Data:** 20 de Outubro de 2025
**Status:** ✅ Checkout 100% Funcional
