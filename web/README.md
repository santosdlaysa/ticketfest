# Lumera - Frontend Web

Aplicação web frontend construída com Next.js, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 14** (Pages Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (gerenciamento de estado)
- **React Hook Form** (formulários)
- **Axios** (requisições HTTP)
- **React Hot Toast** (notificações)
- **date-fns** (manipulação de datas)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

O aplicativo estará disponível em: **http://localhost:3002**

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
NEXT_PUBLIC_SITE_NAME=Lumera
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

## 📂 Estrutura do Projeto

```
web/
├── src/
│   ├── components/
│   │   ├── common/          # Componentes reutilizáveis (Button, Input)
│   │   ├── layout/          # Layout (Header, Footer)
│   │   ├── event/           # Componentes de eventos
│   │   ├── cart/            # Componentes do carrinho
│   │   └── auth/            # Componentes de autenticação
│   ├── pages/
│   │   ├── index.tsx        # Home
│   │   ├── events/          # Listagem e detalhes de eventos
│   │   ├── cart.tsx         # Carrinho
│   │   ├── checkout.tsx     # Checkout
│   │   ├── auth/            # Login e registro
│   │   └── user/            # Área do usuário
│   ├── contexts/            # Zustand stores (Auth, Cart)
│   ├── services/            # API client
│   ├── lib/                 # Configuração Axios
│   ├── types/               # TypeScript types
│   ├── styles/              # CSS global
│   └── hooks/               # Custom hooks
├── public/                  # Assets estáticos
└── package.json
```

## 🎨 Páginas Implementadas

### Públicas
- ✅ **Home** (`/`) - Página inicial com eventos em destaque
- ✅ **Eventos** (`/events`) - Listagem de todos os eventos
- ✅ **Detalhes do Evento** (`/events/[slug]`) - Informações e compra de ingressos
- ✅ **Login** (`/auth/login`)
- ✅ **Registro** (`/auth/register`)

### Privadas (requer autenticação)
- ✅ **Carrinho** (`/cart`) - Visualizar e gerenciar carrinho
- 🔄 **Checkout** (`/checkout`) - Finalizar compra
- 🔄 **Meus Ingressos** (`/user/tickets`) - Ver ingressos comprados
- 🔄 **Meus Pedidos** (`/user/orders`) - Histórico de pedidos

## 🔐 Autenticação

A autenticação é gerenciada via Zustand com persistência no localStorage:

```typescript
import { useAuthStore } from '@/contexts/AuthContext';

// Em um componente
const { user, isAuthenticated, login, logout } = useAuthStore();
```

## 🛒 Carrinho

O carrinho suporta usuários autenticados e convidados:

```typescript
import { useCartStore } from '@/contexts/CartContext';

const { cart, addToCart, removeItem, clearCart } = useCartStore();
```

## 🎯 Funcionalidades

### Implementadas
- ✅ Navegação e layout responsivo
- ✅ Listagem de eventos com filtros e busca
- ✅ Detalhes do evento com seleção de ingressos
- ✅ Carrinho de compras persistente
- ✅ Sistema de autenticação (login/registro)
- ✅ Gerenciamento de estado global (Zustand)
- ✅ Integração completa com API backend
- ✅ Notificações toast para feedback do usuário
- ✅ Formulários com validação (React Hook Form)

### A Implementar
- 🔄 Checkout completo com pagamento
- 🔄 Visualização de QR codes dos ingressos
- 🔄 Área do usuário completa
- 🔄 Transferência de ingressos
- 🔄 Sistema de avaliações

## 🎨 Design System

### Cores
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Danger**: Red (#EF4444)

### Componentes
- **Button**: Primary, Secondary, Outline, Ghost
- **Input**: Com validação e mensagens de erro
- **Card**: Container reutilizável com sombra
- **Layout**: Header + Content + Footer

## 📱 Responsividade

Breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🧪 Desenvolvimento

```bash
# Executar em desenvolvimento
npm run dev

# Verificar tipos TypeScript
npm run type-check

# Lint
npm run lint
```

## 🚢 Deploy

### Vercel (Recomendado)
```bash
vercel --prod
```

### Build Manual
```bash
npm run build
npm start
```

## 🔗 Links Úteis

- **API Backend**: http://127.0.0.1:3001
- **Frontend**: http://localhost:3002
- **Documentação da API**: Ver `backend/README.md`

## 📝 Notas

- Certifique-se de que o backend está rodando antes de iniciar o frontend
- As imagens são carregadas de `images.unsplash.com` (configurado no `next.config.js`)
- A autenticação usa JWT com refresh token automático
- O carrinho persiste no localStorage

---

**Status**: 🟢 Funcional e Operacional

Desenvolvido com ❤️ pela equipe Lumera
