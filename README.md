# 🎫 TicketFest - Sistema Completo de Venda de Ingressos

Sistema completo de venda de ingressos para eventos e festas com frontend web, aplicativo mobile e backend API.

## 📁 Estrutura do Projeto

```
ticketfest/
├── backend/              # API REST (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── config/
│   ├── prisma/
│   │   └── schema.prisma
│   └── README.md        # Documentação completa da API
├── web/                 # Frontend Web (Next.js/React)
│   └── (a ser implementado)
├── mobile/              # App Mobile (React Native/Flutter)
│   └── (a ser implementado)
└── doc.md              # Documentação completa do projeto
```

## 🚀 Status do Projeto

- ✅ **Backend API**: Implementado e funcional
- ✅ **Frontend Web**: Implementado e funcional
- ⏳ **Mobile App**: Próxima etapa

## 🎯 Funcionalidades Implementadas (Backend)

### Autenticação e Usuários
- ✅ Registro de usuários
- ✅ Login com JWT
- ✅ Refresh tokens
- ✅ Perfis de usuário (USER, ORGANIZER, ADMIN)
- ✅ Gerenciamento de sessões

### Eventos
- ✅ CRUD completo de eventos
- ✅ Busca e filtros (categoria, localização, data)
- ✅ Eventos em destaque
- ✅ Sistema de slugs para URLs amigáveis
- ✅ Suporte a múltiplas imagens
- ✅ Geolocalização (latitude/longitude)

### Ingressos
- ✅ Criação de tipos de ingresso
- ✅ Controle de quantidade e disponibilidade
- ✅ Período de vendas configurável
- ✅ Precificação por tipo
- ✅ Features/benefícios por ingresso

### Carrinho de Compras
- ✅ Adicionar/remover itens
- ✅ Atualizar quantidades
- ✅ Suporte a sessões anônimas
- ✅ Persistência para usuários logados
- ✅ Validação de disponibilidade

### Pedidos e Pagamentos
- ✅ Criação de pedidos
- ✅ Integração com Stripe (cartão de crédito/débito)
- ✅ Suporte a PIX (mock)
- ✅ Suporte a Boleto (mock)
- ✅ Sistema de cupons de desconto
- ✅ Confirmação de pagamento
- ✅ Cancelamento e reembolso

### QR Codes e Ingressos
- ✅ Geração automática de QR codes únicos
- ✅ Criptografia de dados dos QR codes
- ✅ Validação de autenticidade
- ✅ Envio por email

### Check-in
- ✅ Validação de QR codes
- ✅ Prevenção de uso duplicado
- ✅ Estatísticas de check-in
- ✅ Histórico de entradas
- ✅ Dashboard para organizadores

### Emails
- ✅ Confirmação de pedido
- ✅ Envio de ingressos com QR codes
- ✅ Templates HTML responsivos

### Segurança
- ✅ Autenticação JWT
- ✅ Rate limiting
- ✅ Helmet (security headers)
- ✅ CORS configurável
- ✅ Validação de entrada (Zod)
- ✅ Criptografia de dados sensíveis

## 🛠️ Tecnologias

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT
- **Pagamentos**: Stripe
- **Email**: Nodemailer
- **QR Code**: qrcode
- **Validação**: Zod

### Frontend Web (Planejado)
- Next.js 14+
- TypeScript
- Tailwind CSS
- React Query
- Zustand

### Mobile (Planejado)
- React Native ou Flutter
- TypeScript/Dart
- APIs nativas (câmera, notificações)

## 📖 Documentação

- **API Backend**: Ver `backend/README.md`
- **Guia Rápido**: Ver `backend/QUICKSTART.md`
- **Documentação Completa**: Ver `doc.md`

## 🚀 Como Começar

### Backend API

1. **Instalar PostgreSQL**
   ```bash
   # Criar banco de dados
   createdb ticketfest
   ```

2. **Configurar Backend**
   ```bash
   cd backend
   npm install
   npm run prisma:migrate
   npm run prisma:seed
   npm run dev
   ```

3. **Acessar**
   - API: http://localhost:3000
   - Prisma Studio: `npm run prisma:studio`

### Frontend Web

```bash
cd web
npm install
npm run dev
```

Acesse em: **http://localhost:3001**

### Mobile (Em breve)

```bash
cd mobile
npm install
npm run ios    # ou
npm run android
```

## 📚 Endpoints Principais

```
POST   /api/auth/register          # Registrar usuário
POST   /api/auth/login             # Login
GET    /api/events                 # Listar eventos
GET    /api/events/:id             # Detalhes do evento
POST   /api/cart/add               # Adicionar ao carrinho
POST   /api/orders                 # Criar pedido
POST   /api/orders/:id/confirm     # Confirmar pagamento
POST   /api/checkin/validate       # Validar ingresso
GET    /api/checkin/event/:id/stats # Estatísticas
```

Ver documentação completa em `backend/README.md`

## 👥 Usuários de Teste

Após rodar `npm run prisma:seed`:

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@ticketfest.com | password123 | Admin |
| organizer@ticketfest.com | password123 | Organizador |
| user@ticketfest.com | password123 | Usuário |

## 🔐 Segurança

⚠️ **IMPORTANTE**: Este projeto inclui chaves de exemplo no arquivo `.env`. **NUNCA use estas chaves em produção!**

Antes de fazer deploy:
1. Gere novos secrets JWT (min. 32 caracteres)
2. Configure variáveis de ambiente reais
3. Use HTTPS em produção
4. Configure CORS adequadamente
5. Revise permissões do banco de dados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Licença

MIT

## 🎯 Roadmap

### Fase 1 (Concluída) ✅
- [x] Backend API completo
- [x] Autenticação e autorização
- [x] CRUD de eventos e ingressos
- [x] Sistema de carrinho
- [x] Pagamentos (Stripe + mocks)
- [x] QR codes e check-in
- [x] Emails transacionais

### Fase 2 (Concluída) ✅
- [x] Frontend Web (Next.js)
- [x] Páginas de eventos
- [x] Carrinho funcional
- [x] Autenticação e registro
- [x] Layout responsivo
- [ ] Checkout completo (em andamento)
- [ ] Área do usuário completa (em andamento)

### Fase 3
- [ ] Aplicativo Mobile
- [ ] Scanner de QR codes
- [ ] Notificações push
- [ ] Wallet integration

### Fase 4
- [ ] Analytics e relatórios
- [ ] Sistema de avaliações
- [ ] Transferência de ingressos
- [ ] Upgrades de ingressos

## 💬 Suporte

- 📧 Email: suporte@ticketfest.com
- 📖 Docs: Ver arquivos README em cada pasta
- 🐛 Issues: GitHub Issues

## 🏆 Créditos

Desenvolvido por TicketFest Team

---

**Status**: 🟢 Backend Completo | 🟢 Frontend Web Funcional | 🟡 Mobile Planejado
