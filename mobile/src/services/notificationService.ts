import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { secureStorage } from './secureStorage';

/**
 * Tipos de notificação suportados pelo app
 */
export enum NotificationType {
  ORDER_CONFIRMATION = 'order_confirmation',
  PAYMENT_APPROVED = 'payment_approved',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  EVENT_REMINDER = 'event_reminder',
  TICKET_AVAILABLE = 'ticket_available',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_UPDATED = 'event_updated',
}

/**
 * Interface para dados de notificação customizados
 */
export interface NotificationData {
  type: NotificationType;
  orderId?: string;
  eventId?: string;
  ticketId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Configuração padrão de como as notificações devem ser exibidas
 * quando o app está em primeiro plano
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as any;
    const type = data?.type as NotificationType;

    // Configuração específica por tipo de notificação
    switch (type) {
      case NotificationType.ORDER_CONFIRMATION:
      case NotificationType.PAYMENT_APPROVED:
        // Notificações importantes sempre exibem alerta
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };

      case NotificationType.PAYMENT_FAILED:
      case NotificationType.EVENT_CANCELLED:
        // Notificações críticas com som
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };

      case NotificationType.EVENT_REMINDER:
      case NotificationType.TICKET_AVAILABLE:
        // Notificações informativas
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
        };

      default:
        // Configuração padrão
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
    }
  },
});

/**
 * Solicita permissões de notificação ao usuário
 * @returns Token de push ou null se permissão foi negada
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Verifica se é um dispositivo físico (push não funciona em emuladores)
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications não funcionam em emuladores');
    return null;
  }

  try {
    // Verifica permissões atuais
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Se não tiver permissão, solicita
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Se permissão foi negada
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permissão de notificação negada');
      return null;
    }

    // Obtém o projectId da configuração do Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // Verifica se o projectId está configurado corretamente
    if (!projectId || projectId === 'your-expo-project-id') {
      console.warn(
        '[Notifications] Push notifications desabilitadas: projectId não configurado.',
        'Execute "npx eas init" para configurar o projeto Expo.'
      );
      return null;
    }

    // Obtém o token de push do Expo
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    console.log('[Notifications] Push token obtido:', token);

    // Configuração específica para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificações Gerais',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Canal para pedidos
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Pedidos e Pagamentos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'default',
      });

      // Canal para eventos
      await Notifications.setNotificationChannelAsync('events', {
        name: 'Eventos',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#2196F3',
      });
    }

    return token;
  } catch (error) {
    console.error('[Notifications] Erro ao registrar para push notifications:', error);
    return null;
  }
}

/**
 * Registra o token de push no backend
 * @param token Token de push do dispositivo
 */
export async function registerPushTokenWithBackend(token: string): Promise<boolean> {
  try {
    // Verifica se há um token salvo anteriormente
    const savedToken = await secureStorage.getItem('pushToken');

    // Se o token é o mesmo, não precisa re-registrar
    if (savedToken === token) {
      console.log('[Notifications] Token já registrado no backend');
      return true;
    }

    // Registra o token no backend
    await api.post('/users/push-token', {
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName,
      deviceModel: Device.modelName,
    });

    // Salva o token localmente
    await secureStorage.setItem('pushToken', token);

    console.log('[Notifications] Token registrado com sucesso no backend');
    return true;
  } catch (error) {
    console.error('[Notifications] Erro ao registrar token no backend:', error);
    return false;
  }
}

/**
 * Remove o token de push do backend (usado no logout)
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await secureStorage.getItem('pushToken');

    if (token) {
      await api.delete('/users/push-token', {
        data: { token },
      });

      await secureStorage.removeItem('pushToken');
      console.log('[Notifications] Token removido do backend');
    }
  } catch (error) {
    console.error('[Notifications] Erro ao remover token do backend:', error);
  }
}

/**
 * Agenda uma notificação local
 * @param notification Dados da notificação
 * @param trigger Quando a notificação deve ser exibida
 */
export async function scheduleLocalNotification(
  notification: NotificationData,
  trigger: Notifications.NotificationTriggerInput
): Promise<string> {
  try {
    // Determina o canal Android baseado no tipo
    let androidChannelId = 'default';
    if (
      notification.type === NotificationType.ORDER_CONFIRMATION ||
      notification.type === NotificationType.PAYMENT_APPROVED ||
      notification.type === NotificationType.PAYMENT_FAILED
    ) {
      androidChannelId = 'orders';
    } else if (
      notification.type === NotificationType.EVENT_REMINDER ||
      notification.type === NotificationType.TICKET_AVAILABLE
    ) {
      androidChannelId = 'events';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          orderId: notification.orderId,
          eventId: notification.eventId,
          ticketId: notification.ticketId,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          channelId: androidChannelId,
        }),
      },
      trigger,
    });

    console.log('[Notifications] Notificação local agendada:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Erro ao agendar notificação local:', error);
    throw error;
  }
}

