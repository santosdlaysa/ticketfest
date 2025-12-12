# 🎫 Lumera - Sistema Completo de Venda de Ingressos

Sistema completo de venda de ingressos para eventos e festas com frontend web, aplicativo mobile e backend API.

## 📚 Documentação Importante

### 🚨 Começando Agora?
- **[TODO-URGENTE.md](TODO-URGENTE.md)** - Checklist rápido do que fazer AGORA
- **[PROBLEMAS-E-SOLUCOES.md](PROBLEMAS-E-SOLUCOES.md)** - Guia completo de problemas e correções

### 📖 Guias Completos
- **[START.md](START.md)** - Guia passo a passo para iniciar o sistema
- **[CHECKOUT-SETUP.md](CHECKOUT-SETUP.md)** - Configurar checkout e Stripe
- **[RESUMO-EXECUTIVO.md](RESUMO-EXECUTIVO.md)** - Visão geral para não-técnicos

### 📊 Status e Progresso
- **[CHECKLIST.md](CHECKLIST.md)** - Checklist detalhado de desenvolvimento
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de mudanças
- **[PROJETO-STATUS.md](PROJETO-STATUS.md)** - Status técnico completo

## 📁 Estrutura do Projeto

```
Lumera/
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

- ✅ **Backend API**: 100% Completo e Funcional
- ✅ **Frontend Web**: 95% Completo (Admin + Usuario completo!)
- ✅ **Mobile App**: 95% Completo (React Native + Scanner QR)
- ⚠️ **Configuracao**: Requer PostgreSQL e Pagar.me

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
   createdb Lumera
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
| admin@Lumera.com | password123 | Admin |
| organizer@Lumera.com | password123 | Organizador |
| user@Lumera.com | password123 | Usuário |

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

### Fase 1 (Concluida) ✅
- [x] Backend API completo
- [x] Autenticacao e autorizacao
- [x] CRUD de eventos e ingressos
- [x] Sistema de carrinho
- [x] Pagamentos (Pagar.me - PIX e Cartao)
- [x] QR codes e check-in
- [x] Emails transacionais

### Fase 2 (Concluida) ✅
- [x] Frontend Web (Next.js)
- [x] Paginas de eventos
- [x] Carrinho funcional
- [x] Autenticacao e registro
- [x] Layout responsivo
- [x] Checkout completo com Pagar.me
- [x] Suporte PIX e Cartao
- [x] Pagina "Meus Ingressos" com QR Code
- [x] Pagina "Meus Pedidos"
- [x] Email de lembrete (24h e 2h antes)

### Fase 3 (Concluida) ✅
- [x] Aplicativo Mobile (React Native)
- [x] Scanner de QR codes
- [x] Dashboard de vendas em tempo real
- [x] Exportar lista de participantes (CSV)

### Fase 4 (85% Concluida) 🟢 **NOVA!**
- [x] Lista de espera para eventos esgotados
- [x] Historico de eventos frequentados
- [x] Favoritos/eventos salvos
- [x] Busca avancada com filtros
- [x] Relatorios financeiros detalhados
- [x] Duplicar evento (template)
- [x] Cancelamento de evento com reembolso
- [x] Moderacao de eventos
- [x] Gestao de usuarios (admin)
- [x] Painel de monitoramento da plataforma
- [ ] Email marketing
- [ ] Gestao de equipe

### Fase 5 (Planejada)
- [ ] Testes automatizados
- [ ] Cache com Redis
- [ ] 2FA/MFA
- [ ] Analytics demografico

## 💬 Suporte

- 📧 Email: suporte@Lumera.com
- 📖 Docs: Ver arquivos README em cada pasta
- 🐛 Issues: GitHub Issues

## 🏆 Créditos

Desenvolvido por Lumera Team

---

## ⚡ Quick Start

**Precisa configurar PostgreSQL?** Veja [TODO-URGENTE.md](TODO-URGENTE.md)

```bash
# 1. Setup Database
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed

# 2. Start Backend
npm run dev

# 3. Start Frontend (novo terminal)
cd ../web
npm install
npm run dev

# 4. Acessar
# http://localhost:3001
# Login: user@Lumera.com / password123
```

---

**Status**: 🟢 Backend 100% | 🟢 Frontend 95% | 🟢 Mobile 95%

**Versao Atual:** 1.2.0 | **Data:** 12 de Dezembro de 2025
