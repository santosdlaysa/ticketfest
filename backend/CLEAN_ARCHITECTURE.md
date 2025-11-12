# Clean Architecture - Backend TicketFest

## Estrutura do Projeto

Este projeto segue os princípios da **Clean Architecture**, organizando o código em camadas bem definidas com responsabilidades claras e baixo acoplamento.

```
src/
├── domain/                    # Camada de Domínio (Regras de Negócio)
│   ├── entities/              # Entidades do domínio
│   │   ├── User.ts
│   │   ├── Event.ts
│   │   ├── Ticket.ts
│   │   ├── Order.ts
│   │   └── Coupon.ts
│   └── repositories/          # Interfaces dos repositórios
│       ├── IUserRepository.ts
│       ├── IEventRepository.ts
│       ├── ITicketRepository.ts
│       ├── IOrderRepository.ts
│       └── ICouponRepository.ts
│
├── application/               # Camada de Aplicação (Casos de Uso)
│   ├── use-cases/             # Casos de uso da aplicação
│   │   ├── order/
│   │   │   ├── CreateOrderUseCase.ts
│   │   │   ├── GetOrderByIdUseCase.ts
│   │   │   ├── GetUserOrdersUseCase.ts
│   │   │   ├── ConfirmPaymentUseCase.ts
│   │   │   └── CancelOrderUseCase.ts
│   │   ├── event/
│   │   ├── ticket/
│   │   ├── auth/
│   │   └── cart/
│   └── dtos/                  # Data Transfer Objects
│       ├── OrderDTO.ts
│       ├── EventDTO.ts
│       └── UserDTO.ts
│
├── infrastructure/            # Camada de Infraestrutura (Detalhes de Implementação)
│   ├── database/
│   │   ├── prisma/
│   │   │   └── PrismaClient.ts
│   │   └── repositories/      # Implementações dos repositórios
│   │       ├── PrismaUserRepository.ts
│   │       ├── PrismaEventRepository.ts
│   │       ├── PrismaTicketRepository.ts
│   │       ├── PrismaOrderRepository.ts
│   │       └── PrismaCouponRepository.ts
│   ├── services/              # Serviços externos (Email, Payment, QRCode)
│   │   ├── QRCodeService.ts
│   │   ├── PaymentService.ts
│   │   └── EmailService.ts
│   └── factories/             # Factories para injeção de dependências
│       ├── OrderUseCaseFactory.ts
│       ├── EventUseCaseFactory.ts
│       └── AuthUseCaseFactory.ts
│
├── interfaces/                # Camada de Interface (Controllers, Routes)
│   └── http/
│       ├── controllers/       # Controllers HTTP
│       │   ├── OrderController.ts
│       │   ├── EventController.ts
│       │   └── AuthController.ts
│       ├── routes/            # Definição de rotas
│       │   ├── order.routes.ts
│       │   ├── event.routes.ts
│       │   └── index.ts
│       └── middlewares/       # Middlewares HTTP
│           ├── auth.ts
│           └── errorHandler.ts
│
├── config/                    # Configurações
│   ├── database.ts
│   └── env.ts
│
├── utils/                     # Utilitários
│   ├── jwt.ts
│   ├── validation.ts
│   └── slugify.ts
│
├── app.ts                     # Configuração do Express
└── server.ts                  # Entry point da aplicação
```

## Camadas da Arquitetura

### 1. Domain (Domínio)

**Responsabilidade:** Contém as regras de negócio puras da aplicação.

- **Entidades:** Objetos com identidade e lógica de negócio encapsulada
  - Não dependem de frameworks ou bibliotecas externas
  - Contêm validações e regras de negócio
  - Exemplo: `Order.confirmPayment()`, `Ticket.canSell()`

- **Interfaces de Repositório:** Contratos que definem como acessar dados
  - Define o que é necessário, não como é implementado
  - Permite inversão de dependência

### 2. Application (Aplicação)

**Responsabilidade:** Orquestra o fluxo de dados e coordena as entidades do domínio.

- **Use Cases:** Casos de uso específicos da aplicação
  - Um use case por ação de negócio
  - Orquestra entidades e repositórios
  - Não conhece detalhes de infraestrutura
  - Exemplo: `CreateOrderUseCase`, `ConfirmPaymentUseCase`

