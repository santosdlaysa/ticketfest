# Sistema de Pagamento Dividido (Split Payment) - Lumera

## Visão Geral

O sistema de Split Payment permite que o valor de cada venda de ingresso seja automaticamente dividido entre a plataforma Lumera e o organizador do evento. Isso é essencial para um marketplace de ingressos.

## Arquitetura

### Modelos de Dados

```
┌─────────────────────┐     ┌──────────────────────┐
│   OrganizerAccount  │     │       SplitRule      │
├─────────────────────┤     ├──────────────────────┤
│ - userId            │◄────│ - eventId            │
│ - verified          │     │ - organizerAccountId │
│ - bankDetails       │     │ - platformPercentage │
│ - externalAccounts  │     │ - organizerPercentage│
│ - availableBalance  │     │ - platformFixedFee   │
│ - pendingBalance    │     │ - active             │
└─────────────────────┘     └──────────────────────┘
          │                           │
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│       Payout        │     │  SplitTransaction    │
├─────────────────────┤     ├──────────────────────┤
│ - amount            │     │ - orderId            │
│ - fee               │     │ - totalAmount        │
│ - netAmount         │     │ - platformAmount     │
│ - status            │     │ - organizerAmount    │
│ - payoutMethod      │     │ - status             │
└─────────────────────┘     └──────────────────────┘
```

### Fluxo de Venda com Split

```
1. Compra de Ingresso
   │
   ├── Verifica SplitRule do evento
   │
   ├── Calcula divisão:
   │   - platformAmount = total × platformPercentage% + platformFixedFee
   │   - organizerAmount = total - platformAmount
   │
   ├── Cria SplitTransaction (status: PENDING)
   │
   └── Adiciona organizerAmount ao pendingBalance

2. Confirmação de Pagamento
   │
   ├── Verifica pagamento no gateway
   │
   ├── Atualiza SplitTransaction (status: PROCESSING → COMPLETED)
   │
   └── Move pendingBalance → availableBalance

3. Solicitação de Saque (Withdraw)
   │
   ├── Verifica saldo disponível
   │
   ├── Cria Payout (status: PENDING)
   │
   └── Deduz do availableBalance

4. Processamento de Saque (Admin)
   │
   ├── Processa transferência via gateway
   │
   └── Atualiza Payout (status: COMPLETED)
```

## Endpoints da API

### Conta do Organizador

#### Criar conta
```http
POST /api/split/account
Authorization: Bearer {token}

Response:
{
  "message": "Organizer account created successfully",
  "account": {
    "id": "uuid",
    "userId": "uuid",
    "verified": false,
    "availableBalance": 0,
    "pendingBalance": 0
  }
}
```

#### Obter conta
```http
GET /api/split/account
Authorization: Bearer {token}

Response:
{
  "account": {
    "id": "uuid",
    "userId": "uuid",
    "verified": true,
    "verifiedAt": "2024-01-01T00:00:00Z",
    "bankCode": "001",
    "bankName": "Banco do Brasil",
    "accountType": "CHECKING",
    "accountNumber": "****1234",
    "agencyNumber": "1234",
    "holderName": "Nome do Organizador",
    "holderDocument": "***.***.***-XX",
    "holderType": "INDIVIDUAL",
    "availableBalance": 1500.00,
    "pendingBalance": 500.00,
    "hasStripeAccount": true
  }
}
```

#### Atualizar dados bancários
```http
PUT /api/split/account/bank-details
Authorization: Bearer {token}
Content-Type: application/json

{
  "bankCode": "001",
  "bankName": "Banco do Brasil",
  "accountType": "CHECKING",
  "accountNumber": "12345678",
  "accountDigit": "9",
  "agencyNumber": "1234",
  "agencyDigit": "5",
  "holderName": "Nome Completo",
  "holderDocument": "12345678900",
  "holderType": "INDIVIDUAL"
}
```

#### Verificar conta (ADMIN)
```http
POST /api/split/account/:id/verify
Authorization: Bearer {admin_token}
```

### Regras de Split

#### Criar regra para evento
```http
POST /api/events/:eventId/split-rules
Authorization: Bearer {token}
Content-Type: application/json

{
  "platformPercentage": 10,
  "organizerPercentage": 90,
  "platformFixedFee": 2.00
}
```

#### Obter regra de evento
```http
GET /api/events/:eventId/split-rules
Authorization: Bearer {token}
```

#### Atualizar regra
```http
PUT /api/events/:eventId/split-rules
Authorization: Bearer {token}
Content-Type: application/json

{
  "platformPercentage": 15,
  "organizerPercentage": 85,
  "platformFixedFee": 1.50
}
```

### Payouts (Saques)

#### Listar repasses
```http
GET /api/split/payouts/:organizerId?limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "payouts": {
    "data": [...],
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "balance": {
    "availableBalance": 1500.00,
    "pendingBalance": 500.00,
    "totalEarned": 10000.00,
    "totalWithdrawn": 8000.00
  }
}
```

#### Solicitar saque
```http
POST /api/split/payouts/:organizerId/withdraw
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 500.00,
  "payoutMethod": "PIX"
}

Response:
{
  "message": "Withdrawal request created successfully",
  "payout": {
    "id": "uuid",
    "amount": 500.00,
    "fee": 0,
    "netAmount": 500.00,
    "status": "PENDING",
    "payoutMethod": "PIX"
  }
}
```

