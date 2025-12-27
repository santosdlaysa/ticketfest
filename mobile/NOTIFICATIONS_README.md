# Sistema de Notificações Push - Lumera Mobile

Este documento descreve o sistema completo de notificações push implementado no aplicativo móvel Lumera usando Expo Notifications.

## Índice

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Arquitetura](#arquitetura)
5. [Uso](#uso)
6. [Tipos de Notificação](#tipos-de-notificação)
7. [Integração com Backend](#integração-com-backend)
8. [Testes](#testes)
9. [Troubleshooting](#troubleshooting)

## Visão Geral

O sistema de notificações permite:
- Receber notificações push remotas do backend
- Agendar notificações locais
- Navegar automaticamente para telas relevantes ao tocar em notificações
- Gerenciar badges e canais de notificação (Android)
- Configurar comportamento de notificações em foreground/background

## Instalação

### 1. Instalar dependências

```bash
npx expo install expo-notifications expo-device
```

### 2. Configurar app.json

O arquivo `app.json` já está configurado com:
- Plugin `expo-notifications`
- Permissões Android necessárias
- Configuração de background modes para iOS
- Ícone e cor de notificação

### 3. Configurar Project ID

No arquivo `src/services/notificationService.ts`, substitua:

```typescript
projectId: 'your-expo-project-id'
```

Pelo ID do seu projeto Expo (encontrado em `app.json` em `extra.eas.projectId` ou no dashboard do Expo).

## Configuração

### Android

#### Canais de Notificação

O sistema cria automaticamente 3 canais:

1. **default** - Notificações gerais
2. **orders** - Pedidos e pagamentos (alta prioridade)
3. **events** - Eventos e lembretes (prioridade padrão)

#### Firebase Cloud Messaging (FCM)

Para notificações push no Android, você precisa:

1. Criar projeto no [Firebase Console](https://console.firebase.google.com/)
2. Adicionar app Android
3. Baixar `google-services.json` e colocar na raiz do projeto mobile
4. Configurar as credenciais no Expo:

```bash
eas credentials
```

### iOS

#### Apple Push Notification (APN)

Para notificações push no iOS, você precisa:

1. Apple Developer Account
2. Certificados APN
3. Configurar as credenciais no Expo:

```bash
eas credentials
```

## Arquitetura

### Arquivos Principais

```
mobile/
├── src/
│   ├── services/
│   │   ├── notificationService.ts      # Serviço principal de notificações
│   │   └── notificationExamples.ts     # Exemplos de uso
│   ├── hooks/
│   │   └── useNotifications.ts         # Hook React para notificações
│   └── navigation/
│       └── types.ts                    # Tipos de navegação (atualizados)
├── App.tsx                             # Integração inicial
└── app.json                            # Configuração Expo
```

### Fluxo de Notificação

```
1. App inicia
   ↓
2. useNotifications hook solicita permissões
   ↓
3. Obtém Expo Push Token
   ↓
4. Registra token no backend (POST /api/users/push-token)
   ↓
5. Backend pode enviar notificações
   ↓
6. App recebe notificação
   ↓
7. Listener processa e navega (se tocada)
```

## Uso

### 1. Uso Básico no App

O hook já está integrado no `App.tsx` e registra automaticamente o dispositivo na inicialização.

### 2. Uso em Componentes

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    expoPushToken,
    isRegistered,
    helpers,
    clearBadge
  } = useNotifications();

  // Verificar status
  useEffect(() => {
    if (isRegistered) {
      console.log('Dispositivo registrado:', expoPushToken);
    }
  }, [isRegistered]);

  // Criar notificação local
  const handleOrderCreated = async (orderId: string, eventName: string) => {
    await helpers.notifyOrderConfirmation(orderId, eventName);
  };

  return (
    // ... seu componente
  );
}
```

### 3. Agendar Lembretes de Evento

```typescript
import { notificationHelpers } from '../services/notificationService';

// Agendar lembrete 24h antes do evento
const scheduleReminder = async () => {
  const eventDate = new Date('2025-01-15T20:00:00');

  await notificationHelpers.scheduleEventReminder(
    'Festival de Música',
    'event-123',
    eventDate,
    24 // horas antes
  );
};
```

### 4. Notificações de Pedido

```typescript
// No fluxo de checkout
const handlePaymentSuccess = async (order) => {
  // Notificar confirmação
  await helpers.notifyOrderConfirmation(
    order.id,
    order.event.name
  );

  // Agendar lembrete do evento
  await helpers.scheduleEventReminder(
    order.event.name,
    order.event.id,
    new Date(order.event.date),
    24
  );
};
```

### 5. Gerenciar Badge

```typescript
const { clearBadge, setBadge } = useNotifications();

// Limpar badge
await clearBadge();

// Definir número de notificações não lidas
await setBadge(5);
```

## Tipos de Notificação

O sistema suporta os seguintes tipos:

### 1. ORDER_CONFIRMATION
Confirmação de pedido criado
- **Prioridade**: Alta
- **Som**: Sim
- **Canal**: orders

### 2. PAYMENT_APPROVED
Pagamento aprovado
- **Prioridade**: Alta
- **Som**: Sim
- **Canal**: orders
- **Navegação**: OrderDetails

### 3. PAYMENT_FAILED
Pagamento recusado
- **Prioridade**: Alta
- **Som**: Sim
- **Canal**: orders
- **Navegação**: OrderDetails

### 4. PAYMENT_REFUNDED
Pagamento reembolsado
- **Prioridade**: Alta
- **Som**: Sim
- **Canal**: orders

### 5. EVENT_REMINDER
Lembrete de evento
- **Prioridade**: Padrão
- **Som**: Não
- **Canal**: events
- **Navegação**: EventDetails

### 6. TICKET_AVAILABLE
Ingressos disponíveis
- **Prioridade**: Padrão
- **Som**: Não
- **Canal**: events
- **Navegação**: EventDetails

### 7. EVENT_CANCELLED
Evento cancelado
- **Prioridade**: Alta
- **Som**: Sim
- **Canal**: events
- **Navegação**: EventDetails

### 8. EVENT_UPDATED
Evento atualizado
- **Prioridade**: Padrão
- **Som**: Não
- **Canal**: events
- **Navegação**: EventDetails

## Integração com Backend

### Endpoint: POST /api/users/push-token

Registra o token de push do dispositivo.

**Request:**
```typescript
{
  token: string;          // Expo Push Token
  platform: 'ios' | 'android';
  deviceName?: string;
  deviceModel?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### Endpoint: DELETE /api/users/push-token

Remove o token (usado no logout).

**Request:**
```typescript
{
  token: string;
}
```

### Enviar Notificação Push do Backend

Use a API do Expo Push Notification:

```typescript
// Backend (Node.js/Express)
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: any
) {
  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
    channelId: 'orders', // Android channel
  }];

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log('Notificações enviadas:', receipts);
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  }
}

// Exemplo de uso
await sendPushNotification(
  userPushToken,
  'Pagamento Aprovado!',
  'Seu pagamento foi aprovado com sucesso.',
  {
    type: 'payment_approved',
    orderId: '123',
    eventId: '456'
  }
);
```

### Formato de Data Payload

```typescript
{
  type: NotificationType;  // Ex: 'order_confirmation'
  orderId?: string;
  eventId?: string;
  ticketId?: string;
  // ... outros dados customizados
}
```

## Testes

### Testar em Dispositivo Físico

1. **Build do app:**
```bash
eas build --platform android --profile development
# ou
eas build --platform ios --profile development
```

2. **Instalar no dispositivo**

3. **Verificar logs:**
```bash
npx expo start
# Abrir o app e verificar console
```

### Testar com Expo Push Notification Tool

1. Abra: https://expo.dev/notifications
2. Cole o Expo Push Token (obtido do console)
3. Configure título, mensagem e data
4. Envie a notificação

### Testar Notificações Locais

```typescript
import { notificationHelpers } from '../services/notificationService';

// Em qualquer componente
const testNotification = async () => {
  await notificationHelpers.notifyOrderConfirmation(
    'test-order-123',
    'Evento Teste'
  );
};
```

## Troubleshooting

### Notificações não aparecem

1. **Verificar permissões:**
```typescript
const { status } = await Notifications.getPermissionsAsync();
console.log('Status permissão:', status);
```

2. **Verificar se é dispositivo físico:**
   - Push notifications NÃO funcionam em emuladores
   - Notificações locais funcionam em emuladores

3. **Verificar token:**
```typescript
const token = await Notifications.getExpoPushTokenAsync();
console.log('Push Token:', token);
```

### Navegação não funciona ao tocar

1. Verificar se os tipos de navegação estão corretos
2. Verificar se a tela existe em `navigation/types.ts`
3. Verificar logs do console

### Android: Notificações silenciosas

1. Verificar se o canal está configurado
2. Verificar configurações do dispositivo
3. Aumentar importância do canal:
```typescript
importance: Notifications.AndroidImportance.MAX
```

### iOS: Notificações não recebidas em background

1. Verificar `UIBackgroundModes` no app.json
2. Verificar certificados APN
3. Verificar se o app não está em modo "Não Perturbe"

### Token não registra no backend

1. Verificar URL da API
2. Verificar autenticação (token JWT)
3. Verificar logs do backend
4. Verificar se o endpoint existe

## Próximos Passos

### Melhorias Recomendadas

1. **Implementar Deep Linking:**
   - Permitir abrir o app através de notificações quando fechado

2. **Adicionar Notification Categories (iOS):**
   - Ações rápidas nas notificações (responder, confirmar, etc.)

3. **Implementar Quiet Hours:**
   - Não enviar notificações em horários específicos

4. **Analytics:**
   - Rastrear taxa de abertura de notificações
   - Medir engajamento por tipo

5. **Notificações Rich:**
   - Adicionar imagens e mídia
   - Botões de ação customizados

6. **Preferências de Usuário:**
   - Permitir usuário configurar tipos de notificação
   - Frequência de lembretes

### Recursos Adicionais

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do console
2. Consultar este README
3. Verificar `notificationExamples.ts` para exemplos
4. Consultar documentação oficial do Expo

---

**Última atualização:** 2025-12-26
