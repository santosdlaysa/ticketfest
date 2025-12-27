import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lumera API',
      version: '1.0.0',
      description: `
# Lumera - Plataforma de Venda de Ingressos

API RESTful para gerenciamento de eventos, venda de ingressos e check-in.

## Autenticação

A API usa autenticação JWT. Para endpoints protegidos, inclua o header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Rate Limiting

- 100 requisições por 15 minutos por IP
- Endpoints de autenticação tem limites mais restritos

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 429 | Rate limit excedido |
| 500 | Erro interno |
      `,
      contact: {
        name: 'Suporte Lumera',
        email: 'suporte@lumera.com',
      },
    },
    servers: [
      {
        url: env.API_URL || 'http://localhost:3000',
        description: env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no login',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            cpf: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'ORGANIZER'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@email.com' },
            password: { type: 'string', minLength: 6, example: '123456' },
            name: { type: 'string', example: 'João Silva' },
            cpf: { type: 'string', example: '123.456.789-00' },
            phone: { type: 'string', example: '(11) 99999-9999' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            cpf: { type: 'string' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 6 },
          },
        },

        // Event schemas
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            location: { type: 'string' },
            address: { type: 'string' },
            latitude: { type: 'number', nullable: true },
            longitude: { type: 'number', nullable: true },
            images: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'] },
            organizerId: { type: 'string', format: 'uuid' },
            tickets: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } },
          },
        },
        CreateEventRequest: {
          type: 'object',
          required: ['name', 'description', 'date', 'location', 'address', 'category'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            address: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            images: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
          },
        },

        // Ticket schemas
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            quantity: { type: 'integer' },
            sold: { type: 'integer' },
            salesStart: { type: 'string', format: 'date-time' },
            salesEnd: { type: 'string', format: 'date-time' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },

        // Cart schemas
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            subtotal: { type: 'number' },
            total: { type: 'number' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            ticket: { $ref: '#/components/schemas/Ticket' },
          },
        },
        AddToCartRequest: {
          type: 'object',
          required: ['ticketId', 'quantity'],
          properties: {
            ticketId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },

        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            subtotal: { type: 'number' },
            discount: { type: 'number' },
            total: { type: 'number' },
            paymentMethod: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO'] },
            paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
            createdAt: { type: 'string', format: 'date-time' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
            ticketInstances: { type: 'array', items: { $ref: '#/components/schemas/TicketInstance' } },
          },
        },
        TicketInstance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            qrCode: { type: 'string', description: 'QR Code image as Base64 Data URL' },
            checkedIn: { type: 'boolean' },
            checkedInAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['items', 'paymentMethod'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ticketId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer' },
                },
              },
            },
            paymentMethod: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO'] },
            couponCode: { type: 'string' },
            cardToken: { type: 'string', description: 'Token do cartão (Pagar.me)' },
            installments: { type: 'integer', minimum: 1, maximum: 12 },
          },
        },

        // Check-in schemas
        CheckinRequest: {
          type: 'object',
          required: ['qrCodeData'],
          properties: {
            qrCodeData: { type: 'string', description: 'Dados criptografados do QR Code' },
            eventId: { type: 'string', format: 'uuid' },
          },
        },
        CheckinResponse: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            alreadyCheckedIn: { type: 'boolean' },
            checkedInAt: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
            ticket: {
              type: 'object',
              properties: {
                eventName: { type: 'string' },
                ticketName: { type: 'string' },
                holderName: { type: 'string' },
              },
            },
          },
        },

        // Payout schemas
        Payout: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            fee: { type: 'number' },
            netAmount: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
            payoutMethod: { type: 'string', enum: ['BANK_TRANSFER', 'PIX'] },
            requestedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Common schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso ausente ou inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Erro de validação',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticação e gerenciamento de usuários' },
      { name: 'Events', description: 'Gerenciamento de eventos' },
      { name: 'Tickets', description: 'Gerenciamento de ingressos' },
      { name: 'Cart', description: 'Carrinho de compras' },
      { name: 'Orders', description: 'Pedidos e pagamentos' },
      { name: 'Check-in', description: 'Validação de ingressos' },
      { name: 'Payouts', description: 'Repasses para organizadores' },
      { name: 'Admin', description: 'Operações administrativas' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
