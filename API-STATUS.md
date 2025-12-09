# 📡 API Status & Frontend Implementation - Lumera

Documentação técnica completa dos endpoints da API e status de implementação no frontend.

## 📋 Índice

1. [Endpoints da API](#endpoints-da-api)
2. [Status de Implementação no Frontend](#status-de-implementação-no-frontend)
3. [O que Falta Implementar](#o-que-falta-implementar)
4. [Próximos Passos](#próximos-passos)

---

## 📡 Endpoints da API

**Base URL:** `http://localhost:4000/api`

### 🏥 Health Check

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/health` | ❌ Não | Status da API |

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-29T12:00:00.000Z",
  "uptime": 3600
}
```

---

### 🔐 Autenticação (`/auth`)

| Método | Endpoint | Auth | Role | Descrição | Status Frontend |
|--------|----------|------|------|-----------|----------------|
| POST | `/auth/register` | ❌ Não | - | Registrar novo usuário | ✅ Implementado |
| POST | `/auth/login` | ❌ Não | - | Login | ✅ Implementado |
| POST | `/auth/refresh-token` | ❌ Não | - | Renovar token | ✅ Implementado |
| POST | `/auth/logout` | ❌ Não | - | Logout | ✅ Implementado |
| GET | `/auth/profile` | ✅ Sim | - | Obter perfil do usuário | ✅ Implementado |

#### POST `/auth/register`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva",
  "cpf": "12345678900",
  "phone": "11999999999"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "USER"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### POST `/auth/login`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response:** Igual ao `/register`

---

### 🎪 Eventos (`/events`)

| Método | Endpoint | Auth | Role | Descrição | Status Frontend |
|--------|----------|------|------|-----------|----------------|
| GET | `/events` | ❌ Não | - | Listar todos os eventos | ✅ Implementado |
| GET | `/events/featured` | ❌ Não | - | Eventos em destaque | ✅ Implementado |
| GET | `/events/category/:category` | ❌ Não | - | Eventos por categoria | ✅ Implementado |
| GET | `/events/slug/:slug` | ❌ Não | - | Evento por slug | ✅ Implementado |
| GET | `/events/:id` | ❌ Não | - | Evento por ID | ✅ Implementado |
| POST | `/events` | ✅ Sim | ORGANIZER/ADMIN | Criar evento | ✅ Implementado |
| PUT | `/events/:id` | ✅ Sim | ORGANIZER/ADMIN | Atualizar evento | ⚠️ API pronta |
| DELETE | `/events/:id` | ✅ Sim | ORGANIZER/ADMIN | Deletar evento | ✅ Implementado |

#### GET `/events`
**Query Params:**
- `category` (string, opcional) - Filtrar por categoria
- `search` (string, opcional) - Buscar por nome
- `status` (string, opcional) - Filtrar por status
- `limit` (number, opcional) - Limitar resultados
- `offset` (number, opcional) - Paginação

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "name": "Festival de Rock 2025",
      "slug": "festival-de-rock-2025",
      "description": "Descrição do evento",
      "date": "2025-12-15T20:00:00.000Z",
      "location": "Allianz Parque",
      "address": "Av. Francisco Matarazzo, 1705",
      "category": "Música",
      "images": ["url1", "url2"],
      "status": "PUBLISHED",
      "organizerId": "uuid"
    }
  ],
  "total": 100
}
```

#### POST `/events`
**Body:**
```json
{
  "name": "Festival de Rock 2025",
  "description": "O maior festival de rock do Brasil",
  "date": "2025-12-15T20:00:00.000Z",
  "endDate": "2025-12-16T02:00:00.000Z",
  "location": "Allianz Parque",
  "address": "Av. Francisco Matarazzo, 1705 - São Paulo, SP",
  "latitude": -23.527489,
  "longitude": -46.678581,
  "category": "Música",
  "images": ["https://exemplo.com/img1.jpg"],
  "status": "DRAFT"
}
```

---

### 🎫 Ingressos (`/tickets`)

| Método | Endpoint | Auth | Role | Descrição | Status Frontend |
|--------|----------|------|------|-----------|----------------|
| GET | `/tickets/event/:eventId` | ❌ Não | - | Listar ingressos do evento | ✅ Implementado |
| GET | `/tickets/:id` | ❌ Não | - | Ingresso por ID | ✅ Implementado |
| POST | `/tickets` | ✅ Sim | ORGANIZER/ADMIN | Criar ingresso | ✅ Implementado |
| PUT | `/tickets/:id` | ✅ Sim | ORGANIZER/ADMIN | Atualizar ingresso | ✅ Implementado |
| DELETE | `/tickets/:id` | ✅ Sim | ORGANIZER/ADMIN | Deletar ingresso | ✅ Implementado |

#### POST `/tickets`
**Body:**
```json
{
  "eventId": "uuid",
  "name": "Pista",
  "description": "Acesso à área de pista",
  "price": 80.00,
  "quantity": 500,
  "salesStart": "2025-11-01T00:00:00.000Z",
  "salesEnd": "2025-12-15T18:00:00.000Z",
  "features": ["Acesso à pista", "Banheiros exclusivos"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "name": "Pista",
  "description": "Acesso à área de pista",
  "price": 80.00,
  "quantity": 500,
  "sold": 0,
  "salesStart": "2025-11-01T00:00:00.000Z",
  "salesEnd": "2025-12-15T18:00:00.000Z",
  "features": ["Acesso à pista", "Banheiros exclusivos"]
}
```

---

### 🛒 Carrinho (`/cart`)

| Método | Endpoint | Auth | Descrição | Status Frontend |
|--------|----------|------|-----------|----------------|
| GET | `/cart` | ⚠️ Opcional | Obter carrinho | ✅ Implementado |
| POST | `/cart/add` | ⚠️ Opcional | Adicionar item | ✅ Implementado |
| PUT | `/cart/item/:itemId` | ⚠️ Opcional | Atualizar quantidade | ✅ Implementado |
| DELETE | `/cart/item/:itemId` | ⚠️ Opcional | Remover item | ✅ Implementado |
| DELETE | `/cart/clear` | ⚠️ Opcional | Limpar carrinho | ✅ Implementado |

**Nota:** Suporta tanto usuários logados quanto guests (via sessionId)

#### POST `/cart/add`
**Body:**
```json
{
  "ticketId": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "quantity": 2,
      "ticket": {
        "id": "uuid",
        "name": "Pista",
        "price": 80.00,
        "event": {
          "id": "uuid",
          "name": "Festival de Rock 2025",
          "date": "2025-12-15T20:00:00.000Z",
          "location": "Allianz Parque",
          "images": ["url"]
        }
      }
    }
  ],
  "subtotal": 160.00,
  "total": 160.00,
  "itemCount": 2
}
```

---

### 📦 Pedidos (`/orders`)

| Método | Endpoint | Auth | Descrição | Status Frontend |
|--------|----------|------|-----------|----------------|
| POST | `/orders` | ✅ Sim | Criar pedido | ✅ Implementado |
| GET | `/orders` | ✅ Sim | Listar pedidos do usuário | ✅ Implementado |
| GET | `/orders/:id` | ✅ Sim | Obter pedido por ID | ✅ Implementado |
| POST | `/orders/:id/confirm-payment` | ✅ Sim | Confirmar pagamento | ⚠️ API pronta |
| POST | `/orders/:id/cancel` | ✅ Sim | Cancelar pedido | ✅ Implementado |

#### POST `/orders`
**Body:**
```json
{
  "items": [
    {
      "ticketId": "uuid",
      "quantity": 2
    }
  ],
  "paymentMethod": "PIX",
  "couponCode": "DESCONTO10"
}
```

**Payment Methods:** `CREDIT_CARD`, `DEBIT_CARD`, `PIX`, `BOLETO`

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "userId": "uuid",
    "subtotal": 160.00,
    "discount": 16.00,
    "total": 144.00,
    "paymentMethod": "PIX",
    "paymentStatus": "PENDING",
    "status": "PENDING",
    "items": [
      {
        "id": "uuid",
        "ticketId": "uuid",
        "quantity": 2,
        "price": 80.00,
        "ticket": {
          "id": "uuid",
          "name": "Pista"
        },
        "ticketInstances": [
          {
            "id": "uuid",
            "qrCode": "data:image/png;base64,...",
            "qrCodeData": "encrypted_data",
            "checkedIn": false
          }
        ]
      }
    ]
  },
  "payment": {
    "method": "PIX",
    "status": "PENDING"
  }
}
```

