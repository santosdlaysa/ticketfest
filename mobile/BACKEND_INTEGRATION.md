# Integração de Notificações Push - Backend

Este documento especifica os endpoints e a integração necessária no backend para suportar notificações push no aplicativo móvel.

## Endpoints Necessários

### 1. POST /api/users/push-token

Registra o token de push do dispositivo do usuário.

**Autenticação:** Requerida (Bearer Token)

**Request Body:**
```typescript
{
  token: string;          // Expo Push Token (formato: "ExponentPushToken[xxxxxx]")
  platform: 'ios' | 'android';
  deviceName?: string;    // Nome do dispositivo (ex: "iPhone 13 Pro")
  deviceModel?: string;   // Modelo do dispositivo (ex: "iPhone14,3")
}
```

**Response (Success - 200):**
```typescript
{
  success: true,
  message: "Token registrado com sucesso"
}
```

**Response (Error - 400):**
```typescript
{
  error: "Token inválido"
}
```

**Exemplo de Implementação (Node.js/Express):**
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PushToken } from '../models/PushToken';

const router = Router();

router.post('/users/push-token', authenticateToken, async (req, res) => {
  try {
    const { token, platform, deviceName, deviceModel } = req.body;
    const userId = req.user.id; // do middleware de autenticação

    // Validar token
    if (!token || !token.startsWith('ExponentPushToken[')) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Salvar ou atualizar token no banco
    await PushToken.upsert({
      userId,
      token,
      platform,
      deviceName,
      deviceModel,
      isActive: true,
      lastUsedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Token registrado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao registrar push token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
```

**Schema de Banco de Dados:**
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name VARCHAR(100),
  device_model VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_token UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);
```

### 2. DELETE /api/users/push-token

Remove o token de push do dispositivo (usado no logout).

**Autenticação:** Requerida (Bearer Token)

**Request Body:**
```typescript
{
  token: string;  // Token a ser removido
}
```

**Response (Success - 200):**
```typescript
{
  success: true,
  message: "Token removido com sucesso"
}
```

**Exemplo de Implementação:**
```typescript
router.delete('/users/push-token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Marcar token como inativo ou deletar
    await PushToken.update(
      { isActive: false },
      { where: { userId, token } }
    );

    res.json({
      success: true,
      message: 'Token removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover push token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

## Enviar Notificações Push

### Instalação do SDK do Expo

```bash
npm install expo-server-sdk
```

### Serviço de Notificações

Crie um serviço para gerenciar o envio de notificações:

**src/services/pushNotificationService.ts:**
```typescript
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PushToken } from '../models/PushToken';

const expo = new Expo();

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

interface NotificationData {
  type: NotificationType;
  orderId?: string;
  eventId?: string;
  ticketId?: string;
  [key: string]: any;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: NotificationData
) {
  try {
    // Buscar tokens ativos do usuário
    const pushTokens = await PushToken.findAll({
      where: { userId, isActive: true },
    });

    if (pushTokens.length === 0) {
      console.log(`Usuário ${userId} não tem tokens de push ativos`);
      return;
    }

    // Preparar mensagens
    const messages: ExpoPushMessage[] = pushTokens.map((tokenRecord) => {
      // Verificar se o token é válido
      if (!Expo.isExpoPushToken(tokenRecord.token)) {
        console.error(`Token inválido: ${tokenRecord.token}`);
        return null;
      }

      return {
        to: tokenRecord.token,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: getChannelId(data.type),
      };
    }).filter(Boolean) as ExpoPushMessage[];

    // Enviar em chunks (Expo recomenda chunks de até 100 notificações)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Erro ao enviar chunk de notificações:', error);
      }
    }

    // Verificar tickets para remover tokens inválidos
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const pushToken = pushTokens[i];

      if (ticket.status === 'error') {
        console.error(`Erro ao enviar para ${pushToken.token}:`, ticket.message);

        // Se o token for inválido, marcar como inativo
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await pushToken.update({ isActive: false });
        }
      }
    }

    return tickets;
  } catch (error) {
    console.error('Erro no serviço de push notification:', error);
    throw error;
  }
}

