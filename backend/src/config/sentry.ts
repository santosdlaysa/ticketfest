import * as Sentry from '@sentry/node';
import { env } from './env.js';

/**
 * Inicializa e configura o Sentry para monitoramento de erros
 *
 * Para configurar:
 * 1. Crie um projeto no Sentry (https://sentry.io)
 * 2. Copie o DSN do projeto
 * 3. Adicione a variável SENTRY_DSN no arquivo .env
 * 4. Execute: npm install @sentry/node
 */
export function initSentry() {
  // Só inicializa o Sentry se o DSN estiver configurado
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn || sentryDsn === 'https://your-dsn@sentry.io/project') {
    console.warn('⚠️  Sentry DSN não configurado. Monitoramento de erros desabilitado.');
    console.warn('   Configure a variável SENTRY_DSN no arquivo .env para habilitar o Sentry.');
    return;
  }

  Sentry.init({
    // DSN do projeto no Sentry
    dsn: sentryDsn,

    // Nome do ambiente (development, staging, production)
    environment: env.NODE_ENV || 'development',

    // Versão da aplicação (útil para rastrear erros por release)
    release: process.env.npm_package_version || '1.0.0',

    // Taxa de amostragem de transações para performance monitoring (0.0 a 1.0)
    // 1.0 = 100% das transações, 0.1 = 10% das transações
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Função para filtrar eventos antes de enviar ao Sentry
    beforeSend(event, hint) {
      // Filtra erros específicos que não queremos rastrear
      const error = hint.originalException;

      if (error instanceof Error) {
        // Ignora erros de CORS em desenvolvimento
        if (error.message?.includes('Not allowed by CORS') && env.NODE_ENV === 'development') {
          return null;
        }

        // Ignora erros de rate limit (são esperados)
        if (error.message?.includes('Too many requests')) {
          return null;
        }
      }

      return event;
    },

    // Função para filtrar breadcrumbs (rastros de atividade)
    beforeBreadcrumb(breadcrumb) {
      // Filtra breadcrumbs de rotas de health check
      if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
        return null;
      }

      return breadcrumb;
    },

    // Ignora erros específicos
    ignoreErrors: [
      // Erros comuns do browser que não são relevantes
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
    ],
  });

  console.log('✅ Sentry inicializado com sucesso');
}

export default Sentry;