---

### ✅ Check-in (`/checkin`)

| Método | Endpoint | Auth | Role | Descrição | Status Frontend |
|--------|----------|------|------|-----------|----------------|
| POST | `/checkin/validate` | ✅ Sim | - | Validar e fazer check-in | ❌ Não implementado |
| GET | `/checkin/event/:eventId/stats` | ✅ Sim | ORGANIZER/ADMIN | Estatísticas de check-in | ❌ Não implementado |
| GET | `/checkin/event/:eventId/history` | ✅ Sim | ORGANIZER/ADMIN | Histórico de check-ins | ❌ Não implementado |

#### POST `/checkin/validate`
**Body:**
```json
{
  "qrCodeData": "encrypted_data"
}
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "event": {
      "name": "Festival de Rock 2025",
      "date": "2025-12-15T20:00:00.000Z"
    },
    "ticketType": "Pista",
    "checkedInAt": "2025-12-15T19:30:00.000Z"
  }
}
```

---

## ✅ Status de Implementação no Frontend

### Páginas Públicas

| Página | Rota | Status | Descrição |
|--------|------|--------|-----------|
| Home | `/` | ✅ Implementado | Landing page com eventos em destaque |
| Eventos | `/events` | ✅ Implementado | Listagem de eventos com busca e filtros |
| Detalhes do Evento | `/events/[slug]` | ✅ Implementado | Informações do evento e seleção de ingressos |
| Carrinho | `/cart` | ✅ Implementado | Visualização e edição do carrinho |
| Login | `/auth/login` | ✅ Implementado | Autenticação de usuários |
| Registro | `/auth/register` | ✅ Implementado | Cadastro de novos usuários |

