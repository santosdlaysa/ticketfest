# Guia Rápido - Notificações Push

## Setup Inicial (5 minutos)

### 1. Instalar Dependências

```bash
cd mobile
npx expo install expo-notifications expo-device
```

### 2. Configurar Project ID

Edite `src/services/notificationService.ts` (linha ~58):

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'seu-project-id-aqui', // Substituir!
});
```

Para encontrar seu Project ID:
- Método 1: Verifique `app.json` em `extra.eas.projectId`
- Método 2: Acesse https://expo.dev e veja no dashboard
- Método 3: Execute `eas project:info`

### 3. Build e Teste

```bash
# Build de desenvolvimento
eas build --platform android --profile development

# Ou iniciar localmente
npm start
```

**Importante:** Push notifications só funcionam em dispositivos físicos, não em emuladores!

## Uso Básico

### Em Qualquer Componente

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { helpers } = useNotifications();

  const handleOrderCreated = async () => {
    await helpers.notifyOrderConfirmation('order-123', 'Nome do Evento');
  };

  return <Button onPress={handleOrderCreated}>Criar Pedido</Button>;
}
```

### Tipos de Notificação Disponíveis

```typescript
// 1. Confirmação de pedido
await helpers.notifyOrderConfirmation(orderId, eventName);

// 2. Pagamento aprovado
await helpers.notifyPaymentApproved(orderId, eventName);

// 3. Pagamento recusado
await helpers.notifyPaymentFailed(orderId, motivo);

// 4. Lembrete de evento (24h antes)
await helpers.scheduleEventReminder(eventName, eventId, eventDate, 24);

// 5. Ingresso disponível
await helpers.notifyTicketAvailable(eventName, eventId, ticketName);

// 6. Evento cancelado
await helpers.notifyEventCancelled(eventName, eventId);
```

## Testar Notificações

### 1. Testar Localmente

Use o componente de demonstração:

```typescript
import { NotificationDemo } from './src/components/NotificationDemo';

// Adicione em alguma tela para testar
<NotificationDemo />
```

### 2. Testar Push Remotas

1. Abra o app no dispositivo
2. Copie o Push Token do console
3. Acesse: https://expo.dev/notifications
4. Cole o token e envie uma notificação de teste

## Integração com Fluxos

### Fluxo de Checkout

```typescript
// CheckoutScreen.tsx
import { useNotifications } from '../hooks/useNotifications';

function CheckoutScreen() {
  const { helpers } = useNotifications();

  const handlePaymentSuccess = async (order) => {
    // Notificar confirmação
    await helpers.notifyOrderConfirmation(order.id, order.event.name);

    // Agendar lembrete
    await helpers.scheduleEventReminder(
      order.event.name,
      order.event.id,
      new Date(order.event.date),
      24
    );
  };

  return (/* ... */);
}
```

### Fluxo de Autenticação

```typescript
// AuthStore.ts
import { useNotifications } from '../hooks/useNotifications';

const login = async (email, password) => {
  const result = await api.login(email, password);

  if (result.success) {
    // Registrar para notificações após login
    const { register } = useNotifications();
    await register();
  }
};

const logout = async () => {
  // Remover registro antes de fazer logout
  const { unregister } = useNotifications();
  await unregister();

  await api.logout();
};
```

## Backend

O backend precisa implementar um endpoint:

### POST /api/users/push-token

```typescript
{
  token: string;
  platform: 'ios' | 'android';
  deviceName?: string;
  deviceModel?: string;
}
```

Veja `BACKEND_INTEGRATION.md` para implementação completa.

## Troubleshooting Rápido

### Notificação não aparece?

1. **Verificar permissões:**
```typescript
const { status } = await Notifications.getPermissionsAsync();
console.log(status); // deve ser 'granted'
```

2. **Verificar se é dispositivo físico:**
   - Emuladores NÃO suportam push notifications
   - Use um celular/tablet real

3. **Verificar logs:**
```bash
npx expo start
# Pressione 'j' para abrir debugger
# Verifique console do navegador
```

### Token não registra?

1. Verificar URL da API em `src/services/api.ts`
2. Verificar autenticação (token JWT)
3. Verificar se endpoint `/api/users/push-token` existe

### Navegação não funciona ao tocar?

1. Verificar se as rotas existem em `src/navigation/types.ts`
2. Verificar tipo de notificação no payload
3. Verificar logs no console

## Próximos Passos

1. ✅ Implementar endpoint no backend
2. ✅ Testar em dispositivo físico
3. ✅ Integrar com fluxos de checkout e pedidos
4. ✅ Configurar lembretes de eventos
5. ✅ Monitorar logs e erros

## Recursos

- 📚 [README Completo](./NOTIFICATIONS_README.md)
- 🔧 [Integração Backend](./BACKEND_INTEGRATION.md)
- 💡 [Exemplos de Código](./src/services/notificationExamples.ts)
- 🎨 [Componente Demo](./src/components/NotificationDemo.tsx)
- 🌐 [Expo Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- 🔔 [Ferramenta de Teste](https://expo.dev/notifications)

## Suporte

Em caso de dúvidas:
1. Consulte os arquivos de documentação
2. Verifique os exemplos em `notificationExamples.ts`
3. Use o componente `NotificationDemo` para testes
4. Verifique logs com `console.log('[Notifications]', ...)`

---

**Setup time:** ~5 minutos
**Difficulty:** Fácil
**Status:** Pronto para uso