/**
 * Cancela uma notificação agendada
 * @param notificationId ID da notificação a cancelar
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Notificação cancelada:', notificationId);
  } catch (error) {
    console.error('[Notifications] Erro ao cancelar notificação:', error);
  }
}

/**
 * Cancela todas as notificações agendadas
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Todas as notificações canceladas');
  } catch (error) {
    console.error('[Notifications] Erro ao cancelar todas as notificações:', error);
  }
}

/**
 * Obtém todas as notificações agendadas
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('[Notifications] Erro ao obter notificações agendadas:', error);
    return [];
  }
}

/**
 * Limpa o badge de notificações
 */
export async function clearNotificationBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('[Notifications] Erro ao limpar badge:', error);
  }
}

/**
 * Define o número do badge
 * @param count Número a exibir no badge
 */
export async function setNotificationBadge(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('[Notifications] Erro ao definir badge:', error);
  }
}

/**
 * Helpers para criar notificações locais específicas
 */
export const notificationHelpers = {
  /**
   * Agenda lembrete de evento
   * @param eventName Nome do evento
   * @param eventId ID do evento
   * @param eventDate Data do evento
   * @param hoursBeforeEvent Quantas horas antes do evento notificar (padrão: 24h)
   */
  scheduleEventReminder: async (
    eventName: string,
    eventId: string,
    eventDate: Date,
    hoursBeforeEvent: number = 24
  ): Promise<string> => {
    const reminderTime = new Date(eventDate.getTime() - hoursBeforeEvent * 60 * 60 * 1000);

    // Não agenda se a data já passou
    if (reminderTime <= new Date()) {
      throw new Error('Data do lembrete já passou');
    }

    return scheduleLocalNotification(
      {
        type: NotificationType.EVENT_REMINDER,
        eventId,
        title: 'Lembrete de Evento',
        body: `${eventName} acontece em ${hoursBeforeEvent} horas!`,
        data: { eventName, eventDate: eventDate.toISOString() },
      },
      { date: reminderTime }
    );
  },

  /**
   * Notifica sobre confirmação de pedido
   * @param orderId ID do pedido
   * @param eventName Nome do evento
   */
  notifyOrderConfirmation: async (orderId: string, eventName: string): Promise<string> => {
    return scheduleLocalNotification(
      {
        type: NotificationType.ORDER_CONFIRMATION,
        orderId,
        title: 'Pedido Confirmado!',
        body: `Seu pedido para ${eventName} foi confirmado com sucesso.`,
      },
      { seconds: 1 } // Exibe imediatamente
    );
  },

  /**
   * Notifica sobre pagamento aprovado
   * @param orderId ID do pedido
   * @param eventName Nome do evento
   */
  notifyPaymentApproved: async (orderId: string, eventName: string): Promise<string> => {
    return scheduleLocalNotification(
      {
        type: NotificationType.PAYMENT_APPROVED,
        orderId,
        title: 'Pagamento Aprovado!',
        body: `Seu pagamento para ${eventName} foi aprovado. Seus ingressos estão disponíveis.`,
      },
      { seconds: 1 }
    );
  },

  /**
   * Notifica sobre falha no pagamento
   * @param orderId ID do pedido
   * @param reason Motivo da falha
   */
  notifyPaymentFailed: async (orderId: string, reason?: string): Promise<string> => {
    return scheduleLocalNotification(
      {
        type: NotificationType.PAYMENT_FAILED,
        orderId,
        title: 'Pagamento Recusado',
        body: reason || 'Houve um problema com seu pagamento. Tente novamente.',
      },
      { seconds: 1 }
    );
  },

  /**
   * Notifica sobre disponibilidade de ingresso
   * @param eventName Nome do evento
   * @param eventId ID do evento
   * @param ticketName Nome do tipo de ingresso
   */
  notifyTicketAvailable: async (
    eventName: string,
    eventId: string,
    ticketName: string
  ): Promise<string> => {
    return scheduleLocalNotification(
      {
        type: NotificationType.TICKET_AVAILABLE,
        eventId,
        title: 'Ingressos Disponíveis!',
        body: `${ticketName} para ${eventName} estão disponíveis agora!`,
      },
      { seconds: 1 }
    );
  },

  /**
   * Notifica sobre cancelamento de evento
   * @param eventName Nome do evento
   * @param eventId ID do evento
   */
  notifyEventCancelled: async (eventName: string, eventId: string): Promise<string> => {
    return scheduleLocalNotification(
      {
        type: NotificationType.EVENT_CANCELLED,
        eventId,
        title: 'Evento Cancelado',
        body: `${eventName} foi cancelado. Você receberá reembolso em breve.`,
      },
      { seconds: 1 }
    );
  },
};
