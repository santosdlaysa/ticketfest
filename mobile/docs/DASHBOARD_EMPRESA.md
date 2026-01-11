# Dashboard da Empresa - Cadastro de Eventos, Ingressos e Locais

## Visão Geral

Este documento descreve o sistema de gestão para organizadores de eventos na plataforma **Lumera/Ticketfest**. O dashboard permite que empresas e organizadores gerenciem seus eventos, ingressos, locais e acompanhem métricas de vendas.

---

## 1. Arquitetura do Sistema

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Node.js + Express.js + TypeScript |
| **Banco de Dados** | PostgreSQL + Prisma ORM |
| **Frontend Web** | Next.js 14 + React + TypeScript |
| **Frontend Mobile** | React Native + Expo |
| **Estilização** | Tailwind CSS |
| **Gráficos** | Recharts |
| **Formulários** | React Hook Form |
| **Estado** | Zustand |

### Estrutura de Diretórios

```
ticketfest/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Modelos do banco de dados
│   └── src/
│       ├── controllers/           # Controllers da API
│       ├── services/              # Lógica de negócio
│       ├── routes/                # Definição de rotas
│       ├── middlewares/           # Autenticação e autorização
│       └── utils/                 # Validações (Zod)
│
├── web/
│   └── src/
│       ├── pages/
│       │   └── admin/             # Páginas do dashboard
│       │       ├── index.tsx      # Dashboard principal
│       │       ├── events/        # Gestão de eventos
│       │       └── venues/        # Gestão de locais
│       ├── components/
│       │   └── admin/             # Componentes do dashboard
│       ├── services/
│       │   └── api.ts             # Cliente da API
│       └── types/
│           └── index.ts           # Tipos TypeScript
│
└── mobile/                        # App React Native
```

---

## 2. Funcionalidades Implementadas

### 2.1 Dashboard Principal (`/admin`)

**Arquivo:** `web/src/pages/admin/index.tsx`

#### Estatísticas em Cards
- Total de eventos (publicados, rascunhos, cancelados, concluídos)
- Ingressos vendidos
- Receita total
- Check-ins do dia

#### Gráfico de Vendas
- Visualização dos últimos 7 dias
- Gráfico de área com Recharts
- Exibe receita por dia

#### Listas Rápidas
- Próximos eventos (com contagem de ingressos)
- Eventos em rascunho (pendentes de publicação)

#### Ações Rápidas
- Criar novo evento
- Gerenciar eventos
- Acessar locais
- Check-in de ingressos

---

### 2.2 Gestão de Eventos

#### Listar Eventos (`/admin/events`)
**Arquivo:** `web/src/pages/admin/events/index.tsx`

- Lista todos os eventos do organizador
- Exibe imagem, nome, categoria, data, local
- Status com badges coloridos:
  - 🟢 Publicado (verde)
  - ⚪ Rascunho (cinza)
  - 🔴 Cancelado (vermelho)
  - 🟣 Concluído (roxo)
- Ações: Ver página, Editar, Gerenciar ingressos, Deletar

#### Criar Evento (`/admin/events/create`)
**Arquivo:** `web/src/pages/admin/events/create.tsx`

**Campos do formulário:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome | text | Sim | Min 3 caracteres |
| Descrição | textarea | Sim | Min 10 caracteres |
| Categoria | select | Sim | Lista predefinida |
| Status | select | Sim | DRAFT ou PUBLISHED |
| Data de início | datetime | Sim | - |
| Data de término | datetime | Não | - |
| Local/Venue | text | Sim | Min 3 caracteres |
| Endereço | text | Sim | Min 5 caracteres |
| Imagens | textarea | Não | URLs separadas por vírgula |

**Categorias disponíveis:**
- Música, Tecnologia, Comédia, Teatro, Esporte
- Gastronomia, Educação, Arte, Negócios, Outro

#### Editar Evento (`/admin/events/[id]/edit`)
**Arquivo:** `web/src/pages/admin/events/[id]/edit.tsx`

