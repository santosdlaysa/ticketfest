# Lumera API

Sistema completo de venda de ingressos - Backend API REST

## 🚀 Tecnologias

- **Node.js** 18+
- **TypeScript** 5+
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados (via pg)
- **JWT** - Autenticação
- **Stripe** - Gateway de pagamento
- **QRCode** - Geração de QR Codes
- **Nodemailer** - Envio de emails

## 📋 Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- npm ou yarn

## 🔧 Instalação

1. **Instalar dependências**
```bash
npm install
```

2. **Configurar variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Configurações do PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET`: Chave secreta para refresh tokens
- Outras configurações conforme necessário

## 🏃 Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📚 Documentação da API

### Base URL
```
http://localhost:3000/api
```

### Autenticação

#### Registrar
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "João Silva",
  "cpf": "12345678901",
  "phone": "+5511999999999"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Perfil do Usuário
```http
GET /api/auth/profile
Authorization: Bearer {accessToken}
```

### Eventos

#### Listar Eventos
```http
GET /api/events?category=Música&search=festival&limit=20&offset=0
```

#### Eventos em Destaque
```http
GET /api/events/featured
```

#### Buscar Evento por ID
```http
GET /api/events/{eventId}
```

#### Buscar Evento por Slug
```http
GET /api/events/slug/{slug}
```

#### Criar Evento (Organizador/Admin)
```http
POST /api/events
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Festival de Verão 2025",
  "description": "O maior festival de música...",
  "date": "2025-01-15T18:00:00Z",
  "endDate": "2025-01-17T23:59:00Z",
  "location": "Parque Ibirapuera",
  "address": "Av. Pedro Álvares Cabral...",
  "latitude": -23.5878,
  "longitude": -46.6572,
  "category": "Música",
  "images": ["https://..."],
  "status": "PUBLISHED"
}
```

### Ingressos

#### Listar Ingressos de um Evento
```http
GET /api/tickets/event/{eventId}
```

#### Criar Ingresso (Organizador/Admin)
```http
POST /api/tickets
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "eventId": "uuid",
  "name": "Pista",
  "description": "Acesso à área de pista",
  "price": 150.00,
  "quantity": 5000,
  "salesStart": "2024-11-01T00:00:00Z",
  "salesEnd": "2025-01-15T23:59:00Z",
  "features": ["Acesso à pista", "Bebidas não inclusas"]
}
```

### Carrinho

#### Ver Carrinho
```http
GET /api/cart
X-Session-ID: {sessionId}  // Para usuários não autenticados
Authorization: Bearer {accessToken}  // Para usuários autenticados
```

#### Adicionar ao Carrinho
```http
POST /api/cart/add
Content-Type: application/json

{
  "ticketId": "uuid",
  "quantity": 2
}
```

#### Atualizar Item do Carrinho
```http
PUT /api/cart/item/{itemId}
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remover do Carrinho
```http
DELETE /api/cart/item/{itemId}
```

#### Limpar Carrinho
```http
DELETE /api/cart/clear
```

### Pedidos

#### Criar Pedido
```http
POST /api/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "items": [
    {
      "ticketId": "uuid",
      "quantity": 2
    }
  ],
  "couponCode": "BEMVINDO",
  "paymentMethod": "CREDIT_CARD"
}
```

**Resposta:**
```json
{
  "order": {
    "id": "uuid",
    "total": 285.00,
    "paymentStatus": "PENDING",
    "items": [...]
  },
  "payment": {
    "paymentIntent": {
      "id": "pi_...",
      "clientSecret": "pi_..._secret_...",
      "amount": 285.00,
      "currency": "brl"
    }
  }
}
```

#### Confirmar Pagamento
```http
POST /api/orders/{orderId}/confirm-payment
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "paymentId": "pi_..."
}
```

#### Listar Meus Pedidos
```http
GET /api/orders
Authorization: Bearer {accessToken}
```

#### Ver Pedido
```http
GET /api/orders/{orderId}
Authorization: Bearer {accessToken}
```

#### Cancelar Pedido
```http
POST /api/orders/{orderId}/cancel
Authorization: Bearer {accessToken}
```

### Check-in

#### Validar Ingresso
```http
POST /api/checkin/validate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "qrCodeData": "encrypted-qr-data",
  "eventId": "uuid"
}
```

**Resposta (Sucesso):**
```json
{
  "valid": true,
  "alreadyCheckedIn": false,
  "checkedInAt": "2025-01-15T20:30:00Z",
  "message": "Check-in successful",
  "ticket": {
    "eventName": "Festival de Verão 2025",
    "ticketName": "Pista",
    "holderName": "João Silva",
    "holderEmail": "joao@example.com"
  }
}
```

**Resposta (Já utilizado):**
```json
{
  "valid": false,
  "alreadyCheckedIn": true,
  "checkedInAt": "2025-01-15T19:00:00Z",
  "message": "Ticket already used at ...",
  "ticket": { ... }
}
```

#### Estatísticas de Check-in (Organizador/Admin)
```http
GET /api/checkin/event/{eventId}/stats
Authorization: Bearer {accessToken}
```

#### Histórico de Check-in (Organizador/Admin)
```http
GET /api/checkin/event/{eventId}/history
Authorization: Bearer {accessToken}
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Após o login, você receberá:

- **Access Token**: Token de curta duração (15 minutos) usado para autenticar requisições
- **Refresh Token**: Token de longa duração (7 dias) usado para obter novos access tokens

### Como usar

1. Faça login para obter os tokens
2. Inclua o access token no header `Authorization`:
   ```
   Authorization: Bearer {accessToken}
   ```
3. Quando o access token expirar, use o refresh token para obter um novo:
   ```http
   POST /api/auth/refresh-token
   { "refreshToken": "..." }
   ```

## 👥 Roles (Papéis)

- **USER**: Usuário comum (pode comprar ingressos)
- **ORGANIZER**: Organizador de eventos (pode criar e gerenciar eventos)
- **ADMIN**: Administrador (acesso total)

## 💳 Métodos de Pagamento

A API suporta:

- **CREDIT_CARD**: Cartão de crédito (via Stripe)
- **DEBIT_CARD**: Cartão de débito (via Stripe)
- **PIX**: PIX (mock - integrar com gateway brasileiro)
- **BOLETO**: Boleto bancário (mock - integrar com gateway brasileiro)

## 📧 Emails

Após a confirmação do pagamento, o sistema envia automaticamente:

1. Email de confirmação do pedido
2. Email com os QR codes dos ingressos

Configure as variáveis de ambiente SMTP para habilitar o envio de emails.

## 🧪 Usuários de Teste

Após popular o banco de dados, você terá:

- **Admin**: `admin@Lumera.com` / `password123`
- **Organizer**: `organizer@Lumera.com` / `password123`
- **User**: `user@Lumera.com` / `password123`

## 📦 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/           # Configurações
│   ├── controllers/      # Controllers
│   ├── domain/           # Entidades e interfaces de domínio
│   ├── application/      # Use cases e DTOs
│   ├── infrastructure/   # Implementações de infraestrutura
│   ├── interfaces/       # Controllers HTTP e middlewares
│   ├── lib/              # Utilitários de banco de dados
│   ├── middlewares/      # Middlewares
│   ├── routes/           # Rotas
│   ├── services/         # Lógica de negócio
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Utilitários
│   ├── app.ts            # Configuração do Express
│   └── server.ts         # Ponto de entrada
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json
└── tsconfig.json
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor em produção
- `npm test` - Executa testes
- `npm run lint` - Executa linter

## 📝 Licença

MIT

## 👨‍💻 Autor

Lumera Team
