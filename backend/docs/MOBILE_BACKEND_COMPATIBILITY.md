# Análise de Compatibilidade Mobile x Backend - Lumera

## Resumo Executivo

✅ **O backend possui TODAS as rotas necessárias para o mobile funcionar completamente.**

O backend está bem estruturado seguindo Clean Architecture e atende todas as necessidades do aplicativo mobile React Native.

---

## 1. ENDPOINTS - Comparação Mobile vs Backend

### Autenticação (`/api/auth`)

| Endpoint | Método | Mobile Usa | Backend Possui | Payload/Response |
|----------|--------|------------|----------------|------------------|
| `/auth/register` | POST | ✅ | ✅ | `{email, password, name, cpf?, phone?}` → `{user, accessToken, refreshToken}` |
| `/auth/login` | POST | ✅ | ✅ | `{email, password}` → `{user, accessToken, refreshToken}` |
| `/auth/logout` | POST | ✅ | ✅ | `{refreshToken}` → `void` |
| `/auth/profile` | GET | ✅ | ✅ | `Authorization: Bearer` → `User` |
| `/auth/refresh-token` | POST | ✅ | ✅ | `{refreshToken}` → `{accessToken}` |

### Eventos (`/api/events`)

| Endpoint | Método | Mobile Usa | Backend Possui | Descrição |
|----------|--------|------------|----------------|-----------|
| `/events` | GET | ✅ | ✅ | Lista eventos com filtros (category, search, status, limit, offset) |
| `/events/featured` | GET | ✅ | ✅ | Retorna até 10 próximos eventos em destaque |
| `/events/:id` | GET | ✅ | ✅ | Evento por ID com ingressos disponíveis |
| `/events/slug/:slug` | GET | ✅ | ✅ | Evento por slug |
| `/events/category/:category` | GET | ✅ | ✅ | Eventos filtrados por categoria |
| `/events` | POST | ✅ | ✅ | Criar evento (ORGANIZER/ADMIN) |
| `/events/:id` | PUT | ✅ | ✅ | Atualizar evento (ORGANIZER/ADMIN) |
| `/events/:id` | DELETE | ✅ | ✅ | Deletar evento (ORGANIZER/ADMIN) |

### Ingressos (`/api/tickets`)

| Endpoint | Método | Mobile Usa | Backend Possui | Descrição |
|----------|--------|------------|----------------|-----------|
| `/tickets/event/:eventId` | GET | ✅ | ✅ | Ingressos de um evento |
| `/tickets/:id` | GET | ✅ | ✅ | Ingresso por ID |
| `/tickets` | POST | ✅ | ✅ | Criar ingresso (ORGANIZER/ADMIN) |
| `/tickets/:id` | PUT | ✅ | ✅ | Atualizar ingresso |
| `/tickets/:id` | DELETE | ✅ | ✅ | Deletar ingresso |

### Carrinho (`/api/cart`)

| Endpoint | Método | Mobile Usa | Backend Possui | Descrição |
|----------|--------|------------|----------------|-----------|
| `/cart` | GET | ✅ | ✅ | Obter carrinho (usa Authorization ou X-Session-ID) |
| `/cart/add` | POST | ✅ | ✅ | Adicionar item `{ticketId, quantity}` |
| `/cart/item/:itemId` | PUT | ✅ | ✅ | Atualizar quantidade `{quantity}` |
| `/cart/item/:itemId` | DELETE | ✅ | ✅ | Remover item do carrinho |
| `/cart/clear` | DELETE | ✅ | ✅ | Limpar todo o carrinho |

### Pedidos (`/api/orders`)

| Endpoint | Método | Mobile Usa | Backend Possui | Descrição |
|----------|--------|------------|----------------|-----------|
| `/orders` | POST | ✅ | ✅ | Criar pedido `{items, couponCode?, paymentMethod}` |
| `/orders` | GET | ✅ | ✅ | Listar pedidos do usuário autenticado |
| `/orders/:id` | GET | ✅ | ✅ | Obter pedido por ID |
| `/orders/:id/confirm-payment` | POST | ✅ | ✅ | Confirmar pagamento `{paymentId}` |
| `/orders/:id/cancel` | POST | ✅ | ✅ | Cancelar pedido |

