# 📋 Guia do Organizador - TicketFest

Este guia explica como criar e gerenciar eventos na plataforma TicketFest.

## 📝 Índice

1. [Requisitos](#requisitos)
2. [Como Criar um Evento](#como-criar-um-evento)
3. [Como Configurar Ingressos](#como-configurar-ingressos)
4. [Como Gerenciar Vendas](#como-gerenciar-vendas)
5. [Fluxo Completo de Pagamento](#fluxo-completo-de-pagamento)

---

## ✅ Requisitos

Para criar eventos, você precisa:
- Ter uma conta com role **ORGANIZER** ou **ADMIN**
- Estar logado no sistema

**Nota:** No modo desenvolvimento com `NEXT_PUBLIC_MOCK_AUTH='true'`, todos os usuários logam automaticamente como ORGANIZER.

---

## 🎪 Como Criar um Evento

### Passo 1: Acessar Área de Eventos

1. Faça login no sistema
2. Clique no seu **avatar** no canto superior direito
3. Selecione **"Meus Eventos"** no menu dropdown

### Passo 2: Criar Novo Evento

1. Clique no botão **"Criar Evento"**
2. Preencha o formulário com os dados do evento:

#### **Informações Básicas**

| Campo | Obrigatório | Descrição | Exemplo |
|-------|-------------|-----------|---------|
| Nome do Evento | Sim | Nome que aparecerá na plataforma | Festival de Rock 2025 |
| Descrição | Sim | Descrição detalhada (min 10 caracteres) | O maior festival de rock do Brasil |
| Categoria | Sim | Categoria do evento | Música, Tecnologia, Comédia, etc. |
| Status | Sim | Estado de publicação | Rascunho ou Publicado |

**Categorias Disponíveis:**
- Música
- Tecnologia
- Comédia
- Teatro
- Esporte
- Gastronomia
- Educação
- Arte
- Negócios
- Outro

#### **Data e Horário**

| Campo | Obrigatório | Descrição | Exemplo |
|-------|-------------|-----------|---------|
| Data de Início | Sim | Quando o evento começa | 2025-12-15 20:00 |
| Data de Término | Não | Quando o evento termina | 2025-12-16 02:00 |

#### **Localização**

| Campo | Obrigatório | Descrição | Exemplo |
|-------|-------------|-----------|---------|
| Local/Venue | Sim | Nome do local (min 3 caracteres) | Allianz Parque |
| Endereço Completo | Sim | Endereço completo (min 5 caracteres) | Av. Francisco Matarazzo, 1705 - São Paulo, SP |

#### **Imagens**

| Campo | Obrigatório | Descrição | Formato |
|-------|-------------|-----------|---------|
| URLs das Imagens | Não | URLs separadas por vírgula | https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg |

### Passo 3: Salvar Evento

1. Clique em **"Criar Evento"**
2. Você será redirecionado para a lista de eventos
3. Seu evento aparecerá na listagem

---

## 🎫 Como Configurar Ingressos

**IMPORTANTE:** Você precisa criar pelo menos 1 tipo de ingresso para que as pessoas possam comprar.

### Passo 1: Acessar Gerenciamento de Ingressos

1. Na lista de **"Meus Eventos"**
2. Encontre o evento criado
3. Clique no botão **"Ingressos"**

### Passo 2: Adicionar Tipo de Ingresso

1. Clique em **"Adicionar Ingresso"**
2. Preencha o formulário:

#### **Campos do Ingresso**

| Campo | Obrigatório | Descrição | Exemplo |
|-------|-------------|-----------|---------|
| Nome do Ingresso | Sim | Tipo/categoria do ingresso | Pista, Camarote, VIP |
| Preço (R$) | Sim | Valor do ingresso | 50.00, 100.00, 250.00 |
| Quantidade Disponível | Sim | Total de ingressos disponíveis | 100, 500, 1000 |
| Descrição | Não | Descrição do ingresso | Acesso à área de pista |
| Início das Vendas | Sim | Quando começa a vender | 2025-11-01 00:00 |
| Fim das Vendas | Sim | Quando termina a venda | 2025-12-15 18:00 |
| Benefícios | Não | Lista separada por vírgula | Acesso à pista, Open bar, Área VIP |

### Passo 3: Salvar Ingresso

1. Clique em **"Adicionar Ingresso"**
2. O ingresso aparecerá na lista
3. Repita para criar outros tipos de ingresso

### Exemplo Prático: Festival de Rock

**Evento:** Festival de Rock 2025

**Ingressos criados:**

#### 1. Pista
- **Preço:** R$ 80,00
- **Quantidade:** 500
- **Benefícios:**
  - Acesso à área de pista
  - Banheiros exclusivos

#### 2. Camarote
- **Preço:** R$ 250,00
- **Quantidade:** 100
- **Benefícios:**
  - Acesso ao camarote
  - Open bar
  - Área climatizada
  - Vista privilegiada

#### 3. VIP
- **Preço:** R$ 500,00
- **Quantidade:** 50
- **Benefícios:**
  - Acesso VIP
  - Meet & Greet com artistas
  - Open bar premium
  - Estacionamento incluso
  - Área lounge exclusiva

### Gerenciar Ingressos Existentes

Na tela de gerenciamento, você pode:
- ✏️ **Editar** - Modificar dados do ingresso
- 🗑️ **Deletar** - Remover ingresso (apenas se não houver vendas)
- 👁️ Ver quantidade **vendida** vs **disponível**

---

## 💰 Como Gerenciar Vendas

### Visualizar Estatísticas

Na página de ingressos, você vê:
- **Quantidade disponível** - Restante disponível / Total
- **Quantidade vendida** - Ingressos já vendidos
- **Período de vendas** - Quando começa e termina

### Status do Evento

| Status | Descrição | Visível para Usuários |
|--------|-----------|----------------------|
| **Rascunho** | Evento ainda não publicado | ❌ Não |
| **Publicado** | Evento visível na plataforma | ✅ Sim |
| **Cancelado** | Evento foi cancelado | ⚠️ Sim (com aviso) |
| **Concluído** | Evento já aconteceu | ✅ Sim (histórico) |

---

## 🔄 Fluxo Completo de Pagamento

### 1️⃣ Organizador Cria Evento

```
Organizador → Meus Eventos → Criar Evento
  ↓
Preenche dados do evento
  ↓
Clica em "Criar Evento"
  ↓
Evento criado (Rascunho ou Publicado)
```

### 2️⃣ Organizador Configura Ingressos

```
Lista de Eventos → Ingressos
  ↓
Adicionar Ingresso
  ↓
Define: Nome, Preço, Quantidade, Período
  ↓
Salva ingresso
  ↓
Repete para criar mais tipos
```

### 3️⃣ Cliente Compra Ingresso

```
Cliente → Explorar Eventos
  ↓
Seleciona evento
  ↓
Escolhe tipo e quantidade de ingresso
  ↓
Adiciona ao carrinho
  ↓
Finaliza compra
```

### 4️⃣ Cliente Escolhe Pagamento

```
Checkout
  ↓
Preenche dados pessoais
  ↓
Escolhe forma de pagamento:
  - PIX (aprovação imediata)
  - Boleto (até 3 dias úteis)
  - Cartão de Crédito (aprovação imediata)
  ↓
Confirma pedido
```

### 5️⃣ Processamento do Pagamento

#### **PIX:**
```
Cliente recebe QR Code e código PIX
  ↓
Paga via app do banco
  ↓
Sistema confirma automaticamente
  ↓
Cliente recebe ingressos por email
```

#### **Boleto:**
```
Cliente baixa boleto
  ↓
Paga no banco (até 3 dias)
  ↓
Sistema confirma em até 24h após pagamento
  ↓
Cliente recebe ingressos por email
```

#### **Cartão de Crédito:**
```
Cliente preenche dados do cartão (Stripe)
  ↓
Pagamento processado instantaneamente
  ↓
Cliente recebe confirmação imediata
  ↓
Ingressos enviados por email
```

### 6️⃣ Cliente Recebe Ingressos

```
Email com ingressos
  ↓
Cada ingresso tem QR Code único
  ↓
Cliente pode ver em "Meus Ingressos"
  ↓
No dia do evento, apresenta QR Code na entrada
```

### 7️⃣ Check-in no Evento

```
Portaria escaneia QR Code
  ↓
Sistema valida autenticidade
  ↓
Marca como "check-in realizado"
  ↓
QR Code não pode ser usado novamente
  ↓
Cliente entra no evento
```

---

## 📊 Recursos Disponíveis

### Para Organizadores

| Recurso | Status | Página |
|---------|--------|--------|
| ✅ Criar eventos | Implementado | `/admin/events/create` |
| ✅ Listar meus eventos | Implementado | `/admin/events` |
| ✅ Editar eventos | Planejado | `/admin/events/[id]/edit` |
| ✅ Deletar eventos | Implementado | `/admin/events` |
| ✅ Gerenciar ingressos | Implementado | `/admin/events/[id]/tickets` |
| ✅ Adicionar ingresso | Implementado | `/admin/events/[id]/tickets` |
| ✅ Editar ingresso | Implementado | `/admin/events/[id]/tickets` |
| ✅ Deletar ingresso | Implementado | `/admin/events/[id]/tickets` |
| ⏳ Ver vendas/relatórios | Pendente | - |
| ⏳ Ver estatísticas | Pendente | - |
| ⏳ Exportar relatórios | Pendente | - |

### Para Clientes

| Recurso | Status | Página |
|---------|--------|--------|
| ✅ Ver eventos | Implementado | `/events` |
| ✅ Buscar eventos | Implementado | `/events` |
| ✅ Filtrar por categoria | Implementado | `/events?category=X` |
| ✅ Ver detalhes do evento | Implementado | `/events/[slug]` |
| ✅ Adicionar ao carrinho | Implementado | `/events/[slug]` |
| ✅ Ver carrinho | Implementado | `/cart` |
| ✅ Finalizar compra | Implementado | `/checkout` |
| ✅ Pagar com PIX | Implementado | `/checkout` |
| ✅ Pagar com Boleto | Implementado | `/checkout` |
| ✅ Pagar com Cartão | Implementado | `/checkout` |
| ✅ Ver meus ingressos | Implementado | `/user/tickets` |
| ✅ Ver meus pedidos | Implementado | `/user/orders` |
| ✅ Baixar QR Code | Implementado | `/user/tickets` |

---

## 🔧 Configurações Técnicas

### Variáveis de Ambiente

Para modo desenvolvimento (mock):

```env
# Frontend (.env)
NEXT_PUBLIC_MOCK_AUTH='true'          # Login sem API
NEXT_PUBLIC_API_URL='http://localhost:4000/api'
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'
```

Para produção:

```env
# Frontend (.env)
NEXT_PUBLIC_MOCK_AUTH='false'         # Login real com API
NEXT_PUBLIC_API_URL='https://api.ticketfest.com/api'
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_live_...'
```

### Backend

```env
# Backend (.env)
PORT=4000
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY='sk_live_...'
FRONTEND_URL='http://localhost:3000'
```

---

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@ticketfest.com
- 💬 Chat: Disponível na plataforma
- 📚 Documentação: https://docs.ticketfest.com

---

**Última atualização:** 29/10/2025
**Versão:** 1.0.0