- Carrega dados existentes do evento
- Mesmos campos do formulário de criação
- Bloqueio de edição para eventos COMPLETED
- Aviso visual quando há ingressos vendidos
- Ações rápidas: Gerenciar ingressos, Ver página pública

---

### 2.3 Gestão de Ingressos

#### Gerenciar Ingressos (`/admin/events/[id]/tickets`)
**Arquivo:** `web/src/pages/admin/events/[id]/tickets.tsx`

**Campos do ingresso:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome | text | Sim | Ex: Pista, VIP, Camarote |
| Preço (R$) | number | Sim | Min 0 |
| Quantidade | number | Sim | Min 1 |
| Descrição | textarea | Não | - |
| Início das vendas | datetime | Sim | - |
| Fim das vendas | datetime | Sim | - |
| Benefícios | text | Não | Separados por vírgula |

**Funcionalidades:**
- Criar novos tipos de ingresso
- Editar ingressos existentes
- Deletar ingressos (se não vendidos)
- Visualizar quantidade vendida vs disponível
- Lista de benefícios com ícones

---

### 2.4 Gestão de Locais (Venues)

#### Listar Locais (`/admin/venues`)
**Arquivo:** `web/src/pages/admin/venues/index.tsx`

- Grid de cards com locais cadastrados
- Imagem ou placeholder
- Nome, endereço, cidade/estado
- Capacidade (se informada)
- Contador de eventos associados
- Ações: Editar, Deletar

#### Criar Local (`/admin/venues/create`)
**Arquivo:** `web/src/pages/admin/venues/create.tsx`

**Campos do formulário:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome | text | Sim | Min 2 caracteres |
| Descrição | textarea | Não | - |
| Capacidade | number | Não | - |
| Email | email | Não | Formato de email |
| Telefone | text | Não | - |
| Endereço | text | Sim | Min 5 caracteres |
| Cidade | text | Sim | - |
| Estado | select | Sim | Lista de estados BR |
| CEP | text | Não | - |
| Imagens | textarea | Não | URLs separadas por vírgula |

#### Editar Local (`/admin/venues/[id]/edit`)
**Arquivo:** `web/src/pages/admin/venues/[id]/edit.tsx`

- Carrega dados existentes do local
- Mesmos campos do formulário de criação
- Validação de permissões

---

## 3. API Endpoints

### 3.1 Estatísticas (`/api/stats`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/stats/organizer` | Estatísticas do organizador | ORGANIZER, ADMIN |
| GET | `/stats/event/:eventId` | Estatísticas de um evento | ORGANIZER, ADMIN |

**Response `/stats/organizer`:**
```json
{
  "totalEvents": 12,
  "publishedEvents": 8,
  "draftEvents": 3,
  "cancelledEvents": 0,
  "completedEvents": 1,
  "totalTicketsSold": 1234,
  "totalRevenue": 45600.00,
  "todayCheckIns": 89,
  "upcomingEvents": [
    {
      "id": "uuid",
      "name": "Rock in Rio",
      "slug": "rock-in-rio",
      "date": "2025-09-15T20:00:00Z",
      "location": "Cidade do Rock",
      "status": "PUBLISHED",
      "totalTickets": 5000,
      "soldTickets": 3500,
      "revenue": 175000.00,
      "ordersCount": 1200
    }
  ],
  "draftEventsList": [...],
  "salesByDay": [
    { "date": "2025-01-05", "amount": 5000, "tickets": 50 },
    { "date": "2025-01-06", "amount": 7500, "tickets": 75 }
  ]
}
```

### 3.2 Eventos (`/api/events`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/events` | Listar eventos | Público |
| GET | `/events/featured` | Eventos em destaque | Público |
| GET | `/events/:id` | Obter evento por ID | Público |
| GET | `/events/slug/:slug` | Obter evento por slug | Público |
| POST | `/events` | Criar evento | ORGANIZER, ADMIN |
| PUT | `/events/:id` | Atualizar evento | ORGANIZER, ADMIN |
| DELETE | `/events/:id` | Deletar evento | ORGANIZER, ADMIN |

