# 🚀 Guia de Início Rápido - Frontend Web

## Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Backend API rodando em `http://localhost:3000`

## Instalação e Execução

### 1. Instalar Dependências

```bash
cd web
npm install
```

### 2. Configurar Variáveis de Ambiente

O arquivo `.env.local` já está criado com as configurações padrão:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_NAME=Lumera
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em: **http://localhost:3001**

## ✅ Testando a Aplicação

### 1. Acesse a Home
Abra: http://localhost:3001

### 2. Navegue pelos Eventos
- Clique em "Explorar Eventos" ou "Ver Todos"
- Use os filtros de categoria
- Busque por nome do evento

### 3. Teste a Compra

**Opção 1: Como Convidado**
1. Clique em um evento
2. Selecione a quantidade de ingressos
3. Clique em "Adicionar ao Carrinho"
4. Vá para o carrinho
5. Veja os itens adicionados

**Opção 2: Com Login**
1. Clique em "Criar Conta" no header
2. Preencha o formulário:
   - Nome: João Silva
   - Email: teste@exemplo.com
   - Senha: senha123
3. Faça login automaticamente
4. Compre ingressos

### 4. Usuários de Teste (Backend)

Se você rodou o seed do backend (`npm run prisma:seed`):

| Email | Senha | Tipo |
|-------|-------|------|
| user@Lumera.com | password123 | Usuário |
| organizer@Lumera.com | password123 | Organizador |
| admin@Lumera.com | password123 | Admin |

## 📦 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (porta 3001)
npm run build        # Build de produção
npm start            # Inicia servidor de produção
npm run lint         # ESLint
npm run type-check   # Verificação TypeScript
```

## 🎨 Estrutura de Rotas

### Públicas
- `/` - Home com eventos em destaque
- `/events` - Listagem de todos os eventos
- `/events/[slug]` - Detalhes do evento
- `/cart` - Carrinho de compras
- `/auth/login` - Login
- `/auth/register` - Registro

### Privadas (Requer Login)
- `/user/tickets` - Meus ingressos (em desenvolvimento)
- `/user/orders` - Meus pedidos (em desenvolvimento)
- `/checkout` - Finalizar compra (em desenvolvimento)

## 🔧 Desenvolvimento

### Hot Reload
O Next.js possui hot reload automático. Salve qualquer arquivo e veja as mudanças instantaneamente.

### Adicionar Nova Página
1. Crie um arquivo em `src/pages/`
2. Exporte um componente React como default
3. Acesse via URL correspondente

Exemplo:
```typescript
// src/pages/sobre.tsx
export default function Sobre() {
  return <div>Sobre nós</div>
}
// Acesse em: http://localhost:3001/sobre
```

### Adicionar Novo Componente
1. Crie em `src/components/`
2. Importe onde necessário

```typescript
// src/components/common/Badge.tsx
export const Badge = ({ text }: { text: string }) => {
  return <span className="badge">{text}</span>
}
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to API"
- ✅ Verifique se o backend está rodando em `http://localhost:3000`
- ✅ Verifique o `.env.local`

### Erro: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro de CORS
- ✅ Verifique se `FRONTEND_URL=http://localhost:3001` no backend `.env`

### Porta 3001 em uso
Altere a porta no script:
```json
"dev": "next dev -p 3002"
```

## 📱 Responsividade

Teste em diferentes tamanhos:
- **Mobile**: Reduza o navegador para < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🎯 Próximas Implementações

Páginas/features a implementar:
- [ ] Checkout completo
- [ ] Visualização de QR codes
- [ ] Área do usuário completa (ingressos, pedidos)
- [ ] Transferência de ingressos
- [ ] Sistema de avaliações

## 💡 Dicas

1. **Zustand DevTools**: Instale a extensão do navegador para debug
2. **React DevTools**: Útil para inspecionar componentes
3. **Network Tab**: Veja as requisições para a API

## 🚢 Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel:
- `NEXT_PUBLIC_API_URL` (URL da sua API em produção)

---

**Tudo pronto!** 🎉

Divirta-se desenvolvendo!
