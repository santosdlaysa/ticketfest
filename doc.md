# Documentação - Sistema de Venda de Ingressos Lumera

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Documentação Web](#documentação-web)
5. [Documentação Mobile](#documentação-mobile)
6. [API e Backend](#api-e-backend)
7. [Fluxos de Usuário](#fluxos-de-usuário)
8. [Segurança](#segurança)
9. [Guia de Instalação](#guia-de-instalação)
10. [Deployment](#deployment)

---

## Visão Geral

O **Lumera** é uma plataforma completa de venda de ingressos para eventos e festas, oferecendo experiência fluida tanto na versão web quanto mobile.

### Funcionalidades Principais
- Listagem de eventos disponíveis
- Sistema de carrinho de compras
- Checkout integrado com gateways de pagamento
- Geração de QR Codes para validação
- Painel administrativo para organizadores
- Sistema de check-in no evento
- Notificações por email e push

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
├─────────────────┬───────────────────────────────┤
│   Web App       │      Mobile App               │
│   (React/Next)  │   (React Native/Flutter)      │
└────────┬────────┴──────────┬────────────────────┘
         │                   │
         └───────────┬───────┘
                     │
         ┌───────────▼──────────────┐
         │      API REST/GraphQL     │
         │      (Node.js/Express)    │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │   Serviços e Integrações │
         ├──────────────────────────┤
         │ • Banco de Dados         │
         │ • Gateway de Pagamento   │
         │ • Serviço de Email       │
         │ • Gerador de QR Code     │
         │ • Armazenamento (S3)     │
         └──────────────────────────┘
```

---

## Tecnologias Utilizadas

### Frontend Web
- **Framework**: React 18+ ou Next.js 14+
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Gerenciamento de Estado**: React Context API / Zustand / Redux
- **Roteamento**: React Router / Next.js Router
- **Requisições HTTP**: Axios / Fetch API
- **Ícones**: Lucide React

### Mobile
- **Framework**: React Native ou Flutter
- **Linguagem**: TypeScript (React Native) / Dart (Flutter)
- **Navegação**: React Navigation / Flutter Navigator
- **Estado**: Redux / MobX / Provider
- **Camera/QR**: react-native-camera / qr_flutter

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js / NestJS / Fastify
- **Banco de Dados**: PostgreSQL / MongoDB
- **ORM**: Prisma / TypeORM / Mongoose
- **Autenticação**: JWT / OAuth 2.0
- **Cache**: Redis

### Integrações
- **Pagamentos**: Stripe / Mercado Pago / PagSeguro
- **Email**: SendGrid / AWS SES / Resend
- **Storage**: AWS S3 / Cloudinary
- **Monitoring**: Sentry / LogRocket

---

## Documentação Web

### Estrutura de Páginas

#### 1. Página Inicial (Home)
**Rota**: `/`

**Componentes**:
- Header com logo e menu de navegação
- Hero section com busca de eventos
- Grid de eventos em destaque
- Categorias de eventos
- Footer com links e informações

**Funcionalidades**:
- Busca por nome, data ou local
- Filtros por categoria, preço, data
- Ordenação (relevância, data, preço)

```typescript
// Exemplo de estrutura
interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  image: string;
  category: string;
  tickets: Ticket[];
}

interface Ticket {
  id: string;
  name: string;
  price: number;
  available: number;
  description?: string;
}
```

#### 2. Detalhes do Evento
**Rota**: `/event/:id`

**Componentes**:
- Galeria de imagens do evento
- Informações detalhadas (data, local, descrição)
- Mapa de localização
- Seletor de ingressos
- Botão de adicionar ao carrinho
- Seção de avaliações

**Dados exibidos**:
- Nome do evento
- Data e horário
- Local com mapa interativo
- Descrição completa
- Lineup (se aplicável)
- Tipos de ingresso com preços
- Política de cancelamento

#### 3. Carrinho de Compras
**Rota**: `/cart`

**Funcionalidades**:
- Listagem de itens no carrinho
- Alteração de quantidade
- Remoção de itens
- Cálculo de total
- Aplicação de cupons de desconto
- Resumo do pedido

**Estado do Carrinho**:
```typescript
interface CartItem {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  ticketType: string;
  price: number;
  quantity: number;
  ticketId: string;
}

interface Cart {
  items: CartItem[];
  total: number;
  discount: number;
  coupon?: string;
}
```

#### 4. Checkout
**Rota**: `/checkout`

**Etapas**:
1. **Dados Pessoais**
    - Nome completo
    - Email
    - CPF/Documento
    - Telefone

2. **Método de Pagamento**
    - Cartão de crédito
    - Cartão de débito
    - PIX
    - Boleto

3. **Revisão e Confirmação**
    - Resumo do pedido
    - Termos e condições
    - Confirmação final

**Validações**:
- Campos obrigatórios
- Formato de email
- Validação de CPF
- Validação de cartão (Luhn algorithm)
- Verificação de disponibilidade de ingressos

#### 5. Confirmação de Pedido
**Rota**: `/order/:orderId`

**Informações**:
- Número do pedido
- Status do pagamento
- Detalhes dos ingressos
- QR Codes para cada ingresso
- Botão para download em PDF
- Instruções para o dia do evento

#### 6. Meus Ingressos
**Rota**: `/my-tickets`

**Funcionalidades**:
- Lista de todos os ingressos comprados
- Filtros (próximos eventos, passados)
- Visualização de QR Code
- Download individual ou em lote
- Transferência de ingressos
- Solicitação de reembolso

#### 7. Painel Administrativo
**Rota**: `/admin`

**Seções**:
- Dashboard com métricas
- Gerenciamento de eventos
- Gerenciamento de ingressos
- Relatórios de vendas
- Check-in de ingressos
- Gerenciamento de usuários

### Responsividade

**Breakpoints**:
```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

**Adaptações**:
- Menu hamburger em mobile
- Grid responsivo (1 coluna mobile, 2-3 colunas desktop)
- Formulários adaptados para touch
- Imagens otimizadas por tamanho de tela

### Performance

**Otimizações**:
- Lazy loading de imagens
- Code splitting por rota
- Caching de dados estáticos
- Compressão de assets
- CDN para assets estáticos
- Service Workers para PWA

---

## Documentação Mobile

### Plataformas Suportadas
- iOS 13.0+
- Android 8.0+ (API Level 26+)

### Estrutura de Telas

#### 1. Splash Screen
- Logo animado
- Carregamento inicial de dados
- Verificação de autenticação

#### 2. Tela de Login/Cadastro
**Componentes**:
- Formulário de login
- Opções de login social (Google, Facebook, Apple)
- Link para cadastro
- Recuperação de senha

**Navegação**: `Auth.Login`

#### 3. Home (Tab Navigator)
**Tabs**:
- Eventos
- Buscar
- Meus Ingressos
- Perfil

**Tela de Eventos**:
- Lista de eventos em destaque
- Categorias horizontais
- Eventos próximos
- Pull to refresh

#### 4. Detalhes do Evento
**Navegação**: `EventStack.EventDetail`

**Recursos Mobile-Specific**:
- Swipe entre imagens
- Adicionar ao calendário
- Compartilhar evento
- Direções no mapa (integração com GPS)
- Notificações de lembrete

#### 5. Carrinho
**Navegação**: `CartStack.Cart`

**Funcionalidades**:
- Swipe para remover item
- Haptic feedback
- Animações de adição/remoção

#### 6. Checkout Mobile
**Navegação**: `CheckoutStack.Checkout`

**Recursos**:
- Auto-preenchimento de dados salvos
- Scan de cartão com câmera
- Pagamento via carteira digital (Apple Pay, Google Pay)
- PIX com QR Code

#### 7. Meus Ingressos
**Navegação**: `TicketsStack.MyTickets`

**Funcionalidades**:
- QR Code em tela cheia
- Ajuste de brilho automático
- Modo offline (QR salvos localmente)
- Wallet integration (Apple Wallet, Google Pay)

#### 8. Scanner (Organizadores)
**Navegação**: `ScannerStack.Scanner`

**Recursos**:
- Câmera com detecção de QR Code
- Validação em tempo real
- Modo offline com sincronização posterior
- Histórico de check-ins
- Estatísticas de entrada

### Permissões Necessárias

**iOS (Info.plist)**:
```xml
<key>NSCameraUsageDescription</key>
<string>Necessário para escanear QR Codes dos ingressos</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Para mostrar eventos próximos a você</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Para salvar seus ingressos na galeria</string>
```

**Android (AndroidManifest.xml)**:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Navegação

#### Stack Navigation (React Native)
```typescript
type RootStackParamList = {
  Home: undefined;
  EventDetail: { eventId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  MyTickets: undefined;
  TicketDetail: { ticketId: string };
  Scanner: undefined;
};
```

### Estado Global (Redux/MobX)

```typescript
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  events: {
    featured: Event[];
    categories: Category[];
    loading: boolean;
  };
  cart: {
    items: CartItem[];
    total: number;
  };
  tickets: {
    myTickets: Ticket[];
    loading: boolean;
  };
}
```

### Recursos Nativos

#### 1. Push Notifications
**Eventos**:
- Confirmação de compra
- Lembrete de evento (24h antes)
- Alterações no evento
- Promoções e ofertas

**Implementação**:
```typescript
// React Native - Firebase Cloud Messaging
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}
```

#### 2. Câmera para QR Code
```typescript
// React Native Camera
import { RNCamera } from 'react-native-camera';

<RNCamera
  style={styles.camera}
  type={RNCamera.Constants.Type.back}
  onBarCodeRead={onQRCodeScanned}
  barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
/>
```

#### 3. Armazenamento Local
```typescript
// AsyncStorage / MMKV
import AsyncStorage from '@react-native-async-storage/async-storage';

// Salvar tickets offline
await AsyncStorage.setItem('tickets', JSON.stringify(tickets));

// Recuperar tickets
const tickets = await AsyncStorage.getItem('tickets');
```

#### 4. Deep Links
**Configuração**:
```typescript
// Linking configuration
const linking = {
  prefixes: ['Lumera://', 'https://Lumera.com'],
  config: {
    screens: {
      EventDetail: 'event/:id',
      OrderConfirmation: 'order/:orderId',
    },
  },
};
```

### Design System Mobile

**Componentes Reutilizáveis**:
- Button (primary, secondary, outline)
- Card (event, ticket)
- Input (text, password, search)
- Select/Picker
- DatePicker
- Modal/BottomSheet
- Loading/Skeleton
- Toast/Snackbar

**Paleta de Cores**:
```typescript
const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
};
```

**Tipografia**:
```typescript
const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
  small: { fontSize: 12, fontWeight: 'normal' },
};
```

### Animações

**Bibliotecas**:
- React Native Reanimated
- React Native Gesture Handler
- Lottie (animações complexas)

**Exemplos**:
```typescript
// Fade in animation
const fadeAnim = useRef(new Animated.Value(0)).current;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();
```

---

## API e Backend

### Endpoints Principais

#### Autenticação
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

#### Eventos
```
GET    /api/events
GET    /api/events/:id
GET    /api/events/featured
GET    /api/events/search?q=query
GET    /api/events/category/:category
POST   /api/events (admin)
PUT    /api/events/:id (admin)
DELETE /api/events/:id (admin)
```

#### Ingressos
```
GET    /api/tickets/event/:eventId
GET    /api/tickets/:id
POST   /api/tickets/reserve
POST   /api/tickets/release
```

#### Carrinho
```
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update/:itemId
DELETE /api/cart/remove/:itemId
DELETE /api/cart/clear
POST   /api/cart/apply-coupon
```

#### Pedidos
```
POST   /api/orders/create
GET    /api/orders/:id
GET    /api/orders/user/:userId
POST   /api/orders/:id/cancel
GET    /api/orders/:id/tickets
```

#### Pagamentos
```
POST   /api/payments/process
POST   /api/payments/pix/generate
GET    /api/payments/:id/status
POST   /api/payments/webhook
```

#### Check-in
```
POST   /api/checkin/validate
GET    /api/checkin/event/:eventId/stats
GET    /api/checkin/ticket/:ticketId
```

### Modelo de Dados

#### User
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  cpf: string;
  phone: string;
  role: 'user' | 'admin' | 'organizer';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Event
```typescript
interface Event {
  id: string;
  name: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  images: string[];
  organizerId: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Ticket
```typescript
interface Ticket {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  salesStart: Date;
  salesEnd: Date;
  features?: string[];
}
```

#### Order
```typescript
interface Order {
  id: string;
  userId: string;
  eventId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
}

interface OrderItem {
  ticketId: string;
  quantity: number;
  price: number;
  qrCodes: string[];
}
```

### Autenticação JWT

**Token Structure**:
```typescript
interface JWTPayload {
  sub: string; // userId
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

**Headers**:
```
Authorization: Bearer <token>
```

### Webhooks

#### Payment Gateway
```typescript
POST /api/webhooks/payment

{
  "event": "payment.approved",
  "orderId": "uuid",
  "paymentId": "external-id",
  "status": "approved",
  "paidAmount": 150.00
}
```

---

## Fluxos de Usuário

### 1. Compra de Ingresso

```
Usuário → Navega eventos
       → Seleciona evento
       → Escolhe tipo de ingresso
       → Define quantidade
       → Adiciona ao carrinho
       → Revisa carrinho
       → Prossegue para checkout
       → Preenche dados pessoais
       → Escolhe forma de pagamento
       → Confirma pagamento
       → Recebe confirmação
       → Recebe email com QR Codes
```

### 2. Check-in no Evento

```
Usuário → Abre app
       → Vai em "Meus Ingressos"
       → Seleciona ingresso do evento
       → Mostra QR Code

Organizador → Abre scanner
            → Escaneia QR Code
            → Sistema valida
            → Confirma entrada ou erro
            → Atualiza status do ingresso
```

### 3. Transferência de Ingresso

```
Dono → Acessa ingresso
     → Clica em "Transferir"
     → Insere email/telefone do destinatário
     → Confirma transferência
     → Sistema envia notificação

Destinatário → Recebe notificação
             → Aceita transferência
             → Ingresso aparece em sua conta
```

---

## Segurança

### Boas Práticas

1. **Senhas**
    - Hash com bcrypt (salt rounds: 10+)
    - Política de senha forte
    - Rate limiting em login

2. **Tokens**
    - JWT com expiração curta (15min)
    - Refresh tokens com expiração longa (7 dias)
    - Revogação de tokens

3. **Pagamentos**
    - Nunca armazene dados completos de cartão
    - Use tokenização do gateway
    - Implemente 3D Secure
    - Logs de todas transações

4. **QR Codes**
    - Códigos únicos por ingresso
    - Criptografia dos dados
    - Validação única (não pode ser usado 2x)
    - Timestamp de geração

5. **API**
    - HTTPS obrigatório
    - Rate limiting
    - CORS configurado
    - Validação de inputs
    - Proteção contra SQL injection
    - Sanitização de dados

6. **Mobile**
    - SSL Pinning
    - Ofuscação de código
    - Detecção de root/jailbreak
    - Armazenamento seguro (Keychain/KeyStore)

---

## Guia de Instalação

### Web Application

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Lumera-web.git
cd Lumera-web

# Instale as dependências
npm install
# ou
yarn install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Execute em desenvolvimento
npm run dev
# ou
yarn dev

# Build para produção
npm run build
npm start
```

### Mobile Application

**React Native**:
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Lumera-mobile.git
cd Lumera-mobile

# Instale as dependências
npm install
# ou
yarn install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

**Flutter**:
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Lumera-flutter.git
cd Lumera-flutter

# Instale as dependências
flutter pub get

# Execute
flutter run
```

### Backend

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Lumera-api.git
cd Lumera-api

# Instale as dependências
npm install

# Configure o banco de dados
cp .env.example .env
# Edite com suas credenciais

# Execute migrations
npm run migrate

# Inicie o servidor
npm run dev
```

---

## Deployment

### Web (Vercel/Netlify)

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### Mobile

**iOS (App Store)**:
1. Configure certificados no Apple Developer
2. Gere build de produção
3. Upload via Xcode ou Transporter
4. Submeta para revisão

**Android (Google Play)**:
1. Gere signed APK/AAB
2. Upload no Google Play Console
3. Preencha informações da store
4. Submeta para revisão

### Backend (AWS/DigitalOcean)

```bash
# Docker
docker build -t Lumera-api .
docker run -p 3000:3000 Lumera-api

# Docker Compose
docker-compose up -d
```

---

## Monitoramento e Analytics

### Métricas Importantes
- Taxa de conversão (visitante → comprador)
- Ticket médio por pedido
- Taxa de abandono de carrinho
- Tempo médio de checkout
- Eventos mais populares
- Horários de pico de acesso

### Ferramentas
- **Analytics**: Google Analytics, Mixpanel
- **Errors**: Sentry
- **Performance**: New Relic, DataDog
- **Logs**: ELK Stack, CloudWatch

---

## Suporte e Manutenção

### Contato
- Email: suporte@Lumera.com
- Telefone: +55 (11) 1234-5678
- Chat: Em horário comercial

### SLA
- Uptime garantido: 99.9%
- Tempo de resposta: < 2 horas
- Resolução crítica: < 4 horas

---

**Versão**: 1.0.0  
**Última atualização**: Outubro 2025  
**Autor**: Equipe Lumera