# ⚡ TODO URGENTE - TicketFest

**Status Atual:** Sistema 90% pronto - Precisa configuração + 2 páginas

---

## 🔴 BLOQUEADORES (Fazer AGORA)

### 1. PostgreSQL
**Status:** ❌ NÃO CONFIGURADO
**Tempo:** 15-30 min

```bash
# Verificar se está instalado
Get-Service -Name postgresql*

# Se não estiver:
# 1. Baixar: https://www.postgresql.org/download/windows/
# 2. Instalar versão 14+
# 3. Anotar senha do usuário postgres

# Criar banco
# Abrir pgAdmin ou psql
CREATE DATABASE ticketfest;

# Atualizar backend/.env linha 7:
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/ticketfest?schema=public"

# Rodar migrations
cd backend
npm run prisma:migrate
npm run prisma:seed
```

**✅ Pronto quando:** `npm run prisma:migrate` completar sem erros

---

### 2. Stripe (Opcional mas Recomendado)
**Status:** ⚠️ MOCK
**Tempo:** 10 min

```bash
# 1. Criar conta: https://dashboard.stripe.com/register
# 2. Copiar chave: https://dashboard.stripe.com/test/apikeys
# 3. Editar web/.env.local:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_AQUI
```

**✅ Pronto quando:** Chave começa com `pk_test_`

---

## 🟡 FUNCIONALIDADES FALTANDO (Fazer Esta Semana)

### 3. Página "Meus Ingressos"
**Status:** ❌ NÃO EXISTE
**Tempo:** 1-2 dias
**Prioridade:** ALTA

**Criar:** `web/src/pages/user/tickets.tsx`

**O que fazer:**
```typescript
// 1. Buscar pedidos do usuário
const orders = await ordersApi.getUserOrders();

// 2. Mostrar cada ingresso com:
// - QR Code (ticketInstance.qrCode)
// - Nome do evento
// - Data e local
// - Status (usado/não usado)

// 3. Botão download PDF (opcional)
```

**Endpoints já existem:** ✅
- `GET /api/orders` (lista pedidos)
- `GET /api/orders/:id` (detalhes com QR codes)

---

### 4. Página "Meus Pedidos"
**Status:** ❌ NÃO EXISTE
**Tempo:** 1 dia
**Prioridade:** MÉDIA

**Criar:** `web/src/pages/user/orders.tsx`

**O que fazer:**
- Listar todos os pedidos
- Mostrar status de pagamento
- Total gasto
- Link para ver detalhes

**Endpoints já existem:** ✅

---

## 🟢 DESEJÁVEL (Fazer Quando Sobrar Tempo)

### 5. Download PDF
**Status:** ❌ NÃO IMPLEMENTADO
**Tempo:** 4-6 horas
**Prioridade:** BAIXA

```bash
npm install jspdf
```

### 6. Painel Admin
**Status:** ❌ NÃO IMPLEMENTADO
**Tempo:** 3-4 dias
**Prioridade:** BAIXA

Backend já existe, só falta interface.

### 7. Upload de Imagens
**Status:** ❌ NÃO IMPLEMENTADO
**Tempo:** 2 dias
**Prioridade:** BAIXA

---

## 📋 CHECKLIST DE HOJE

### Configuração (30-40 min)
- [ ] Instalar/Verificar PostgreSQL
- [ ] Criar banco `ticketfest`
- [ ] Atualizar senha em `backend/.env`
- [ ] Rodar `npm run prisma:migrate`
- [ ] Rodar `npm run prisma:seed`
- [ ] Criar conta Stripe (opcional)
- [ ] Configurar chave Stripe em `web/.env.local`

### Testar Sistema (10 min)
- [ ] Iniciar backend: `cd backend && npm run dev`
- [ ] Iniciar frontend: `cd web && npm run dev`
- [ ] Abrir http://localhost:3001
- [ ] Login: user@ticketfest.com / password123
- [ ] Adicionar item ao carrinho
- [ ] Fazer checkout
- [ ] Testar pagamento (cartão: 4242 4242 4242 4242)

### Se Tudo Funcionou
✅ Sistema está 90% operacional!

Próximo passo: Implementar páginas de usuário (Meus Ingressos + Meus Pedidos)

---

## 🆘 PROBLEMAS COMUNS

### Backend não inicia
```bash
# Verificar PostgreSQL
services.msc → PostgreSQL → Iniciar
```

### Porta em uso
```bash
# PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Stripe não funciona
- Verificar se chave começa com `pk_test_`
- Reiniciar frontend após alterar .env.local

---

## 📊 PROGRESSO GERAL

```
[████████████████████░░] 90%

✅ Backend API         100%
✅ Frontend Core        90%
✅ Checkout            100%
❌ Área do Usuário       0%
❌ Painel Admin          0%
```

**Faltam:** 2-3 dias de desenvolvimento para 100%

---

## 🎯 PLANO DE 3 DIAS

### Dia 1 (Hoje)
- Configurar PostgreSQL
- Configurar Stripe
- Testar sistema completo

### Dia 2
- Implementar "Meus Ingressos"
- Exibir QR Codes

### Dia 3
- Implementar "Meus Pedidos"
- Testes finais
- Sistema 100% pronto!

---

**Comandos Rápidos:**

```bash
# Iniciar tudo (após configurar banco)
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd web && npm run dev

# Acessar
http://localhost:3001
```

**Login de Teste:**
- Email: `user@ticketfest.com`
- Senha: `password123`

**Cartão de Teste:**
- Número: `4242 4242 4242 4242`
- Data: `12/25`
- CVV: `123`

---

**Data:** 20/10/2025
**Próxima Revisão:** Após configurar PostgreSQL

🚀 **Vamos lá!**
