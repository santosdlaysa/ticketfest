// Este arquivo configura a inicialização do Sentry no lado do servidor (Node.js)
import * as Sentry from '@sentry/nextjs';

/**
 * Configuração do Sentry para o lado do servidor
 *
 * Para configurar:
 * 1. Crie um projeto no Sentry (https://sentry.io)
 * 2. Copie o DSN do projeto
 * 3. Adicione SENTRY_DSN no arquivo .env.local
 * 4. Execute: npm install @sentry/nextjs
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  // DSN do projeto no Sentry
  dsn: SENTRY_DSN || 'https://your-dsn@sentry.io/project',

  // Nome do ambiente (development, staging, production)
  environment: process.env.NODE_ENV || 'development',

  // Versão da aplicação
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Taxa de amostragem de transações para performance monitoring (0.0 a 1.0)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

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
      // Ignora erros de timeout de API (podem ser comuns dependendo da infraestrutura)
      if (error.message?.includes('ETIMEDOUT') || error.message?.includes('ECONNREFUSED')) {
        return null;
      }
    }

    return event;
  },

  // Ignora erros específicos
  ignoreErrors: [
    'Non-Error exception captured',
    'Non-Error promise rejection captured',
  ],
});