### Páginas de Usuário (Autenticadas)

| Página | Rota | Status | Descrição |
|--------|------|--------|-----------|
| Meu Perfil | `/user/profile` | ✅ Implementado | Informações e estatísticas do usuário |
| Meus Ingressos | `/user/tickets` | ✅ Implementado | Lista de ingressos com QR codes |
| Meus Pedidos | `/user/orders` | ✅ Implementado | Histórico de compras |
| Checkout | `/checkout` | ✅ Implementado | Finalização de compra |
| Sucesso do Pagamento | `/checkout/success` | ✅ Implementado | Instruções pós-pagamento |

### Páginas de Organizador/Admin

| Página | Rota | Status | Descrição |
|--------|------|--------|-----------|
| Meus Eventos | `/admin/events` | ✅ Implementado | Lista de eventos do organizador |
| Criar Evento | `/admin/events/create` | ✅ Implementado | Formulário de criação de evento |
| Gerenciar Ingressos | `/admin/events/[id]/tickets` | ✅ Implementado | CRUD de ingressos do evento |
| Editar Evento | `/admin/events/[id]/edit` | ❌ Não implementado | Edição de evento existente |
| Dashboard | `/admin/dashboard` | ❌ Não implementado | Visão geral de vendas e estatísticas |

### Componentes Reutilizáveis

| Componente | Localização | Status | Descrição |
|------------|-------------|--------|-----------|
| Button | `/components/common/Button.tsx` | ✅ Implementado | Botão reutilizável |
| Input | `/components/common/Input.tsx` | ✅ Implementado | Input com label e validação |
| EventCard | `/components/event/EventCard.tsx` | ✅ Implementado | Card de evento |
| Header | `/components/layout/Header.tsx` | ✅ Implementado | Cabeçalho com navegação |
| Footer | `/components/layout/Footer.tsx` | ✅ Implementado | Rodapé |
| Layout | `/components/layout/Layout.tsx` | ✅ Implementado | Layout wrapper |
| StripePaymentForm | `/components/checkout/StripePaymentForm.tsx` | ✅ Implementado | Formulário de pagamento Stripe |

### Contextos (State Management)

| Contexto | Localização | Status | Descrição |
|----------|-------------|--------|-----------|
| AuthContext | `/contexts/AuthContext.tsx` | ✅ Implementado | Autenticação e usuário |
| CartContext | `/contexts/CartContext.tsx` | ✅ Implementado | Gerenciamento do carrinho |

### Serviços (API Calls)

| Serviço | Localização | Status | Descrição |
|---------|-------------|--------|-----------|
| authApi | `/services/api.ts` | ✅ Implementado | Chamadas de autenticação |
| eventsApi | `/services/api.ts` | ✅ Implementado | Chamadas de eventos |
| ticketsApi | `/services/api.ts` | ✅ Implementado | Chamadas de ingressos |
| cartApi | `/services/api.ts` | ✅ Implementado | Chamadas de carrinho |
| ordersApi | `/services/api.ts` | ✅ Implementado | Chamadas de pedidos |