- **DTOs:** Objetos de transferência de dados
  - Define a estrutura de entrada/saída dos use cases
  - Valida dados de entrada

### 3. Infrastructure (Infraestrutura)

**Responsabilidade:** Implementa os detalhes técnicos e integrações externas.

- **Repositories:** Implementações concretas usando Prisma
  - Implementa as interfaces definidas no domínio
  - Lida com persistência de dados
  - Converte entre entidades de domínio e modelos do banco

- **Services:** Serviços externos (Email, Payment, QRCode)
  - Implementa integrações com APIs externas
  - Pode implementar interfaces definidas nos use cases

- **Factories:** Cria instâncias dos use cases com dependências
  - Resolve injeção de dependências
  - Centraliza criação de objetos complexos

### 4. Interfaces (Interfaces)

**Responsabilidade:** Adaptadores para o mundo externo (HTTP, CLI, etc).

- **Controllers:** Adaptam requisições HTTP para use cases
  - Recebe dados da requisição
  - Chama o use case apropriado
  - Formata resposta HTTP

- **Routes:** Define rotas da API
  - Mapeia URLs para controllers
  - Aplica middlewares

- **Middlewares:** Lógica transversal (auth, logging, error handling)

## Fluxo de Dados

```
Request → Route → Controller → Use Case → Repository → Database
                                    ↓
                                Entities
                                    ↓
Response ← Controller ← Use Case ← Repository ← Database
```

## Princípios Seguidos

### 1. Dependency Inversion (Inversão de Dependência)
- Camadas internas não dependem das externas
- Use cases dependem de interfaces, não de implementações concretas

### 2. Single Responsibility (Responsabilidade Única)
- Cada classe tem uma única razão para mudar
- Use cases focados em uma única ação de negócio

### 3. Open/Closed (Aberto/Fechado)
- Fácil adicionar novos use cases sem modificar existentes
- Fácil trocar implementações (ex: trocar Prisma por outro ORM)

### 4. Interface Segregation (Segregação de Interface)
- Interfaces pequenas e focadas
- Cada repositório define apenas os métodos necessários

## Benefícios

1. **Testabilidade:** Fácil criar mocks e testar isoladamente
2. **Manutenibilidade:** Código organizado e fácil de entender
3. **Flexibilidade:** Fácil trocar implementações (banco, APIs externas)
4. **Escalabilidade:** Fácil adicionar novos recursos
5. **Independência de Frameworks:** Lógica de negócio não depende de Express, Prisma, etc.

## Como Adicionar um Novo Recurso

### Exemplo: Adicionar funcionalidade de Reviews

1. **Domain:**
   ```typescript
   // domain/entities/Review.ts
   export class Review { ... }

   // domain/repositories/IReviewRepository.ts
   export interface IReviewRepository { ... }
   ```

2. **Application:**
   ```typescript
   // application/use-cases/review/CreateReviewUseCase.ts
   export class CreateReviewUseCase { ... }

   // application/dtos/ReviewDTO.ts
   export interface CreateReviewDTO { ... }
   ```

3. **Infrastructure:**
   ```typescript
   // infrastructure/database/repositories/PrismaReviewRepository.ts
   export class PrismaReviewRepository implements IReviewRepository { ... }

   // infrastructure/factories/ReviewUseCaseFactory.ts
   export class ReviewUseCaseFactory { ... }
   ```

4. **Interfaces:**
   ```typescript
   // interfaces/http/controllers/ReviewController.ts
   export class ReviewController { ... }

   // interfaces/http/routes/review.routes.ts
   const router = Router();
   ```

## Status da Migração

### ✅ Concluído
- [x] Estrutura de pastas
- [x] Entidades de domínio (User, Event, Ticket, Order, Coupon)
- [x] Interfaces de repositório
- [x] Use cases de Order
- [x] Repositórios Prisma (Order, Ticket, Coupon)
- [x] Factory de Order
- [x] Controller e Routes de Order

### 🚧 Em Progresso
- [ ] Use cases de Event, Ticket, Auth, Cart, Checkin
- [ ] Repositórios restantes
- [ ] Factories restantes
- [ ] Controllers restantes

### 📋 Pendente
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Documentação de API (Swagger)

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build
npm run build

# Rodar testes
npm test

# Migrations do Prisma
npm run prisma:migrate:dev
```

## Referências

- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
