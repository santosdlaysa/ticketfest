# Lumera Mobile - Documentação Completa

Documentação técnica completa do aplicativo mobile React Native para venda de ingressos.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Arquitetura de Navegação](#3-arquitetura-de-navegação)
4. [Telas do Aplicativo](#4-telas-do-aplicativo)
   - [4.1 LoginScreen](#41-loginscreen)
   - [4.2 RegisterScreen](#42-registerscreen)
   - [4.3 HomeScreen](#43-homescreen)
   - [4.4 EventDetailsScreen](#44-eventdetailsscreen)
   - [4.5 CartScreen](#45-cartscreen)
   - [4.6 CheckoutScreen](#46-checkoutscreen)
   - [4.7 PaymentScreen](#47-paymentscreen)
   - [4.8 MyTicketsScreen](#48-myticketsscreen)
   - [4.9 TicketDetailsScreen](#49-ticketdetailsscreen)
   - [4.10 ProfileScreen](#410-profilescreen)
5. [Serviços e APIs](#5-serviços-e-apis)
6. [Gerenciamento de Estado (Stores)](#6-gerenciamento-de-estado-stores)
7. [Tipos TypeScript](#7-tipos-typescript)
8. [Theme e Estilos](#8-theme-e-estilos)
9. [Fluxos de Usuário](#9-fluxos-de-usuário)

---

## 1. Visão Geral

### Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React Native | 0.81.5 | Framework mobile |
| Expo | ~54.0.23 | Plataforma de desenvolvimento |
| TypeScript | ~5.9.2 | Tipagem estática |
| React Navigation | 7.x | Navegação entre telas |
| React Native Paper | 5.14.5 | Componentes Material Design |
| Zustand | 5.0.8 | Gerenciamento de estado |
| Axios | 1.13.2 | Cliente HTTP |
| date-fns | 4.1.0 | Formatação de datas |
| react-native-qrcode-svg | 6.3.20 | Geração de QR Codes |

### Funcionalidades Principais

- Autenticação de usuários (login/registro)
- Catálogo de eventos com busca e filtros
- Detalhes de eventos e ingressos
- Carrinho de compras
- Checkout com múltiplas formas de pagamento (PIX, Cartão, Boleto)
- Visualização de ingressos com QR Code para validação
- Perfil do usuário

---

## 2. Estrutura do Projeto

```
src/
├── navigation/           # Configuração de navegação
│   ├── RootNavigator.tsx
│   ├── AuthStack.tsx
│   ├── MainStack.tsx
│   ├── HomeTabs.tsx
│   └── types.ts
├── screens/              # Telas do aplicativo
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── events/
│   │   ├── HomeScreen.tsx
│   │   └── EventDetailsScreen.tsx
│   ├── cart/
│   │   └── CartScreen.tsx
│   ├── checkout/
│   │   ├── CheckoutScreen.tsx
│   │   └── PaymentScreen.tsx
│   ├── tickets/
│   │   ├── MyTicketsScreen.tsx
│   │   └── TicketDetailsScreen.tsx
│   └── profile/
│       └── ProfileScreen.tsx
├── services/             # Serviços e APIs
│   ├── api.ts
│   ├── paymentService.ts
│   └── mockData.ts
├── stores/               # Estado global (Zustand)
│   ├── authStore.ts
│   └── cartStore.ts
├── types/                # Definições TypeScript
│   └── index.ts
└── theme/                # Tema e estilos
    └── index.ts
```

---

## 3. Arquitetura de Navegação

### Diagrama de Navegação

```
RootNavigator
│
├── AuthStack (não autenticado)
│   ├── Login ─────────────────┐
│   └── Register ◄─────────────┘
│
└── MainStack (autenticado)
    │
    ├── HomeTabs (Bottom Tab Navigator)
    │   ├── Home (Eventos)
    │   ├── MyTickets (Ingressos)
    │   └── Profile (Perfil)
    │
    ├── EventDetails ◄── Home
    ├── Cart ◄── EventDetails/Home
    ├── Checkout ◄── Cart
    ├── Payment ◄── Checkout
    └── TicketDetails ◄── MyTickets
```

### Tipos de Navegação

```typescript
// RootStackParamList
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// AuthStackParamList
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// MainStackParamList
type MainStackParamList = {
  HomeTabs: undefined;
  EventDetails: { eventId: string };
  Cart: undefined;
  Checkout: undefined;
  Payment: undefined;
  TicketDetails: { ticket: TicketItem };
};

// HomeTabsParamList
type HomeTabsParamList = {
  Home: undefined;
  MyTickets: undefined;
  Profile: undefined;
};
```

---

## 4. Telas do Aplicativo

### 4.1 LoginScreen

**Arquivo:** `src/screens/auth/LoginScreen.tsx`

**Descrição:** Tela de entrada do aplicativo para autenticação de usuários.

#### Funcionalidades
- Login com e-mail e senha
- Validação de campos em tempo real
- Modo demo (acesso sem autenticação)
- Navegação para registro

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| email | string | E-mail do usuário |
| password | string | Senha do usuário |
| showPassword | boolean | Visibilidade da senha |
| errors | object | Erros de validação |

#### Validações
- **E-mail:** Formato válido (regex)
- **Senha:** Mínimo 6 caracteres

#### Integrações
- `authStore.login(email, password)` - Autenticação via API
- `authStore.setAuth(data)` - Modo demo

#### Componentes Visuais
- Card com formulário
- TextInput para e-mail e senha
- Botão "Entrar"
- Botão "Entrar sem senha" (demo)
- Link para registro

---

### 4.2 RegisterScreen

**Arquivo:** `src/screens/auth/RegisterScreen.tsx`

**Descrição:** Tela de criação de nova conta de usuário.

#### Funcionalidades
- Cadastro com dados pessoais
- Validação de campos obrigatórios
- Confirmação de senha
- Campos opcionais (telefone, CPF)

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| name | string | Nome completo |
| email | string | E-mail |
| password | string | Senha |
| confirmPassword | string | Confirmação de senha |
| phone | string | Telefone (opcional) |
| cpf | string | CPF (opcional) |
| errors | object | Erros de validação |

#### Validações
- **Nome:** Obrigatório
- **E-mail:** Formato válido e obrigatório
- **Senha:** Mínimo 6 caracteres
- **Confirmação:** Deve coincidir com senha

#### Integrações
- `authStore.register(userData)` - Registro via API

#### Componentes Visuais
- ScrollView com formulário
- 6 campos de entrada
- Botão "Cadastrar"
- Link para login

---

### 4.3 HomeScreen

**Arquivo:** `src/screens/events/HomeScreen.tsx`

**Descrição:** Tela principal com catálogo de eventos.

#### Funcionalidades
- Busca de eventos por texto
- Filtro por categoria
- Carousel de eventos em destaque
- Lista de todos os eventos
- Badge com contador do carrinho
- Pull-to-refresh

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| events | Event[] | Lista de eventos |
| featuredEvents | Event[] | Eventos em destaque |
| loading | boolean | Estado de carregamento |
| refreshing | boolean | Pull-to-refresh |
| searchQuery | string | Termo de busca |
| selectedCategory | string | Categoria selecionada |

#### Categorias Disponíveis
- Todos
- Shows
- Festivais
- Teatro
- Esportes
- Festas
- Outros

#### Integrações
- `eventsApi.getAll(params)` - Lista eventos com filtros
- `eventsApi.getFeatured()` - Eventos em destaque
- `cartStore.itemCount` - Contador do carrinho

#### Componentes Visuais
- Searchbar
- Chips de categorias
- FlatList horizontal (destaques)
- FlatList vertical (todos eventos)
- Cards de eventos com imagem, nome, data e preço mínimo
- Badge no ícone do carrinho

---

### 4.4 EventDetailsScreen

**Arquivo:** `src/screens/events/EventDetailsScreen.tsx`

**Descrição:** Detalhes completos de um evento com opções de compra.

#### Parâmetros de Navegação
```typescript
{ eventId: string }
```

#### Funcionalidades
- Exibição de detalhes do evento
- Lista de tipos de ingressos
- Verificação de disponibilidade
- Modal de seleção de quantidade
- Adicionar ao carrinho

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| event | Event | Dados do evento |
| tickets | Ticket[] | Ingressos disponíveis |
| loading | boolean | Carregamento |
| selectedTicket | Ticket | Ingresso selecionado |
| quantity | number | Quantidade (1-10) |
| modalVisible | boolean | Modal de quantidade |

#### Status de Ingressos
- **Disponível:** Vendas abertas e estoque > 0
- **Em breve:** Vendas ainda não iniciaram
- **Encerrado:** Vendas finalizadas
- **Esgotado:** Estoque zerado

#### Integrações
- `eventsApi.getById(eventId)` - Detalhes do evento
- `ticketsApi.getByEvent(eventId)` - Lista de ingressos
- `cartStore.addToCart(ticketId, quantity)` - Adicionar ao carrinho

#### Componentes Visuais
- Imagem do evento (header)
- Chip de categoria
- Ícones com data, local e organizador
- Descrição do evento
- Cards de ingressos com preço e features
- Modal com seletor de quantidade (+/-)
- Botão "Adicionar ao carrinho"

---

### 4.5 CartScreen

**Arquivo:** `src/screens/cart/CartScreen.tsx`

**Descrição:** Carrinho de compras com itens selecionados.

#### Funcionalidades
- Lista de itens no carrinho
- Alterar quantidade de itens
- Remover itens
- Limpar carrinho
- Resumo de valores
- Prosseguir para checkout

#### Estados (via cartStore)
| Estado | Tipo | Descrição |
|--------|------|-----------|
| cart | Cart | Objeto do carrinho |
| loading | boolean | Carregamento |
| error | string | Mensagem de erro |

#### Integrações
- `cartStore.fetchCart()` - Carregar carrinho
- `cartStore.updateItemQuantity(itemId, quantity)` - Alterar quantidade
- `cartStore.removeItem(itemId)` - Remover item
- `cartStore.clearCart()` - Limpar tudo

#### Componentes Visuais
- Header com botão limpar
- FlatList de itens
- Imagem do evento (miniatura)
- Controles de quantidade (+/-)
- Botão remover (lixeira)
- Resumo: subtotal, desconto, total
- Botão "Finalizar compra"
- Estado vazio com ilustração

---

### 4.6 CheckoutScreen

**Arquivo:** `src/screens/checkout/CheckoutScreen.tsx`

**Descrição:** Revisão do pedido antes do pagamento.

#### Funcionalidades
- Exibição de dados do comprador
- Resumo dos itens
- Aplicar cupom de desconto
- Cálculo de total com desconto

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| couponCode | string | Código do cupom |
| applyingCoupon | boolean | Aplicando cupom |
| discount | number | Valor do desconto |

#### Cupons Válidos
| Código | Desconto |
|--------|----------|
| DESCONTO10 | 10% |
| DESCONTO20 | 20% |

#### Integrações
- `cartStore.cart` - Dados do carrinho
- `authStore.user` - Dados do usuário

#### Componentes Visuais
- Card com dados do comprador (avatar, nome, e-mail)
- Lista de itens do pedido
- Campo de cupom com botão aplicar
- Resumo: subtotal, desconto, total
- Botão "Ir para pagamento"

---

### 4.7 PaymentScreen

**Arquivo:** `src/screens/checkout/PaymentScreen.tsx`

**Descrição:** Fluxo de pagamento multi-método.

#### Funcionalidades
- Seleção de método de pagamento
- Formulário de cartão de crédito/débito
- Geração de QR Code PIX
- Geração de código de boleto
- Simulação de processamento
- Tela de sucesso

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| paymentMethod | string | Método selecionado |
| step | string | Etapa atual |
| cardNumber | string | Número do cartão |
| cardHolder | string | Nome no cartão |
| expiryMonth | string | Mês de validade |
| expiryYear | string | Ano de validade |
| cvv | string | CVV |
| pixCode | string | Código PIX |
| pixQrData | string | Dados do QR |
| boletoBarcode | string | Código de barras |

#### Métodos de Pagamento
| Método | Ícone | Descrição |
|--------|-------|-----------|
| PIX | qrcode | Aprovação instantânea |
| Cartão Crédito | credit-card | Parcele em até 12x |
| Cartão Débito | credit-card-outline | Débito à vista |
| Boleto | barcode | Vencimento em 3 dias |

#### Etapas (Steps)
1. `method` - Seleção do método
2. `card_form` - Formulário do cartão
3. `pix_qr` - QR Code PIX
4. `boleto` - Código do boleto
5. `processing` - Processamento
6. `success` - Sucesso

#### Integrações
- `paymentService.processCardPayment()` - Pagamento cartão
- `paymentService.generatePixPayment()` - Gerar PIX
- `paymentService.confirmPixPayment()` - Confirmar PIX
- `paymentService.generateBoletoPayment()` - Gerar boleto
- `ordersApi.create()` - Criar pedido
- `cartStore.clearCart()` - Limpar carrinho

#### Componentes Visuais
- RadioButtons para métodos
- Formulário de cartão (4 campos)
- QR Code SVG para PIX
- Código copiável (PIX/Boleto)
- ActivityIndicator no processamento
- Ícone de sucesso com animação
- Botão "Ver meus ingressos"

---

### 4.8 MyTicketsScreen

**Arquivo:** `src/screens/tickets/MyTicketsScreen.tsx`

**Descrição:** Lista de ingressos comprados pelo usuário.

#### Funcionalidades
- Lista de todos os ingressos
- Pré-visualização do QR Code
- Status de cada ingresso
- Pull-to-refresh
- Navegação para detalhes

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| tickets | TicketItem[] | Lista de ingressos |
| loading | boolean | Carregamento |
| refreshing | boolean | Pull-to-refresh |

#### Interface TicketItem
```typescript
interface TicketItem {
  id: string;
  ticketName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCode: string;
  qrCodeData: string;
  checkedIn: boolean;
  checkedInAt?: string;
  orderId: string;
  orderDate: string;
  orderTotal: number;
  paymentStatus: string;
  paymentMethod: string;
  ticketPrice: number;
}
```

#### Status dos Ingressos
| Status | Cor | Condição |
|--------|-----|----------|
| Válido | Verde | Não utilizado e evento futuro |
| Utilizado | Azul | Check-in realizado |
| Encerrado | Cinza | Evento passado |

#### Integrações
- `ordersApi.getUserOrders()` - Buscar pedidos
- Filtro: `status === 'CONFIRMED' && paymentStatus === 'PAID'`

#### Componentes Visuais
- FlatList de ingressos
- Card estilo bilhete com recortes
- QR Code miniatura (60x60)
- Nome do evento e tipo de ingresso
- Data formatada
- Chip de status colorido
- Estado vazio com ilustração

---

### 4.9 TicketDetailsScreen

**Arquivo:** `src/screens/tickets/TicketDetailsScreen.tsx`

**Descrição:** Detalhes do ingresso com QR Code para validação.

#### Parâmetros de Navegação
```typescript
{ ticket: TicketItem }
```

#### Funcionalidades
- Duas abas: QR Code e Detalhes
- QR Code grande para escaneamento
- Informações do evento
- Dados da compra
- Status de check-in

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| activeTab | 'qrcode' \| 'details' | Aba ativa |

#### Tab QR Code
- Nome do evento
- Tipo de ingresso
- QR Code grande (60% da largura)
- Código de validação
- Banner de status/instruções
- Aviso de segurança

#### Tab Detalhes
**Seção Evento:**
- Nome do evento
- Data completa
- Horário
- Local

**Seção Ingresso:**
- Tipo
- Código único
- Status (chip)

**Seção Compra:**
- Número do pedido
- Data da compra
- Método de pagamento
- Valor do ingresso
- Total do pedido

#### Componentes Visuais
- Header com botão voltar
- Tabs customizadas com ícones
- QR Code SVG grande
- Overlay "Utilizado" se check-in feito
- Cards de informações
- Dividers entre seções

---

### 4.10 ProfileScreen

**Arquivo:** `src/screens/profile/ProfileScreen.tsx`

**Descrição:** Perfil do usuário com configurações.

#### Funcionalidades
- Exibição de dados pessoais
- Avatar com iniciais
- Toggle de notificações
- Links de suporte
- Logout

#### Estados
| Estado | Tipo | Descrição |
|--------|------|-----------|
| notificationsEnabled | boolean | Notificações ativas |

#### Seções
**Informações Pessoais:**
- Nome
- E-mail
- CPF (formatado)
- Telefone (formatado)

**Configurações:**
- Notificações (switch)
- Editar perfil (em breve)
- Alterar senha (em breve)

**Suporte:**
- Central de ajuda
- Fale conosco
- Termos de uso
- Política de privacidade

**Sobre:**
- Versão do app (1.0.0)

#### Integrações
- `authStore.user` - Dados do usuário
- `authStore.logout()` - Deslogar

#### Componentes Visuais
- Avatar.Text com iniciais
- Badge de role (Usuário/Organizador/Admin)
- List.Item para cada opção
- Switch para notificações
- Ícones para cada item
- Botão logout (outlined, vermelho)
- Footer com logo

---

## 5. Serviços e APIs

### Configuração Base

**Arquivo:** `src/services/api.ts`

```typescript
// Base URL
const API_URL = 'http://localhost:4000/api';

// Interceptadores
- Request: Adiciona Bearer token
- Response: Refresh automático em 401
```

### authApi

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| `register` | POST `/auth/register` | Criar conta | email, password, name, cpf?, phone? |
| `login` | POST `/auth/login` | Autenticar | email, password |
| `logout` | POST `/auth/logout` | Deslogar | refreshToken |
| `getProfile` | GET `/auth/profile` | Obter perfil | - |

### eventsApi

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| `getAll` | GET `/events` | Listar eventos | category?, search?, limit?, offset? |
| `getFeatured` | GET `/events/featured` | Destaques | - |
| `getById` | GET `/events/:id` | Por ID | id |
| `getBySlug` | GET `/events/slug/:slug` | Por slug | slug |
| `getByCategory` | GET `/events/category/:cat` | Por categoria | category |

### ticketsApi

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| `getByEvent` | GET `/tickets/event/:eventId` | Por evento | eventId |
| `getById` | GET `/tickets/:id` | Por ID | id |

### cartApi

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| `get` | GET `/cart` | Obter carrinho | - |
| `add` | POST `/cart/add` | Adicionar item | ticketId, quantity |
| `updateItem` | PUT `/cart/item/:itemId` | Atualizar qtd | itemId, quantity |
| `removeItem` | DELETE `/cart/item/:itemId` | Remover item | itemId |
| `clear` | DELETE `/cart/clear` | Limpar | - |

### ordersApi

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| `create` | POST `/orders` | Criar pedido | items, couponCode?, paymentMethod |
| `getById` | GET `/orders/:id` | Por ID | id |
| `getUserOrders` | GET `/orders` | Meus pedidos | - |
| `confirmPayment` | POST `/orders/:id/confirm-payment` | Confirmar pgto | orderId, paymentId |
| `cancel` | POST `/orders/:id/cancel` | Cancelar | orderId |

### paymentService

**Arquivo:** `src/services/paymentService.ts`

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `processCardPayment(amount, cardData, orderId)` | Processar cartão | PaymentResult |
| `generatePixPayment(amount, orderId)` | Gerar PIX | { pixCode, pixQrCode, paymentId } |
| `confirmPixPayment(paymentId)` | Confirmar PIX | PaymentResult |
| `generateBoletoPayment(amount, orderId)` | Gerar boleto | { boletoBarcode } |
| `formatCardNumber(value)` | Formatar número | string (XXXX XXXX XXXX XXXX) |
| `getCardBrand(number)` | Detectar bandeira | string |

---

## 6. Gerenciamento de Estado (Stores)

### authStore

**Arquivo:** `src/stores/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Ações
login(email, password): Promise<void>
register(data): Promise<void>
logout(): Promise<void>
setAuth(data): void
checkAuth(): Promise<void>
```

**Persistência:** AsyncStorage (chave: 'auth-storage')

### cartStore

**Arquivo:** `src/stores/cartStore.ts`

```typescript
interface CartState {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

// Ações
fetchCart(): Promise<void>
addToCart(ticketId, quantity): Promise<void>
updateItemQuantity(itemId, quantity): Promise<void>
removeItem(itemId): Promise<void>
clearCart(): Promise<void>
```

---

## 7. Tipos TypeScript

**Arquivo:** `src/types/index.ts`

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
  createdAt: string;
}
```

### Event
```typescript
interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  organizerId: string;
  organizer?: { id: string; name: string; email: string };
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
  price: number;
  quantity: number;
  sold: number;
  available?: number;
  salesStart: string;
  salesEnd: string;
  features: string[];
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
  quantity: number;
  ticket: Ticket & {
    event: { id: string; name: string; date: string; location: string; images: string[] };
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
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  couponCode?: string;
  createdAt: string;
  paidAt?: string;
  event: { id: string; name: string; date: string; location: string; images: string[] };
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  ticketId: string;
  quantity: number;
  price: number;
  ticket: { id: string; name: string; price: number };
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

## 8. Theme e Estilos

**Arquivo:** `src/theme/index.ts`

### Cores

| Nome | Valor | Uso |
|------|-------|-----|
| primary | #6200ee | Cor principal (roxo) |
| secondary | #03dac6 | Cor secundária (ciano) |
| error | #b00020 | Erros (vermelho) |
| background | #f5f5f5 | Fundo das telas |
| surface | #ffffff | Cards e superfícies |
| onPrimary | #ffffff | Texto sobre primary |
| onSurface | #000000 | Texto sobre surface |

### Espaçamento

| Nome | Valor | Uso |
|------|-------|-----|
| xs | 4px | Mínimo |
| sm | 8px | Pequeno |
| md | 16px | Médio (padrão) |
| lg | 24px | Grande |
| xl | 32px | Extra grande |
| xxl | 48px | Máximo |

### Tamanhos de Fonte

| Nome | Valor | Uso |
|------|-------|-----|
| xs | 12px | Labels pequenos |
| sm | 14px | Texto secundário |
| md | 16px | Texto padrão |
| lg | 18px | Subtítulos |
| xl | 20px | Títulos |
| xxl | 24px | Headers |
| xxxl | 32px | Destaques |

---

## 9. Fluxos de Usuário

### Fluxo de Compra

```
1. Home
   └── Buscar/filtrar eventos

2. EventDetails
   └── Ver detalhes do evento
   └── Selecionar ingresso e quantidade
   └── Adicionar ao carrinho

3. Cart
   └── Revisar itens
   └── Ajustar quantidades
   └── Prosseguir para checkout

4. Checkout
   └── Verificar dados
   └── Aplicar cupom (opcional)
   └── Ir para pagamento

5. Payment
   └── Selecionar método
   └── Preencher dados / Escanear QR
   └── Confirmar pagamento

6. Success
   └── Ver ingressos
```

### Fluxo de Validação de Ingresso

```
1. MyTickets
   └── Ver lista de ingressos
   └── Selecionar ingresso

2. TicketDetails
   └── Tab QR Code
       └── Apresentar QR para validação
   └── Tab Detalhes
       └── Ver informações da compra
```

### Fluxo de Autenticação

```
1. Login
   └── Inserir credenciais
   └── OU usar modo demo
   └── OU ir para registro

2. Register
   └── Preencher dados
   └── Criar conta
   └── Voltar para login

3. Logout (via Profile)
   └── Confirmar logout
   └── Retornar para Login
```

---

## Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 2024-12 | 1.0.0 | Versão inicial do app |

---

*Documentação gerada para o projeto Lumera Mobile*
