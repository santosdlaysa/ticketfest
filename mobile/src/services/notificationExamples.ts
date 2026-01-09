/**
 * EXEMPLOS DE USO DO SISTEMA DE NOTIFICAÇÕES
 *
 * Este arquivo demonstra como usar o sistema de notificações
 * em diferentes cenários do aplicativo.
 */

import { notificationHelpers } from './notificationService';

/**
 * EXEMPLO 1: Notificar confirmação de pedido
 *
 * Use após criar um pedido com sucesso.
 */
export async function exampleOrderConfirmation(orderId: string, eventName: string) {
  try {
    const notificationId = await notificationHelpers.notifyOrderConfirmation(
      orderId,
      eventName
    );
    console.log('Notificação de pedido agendada:', notificationId);
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
}

/**
 * EXEMPLO 2: Notificar pagamento aprovado
 *
 * Use quando receber confirmação de pagamento do backend.
 */
export async function examplePaymentApproved(orderId: string, eventName: string) {
  try {
    const notificationId = await notificationHelpers.notifyPaymentApproved(
      orderId,
      eventName
    );
    console.log('Notificação de pagamento aprovado agendada:', notificationId);
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
}

/**
 * EXEMPLO 3: Notificar falha no pagamento
 *
 * Use quando o pagamento for recusado.
 */
export async function examplePaymentFailed(orderId: string, reason?: string) {
  try {
    const notificationId = await notificationHelpers.notifyPaymentFailed(
      orderId,
      reason
    );
    console.log('Notificação de falha no pagamento agendada:', notificationId);
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
}

/**
 * EXEMPLO 4: Agendar lembrete de evento
 *
 * Use quando o usuário comprar ingresso ou marcar interesse em um evento.
 * Agenda uma notificação 24h antes do evento.
 */
export async function exampleEventReminder(
  eventName: string,
  eventId: string,
  eventDate: Date
) {
  try {
    // Agenda lembrete 24h antes
    const notificationId = await notificationHelpers.scheduleEventReminder(
      eventName,
      eventId,
      eventDate,
      24 // 24 horas antes
    );
    console.log('Lembrete de evento agendado:', notificationId);

    // Também pode agendar múltiplos lembretes
    // 1 hora antes do evento
    const reminderHourBefore = await notificationHelpers.scheduleEventReminder(
      eventName,
      eventId,
      eventDate,
      1 // 1 hora antes
    );
    console.log('Lembrete adicional agendado:', reminderHourBefore);
  } catch (error) {
    console.error('Erro ao agendar lembrete:', error);
  }
}

/**
 * EXEMPLO 5: Notificar disponibilidade de ingresso
 *
 * Use quando ingressos esgotados voltarem a estar disponíveis.
 */
export async function exampleTicketAvailable(
  eventName: string,
  eventId: string,
  ticketName: string
) {
  try {
    const notificationId = await notificationHelpers.notifyTicketAvailable(
      eventName,
      eventId,
      ticketName
    );
    console.log('Notificação de ingresso disponível agendada:', notificationId);
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
}

/**
 * EXEMPLO 6: Notificar cancelamento de evento
 *
 * Use quando um evento for cancelado.
 */
export async function exampleEventCancelled(eventName: string, eventId: string) {
  try {
    const notificationId = await notificationHelpers.notifyEventCancelled(
      eventName,
      eventId
    );
    console.log('Notificação de cancelamento agendada:', notificationId);
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
}

/**
 * EXEMPLO 7: Usar o hook em um componente
 *
 * ```tsx
 * import { useNotifications } from '../hooks/useNotifications';
 *
 * function MyComponent() {
 *   const {
 *     expoPushToken,
 *     isRegistered,
 *     notification,
 *     error,
 *     register,
 *     unregister,
 *     clearBadge,
 *     setBadge,
 *     helpers
 *   } = useNotifications();
 *
 *   // Verificar se está registrado
 *   useEffect(() => {
 *     if (isRegistered) {
 *       console.log('Push token:', expoPushToken);
 *     }
 *   }, [isRegistered]);
 *
 *   // Usar helpers para criar notificações
 *   const handleOrderCreated = async (orderId: string, eventName: string) => {
 *     await helpers.notifyOrderConfirmation(orderId, eventName);
 *   };
 *
 *   // Limpar badge quando visualizar notificações
 *   const handleViewNotifications = async () => {
 *     await clearBadge();
 *   };
 *
 *   return (
 *     <View>
 *       {error && <Text>Erro: {error}</Text>}
 *       {isRegistered && <Text>Notificações ativadas!</Text>}
 *     </View>
 *   );
 * }
 * ```
 */

/**
 * EXEMPLO 8: Integração com fluxo de checkout
 *
 * ```tsx
 * import { useNotifications } from '../hooks/useNotifications';
 *
 * function CheckoutScreen() {
 *   const { helpers } = useNotifications();
 *
 *   const handlePayment = async (paymentData) => {
 *     try {
 *       // Processar pagamento
 *       const order = await createOrder(paymentData);
 *
 *       // Notificar criação do pedido
 *       await helpers.notifyOrderConfirmation(
 *         order.id,
 *         order.event.name
 *       );
 *
 *       // Agendar lembrete do evento
 *       await helpers.scheduleEventReminder(
 *         order.event.name,
 *         order.event.id,
 *         new Date(order.event.date),
 *         24
 *       );
 *
 *       // Navegar para sucesso
 *       navigation.navigate('OrderSuccess', { orderId: order.id });
 *     } catch (error) {
 *       await helpers.notifyPaymentFailed(
 *         order?.id || '',
 *         'Erro ao processar pagamento'
 *       );
 *     }
 *   };
 * }
 * ```
 */

/**
 * EXEMPLO 9: Integração com store de autenticação
 *
 * ```tsx
 * import { useNotifications } from '../hooks/useNotifications';
 * import { useAuthStore } from '../stores/authStore';
 *
 * function useAuth() {
 *   const { register, unregister } = useNotifications();
 *   const authStore = useAuthStore();
 *
 *   const login = async (email: string, password: string) => {
 *     const result = await authStore.login(email, password);
 *
 *     if (result.success) {
 *       // Registrar para notificações após login
 *       await register();
 *     }
 *
 *     return result;
 *   };
 *
 *   const logout = async () => {
 *     // Remover registro de notificações antes de fazer logout
 *     await unregister();
 *     await authStore.logout();
 *   };
 *
 *   return { login, logout };
 * }
 * ```
 */

/**
 * EXEMPLO 10: Monitorar notificações recebidas
 *
 * ```tsx
 * import { useNotifications } from '../hooks/useNotifications';
 *
 * function NotificationMonitor() {
 *   const { notification } = useNotifications();
 *
 *   useEffect(() => {
 *     if (notification) {
 *       const data = notification.request.content.data;
 *       console.log('Nova notificação recebida:', data);
 *
 *       // Atualizar UI, mostrar toast, etc.
 *       Toast.show({
 *         type: 'info',
 *         text1: notification.request.content.title,
 *         text2: notification.request.content.body,
 *       });
 *     }
 *   }, [notification]);
 *
 *   return null; // Componente invisível
 * }
 * ```
 */

/**
 * NOTAS IMPORTANTES:
 *
 * 1. Push notifications NÃO funcionam em emuladores, apenas em dispositivos físicos.
 *
 * 2. No app.json/app.config.js, certifique-se de ter:
 *    ```json
 *    {
 *      "expo": {
 *        "plugins": [
 *          [
 *            "expo-notifications",
 *            {
 *              "icon": "./assets/notification-icon.png",
 *              "color": "#ffffff",
 *              "sounds": ["./assets/notification.wav"]
 *            }
 *          ]
 *        ]
 *      }
 *    }
 *    ```
 *
 * 3. Para iOS, você precisará de:
 *    - Apple Developer account
 *    - Certificados APN (Apple Push Notification)
 *    - Configuração no Expo
 *
 * 4. Para testar push notifications:
 *    - Use a ferramenta Expo Push Notification Tool: https://expo.dev/notifications
 *    - Ou envie via backend usando o Expo Push API
 *
 * 5. O backend deve enviar notificações no formato:
 *    ```json
 *    {
 *      "to": "ExponentPushToken[xxxxxx]",
 *      "sound": "default",
 *      "title": "Título da notificação",
 *      "body": "Corpo da notificação",
 *      "data": {
 *        "type": "order_confirmation",
 *        "orderId": "123",
 *        "eventId": "456"
 *      }
 *    }
 *    ```
 *
 * 6. Instalar dependências:
 *    ```bash
 *    npx expo install expo-notifications expo-device
 *    ```
 *
 * 7. Substituir 'your-expo-project-id' em notificationService.ts
 *    pelo ID real do projeto (encontrado em app.json ou no dashboard do Expo)
 */
