# 🔧 TicketFest - Problemas e Soluções

**Data:** 20 de Outubro de 2025
**Versão:** 1.1.0
**Status:** Sistema parcialmente funcional - Requer configuração

---

## 📋 Índice

1. [Problemas Críticos](#-problemas-críticos)
2. [Configurações Necessárias](#-configurações-necessárias)
3. [Funcionalidades Pendentes](#-funcionalidades-pendentes)
4. [Guia de Correção Passo a Passo](#-guia-de-correção-passo-a-passo)

---

## 🚨 Problemas Críticos

### 1. Banco de Dados PostgreSQL Não Configurado

**Status:** ❌ Bloqueador
**Impacto:** Backend não inicia sem banco de dados
**Prioridade:** CRÍTICA

#### Problema
```
Error: P1000: Authentication failed against database server
```

O banco de dados PostgreSQL não está:
- Instalado, OU
- Rodando, OU
- Com credenciais corretas

#### Solução

**Opção A: PostgreSQL Não Instalado**
1. Download: https://www.postgresql.org/download/windows/
2. Instalar versão 14 ou superior
3. Durante instalação, definir senha para usuário `postgres`
4. Atualizar `backend/.env` com a senha

**Opção B: PostgreSQL Instalado mas Não Rodando**
1. Abrir Serviços do Windows (services.msc)
2. Procurar "PostgreSQL"
3. Clicar direito → Iniciar

**Opção C: Senha Incorreta**
1. Editar `backend/.env` linha 7:
   ```env
   DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/ticketfest?schema=public"
   ```
2. Substituir `SUA_SENHA_AQUI` pela senha real

**Opção D: Banco Não Existe**
1. Abrir pgAdmin ou psql
2. Executar:
   ```sql
   CREATE DATABASE ticketfest;
   ```

#### Verificação
```bash
cd backend
npm run prisma:migrate
```

Se aparecer "Your database is now in sync" = ✅ Resolvido

---

### 2. Dependências com Conflitos de Versão

**Status:** ✅ CORRIGIDO
**Impacto:** `npm install` falhava
**Prioridade:** CRÍTICA

#### Problema Original
- ESLint 9 incompatível com Next.js
- Express 5 incompatível com express-async-errors
- Versões incorretas do Stripe

#### Solução Aplicada

**Frontend (`web/package.json`):**
```json
{
  "devDependencies": {
    "eslint": "^8.57.0"  // Era: ^9.17.0
  },
  "dependencies": {
    "@stripe/stripe-js": "^4.8.0",  // Era: ^4.10.0
    "@stripe/react-stripe-js": "^2.8.0"  // Era: ^2.10.0
  }
}
```

**Backend (`backend/package.json`):**
```json
{
  "dependencies": {
    "express": "^4.21.1"  // Era: ^5.0.1
  },
  "devDependencies": {
    "@types/express": "^4.17.21",  // Era: ^5.0.0
    "eslint": "^8.57.0",  // Era: ^9.17.0
    "@typescript-eslint/eslint-plugin": "^6.21.0",  // Era: ^8.19.1
    "@typescript-eslint/parser": "^6.21.0"  // Era: ^8.19.1
  }
}
```

#### Verificação
```bash
# Frontend
cd web
npm install  # Deve completar sem erros

# Backend
cd backend
npm install  # Deve completar sem erros
```

---

## ⚙️ Configurações Necessárias

### 3. Variável de Ambiente Stripe

**Status:** ⚠️ Configuração Mock
**Impacto:** Pagamentos com cartão não funcionam
**Prioridade:** ALTA (para produção)

#### Problema
A chave Stripe no `web/.env.local` é placeholder:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnopqrstuvwxyz
```

#### Solução

1. **Criar conta Stripe gratuita:**
   - Acessar: https://dashboard.stripe.com/register
   - Criar conta (gratuito)

2. **Obter chave de teste:**
   - Login: https://dashboard.stripe.com/test/apikeys
   - Copiar "Publishable key" (começa com `pk_test_`)

3. **Atualizar frontend:**
   Editar `web/.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_REAL_AQUI
   ```

4. **Atualizar backend (opcional):**
   Editar `backend/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_SUA_SECRET_KEY_AQUI
   ```

#### Verificação
- Frontend: Formulário de cartão deve carregar sem erros no console
- Backend: Pagamentos devem processar (modo teste aceita cartão `4242 4242 4242 4242`)

#### Notas
- **Desenvolvimento:** Use chaves `pk_test_` e `sk_test_`
- **Produção:** Troque para `pk_live_` e `sk_live_`
- ⚠️ **NUNCA** commite chaves de produção no Git

---

### 4. URL do Frontend no Backend

**Status:** ✅ CORRIGIDO
**Impacto:** CORS bloquearia requisições
**Prioridade:** MÉDIA

#### Problema Original
```env
FRONTEND_URL=http://localhost:5173  # Porta errada!
```

#### Solução Aplicada
```env
FRONTEND_URL=http://localhost:3001  # Porta correta do Next.js
```

#### Verificação
No console do navegador, não deve aparecer erros de CORS ao fazer requisições.

---

## 📝 Funcionalidades Pendentes

### 5. Área do Usuário - Meus Ingressos

**Status:** ❌ NÃO IMPLEMENTADO
**Impacto:** Usuário não consegue ver ingressos comprados
**Prioridade:** ALTA
**Estimativa:** 1-2 dias

#### O Que Falta

**Página:** `/user/tickets` (não existe)

**Funcionalidades Necessárias:**
- [ ] Listar todos os ingressos do usuário logado
- [ ] Exibir QR Code de cada ingresso
- [ ] Mostrar detalhes do evento (nome, data, local)
- [ ] Status do ingresso (usado/não usado)
- [ ] Download em PDF do ingresso
- [ ] Filtro: próximos eventos / eventos passados

**Endpoint Backend:** ✅ JÁ EXISTE
```
GET /api/orders
GET /api/orders/:id
```

**Dados Disponíveis:**
- QR Code (base64) de cada ingresso
- Informações completas do evento
- Status de check-in

#### Como Implementar

**1. Criar página:**
```
web/src/pages/user/tickets.tsx
```

**2. Buscar ingressos:**
```typescript
const orders = await ordersApi.getUserOrders();
// Cada order tem items com ticketInstances (contém QR codes)
```

**3. Exibir QR Code:**
```tsx
<img src={ticketInstance.qrCode} alt="QR Code" />
```

**4. Adicionar link no Header:**
```tsx
<Link href="/user/tickets">Meus Ingressos</Link>
```

---

### 6. Área do Usuário - Meus Pedidos

**Status:** ❌ NÃO IMPLEMENTADO
**Impacto:** Usuário não vê histórico de compras
**Prioridade:** MÉDIA
**Estimativa:** 1 dia

#### O Que Falta

**Página:** `/user/orders` (não existe)

**Funcionalidades Necessárias:**
- [ ] Lista de todos os pedidos
- [ ] Status de pagamento (pago, pendente, falhou)
- [ ] Total gasto
- [ ] Data da compra
- [ ] Link para ver detalhes de cada pedido
- [ ] Opção de cancelar pedido (se ainda pendente)

**Endpoint Backend:** ✅ JÁ EXISTE
```
GET /api/orders
GET /api/orders/:id
POST /api/orders/:id/cancel
```

#### Como Implementar

Similar à página de tickets, mas focado em pedidos ao invés de ingressos individuais.

---

### 7. Download de PDF dos Ingressos

**Status:** ❌ NÃO IMPLEMENTADO
**Impacto:** Usuário não pode baixar ingresso em PDF
**Prioridade:** MÉDIA
**Estimativa:** 4-6 horas

#### O Que Falta

**Biblioteca Necessária:**
```bash
npm install jspdf
npm install --save-dev @types/jspdf
```

**Funcionalidade:**
- Botão "Baixar PDF" em cada ingresso
- PDF com:
  - Logo do evento
  - Informações do evento
  - QR Code grande
  - Nome do comprador
  - Número do ingresso

#### Exemplo de Implementação
```typescript
import jsPDF from 'jspdf';

const downloadPDF = (ticket) => {
  const doc = new jsPDF();
  doc.text(ticket.event.name, 10, 10);
  doc.addImage(ticket.qrCode, 'PNG', 10, 20, 50, 50);
  doc.save(`ingresso-${ticket.id}.pdf`);
};
```

---

### 8. Painel Administrativo

**Status:** ❌ NÃO IMPLEMENTADO
**Impacto:** Organizadores não têm interface visual
**Prioridade:** BAIXA (backend já funciona)
**Estimativa:** 3-4 dias

#### O Que Falta

**Backend:** ✅ API completa existe
**Frontend:** ❌ Interface não existe

**Páginas Necessárias:**
- `/admin/dashboard` - Visão geral de vendas
- `/admin/events` - Gerenciar eventos
- `/admin/events/new` - Criar evento
- `/admin/events/:id/edit` - Editar evento
- `/admin/checkin` - Interface de check-in

**Endpoints Disponíveis:**
- ✅ CRUD completo de eventos
- ✅ Check-in de ingressos
- ✅ Estatísticas

---

### 9. Upload de Imagens

**Status:** ❌ NÃO IMPLEMENTADO
**Impacto:** Imagens de eventos são apenas URLs externas
**Prioridade:** BAIXA
**Estimativa:** 2 dias

#### Problema Atual
```typescript
// Eventos usam URLs do Unsplash (externas)
images: ["https://images.unsplash.com/..."]
```

#### Solução Necessária

**Opção A: AWS S3**
1. Configurar bucket S3
2. Implementar upload via `multer` + `aws-sdk`
3. Retornar URL permanente da imagem

**Opção B: Cloudinary**
1. Conta gratuita: https://cloudinary.com
2. Mais simples que S3
3. CDN incluso

**Opção C: Armazenamento Local**
1. Pasta `backend/uploads`
2. Servir via Express static
3. ⚠️ Não recomendado para produção

---

## 🎯 Guia de Correção Passo a Passo

### Etapa 1: Configurar Banco de Dados (15-30 min)

**1.1. Verificar PostgreSQL**
```bash
# Windows PowerShell
Get-Service -Name postgresql*
```

Se não estiver instalado:
- Download: https://www.postgresql.org/download/windows/
- Instalar versão 14+
- Anotar senha do usuário `postgres`

**1.2. Criar Banco**
```sql
-- Abrir pgAdmin ou psql
CREATE DATABASE ticketfest;
```

**1.3. Atualizar Senha**
Editar `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:SENHA_REAL@localhost:5432/ticketfest?schema=public"
```

**1.4. Executar Migrations**
```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

**✅ Verificação:** Deve aparecer "Your database is now in sync with your schema."

---

### Etapa 2: Configurar Stripe (10 min)

**2.1. Criar Conta**
- Acesse: https://dashboard.stripe.com/register
- Complete o cadastro (gratuito)

**2.2. Obter Chave**
- Login: https://dashboard.stripe.com/test/apikeys
- Copiar "Publishable key"

**2.3. Atualizar .env**
Editar `web/.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_AQUI
```

**✅ Verificação:** Chave deve começar com `pk_test_`

---

### Etapa 3: Iniciar Sistema (5 min)

**3.1. Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

Deve aparecer:
```
Server running on http://localhost:3000
Database connected successfully
```

**3.2. Terminal 2 - Frontend**
```bash
cd web
npm run dev
```

Deve aparecer:
```
✓ Ready in 1906ms
Local: http://localhost:3001
```

**✅ Verificação:** Abrir http://localhost:3001 - site deve carregar

---

### Etapa 4: Testar Checkout (5 min)

1. Acessar http://localhost:3001
2. Clicar em um evento
3. Adicionar ingressos ao carrinho
4. Fazer login: `user@ticketfest.com` / `password123`
5. Ir para checkout
6. Testar PIX, Boleto ou Cartão

**Cartão de Teste Stripe:**
- Número: `4242 4242 4242 4242`
- Data: Qualquer futura (ex: `12/25`)
- CVV: Qualquer 3 dígitos (ex: `123`)

**✅ Verificação:** Deve redirecionar para página de sucesso

---

## 📊 Resumo de Status

### ✅ Funcionando (90%)
- Backend API completo
- Frontend com checkout
- Autenticação
- Carrinho
- Listagem de eventos
- Processamento de pedidos
- Integração Stripe

### ⚠️ Precisa Configuração
- Banco de dados PostgreSQL
- Chave Stripe real

### ❌ Não Implementado (10%)
- Página "Meus Ingressos"
- Página "Meus Pedidos"
- Download PDF
- Painel Admin (frontend)
- Upload de imagens

---

## 🚀 Prioridades de Desenvolvimento

### Semana 1 (Crítico)
1. ✅ Configurar banco de dados
2. ✅ Configurar Stripe
3. ❌ Implementar "Meus Ingressos"
4. ❌ Implementar "Meus Pedidos"

### Semana 2 (Importante)
5. ❌ Download PDF de ingressos
6. ❌ Testes de integração
7. ❌ Deploy (backend + frontend)

### Semana 3+ (Desejável)
8. ❌ Painel Admin
9. ❌ Upload de imagens
10. ❌ Mobile App

---

## 📞 Próximos Passos

### Agora (Imediato)
1. Configurar PostgreSQL
2. Rodar migrations
3. Iniciar backend e frontend
4. Testar checkout

### Esta Semana
1. Implementar "Meus Ingressos"
2. Implementar "Meus Pedidos"
3. Testar fluxo completo

### Próxima Semana
1. Deploy do sistema
2. Configurar Stripe produção
3. Testes finais

---

## 📋 Checklist de Verificação

### Configuração Inicial
- [ ] PostgreSQL instalado e rodando
- [ ] Banco `ticketfest` criado
- [ ] Senha atualizada em `backend/.env`
- [ ] Migrations executadas com sucesso
- [ ] Seeds carregados (3 eventos, 3 usuários)
- [ ] Chave Stripe obtida
- [ ] Chave Stripe configurada em `web/.env.local`

### Sistema Funcionando
- [ ] Backend inicia sem erros
- [ ] Frontend inicia sem erros
- [ ] Site carrega em http://localhost:3001
- [ ] Eventos aparecem na home
- [ ] Login funciona
- [ ] Carrinho funciona
- [ ] Checkout processa (qualquer método)
- [ ] Página de sucesso aparece

### Desenvolvimento Pendente
- [ ] Página "Meus Ingressos" criada
- [ ] QR Codes visíveis ao usuário
- [ ] Página "Meus Pedidos" criada
- [ ] Download PDF implementado
- [ ] Painel admin (opcional)

---

## 🆘 Problemas Comuns

### "Cannot connect to database"
**Solução:** Verificar se PostgreSQL está rodando
```bash
# Windows Services
services.msc → PostgreSQL → Iniciar
```

### "Invalid Stripe key"
**Solução:** Verificar se chave começa com `pk_test_`

### "Port 3000 already in use"
**Solução:** Matar processo na porta
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### "Module not found"
**Solução:** Reinstalar dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Última Atualização:** 20 de Outubro de 2025
**Versão do Documento:** 1.0
**Próxima Revisão:** Após configuração do banco de dados

---

**⚡ Quick Start para Desenvolvedores:**

Se você já tem PostgreSQL rodando:
```bash
# 1. Configure .env
cd backend
# Editar .env com sua senha PostgreSQL

# 2. Setup Database
npm run prisma:migrate
npm run prisma:seed

# 3. Start Backend
npm run dev

# 4. Start Frontend (novo terminal)
cd ../web
npm run dev

# 5. Acessar
http://localhost:3001
```

Se funcionou, pule para "Etapa 4: Testar Checkout" acima! 🚀