---

## ❌ O que Falta Implementar

### Páginas Pendentes

#### 1. Editar Evento (`/admin/events/[id]/edit`)
**Prioridade:** Alta
**Descrição:** Permitir organizadores editarem eventos existentes
**Funcionalidades:**
- Formulário pré-preenchido com dados atuais
- Validação igual ao criar evento
- Botão de salvar alterações
- Botão de cancelar

**Estimativa:** 2-3 horas

---

#### 2. Dashboard do Organizador (`/admin/dashboard`)
**Prioridade:** Média
**Descrição:** Visão geral de vendas e estatísticas
**Funcionalidades:**
- Total de vendas (R$)
- Total de ingressos vendidos
- Eventos mais populares
- Gráfico de vendas por período
- Lista de últimos pedidos
- Taxa de check-in

**Estimativa:** 1-2 dias

---

#### 3. Scanner de QR Code (`/admin/checkin`)
**Prioridade:** Alta (para eventos presenciais)
**Descrição:** Permitir organizadores fazerem check-in via QR code
**Funcionalidades:**
- Abrir câmera do dispositivo
- Escanear QR code
- Validar ingresso via API
- Mostrar status (válido, já usado, inválido)
- Som/vibração de confirmação
- Histórico de check-ins

**Estimativa:** 1-2 dias

---

#### 4. Relatórios de Vendas (`/admin/reports`)
**Prioridade:** Média
**Descrição:** Relatórios detalhados de vendas
**Funcionalidades:**
- Filtrar por evento, período, status
- Exportar para CSV/PDF
- Gráficos de vendas
- Métodos de pagamento mais usados
- Ingressos mais vendidos
- Taxa de conversão

**Estimativa:** 2-3 dias

---

### Funcionalidades Pendentes

#### 1. Upload de Imagens (AWS S3)
**Prioridade:** Alta
**Status:** Backend tem configuração, frontend não implementado
**Descrição:** Permitir upload direto de imagens ao criar eventos
**Funcionalidades:**
- Componente de upload de arquivos
- Preview de imagens
- Redimensionamento automático
- Upload para S3
- Múltiplas imagens

**Estimativa:** 2-3 dias

---

#### 2. Transferência de Ingressos
**Prioridade:** Baixa
**Descrição:** Permitir transferir ingresso para outro usuário
**Funcionalidades:**
- Buscar usuário por email
- Enviar solicitação de transferência
- Aceitar/rejeitar transferência
- Notificação por email
- Histórico de transferências

**Estimativa:** 2-3 dias

---

#### 3. Sistema de Reviews/Avaliações
**Prioridade:** Baixa
**Descrição:** Permitir usuários avaliarem eventos após participação
**Funcionalidades:**
- Avaliação de 1-5 estrelas
- Comentário escrito
- Foto/vídeo opcional
- Resposta do organizador
- Moderação de reviews

**Estimativa:** 3-4 dias

---

#### 4. Sistema de Favoritos
**Prioridade:** Baixa
**Descrição:** Permitir usuários salvarem eventos favoritos
**Funcionalidades:**
- Botão de favoritar/desfavoritar
- Lista de eventos favoritos
- Notificação de novos ingressos
- Compartilhar favoritos

**Estimativa:** 1-2 dias

---

#### 5. Cupons de Desconto (Frontend)
**Prioridade:** Média
**Status:** Backend implementado, frontend parcial
**Descrição:** Gerenciar cupons de desconto
**Funcionalidades Admin:**
- Criar cupom
- Definir % ou valor fixo
- Definir período de validade
- Limite de usos
- Aplicar a eventos específicos
- Valor mínimo de compra

**Estimativa:** 1-2 dias

---

#### 6. Notificações Push
**Prioridade:** Baixa
**Descrição:** Notificar usuários sobre eventos e atualizações
**Funcionalidades:**
- Confirmação de pagamento
- Ingresso disponível (favoritos)
- Lembrete de evento (24h antes)
- Cancelamento de evento
- Novo evento de organizador favorito

**Estimativa:** 2-3 dias

---

#### 7. Chat de Suporte
**Prioridade:** Baixa
**Descrição:** Sistema de mensagens entre usuários e organizadores
**Funcionalidades:**
- Chat em tempo real (Socket.io)
- Histórico de conversas
- Anexar imagens
- Notificação de nova mensagem
- Status online/offline

**Estimativa:** 3-4 dias

---

