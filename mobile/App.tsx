import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import * as Sentry from '@sentry/react-native';
import { initSentry } from './src/config/sentry';
import RootNavigator from './src/navigation/RootNavigator';
import { getTheme } from './src/theme';
import { useThemeStore } from './src/stores/themeStore';
import { useNotifications } from './src/hooks/useNotifications';

// Inicializa o Sentry antes de renderizar a aplicação
initSentry();

function App() {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { register, error } = useNotifications();

  // Registra para notificações push quando o app inicia
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        console.log('[App] Iniciando configuração de notificações...');
        await register();
        console.log('[App] Notificações configuradas com sucesso');
      } catch (err) {
        console.error('[App] Erro ao configurar notificações:', err);
        // Sentry captura erro de notificação mas não quebra o app
        Sentry.captureException(err);
      }
    };

    setupNotifications();
  }, []);

  // Log de erro de notificação (opcional)
  useEffect(() => {
    if (error) {
      console.warn('[App] Erro nas notificações:', error);
      // Sentry pode capturar erros de notificação mas não são críticos
      Sentry.captureMessage(`Notification Error: ${error}`, 'warning');
    }
  }, [error]);

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </PaperProvider>
  );
}

// Envolve a aplicação com o HOC do Sentry para capturar erros
// Isso permite que o Sentry capture erros de renderização e de lifecycle
export default Sentry.wrap(App);