// Determinar o canal Android baseado no tipo
function getChannelId(type: NotificationType): string {
  switch (type) {
    case NotificationType.ORDER_CONFIRMATION:
    case NotificationType.PAYMENT_APPROVED:
    case NotificationType.PAYMENT_FAILED:
    case NotificationType.PAYMENT_REFUNDED:
      return 'orders';
    case NotificationType.EVENT_REMINDER:
    case NotificationType.TICKET_AVAILABLE:
    case NotificationType.EVENT_CANCELLED:
    case NotificationType.EVENT_UPDATED:
      return 'events';
    default:
      return 'default';
  }
}

// Enviar para múltiplos usuários
export async function sendBulkPushNotifications(
  userIds: string[],
  title: string,
  body: string,
  data: NotificationData
) {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushNotification(userId, title, body, data))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Notificações enviadas: ${successful} sucesso, ${failed} falhas`);

  return { successful, failed };
}
```

### Helpers para Tipos Específicos de Notificação

**src/services/notificationHelpers.ts:**
```typescript
import {
  sendPushNotification,
  sendBulkPushNotifications,
  NotificationType,
} from './pushNotificationService';

export const notificationHelpers = {
  // Notificar confirmação de pedido
  async notifyOrderConfirmation(userId: string, orderId: string, eventName: string) {
    return sendPushNotification(
      userId,
      'Pedido Confirmado!',
      `Seu pedido para ${eventName} foi confirmado com sucesso.`,
      {
        type: NotificationType.ORDER_CONFIRMATION,
        orderId,
      }
    );
  },

  // Notificar pagamento aprovado
  async notifyPaymentApproved(userId: string, orderId: string, eventName: string) {
    return sendPushNotification(
      userId,
      'Pagamento Aprovado!',
      `Seu pagamento para ${eventName} foi aprovado. Seus ingressos estão disponíveis.`,
      {
        type: NotificationType.PAYMENT_APPROVED,
        orderId,
      }
    );
  },

  // Notificar falha no pagamento
  async notifyPaymentFailed(userId: string, orderId: string, reason?: string) {
    return sendPushNotification(
      userId,
      'Pagamento Recusado',
      reason || 'Houve um problema com seu pagamento. Tente novamente.',
      {
        type: NotificationType.PAYMENT_FAILED,
        orderId,
      }
    );
  },

  // Notificar reembolso
  async notifyPaymentRefunded(userId: string, orderId: string, amount: number) {
    return sendPushNotification(
      userId,
      'Reembolso Processado',
      `Seu reembolso de R$ ${amount.toFixed(2)} foi processado.`,
      {
        type: NotificationType.PAYMENT_REFUNDED,
        orderId,
      }
    );
  },

  // Notificar lembrete de evento (1 dia antes)
  async notifyEventReminder(userId: string, eventId: string, eventName: string) {
    return sendPushNotification(
      userId,
      'Lembrete de Evento',
      `${eventName} acontece amanhã!`,
      {
        type: NotificationType.EVENT_REMINDER,
        eventId,
      }
    );
  },

  // Notificar ingressos disponíveis
  async notifyTicketAvailable(
    userIds: string[],
    eventId: string,
    eventName: string,
    ticketName: string
  ) {
    return sendBulkPushNotifications(
      userIds,
      'Ingressos Disponíveis!',
      `${ticketName} para ${eventName} estão disponíveis agora!`,
      {
        type: NotificationType.TICKET_AVAILABLE,
        eventId,
      }
    );
  },

  // Notificar cancelamento de evento
  async notifyEventCancelled(userIds: string[], eventId: string, eventName: string) {
    return sendBulkPushNotifications(
      userIds,
      'Evento Cancelado',
      `${eventName} foi cancelado. Você receberá reembolso em breve.`,
      {
        type: NotificationType.EVENT_CANCELLED,
        eventId,
      }
    );
  },

  // Notificar atualização de evento
  async notifyEventUpdated(userIds: string[], eventId: string, eventName: string) {
    return sendBulkPushNotifications(
      userIds,
      'Evento Atualizado',
      `${eventName} teve alterações. Confira os detalhes.`,
      {
        type: NotificationType.EVENT_UPDATED,
        eventId,
      }
    );
  },
};
```