#### 8. Modo Escuro (Dark Mode)
**Prioridade:** Baixa
**Descrição:** Tema escuro para toda a aplicação
**Funcionalidades:**
- Toggle no header
- Salvar preferência
- Cores adaptadas
- Suporte a preferência do sistema

**Estimativa:** 1-2 dias

---

### Melhorias de UX

#### 1. Loading States
**Prioridade:** Média
**Status:** Implementado parcialmente
**Melhorias:**
- Skeleton loaders nas listagens
- Shimmer effect
- Progress bar em uploads
- Loading inline em botões

**Estimativa:** 1-2 dias

---

#### 2. Animações e Transições
**Prioridade:** Baixa
**Status:** Mínimo implementado
**Melhorias:**
- Transições suaves entre páginas
- Animações de hover
- Scroll reveal
- Microinterações

**Estimativa:** 2-3 dias

---

#### 3. Acessibilidade (A11y)
**Prioridade:** Alta
**Status:** Básico implementado
**Melhorias:**
- ARIA labels completos
- Navegação por teclado
- Contraste de cores (WCAG AA)
- Screen reader support
- Focus indicators

**Estimativa:** 2-3 dias

---

#### 4. Responsividade
**Prioridade:** Alta
**Status:** Implementado, mas pode melhorar
**Melhorias:**
- Testar em mais dispositivos
- Menu mobile melhorado
- Tabelas responsivas
- Imagens otimizadas por dispositivo

**Estimativa:** 2-3 dias

---

## 📊 Resumo do Status

### Backend API
- ✅ **100% Implementado**
- Todos os endpoints funcionais
- Documentação completa
- Pronto para produção

### Frontend Web
- ✅ **85% Implementado**
- Fluxo principal completo
- Áreas críticas funcionando
- Algumas features avançadas pendentes

### Mobile App
- ❌ **0% Implementado**
- Não iniciado
- Tecnologia a definir (React Native vs Flutter)

---

## 🚀 Próximos Passos (Prioridade)

### Fase 1: MVP Completo (1-2 semanas)
1. ✅ Editar Evento - **3h**
2. ✅ Scanner QR Code - **2 dias**
3. ✅ Upload de Imagens - **3 dias**
4. ✅ Dashboard Organizador - **2 dias**

### Fase 2: Melhorias UX (1 semana)
1. ✅ Loading states/Skeleton - **2 dias**
2. ✅ Acessibilidade completa - **3 dias**
3. ✅ Responsividade refinada - **2 dias**

### Fase 3: Features Avançadas (2-3 semanas)
1. ✅ Relatórios de Vendas - **3 dias**
2. ✅ Cupons (frontend completo) - **2 dias**
3. ✅ Sistema de Favoritos - **2 dias**
4. ✅ Transferência de Ingressos - **3 dias**
5. ✅ Sistema de Reviews - **4 dias**

### Fase 4: Engajamento (2-3 semanas)
1. ✅ Notificações Push - **3 dias**
2. ✅ Chat de Suporte - **4 dias**
3. ✅ Dark Mode - **2 dias**
4. ✅ Animações e Transições - **3 dias**

### Fase 5: Mobile (4-6 semanas)
1. ⏳ Setup projeto mobile
2. ⏳ Autenticação
3. ⏳ Listagem e compra
4. ⏳ Meus ingressos + QR Code
5. ⏳ Scanner (organizadores)
6. ⏳ Notificações push
7. ⏳ Apple Pay / Google Pay

---

## 📈 Métricas do Projeto

### Código
- **Total de Linhas:** ~20,000
- **Arquivos Backend:** ~60
- **Arquivos Frontend:** ~30
- **Componentes React:** ~15
- **Endpoints API:** 35+

### Tempo de Desenvolvimento
- **Backend:** 100% (2-3 semanas)
- **Frontend:** 85% (2-3 semanas)
- **Documentação:** 100% (3 dias)
- **Total investido:** ~5-6 semanas

### Para Completar MVP
- **Tempo estimado:** 1-2 semanas
- **Features críticas:** 4
- **Melhorias UX:** 3

---

## 🔗 Links Úteis

- **API Docs:** `/backend/README.md`
- **Frontend Docs:** `/web/README.md`
- **Guia Organizador:** `/GUIA-ORGANIZADOR.md`
- **Checklist:** `/CHECKLIST.md`

---

**Última atualização:** 29/10/2025
**Versão:** 1.0.0
**Status Geral:** 🟢 MVP Funcional (85%)