### Check-in (`/api/checkin`) - Funcionalidade Extra

| Endpoint | Método | Mobile Usa | Backend Possui | Descrição |
|----------|--------|------------|----------------|-----------|
| `/checkin/validate` | POST | ❌ | ✅ | Validar QR Code do ingresso |
| `/checkin/event/:eventId/stats` | GET | ❌ | ✅ | Estatísticas de check-in |
| `/checkin/event/:eventId/history` | GET | ❌ | ✅ | Histórico de check-ins |

---

## 2. ESTRUTURAS DE DADOS

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  cpf?: string;         // 11 dígitos, sem formatação
  phone?: string;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
  createdAt: string;    // ISO 8601
}
```

### Event
```typescript
interface Event {
  id: string;
  name: string;
  slug: string;          // URL amigável, único
  description: string;
  date: string;          // ISO 8601
  endDate?: string;
  location: string;
  address: string;
  latitude?: number;     // -90 a 90
  longitude?: number;    // -180 a 180
  images: string[];      // URLs
  category: 'SHOW' | 'FESTIVAL' | 'TEATRO' | 'ESPORTE' | 'FESTA' | 'OUTRO';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
  tickets?: Ticket[];
  createdAt: string;
  updatedAt: string;
}
```

### Ticket
```typescript
interface Ticket {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;         // >= 0
  quantity: number;      // Total disponível
  sold: number;          // Quantidade vendida
  available?: number;    // Calculado: quantity - sold
  salesStart: string;    // ISO 8601
  salesEnd: string;
  features: string[];    // Benefícios do ingresso
  event?: {
    id: string;
    name: string;
    date: string;
    location: string;
  };
}
```

### Cart
```typescript
interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

interface CartItem {
  id: string;
  quantity: number;      // 1-10
  ticket: Ticket & {
    event: {
      id: string;
      name: string;
      date: string;
      location: string;
      images: string[];
    };
  };
}
```

### Order
```typescript
interface Order {
  id: string;
  userId: string;
  eventId: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  couponCode?: string;
  createdAt: string;
  paidAt?: string;
  event: {
    id: string;
    name: string;
    date: string;
    location: string;
    images: string[];
  };
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  ticketId: string;
  quantity: number;
  price: number;
  ticket: {
    id: string;
    name: string;
    price: number;
  };
  ticketInstances?: TicketInstance[];
}

interface TicketInstance {
  id: string;
  qrCode: string;
  qrCodeData: string;
  checkedIn: boolean;
  checkedInAt?: string;
}
```

---

## 3. AUTENTICAÇÃO

### Headers Utilizados

| Header | Uso | Descrição |
|--------|-----|-----------|
| `Authorization` | `Bearer {accessToken}` | Token JWT para rotas protegidas |
| `X-Session-ID` | `{sessionId}` | Identificador para carrinho de guests |
| `Content-Type` | `application/json` | Tipo de conteúdo das requisições |

### Fluxo de Autenticação

```
1. Login/Register
   └── Recebe: { user, accessToken, refreshToken }
   └── Armazena tokens no AsyncStorage

2. Requisições Autenticadas
   └── Adiciona header: Authorization: Bearer {accessToken}

3. Token Expirado (401)
   └── POST /auth/refresh-token com refreshToken
   └── Recebe novo accessToken
   └── Retry da requisição original

4. Refresh Token Expirado
   └── Logout automático
   └── Limpa AsyncStorage
   └── Redireciona para login
