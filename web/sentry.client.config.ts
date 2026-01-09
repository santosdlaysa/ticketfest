// Este arquivo configura a inicialização do Sentry no lado do cliente (browser)
import * as Sentry from '@sentry/nextjs';

/**
 * Configuração do Sentry para o lado do cliente
 *
 * Para configurar:
 * 1. Crie um projeto no Sentry (https://sentry.io)
 * 2. Copie o DSN do projeto
 * 3. Adicione NEXT_PUBLIC_SENTRY_DSN no arquivo .env.local
 * 4. Execute: npm install @sentry/nextjs
 * 5. Opcionalmente, configure o Sentry Auth Token para upload de source maps:
 *    - SENTRY_ORG: nome da sua organização no Sentry
 *    - SENTRY_PROJECT: nome do projeto no Sentry
 *    - SENTRY_AUTH_TOKEN: token de autenticação do Sentry
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  // DSN do projeto no Sentry
  dsn: SENTRY_DSN || 'https://your-dsn@sentry.io/project',

  // Nome do ambiente (development, staging, production)
  environment: process.env.NODE_ENV || 'development',

  // Versão da aplicação
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Taxa de amostragem de transações para performance monitoring (0.0 a 1.0)
  // Ajuste conforme necessário para balancear custo vs visibilidade
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Taxa de amostragem de replays de sessão (0.0 a 1.0)
  // Session Replay permite ver o que o usuário estava fazendo quando o erro ocorreu
  replaysSessionSampleRate: 0.1, // 10% das sessões normais

  // Taxa de amostragem de replays quando ocorre um erro (0.0 a 1.0)
  replaysOnErrorSampleRate: 1.0, // 100% das sessões com erro

  // Integrações do Sentry
  integrations: [
    // Session Replay - captura interações do usuário
    Sentry.replayIntegration({
      // Mascara dados sensíveis (senhas, cartões de crédito, etc)
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Função para filtrar eventos antes de enviar ao Sentry
  beforeSend(event, hint) {
    // Não envia eventos em desenvolvimento (opcional)
    // if (process.env.NODE_ENV === 'development') {
    //   console.error('Erro capturado pelo Sentry:', hint.originalException || hint.syntheticException);
    //   return null;
    // }

    // Filtra erros específicos que não queremos rastrear
    const error = hint.originalException;

    if (error instanceof Error) {
      // Ignora erros de cancelamento de requisições (comum em navegação rápida)
      if (error.message?.includes('AbortError') || error.message?.includes('canceled')) {
        return null;
      }

      // Ignora erros de network comuns que não são bugs
      if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        return null;
      }

      // Ignora erros de extensões do browser
      if (error.message?.includes('chrome-extension://') || error.message?.includes('moz-extension://')) {
        return null;
      }
    }

    return event;
  },

  // Ignora erros específicos
  ignoreErrors: [
    // Erros comuns do browser que não são relevantes
    'Non-Error exception captured',
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Erros de scripts de terceiros
    'Script error.',
    // Erros de extensões
    'SecurityError',
  ],

  // Lista de URLs que devem ser ignoradas
  denyUrls: [
    // Extensões do Chrome
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Extensões do Firefox
    /^moz-extension:\/\//i,
  ],
});
