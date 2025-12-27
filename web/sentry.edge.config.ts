// Este arquivo configura a inicialização do Sentry para Edge Runtime
import * as Sentry from '@sentry/nextjs';

/**
 * Configuração do Sentry para Edge Runtime
 *
 * Edge Runtime é usado por middleware e algumas rotas do Next.js
 * Para configurar:
 * 1. Crie um projeto no Sentry (https://sentry.io)
 * 2. Copie o DSN do projeto
 * 3. Adicione SENTRY_DSN no arquivo .env.local
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
});