```

### JWT Payload
```typescript
interface TokenPayload {
  sub: string;      // User ID
  email: string;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
}
```

---

## 4. VALIDAÇÕES DO BACKEND (Zod)

### Register
```typescript
{
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  cpf: z.string().regex(/^\d{11}$/).optional(),
  phone: z.string().optional()
}
```

### Create Event
```typescript
{
  name: z.string().min(3),
  description: z.string().min(10),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(3),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category: z.string(),
  images: z.array(z.string().url()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional()
}
```

### Create Ticket
```typescript
{
  eventId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  salesStart: z.string().datetime(),
  salesEnd: z.string().datetime(),
  features: z.array(z.string()).optional()
}
```

### Add to Cart
```typescript
{
  ticketId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10)
}
```

### Create Order
```typescript
{
  items: z.array(z.object({
    ticketId: z.string().uuid(),
    quantity: z.number().int().min(1)
  })),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO'])
}
```

---

## 5. MÉTODOS DE PAGAMENTO

| Método | Código | Mobile | Backend |
|--------|--------|--------|---------|
| PIX | `PIX` | ✅ | ✅ |
| Cartão de Crédito | `CREDIT_CARD` | ✅ | ✅ |
| Cartão de Débito | `DEBIT_CARD` | ✅ | ✅ |
| Boleto Bancário | `BOLETO` | ✅ | ✅ |

---

## 6. CATEGORIAS DE EVENTOS

| Categoria | Valor |
|-----------|-------|
| Show | `SHOW` |
| Festival | `FESTIVAL` |
| Teatro | `TEATRO` |
| Esporte | `ESPORTE` |
| Festa | `FESTA` |
| Outro | `OUTRO` |

---

## 7. CÓDIGOS DE ERRO HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado |
| 400 | Bad Request | Validação falhou |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sem permissão para ação |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Duplicidade (email, CPF) |
| 500 | Internal Server Error | Erro interno |

---

## 8. FUNCIONALIDADES EXTRAS DO BACKEND

Funcionalidades implementadas no backend que o mobile ainda não utiliza:

### Check-in de Ingressos
- Validação de QR Code
- Estatísticas de entrada por tipo de ingresso
- Histórico de check-ins

### Sistema de Cupons Avançado
- Desconto fixo ou percentual
- Limite de usos
- Período de validade
- Valor mínimo de compra
- Vinculação a evento específico

### Integrações (Configuráveis)
- **Stripe**: Processamento de pagamentos
- **AWS S3**: Upload de imagens
- **SMTP**: Envio de emails transacionais

---

## 9. CONFIGURAÇÃO DE INTEGRAÇÃO

### Mobile → Backend

O mobile está configurado com mock data (`USE_MOCK_DATA = true`). Para integrar com o backend real:

1. **Alterar flag no mobile:**
```typescript
// mobile/src/services/api.ts
const USE_MOCK_DATA = false;
```

2. **Ajustar URL base:**
```typescript
// mobile/src/services/api.ts
const API_URL = __DEV__
  ? 'http://localhost:4000/api'  // ou 10.0.2.2:4000 para Android emulator
  : 'https://api.Lumera.com/api';
```

3. **Verificar porta do backend:**
```env
# backend/.env
PORT=4000  # Deve coincidir com o mobile
```

---

## 10. ARQUIVOS DE REFERÊNCIA

### Mobile
| Arquivo | Descrição |
|---------|-----------|
| `mobile/src/services/api.ts` | Configuração Axios, endpoints, interceptadores |
| `mobile/src/stores/authStore.ts` | Estado de autenticação (Zustand) |
| `mobile/src/stores/cartStore.ts` | Estado do carrinho |
| `mobile/src/types/index.ts` | Tipos TypeScript |
| `mobile/src/services/mockData.ts` | Dados mock para desenvolvimento |

### Backend
| Arquivo | Descrição |
|---------|-----------|
| `backend/src/routes/*.ts` | Definição de rotas |
| `backend/src/controllers/*.ts` | Controladores |
| `backend/src/domain/entities/*.ts` | Entidades de domínio |
| `backend/src/application/dtos/*.ts` | DTOs |
| `backend/src/utils/validation.ts` | Schemas Zod |
| `backend/src/middlewares/auth.ts` | Middleware JWT |

---

## Conclusão

✅ **COMPATIBILIDADE TOTAL CONFIRMADA**

O backend Lumera atende 100% das necessidades do aplicativo mobile. Todas as rotas, estruturas de dados, autenticação e funcionalidades estão implementadas e prontas para uso.

**Próximos passos para produção:**
1. Desabilitar mock data no mobile
2. Configurar URLs de produção
3. Configurar variáveis de ambiente do backend
4. Implementar check-in no mobile (funcionalidade extra)
