import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation, NavigationContainerRef } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  registerForPushNotifications,
  registerPushTokenWithBackend,
  unregisterPushToken,
  clearNotificationBadge,
  setNotificationBadge,
  NotificationType,
  notificationHelpers,
} from '../services/notificationService';
import type { HomeStackParamList } from '../navigation/types';

/**
 * Interface do estado de notificações
 */
interface NotificationState {
  expoPushToken: string | null;
  isRegistered: boolean;
  notification: Notifications.Notification | null;
  error: string | null;
}

// Referência global de navegação para uso fora do contexto do NavigationContainer
let navigationRef: NavigationContainerRef<any> | null = null;

export function setNavigationRef(ref: NavigationContainerRef<any> | null) {
  navigationRef = ref;
}

/**
 * Hook customizado para gerenciar notificações push
 * Lida com registro, permissões e navegação baseada em notificações
 *
 * @param useNavigationHook - Se deve tentar usar o hook useNavigation (default: false)
 *                            Passar true apenas quando usado dentro do NavigationContainer
 */
export function useNotifications(useNavigationHook: boolean = false) {
  // Tenta usar o hook apenas se solicitado e estiver dentro do NavigationContainer
  let navigation: NativeStackNavigationProp<HomeStackParamList> | null = null;

  try {
    if (useNavigationHook) {
      navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    }
  } catch {
    // Ignora erro se não estiver dentro do NavigationContainer
  }

  const [state, setState] = useState<NotificationState>({
    expoPushToken: null,
    isRegistered: false,
    notification: null,
    error: null,
  });

  // Refs para os listeners de notificação
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  /**
   * Registra o dispositivo para receber notificações push
   */
  const register = async () => {
    try {
      console.log('[useNotifications] Iniciando registro de notificações...');

      // Obtém o token de push
      const token = await registerForPushNotifications();

      if (!token) {
        setState((prev) => ({
          ...prev,
          error: 'Não foi possível obter permissão para notificações',
        }));
        return;
      }

      // Registra o token no backend
      const success = await registerPushTokenWithBackend(token);

      setState((prev) => ({
        ...prev,
        expoPushToken: token,
        isRegistered: success,
        error: success ? null : 'Erro ao registrar token no servidor',
      }));

      console.log('[useNotifications] Registro concluído:', { token, success });
    } catch (error: any) {
      console.error('[useNotifications] Erro ao registrar notificações:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Erro desconhecido ao registrar notificações',
      }));
    }
  };

  /**
   * Remove o registro de notificações (usado no logout)
   */
  const unregister = async () => {
    try {
      await unregisterPushToken();
      setState({
        expoPushToken: null,
        isRegistered: false,
        notification: null,
        error: null,
      });
      console.log('[useNotifications] Notificações desregistradas');
    } catch (error: any) {
      console.error('[useNotifications] Erro ao desregistrar notificações:', error);
    }
  };

  /**
   * Função auxiliar para navegar usando o ref ou hook disponível
   */
  const navigateTo = (screen: string, params?: Record<string, any>) => {
    try {
      if (navigation) {
        (navigation as any).navigate(screen, params);
      } else if (navigationRef) {
        (navigationRef as any).navigate(screen, params);
      } else {
        console.warn('[useNotifications] Navegação não disponível');
      }
    } catch (error) {
      console.error('[useNotifications] Erro ao navegar:', error);
    }
  };

  /**
   * Navega para a tela apropriada baseado no tipo de notificação
   * @param notification Notificação recebida
   */
  const handleNotificationNavigation = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as any;
    const type = data?.type as NotificationType;

    console.log('[useNotifications] Navegando baseado na notificação:', { type, data });

    switch (type) {
      case NotificationType.ORDER_CONFIRMATION:
      case NotificationType.PAYMENT_APPROVED:
      case NotificationType.PAYMENT_FAILED:
        // Navega para detalhes do pedido
        if (data.orderId) {
          navigateTo('OrderDetails', { orderId: data.orderId });
        } else {
          navigateTo('Orders');
        }
        break;

      case NotificationType.EVENT_REMINDER:
      case NotificationType.TICKET_AVAILABLE:
      case NotificationType.EVENT_CANCELLED:
      case NotificationType.EVENT_UPDATED:
        // Navega para detalhes do evento
        if (data.eventId) {
          navigateTo('EventDetails', { eventId: data.eventId });
        } else {
          navigateTo('HomeMain');
        }
        break;

      default:
        // Notificação genérica - vai para home
        navigateTo('HomeMain');
        break;
    }
  };

  /**
   * Configura os listeners de notificação
   */
  useEffect(() => {
    // Listener para notificações recebidas enquanto o app está em primeiro plano
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[useNotifications] Notificação recebida (foreground):', notification);

        setState((prev) => ({
          ...prev,
          notification,
        }));

        // Pode adicionar lógica customizada aqui
        // Ex: exibir um toast, reproduzir som customizado, etc.
      }
    );

    // Listener para quando o usuário toca na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[useNotifications] Notificação tocada:', response);

        const notification = response.notification;

        // Navega para a tela apropriada
        handleNotificationNavigation(notification);

        // Limpa o badge após interagir com a notificação
        clearNotificationBadge();
      }
    );

    // Limpa os listeners quando o componente é desmontado
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  /**
   * Limpa o badge de notificações
   */
  const clearBadge = async () => {
    await clearNotificationBadge();
  };

  /**
   * Define o número do badge
   * @param count Número a exibir
   */
  const setBadge = async (count: number) => {
    await setNotificationBadge(count);
  };

  /**
   * Obtém a última notificação recebida
   */
  const getLastNotification = async () => {
    try {
      const notification = await Notifications.getLastNotificationResponseAsync();
      return notification?.notification || null;
    } catch (error) {
      console.error('[useNotifications] Erro ao obter última notificação:', error);
      return null;
    }
  };

  return {
    // Estado
    expoPushToken: state.expoPushToken,
    isRegistered: state.isRegistered,
    notification: state.notification,
    error: state.error,

    // Métodos
    register,
    unregister,
    clearBadge,
    setBadge,
    getLastNotification,

    // Helpers para criar notificações locais
    helpers: notificationHelpers,
  };
}