### 3.3 Ingressos (`/api/tickets`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/tickets/event/:eventId` | Listar ingressos do evento | Público |
| GET | `/tickets/:id` | Obter ingresso | Público |
| POST | `/tickets` | Criar ingresso | ORGANIZER, ADMIN |
| PUT | `/tickets/:id` | Atualizar ingresso | ORGANIZER, ADMIN |
| DELETE | `/tickets/:id` | Deletar ingresso | ORGANIZER, ADMIN |

### 3.4 Locais (`/api/venues`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/venues` | Listar locais do organizador | ORGANIZER, ADMIN |
| GET | `/venues/search?q=` | Buscar locais | ORGANIZER, ADMIN |
| GET | `/venues/:id` | Obter local | ORGANIZER, ADMIN |
| POST | `/venues` | Criar local | ORGANIZER, ADMIN |
| PUT | `/venues/:id` | Atualizar local | ORGANIZER, ADMIN |
| DELETE | `/venues/:id` | Deletar local | ORGANIZER, ADMIN |

---

## 4. Modelos de Dados

### 4.1 Venue (Local)

```prisma
model Venue {
  id          String   @id @default(uuid())
  name        String
  address     String
  city        String
  state       String
  zipCode     String?
  latitude    Float?
  longitude   Float?
  capacity    Int?
  description String?
  images      String[]
  phone       String?
  email       String?
  organizerId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organizer   User     @relation(fields: [organizerId], references: [id])
  events      Event[]
}
```

### 4.2 Event (Evento)

```prisma
model Event {
  id          String      @id @default(uuid())
  name        String
  slug        String      @unique
  description String
  date        DateTime
  endDate     DateTime?
  location    String
  address     String
  latitude    Float?
  longitude   Float?
  venueId     String?     // Relação opcional com Venue
  images      String[]
  category    String
  status      EventStatus // DRAFT, PUBLISHED, CANCELLED, COMPLETED
  organizerId String
  createdAt   DateTime
  updatedAt   DateTime

  organizer   User
  venue       Venue?
  tickets     Ticket[]
  orders      Order[]
}
```

### 4.3 Ticket (Ingresso)

```prisma
model Ticket {
  id          String   @id @default(uuid())
  eventId     String
  name        String
  description String?
  price       Float
  quantity    Int
  sold        Int      @default(0)
  salesStart  DateTime
  salesEnd    DateTime
  features    String[]
  createdAt   DateTime
  updatedAt   DateTime

  event       Event
  orderItems  OrderItem[]
}
```

---

## 5. Componentes Reutilizáveis

### 5.1 StatCard
**Arquivo:** `web/src/components/admin/StatCard.tsx`

Card para exibição de métricas no dashboard.

```tsx
<StatCard
  title="Total de Eventos"
  value={12}
  subtitle="8 publicados"
  color="primary"
  icon={<CalendarIcon />}
  trend={{ value: 15, isPositive: true }}
/>
```

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| title | string | Título do card |
| value | string \| number | Valor principal |
| subtitle | string | Texto secundário |
| icon | ReactNode | Ícone SVG |
| color | 'primary' \| 'success' \| 'warning' \| 'error' \| 'info' | Cor do ícone |
| trend | { value: number, isPositive: boolean } | Indicador de tendência |

### 5.2 SalesChart
**Arquivo:** `web/src/components/admin/SalesChart.tsx`

Gráfico de vendas usando Recharts.

```tsx
<SalesChart
  data={salesByDay}
  type="area"
  dataKey="amount"
  title="Vendas dos Últimos 7 Dias"
/>
```

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| data | SalesByDay[] | Dados de vendas |
| type | 'area' \| 'bar' | Tipo do gráfico |
| dataKey | 'amount' \| 'tickets' | Campo a exibir |
| title | string | Título do gráfico |

---

## 6. Autenticação e Autorização