#### Processar saque (ADMIN)
```http
POST /api/split/payouts/:payoutId/process
Authorization: Bearer {admin_token}
```

## Gateways de Pagamento Suportados

### 1. Stripe Connect
- Conta conectada tipo Express ou Standard
- Split automático no Payment Intent
- Transferências automáticas após pagamento
- Payouts para conta bancária

### 2. Pagar.me (Implementação Placeholder)
- Criação de recebedores
- Split rules por transação
- Antecipação de recebíveis

### 3. Mercado Pago (Implementação Placeholder)
- Contas de vendedor
- Application fee
- Marketplace mode

### 4. Asaas (Implementação Placeholder)
- Subcontas
- Split por cobrança
- Carteira digital

## Configuração

### Variáveis de Ambiente

```env
# Stripe (Recomendado)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Pagar.me (Opcional)
PAGARME_API_KEY=ak_live_xxx

# Mercado Pago (Opcional)
MERCADOPAGO_ACCESS_TOKEN=xxx

# Asaas (Opcional)
ASAAS_API_KEY=xxx
```

## Regras de Negócio

### 1. Porcentagens
- `platformPercentage + organizerPercentage` deve ser igual a 100%
- `platformFixedFee` é adicional à porcentagem

### 2. Verificação de Conta
- Organizador deve ter conta verificada antes de criar split rules
- Dados bancários obrigam re-verificação se alterados

### 3. Saldo
- **pendingBalance**: Valor aguardando confirmação de pagamento
- **availableBalance**: Valor disponível para saque

### 4. Saques
- Mínimo: valor deve ser positivo
- Máximo: não pode exceder `availableBalance`
- Taxa: pode variar por método (PIX geralmente sem taxa)

### 5. Pagamento Falho
- Se pagamento falhar, split transaction é marcada como FAILED
- Valor pendente não é liberado
- Organizador não perde dinheiro já disponível

## Segurança

### Validações
- Apenas organizador do evento ou admin pode criar/editar split rules
- Apenas dono da conta pode solicitar saques
- Verificação de saldo antes de cada saque
- Mascaramento de dados bancários nas respostas

### Auditoria
- Todas as operações financeiras são registradas em `audit_logs`
- Inclui: IP, User Agent, dados anteriores e novos, timestamp

## Exemplo de Cálculo

```
Venda de Ingresso: R$ 100,00

Split Rule:
- platformPercentage: 10%
- organizerPercentage: 90%
- platformFixedFee: R$ 2,00

Cálculo:
- platformAmount = 100 × 10% + 2 = R$ 12,00
- organizerAmount = 100 - 12 = R$ 88,00

Resultado:
- Plataforma recebe: R$ 12,00
- Organizador recebe: R$ 88,00
```

## Estrutura de Arquivos

```
src/
├── domain/
│   ├── entities/
│   │   ├── OrganizerAccount.ts
│   │   ├── SplitRule.ts
│   │   ├── SplitTransaction.ts
│   │   └── Payout.ts
│   └── repositories/
│       ├── IOrganizerAccountRepository.ts
│       ├── ISplitRuleRepository.ts
│       ├── ISplitTransactionRepository.ts
│       ├── IPayoutRepository.ts
│       └── IAuditLogRepository.ts
├── application/
│   ├── dtos/
│   │   └── SplitPaymentDTO.ts
│   └── use-cases/
│       └── split-payment/
│           ├── CreateOrganizerAccountUseCase.ts
│           ├── UpdateBankDetailsUseCase.ts
│           ├── VerifyOrganizerAccountUseCase.ts
│           ├── CreateSplitRuleUseCase.ts
│           ├── UpdateSplitRuleUseCase.ts
│           ├── ProcessSplitPaymentUseCase.ts
│           ├── CompleteSplitTransactionUseCase.ts
│           ├── CreatePayoutUseCase.ts
│           ├── ProcessPayoutUseCase.ts
│           └── GetPayoutsUseCase.ts
├── infrastructure/
│   ├── database/repositories/
│   │   ├── PrismaOrganizerAccountRepository.ts
│   │   ├── PrismaSplitRuleRepository.ts
│   │   ├── PrismaSplitTransactionRepository.ts
│   │   ├── PrismaPayoutRepository.ts
│   │   └── PrismaAuditLogRepository.ts
│   └── services/
│       └── SplitPaymentService.ts
├── controllers/
│   └── split-payment.controller.ts
└── routes/
    └── split-payment.routes.ts
```

## Próximos Passos

1. **Integração Real com Gateways**
   - Implementar chamadas reais para Pagar.me
   - Implementar chamadas reais para Mercado Pago
   - Implementar chamadas reais para Asaas

2. **Webhooks**
   - Receber notificações de pagamento
   - Processar automaticamente splits
   - Atualizar status de payouts

3. **Dashboard do Organizador**
   - Visualização de saldos
   - Histórico de transações
   - Relatórios financeiros

4. **Antecipação de Recebíveis**
   - Permitir antecipar valores pendentes
   - Calcular taxas de antecipação

5. **Multi-split**
   - Dividir entre múltiplos recebedores
   - Suporte a co-organizadores
