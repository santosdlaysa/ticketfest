import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Inicializa e configura o Sentry para monitoramento de erros no React Native
 *
 * Para configurar:
 * 1. Crie um projeto no Sentry (https://sentry.io)
 * 2. Copie o DSN do projeto
 * 3. Adicione EXPO_PUBLIC_SENTRY_DSN no arquivo .env ou app.json
 * 4. Execute: npm install @sentry/react-native
 * 5. Para builds nativos, execute: npx @sentry/wizard -i reactNative -p ios android
 */

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || 'https://your-dsn@sentry.io/project';

/**
 * Inicializa o Sentry com as configurações apropriadas
 */
export function initSentry() {
  // Só inicializa o Sentry se o DSN estiver configurado
  if (!SENTRY_DSN || SENTRY_DSN === 'https://your-dsn@sentry.io/project') {
    console.warn('⚠️  Sentry DSN não configurado. Monitoramento de erros desabilitado.');
    console.warn('   Configure EXPO_PUBLIC_SENTRY_DSN no app.json para habilitar o Sentry.');
    return;
  }

  Sentry.init({
    // DSN do projeto no Sentry
    dsn: SENTRY_DSN,

    // Nome do ambiente (development, staging, production)
    environment: __DEV__ ? 'development' : 'production',

    // Versão da aplicação
    release: Constants.expoConfig?.version || '1.0.0',

    // Dist é usado para identificar builds específicos
    dist: Constants.expoConfig?.android?.versionCode?.toString() ||
          Constants.expoConfig?.ios?.buildNumber ||
          '1',

    // Taxa de amostragem de transações para performance monitoring (0.0 a 1.0)
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Habilita captura automática de erros nativos
    enableAutoSessionTracking: true,

    // Tempo de inatividade para considerar uma nova sessão (em segundos)
    sessionTrackingIntervalMillis: 10000,

    // Integrações do Sentry (v6 syntax)
    integrations: [
      // React Navigation integration para rastreamento de navegação
      Sentry.reactNavigationIntegration(),
      // React Native Tracing para performance monitoring
      Sentry.reactNativeTracingIntegration({
        // Rastreamento de requisições HTTP
        tracingOrigins: ['localhost', /^\//],
      }),
    ],

    // Opções de tracing movidas para o nível do init no v6
    enableAppStartTracking: true,
    enableNativeFramesTracking: true,
    enableStallTracking: true,

    // Função para filtrar eventos antes de enviar ao Sentry
    beforeSend(event, hint) {
      // Não envia eventos em desenvolvimento (opcional)
      // if (__DEV__) {
      //   console.error('Erro capturado pelo Sentry:', hint.originalException || hint.syntheticException);
      //   return null;
      // }

      // Filtra erros específicos que não queremos rastrear
      const error = hint.originalException;

      if (error instanceof Error) {
        // Ignora erros de cancelamento de requisições
        if (error.message?.includes('AbortError') || error.message?.includes('canceled')) {
          return null;
        }

        // Ignora erros de network comuns que não são bugs da aplicação
        if (error.message?.includes('Network request failed') ||
            error.message?.includes('Network Error')) {
          return null;
        }

        // Ignora timeouts (podem ser comuns dependendo da conexão do usuário)
        if (error.message?.includes('timeout')) {
          return null;
        }
      }

      return event;
    },

    // Função para filtrar breadcrumbs (rastros de atividade)
    beforeBreadcrumb(breadcrumb) {
      // Filtra breadcrumbs de console.log em desenvolvimento
      if (breadcrumb.category === 'console' && __DEV__) {
        return null;
      }

      return breadcrumb;
    },

    // Ignora erros específicos
    ignoreErrors: [
      // Erros comuns que não são relevantes
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
      // Erros do React Native que são esperados
      'Warning: Failed prop type',
      'Warning: Each child in a list',
    ],

    // Habilita logs de debug em desenvolvimento
    debug: __DEV__,

    // Anexa stack traces a mensagens (útil para debugging)
    attachStacktrace: true,

    // Captura informações do dispositivo
    enableNative: true,

    // Captura informações de CPU e memória
    enableNativeCrashHandling: true,
    enableNativeNagger: false, // Desabilita avisos sobre configuração nativa
  });

  console.log('✅ Sentry inicializado com sucesso');
}

/**
 * Configura o contexto do usuário no Sentry
 * Chame esta função após o usuário fazer login
 */
export function setSentryUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Remove o contexto do usuário no Sentry
 * Chame esta função quando o usuário fizer logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Adiciona contexto extra ao Sentry
 * Útil para adicionar informações relevantes sobre o estado da aplicação
 */
export function setSentryContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * Adiciona uma tag ao Sentry
 * Tags são úteis para filtrar e agrupar eventos
 */
export function setSentryTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Captura uma exceção manualmente
 * Use quando quiser reportar um erro que foi tratado
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Captura uma mensagem manualmente
 * Útil para logging de eventos importantes
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export default Sentry;
