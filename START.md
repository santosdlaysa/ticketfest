# 🎫 TicketFest - Guia Completo de Execução

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/))
- ✅ **Git** (opcional)

## 🚀 Passo a Passo Completo

### 1. Configurar o Banco de Dados

Abra o PostgreSQL (pgAdmin ou linha de comando) e crie o banco:

```sql
CREATE DATABASE ticketfest;
```

Ou via terminal:
```bash
psql -U postgres
CREATE DATABASE ticketfest;
\q
```

### 2. Configurar e Iniciar o Backend

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# O arquivo .env já está configurado com valores padrão
# Se sua senha do PostgreSQL for diferente de 'postgres', edite backend/.env

# Executar migrations
npm run prisma:migrate

# Popular com dados de teste
npm run prisma:seed

# Iniciar o servidor
npm run dev
```

✅ **Backend rodando em:** http://localhost:3000

**Teste a API:**
```bash
curl http://localhost:3000/api/health
```

### 3. Configurar e Iniciar o Frontend

**Em um novo terminal:**

```bash
# Voltar para a raiz do projeto
cd ..

# Entrar na pasta do frontend
cd web

# Instalar dependências
npm install

# O arquivo .env.local já está configurado

# Iniciar o servidor
npm run dev
```

✅ **Frontend rodando em:** http://localhost:3001

## 🎉 Pronto! Acesse a Aplicação

Abra seu navegador em: **http://localhost:3001**

## 👤 Usuários de Teste

Após rodar o seed, você tem estes usuários pré-cadastrados:

| Email | Senha | Perfil |
|-------|-------|--------|
| **admin@ticketfest.com** | password123 | Administrador |
| **organizer@ticketfest.com** | password123 | Organizador de Eventos |
| **user@ticketfest.com** | password123 | Usuário Regular |

## 🧪 Testando o Sistema

### Fluxo Completo de Compra

1. **Acesse a Home** (http://localhost:3001)
2. **Veja os eventos em destaque**
3. **Clique em um evento** para ver detalhes
4. **Selecione ingressos** e quantidade
5. **Adicione ao carrinho**
6. **Vá para o carrinho** (ícone no header)
7. **Revise os itens**
8. **Crie uma conta** ou faça login
9. **(Em desenvolvimento)** Finalize a compra

### Testar Como Convidado

Você pode adicionar itens ao carrinho sem fazer login. O carrinho será salvo localmente.

### Testar Como Usuário Logado

1. Clique em "Criar Conta" ou "Entrar"
2. Use um dos emails de teste acima
3. Navegue e compre ingressos

## 🛠️ Ferramentas Úteis

### Prisma Studio (Visualizar Banco de Dados)

```bash
cd backend
npm run prisma:studio
```

Abre em: http://localhost:5555

### Testar API com cURL

```bash
# Listar eventos
curl http://localhost:3000/api/events

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@ticketfest.com","password":"password123"}'
```

## 📁 Estrutura do Projeto

```
ticketfest/
├── backend/              # API REST
│   ├── src/
│   ├── prisma/
│   └── package.json
├── web/                  # Frontend Next.js
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
│   └── package.json
└── README.md
```

## 🐛 Troubleshooting

### Problema: "Porta 3000 em uso"

**Backend:**
```bash
# Pare o processo na porta 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID [número] /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Problema: "Cannot connect to database"

1. Verifique se o PostgreSQL está rodando
2. Confira as credenciais em `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/ticketfest?schema=public"
   ```

### Problema: "Module not found" no Frontend

```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

### Problema: CORS Error

Verifique se no `backend/.env`:
```env
FRONTEND_URL=http://localhost:3001
```

## 📝 Comandos Rápidos

### Backend
```bash
cd backend
npm run dev              # Desenvolvimento
npm run build            # Build
npm run prisma:studio    # Visualizar DB
npm run prisma:seed      # Popular DB
```

### Frontend
```bash
cd web
npm run dev              # Desenvolvimento
npm run build            # Build
npm run type-check       # Verificar tipos
```

## 🔄 Resetar o Banco de Dados

Se quiser começar do zero:

```bash
cd backend

# Deletar migrations
rm -rf prisma/migrations

# Recriar tudo
npm run prisma:migrate
npm run prisma:seed
```

## 🚢 Deploy

### Backend (Heroku/Railway/Render)
1. Configure as variáveis de ambiente
2. Conecte ao banco PostgreSQL em produção
3. Execute migrations: `npm run prisma:migrate`

### Frontend (Vercel)
```bash
cd web
vercel --prod
```

Configure `NEXT_PUBLIC_API_URL` para apontar para seu backend em produção.

## 📚 Documentação Adicional

- **Backend API**: Ver `backend/README.md`
- **Frontend Web**: Ver `web/README.md`
- **Guia Rápido Backend**: `backend/QUICKSTART.md`
- **Guia Rápido Frontend**: `web/QUICKSTART.md`
- **Documentação Completa**: `doc.md`

## 💡 Próximos Passos

Após testar, você pode:

1. **Explorar o código** para entender a arquitetura
2. **Modificar componentes** no frontend (hot reload ativo)
3. **Adicionar novos endpoints** no backend
4. **Criar novos eventos** via Prisma Studio
5. **Implementar as features faltantes** (checkout, área do usuário)

## 🎯 Features Principais Funcionando

### Backend ✅
- Autenticação JWT
- CRUD de Eventos
- Sistema de Carrinho
- Criação de Pedidos
- QR Codes para Ingressos
- Check-in
- Envio de Emails (mock)

### Frontend ✅
- Listagem de Eventos
- Detalhes do Evento
- Carrinho de Compras
- Login/Registro
- Layout Responsivo

### Em Desenvolvimento 🔄
- Checkout completo
- Visualização de QR codes
- Área do usuário (ingressos/pedidos)
- Integração de pagamento real

---

**Divirta-se explorando o TicketFest!** 🎉

Se tiver dúvidas, consulte a documentação ou abra uma issue no GitHub.
