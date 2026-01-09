# Configuração do Sentry - Guia Completo

Este guia explica como configurar o Sentry para monitoramento de erros nos três projetos: Backend, Web e Mobile.

## Índice
- [O que é o Sentry?](#o-que-é-o-sentry)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Inicial no Sentry.io](#configuração-inicial-no-sentryio)
- [Backend (Node.js/Express)](#backend-nodejsexpress)
- [Web (Next.js)](#web-nextjs)
- [Mobile (React Native/Expo)](#mobile-react-nativeexpo)
- [Testando a Integração](#testando-a-integração)
- [Recursos Avançados](#recursos-avançados)

---

## O que é o Sentry?

Sentry é uma plataforma de monitoramento de erros que ajuda você a:
- Detectar e rastrear erros em produção em tempo real
- Capturar stack traces completos para debugging
- Monitorar performance da aplicação
- Receber alertas quando erros críticos ocorrem
- Visualizar replays de sessão (apenas web) para entender o comportamento do usuário

---

## Pré-requisitos

1. Conta no Sentry.io (gratuita para começar)
   - Acesse [https://sentry.io/signup/](https://sentry.io/signup/)
   - Crie uma conta gratuita

2. Node.js instalado (versão 18 ou superior)

---

## Configuração Inicial no Sentry.io

### Passo 1: Criar Projetos no Sentry

1. Faça login em [https://sentry.io](https://sentry.io)
2. Clique em "Create Project"
3. Crie três projetos separados:
   - **Backend**: Selecione "Node.js" como plataforma
   - **Web**: Selecione "Next.js" como plataforma
   - **Mobile**: Selecione "React Native" como plataforma

### Passo 2: Obter o DSN

Após criar cada projeto, você verá o **DSN** (Data Source Name). Este é um URL único que identifica seu projeto.

Exemplo: `https://examplePublicKey@o0.ingest.sentry.io/0`

Copie o DSN de cada projeto - você precisará deles nas próximas etapas.

### Passo 3: Criar Auth Token (Opcional, mas recomendado para produção)

Para upload de source maps (necessário para ver código original nos erros):

1. Vá em **Settings > Account > API > Auth Tokens**
2. Clique em "Create New Token"
3. Selecione os seguintes escopos:
   - `project:releases`
   - `project:write`
   - `org:read`
4. Copie o token gerado

---

## Backend (Node.js/Express)

### Instalação

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

### Configuração

1. **Adicione o DSN ao arquivo `.env`:**

```bash
# Copie o .env.example e adicione seu DSN
cp .env.example .env

# Edite o .env e adicione:
SENTRY_DSN=https://seu-dsn@sentry.io/projeto-backend
```

2. **Os arquivos já estão configurados:**
   - `src/config/sentry.ts` - Configuração do Sentry
   - `src/app.ts` - Middlewares do Sentry integrados
   - `src/server.ts` - Inicialização do Sentry
   - `src/middlewares/errorHandler.ts` - Captura de erros

### Como Funciona

- O Sentry captura automaticamente erros não tratados
- Erros 5xx são enviados ao Sentry automaticamente
- Erros 4xx (erros do cliente) NÃO são enviados
- Você pode capturar erros manualmente:

```typescript
import Sentry from './config/sentry.js';

// Capturar uma exceção
try {
  // código
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'payment' },
    extra: { userId: user.id }
  });
}

// Capturar uma mensagem
Sentry.captureMessage('Algo importante aconteceu', 'info');
```

---

## Web (Next.js)

### Instalação

```bash
cd web
npm install @sentry/nextjs
```

### Configuração

1. **Adicione as variáveis ao arquivo `.env.local`:**

```bash
# Crie o arquivo .env.local
cp .env.example .env.local

# Edite o .env.local e adicione:
NEXT_PUBLIC_SENTRY_DSN=https://seu-dsn@sentry.io/projeto-web
SENTRY_DSN=https://seu-dsn@sentry.io/projeto-web

# Opcional (para produção - upload de source maps):
SENTRY_AUTH_TOKEN=seu-token-de-autenticacao
SENTRY_ORG=sua-organizacao
SENTRY_PROJECT=seu-projeto
NEXT_PUBLIC_APP_VERSION=1.0.0
```

2. **Os arquivos já estão configurados:**
   - `sentry.client.config.ts` - Configuração do cliente (browser)
   - `sentry.server.config.ts` - Configuração do servidor
   - `sentry.edge.config.ts` - Configuração para Edge Runtime
   - `next.config.js` - Integração com Next.js
   - `src/components/common/ErrorBoundary.tsx` - Captura erros de React

### Como Funciona

- Erros de renderização React são capturados pelo ErrorBoundary
- Erros do servidor são capturados automaticamente
- Session Replay grava interações do usuário (quando há erro)
- Você pode capturar erros manualmente:

```typescript
import * as Sentry from '@sentry/nextjs';

// Capturar uma exceção
try {
  // código
} catch (error) {
  Sentry.captureException(error);
}

// Adicionar contexto do usuário
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name
});
```

---

## Mobile (React Native/Expo)

### Instalação

```bash
cd mobile
npm install @sentry/react-native
```

### Configuração

1. **Edite o arquivo `app.json`:**

```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://seu-dsn@sentry.io/projeto-mobile"
    }
  }
}
```

2. **Os arquivos já estão configurados:**
   - `src/config/sentry.ts` - Configuração e funções auxiliares
   - `App.tsx` - Inicialização do Sentry

### Como Funciona

- Erros nativos (iOS/Android) são capturados automaticamente
- Erros JavaScript são capturados automaticamente
- Performance de navegação é monitorada
- Você pode usar as funções auxiliares:

```typescript
import {
  captureException,
  captureMessage,
  setSentryUser,
  clearSentryUser,
  setSentryContext,
  setSentryTag
} from './config/sentry';

// Após login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.name
});

// Após logout
clearSentryUser();

// Adicionar contexto
setSentryContext('payment', {
  method: 'credit_card',
  amount: 100.00
});

// Adicionar tags
setSentryTag('feature', 'checkout');

// Capturar erro
try {
  // código
} catch (error) {
  captureException(error, { feature: 'payment' });
}
```

---

## Testando a Integração

### Backend

Adicione uma rota de teste no seu código:

```typescript
app.get('/api/sentry-test', (req, res) => {
  throw new Error('Teste de erro do Sentry!');
});
```

Acesse `http://localhost:3000/api/sentry-test` e verifique se o erro aparece no Sentry.

### Web

Adicione um botão de teste em alguma página:

```tsx
<button onClick={() => {
  throw new Error('Teste de erro do Sentry Web!');
}}>
  Testar Sentry
</button>
```

### Mobile

Adicione um botão de teste em alguma tela:

```tsx
import { captureException } from './config/sentry';

<Button onPress={() => {
  captureException(new Error('Teste de erro do Sentry Mobile!'));
}}>
  Testar Sentry
</Button>
```

---

## Recursos Avançados

### 1. Filtrar Erros por Ambiente

Os erros são automaticamente marcados com o ambiente (`development`, `production`). Você pode filtrar por ambiente no Sentry.

### 2. Source Maps

Source maps permitem ver o código original ao invés do código minificado/transpilado.

**Backend**: Já configurado automaticamente.

**Web**: Configure as variáveis `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT`.

**Mobile**: Para builds nativos, execute:
```bash
npx @sentry/wizard -i reactNative -p ios android
```

### 3. Releases

Marcar releases ajuda a rastrear em qual versão da aplicação o erro ocorreu:

```bash
# Criar um release
npx sentry-cli releases new 1.0.0
npx sentry-cli releases set-commits 1.0.0 --auto
npx sentry-cli releases finalize 1.0.0
```

### 4. Alertas

Configure alertas no Sentry para ser notificado quando:
- Novos erros ocorrerem
- Erros ultrapassarem um limite
- Erros críticos acontecerem

Vá em **Alerts > Create Alert** no Sentry.

### 5. Performance Monitoring

Já está habilitado! Você pode ver:
- Tempo de resposta das APIs (backend)
- Tempo de carregamento de páginas (web)
- Performance de navegação (mobile)

### 6. Session Replay (Web)

Session Replay grava as interações do usuário quando um erro ocorre. Isso ajuda a entender o contexto do erro.

Já está configurado no `sentry.client.config.ts`.

---

## Desabilitando o Sentry em Desenvolvimento (Opcional)

Se você não quiser enviar erros em desenvolvimento, descomente as linhas no `beforeSend`:

```typescript
beforeSend(event, hint) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Erro capturado pelo Sentry:', hint.originalException);
    return null; // Não envia ao Sentry
  }
  return event;
}
```

---

## Troubleshooting

### Erros não aparecem no Sentry

1. Verifique se o DSN está correto
2. Verifique se as variáveis de ambiente estão carregadas
3. Verifique os logs do console - deve aparecer "✅ Sentry inicializado com sucesso"
4. Verifique se o erro não está sendo filtrado pelo `beforeSend`

### Source maps não funcionam

1. Verifique se o `SENTRY_AUTH_TOKEN` está configurado
2. Verifique se `SENTRY_ORG` e `SENTRY_PROJECT` estão corretos
3. Execute o build e verifique se os source maps foram enviados nos logs

### Performance está lenta

Reduza as taxas de amostragem:

```typescript
tracesSampleRate: 0.1, // 10% das transações
replaysSessionSampleRate: 0.05, // 5% das sessões
```

---

## Suporte

- Documentação oficial: [https://docs.sentry.io](https://docs.sentry.io)
- Comunidade: [https://discord.gg/sentry](https://discord.gg/sentry)
- Blog: [https://blog.sentry.io](https://blog.sentry.io)

---

**Última atualização**: Dezembro 2025