### Roles (Papéis)

| Role | Descrição | Permissões |
|------|-----------|------------|
| USER | Usuário comum | Comprar ingressos, ver pedidos |
| ORGANIZER | Organizador de eventos | Criar/gerenciar eventos, ingressos, locais |
| ADMIN | Administrador | Todas as permissões |

### Proteção de Rotas

Todas as páginas do dashboard (`/admin/*`) verificam:

1. **Autenticação:** Usuário deve estar logado
2. **Autorização:** Role deve ser ORGANIZER ou ADMIN

```tsx
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login');
    return;
  }

  if (!authLoading && user && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
    toast.error('Você não tem permissão para acessar esta página');
    router.push('/');
  }
}, [authLoading, isAuthenticated, user, router]);
```

---

## 7. Validações

### Backend (Zod)

**Venue:**
```typescript
export const createVenueSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: z.number().int().min(1).optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});
```

### Frontend (React Hook Form)

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<VenueFormData>();

<Input
  label="Nome do Local *"
  error={errors.name?.message}
  {...register('name', {
    required: 'Nome é obrigatório',
    minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
  })}
/>
```

---

## 8. Fluxos de Uso

### 8.1 Criar um Evento Completo

1. Acessar `/admin` (Dashboard)
2. Clicar em "Novo Evento" ou "Criar Evento"
3. Preencher informações básicas (nome, descrição, categoria)
4. Definir data e horário
5. Informar local e endereço (ou selecionar um Venue cadastrado)
6. Adicionar imagens (URLs)
7. Salvar como DRAFT ou PUBLISHED
8. Acessar "Gerenciar Ingressos"
9. Criar tipos de ingresso (Pista, VIP, etc.)
10. Definir preços, quantidades e período de vendas

### 8.2 Gerenciar Locais

1. Acessar `/admin/venues`
2. Clicar em "Novo Local"
3. Preencher dados do local
4. Salvar
5. Ao criar evento, selecionar o local cadastrado

### 8.3 Acompanhar Vendas

1. Acessar `/admin` (Dashboard)
2. Visualizar cards de estatísticas
3. Analisar gráfico de vendas dos últimos 7 dias
4. Ver lista de próximos eventos com vendas
5. Clicar em um evento para ver detalhes

---

## 9. Funcionalidades Futuras

### Fase 2 - Melhorias

- [ ] Upload de imagens (ao invés de URLs)
- [ ] Integração com mapa para seleção de localização
- [ ] Filtros avançados na lista de eventos
- [ ] Exportação de relatórios (CSV, PDF)
- [ ] Notificações push de vendas

### Fase 3 - Validação de Ingressos

- [ ] Scanner de QR Code via webcam
- [ ] Validação manual por código
- [ ] Estatísticas de check-in em tempo real
- [ ] Histórico de validações

### Fase 4 - Área Financeira

- [ ] Configuração de conta bancária
- [ ] Visualização de saldo (disponível vs pendente)
- [ ] Solicitação de saques
- [ ] Histórico de transações
- [ ] Configuração de split por evento

### Fase 5 - Analytics Avançado

- [ ] Gráficos de vendas por período customizado
- [ ] Comparativo entre eventos
- [ ] Taxa de conversão (visitas vs compras)
- [ ] Mapa de calor de vendas por região

---

## 10. Configuração e Execução

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Rodar migrations
npx prisma migrate dev

# Iniciar servidor
npm run dev
```

### Web

```bash
cd web

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Iniciar servidor
npm run dev
```

### Acessar

- **Backend API:** http://localhost:3000
- **Web Dashboard:** http://localhost:3001/admin

### Usuários de Teste

| Email | Senha | Role |
|-------|-------|------|
| organizer@lumera.com | 123456 | ORGANIZER |
| admin@lumera.com | 123456 | ADMIN |

---

## 11. Referências

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Recharts](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod Validation](https://zod.dev/)

---

**Última atualização:** Dezembro 2025
**Versão:** 1.0.0