## Exemplos de Uso no Backend

### 1. Após Criar Pedido

```typescript
import { notificationHelpers } from '../services/notificationHelpers';

// No controller de pedidos
async function createOrder(req, res) {
  try {
    const order = await Order.create(req.body);

    // Enviar notificação
    await notificationHelpers.notifyOrderConfirmation(
      req.user.id,
      order.id,
      order.event.name
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 2. Após Confirmação de Pagamento

```typescript
// Webhook do gateway de pagamento
async function handlePaymentWebhook(req, res) {
  const { orderId, status } = req.body;

  const order = await Order.findByPk(orderId, { include: [User, Event] });

  if (status === 'approved') {
    await order.update({ paymentStatus: 'PAID' });

    await notificationHelpers.notifyPaymentApproved(
      order.userId,
      order.id,
      order.event.name
    );
  } else if (status === 'rejected') {
    await notificationHelpers.notifyPaymentFailed(
      order.userId,
      order.id,
      'Pagamento recusado pela operadora'
    );
  }

  res.json({ success: true });
}
```

### 3. Lembrete de Evento (Cron Job)

```typescript
import cron from 'node-cron';

// Executar diariamente às 9h
cron.schedule('0 9 * * *', async () => {
  console.log('Enviando lembretes de eventos...');

  // Buscar eventos que acontecem amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const events = await Event.findAll({
    where: {
      date: {
        [Op.gte]: startOfDay(tomorrow),
        [Op.lte]: endOfDay(tomorrow),
      },
    },
    include: [
      {
        model: Order,
        where: { paymentStatus: 'PAID' },
        include: [User],
      },
    ],
  });

  for (const event of events) {
    const userIds = event.orders.map((order) => order.userId);

    if (userIds.length > 0) {
      await notificationHelpers.notifyEventReminder(
        userIds[0], // ou use sendBulkPushNotifications
        event.id,
        event.name
      );
    }
  }
});
```

### 4. Quando Ingresso Volta a Ficar Disponível

```typescript
async function releaseTickets(req, res) {
  const { ticketId } = req.params;

  const ticket = await Ticket.findByPk(ticketId, { include: [Event] });

  // Liberar ingressos que estavam reservados
  await ticket.update({ available: ticket.available + 10 });

  // Buscar usuários interessados (que tentaram comprar antes)
  const interestedUsers = await getInterestedUsers(ticket.eventId);

  await notificationHelpers.notifyTicketAvailable(
    interestedUsers,
    ticket.eventId,
    ticket.event.name,
    ticket.name
  );

  res.json({ success: true });
}
```

## Monitoramento e Logs

### Salvar Histórico de Notificações

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20), -- 'sent', 'failed'
  error_message TEXT
);
```

### Implementação do Log

```typescript
async function logNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: any,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  await NotificationLog.create({
    userId,
    type,
    title,
    body,
    data,
    status,
    errorMessage,
  });
}
```

## Variáveis de Ambiente

Adicione ao `.env`:

```env
# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token-here
```

## Testes

### Testar Envio de Notificação

```typescript
// POST /api/test/notification
router.post('/test/notification', authenticateToken, async (req, res) => {
  try {
    await sendPushNotification(
      req.user.id,
      'Teste de Notificação',
      'Esta é uma notificação de teste!',
      { type: NotificationType.ORDER_CONFIRMATION }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Considerações de Performance

1. **Rate Limiting**: Expo limita o envio de notificações. Use filas (Bull, RabbitMQ) para processar grandes volumes.

2. **Retry Logic**: Implemente retry automático para notificações que falharem.

3. **Batch Processing**: Envie notificações em lotes para melhor performance.

4. **Cleanup**: Remova tokens inativos regularmente para manter a base limpa.

## Segurança

1. **Validação**: Sempre valide o formato do token antes de salvar.
2. **Rate Limiting**: Limite quantas vezes um usuário pode registrar tokens.
3. **Sanitização**: Sanitize dados antes de incluir em notificações.
4. **Autenticação**: Todos os endpoints devem requerer autenticação.

---

**Última atualização:** 2025-12-26
