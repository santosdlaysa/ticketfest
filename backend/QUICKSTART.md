# 🚀 Guia de Início Rápido

## Instalação Rápida (Windows)

### 1. Pré-requisitos

Certifique-se de ter instalado:
- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- ✅ Git

### 2. Configurar PostgreSQL

Abra o pgAdmin ou psql e execute:

```sql
CREATE DATABASE Lumera;
```

Ou via linha de comando:
```bash
psql -U postgres
CREATE DATABASE Lumera;
\q
```

### 3. Instalar Dependências

```bash
cd backend
npm install
```

### 4. Configurar Banco de Dados

O arquivo `.env` já está criado com configurações padrão. Se sua senha do PostgreSQL for diferente de `postgres`, edite as configurações do banco no arquivo `.env`.

### 5. Iniciar o Servidor

```bash
npm run dev
```

O servidor estará rodando em: http://localhost:3000

## ✅ Testando a API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Login com Usuário de Teste
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@Lumera.com\",\"password\":\"password123\"}"
```

### 3. Listar Eventos
```bash
curl http://localhost:3000/api/events
```

## 📱 Ferramentas Recomendadas

### Postman / Insomnia
Use para testar a API de forma interativa:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

## 🔑 Usuários de Teste

Após o seed, você tem estes usuários:

| Email | Senha | Role |
|-------|-------|------|
| admin@Lumera.com | password123 | ADMIN |
| organizer@Lumera.com | password123 | ORGANIZER |
| user@Lumera.com | password123 | USER |

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em modo dev

# Build
npm run build            # Compila TypeScript
npm start                # Inicia em produção

# Qualidade de Código
npm run lint             # Executa linter
npm run format           # Formata código
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se o PostgreSQL está rodando
- Confirme que o DATABASE_URL no .env está correto
- Teste a conexão com: `psql -U postgres -d Lumera`

### Erro: "Port 3000 already in use"
- Altere a variável PORT no .env para outra porta (ex: 3001)

## 📚 Próximos Passos

1. **Explorar a API**: Use o Postman/Insomnia para testar todos os endpoints
2. **Ler a Documentação**: Veja `README.md` para detalhes completos da API
3. **Configurar Email**: Configure SMTP para envio de emails reais
4. **Configurar Stripe**: Adicione suas chaves do Stripe para pagamentos reais
5. **Desenvolver Frontend**: Conecte seu frontend à API

## 💡 Dicas

- Todos os endpoints estão documentados no `README.md`
- Os logs aparecem no console durante desenvolvimento
- Erros de validação retornam detalhes úteis

## 🎯 Fluxo Básico de Teste

1. **Login**
   ```bash
   POST /api/auth/login
   ```

2. **Ver Eventos**
   ```bash
   GET /api/events
   ```

3. **Adicionar ao Carrinho**
   ```bash
   POST /api/cart/add
   ```

4. **Criar Pedido**
   ```bash
   POST /api/orders
   ```

5. **Confirmar Pagamento** (mock)
   ```bash
   POST /api/orders/{orderId}/confirm-payment
   ```

6. **Ver Meus Pedidos**
   ```bash
   GET /api/orders
   ```

Divirta-se desenvolvendo! 🚀
