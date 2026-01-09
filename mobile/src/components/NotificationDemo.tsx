/**
 * COMPONENTE DE DEMONSTRAÇÃO - NÃO USAR EM PRODUÇÃO
 *
 * Este componente demonstra como usar o sistema de notificações.
 * Use como referência para implementar em seus próprios componentes.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, Divider, Chip } from 'react-native-paper';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType } from '../services/notificationService';

export function NotificationDemo() {
  const {
    expoPushToken,
    isRegistered,
    notification,
    error,
    register,
    unregister,
    clearBadge,
    setBadge,
    helpers,
  } = useNotifications();

  const [lastNotification, setLastNotification] = useState<any>(null);

  // Monitora notificações recebidas
  useEffect(() => {
    if (notification) {
      setLastNotification({
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }, [notification]);

  // Handlers para testar notificações locais
  const handleTestOrderConfirmation = async () => {
    try {
      await helpers.notifyOrderConfirmation('order-123', 'Festival de Música 2025');
      Alert.alert('Sucesso', 'Notificação de pedido enviada!');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleTestPaymentApproved = async () => {
    try {
      await helpers.notifyPaymentApproved('order-456', 'Show de Rock');
      Alert.alert('Sucesso', 'Notificação de pagamento enviada!');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleTestPaymentFailed = async () => {
    try {
      await helpers.notifyPaymentFailed('order-789', 'Cartão recusado pela operadora');
      Alert.alert('Sucesso', 'Notificação de falha enviada!');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleTestEventReminder = async () => {
    try {
      // Evento daqui a 25 horas, lembrete 24h antes (ou seja, daqui a 1h)
      const eventDate = new Date(Date.now() + 25 * 60 * 60 * 1000);

      await helpers.scheduleEventReminder(
        'Festival de Verão',
        'event-999',
        eventDate,
        24
      );

      Alert.alert(
        'Sucesso',
        'Lembrete agendado! Você receberá a notificação em 1 hora (simulando 24h antes do evento).'
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleTestTicketAvailable = async () => {
    try {
      await helpers.notifyTicketAvailable('Festival Tech', 'event-555', 'VIP Front Row');
      Alert.alert('Sucesso', 'Notificação de ingresso disponível enviada!');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleTestEventCancelled = async () => {
    try {
      await helpers.notifyEventCancelled('Show Indie', 'event-333');
      Alert.alert('Sucesso', 'Notificação de cancelamento enviada!');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleRegister = async () => {
    await register();
  };

  const handleUnregister = async () => {
    await unregister();
    Alert.alert('Sucesso', 'Notificações desregistradas');
  };

  const handleClearBadge = async () => {
    await clearBadge();
    Alert.alert('Sucesso', 'Badge limpo');
  };

  const handleSetBadge = async () => {
    await setBadge(5);
    Alert.alert('Sucesso', 'Badge definido para 5');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Status do Registro" />
        <Card.Content>
          <View style={styles.statusRow}>
            <Text variant="bodyMedium">Status:</Text>
            <Chip
              icon={isRegistered ? 'check-circle' : 'alert-circle'}
              mode="outlined"
              style={styles.statusChip}
            >
              {isRegistered ? 'Registrado' : 'Não Registrado'}
            </Chip>
          </View>

          {expoPushToken && (
            <View style={styles.tokenContainer}>
              <Text variant="bodySmall" style={styles.tokenLabel}>
                Push Token:
              </Text>
              <Text variant="bodySmall" style={styles.tokenText} selectable>
                {expoPushToken}
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text variant="bodySmall" style={styles.errorText}>
                Erro: {error}
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={handleRegister}
              disabled={isRegistered}
              style={styles.button}
            >
              Registrar
            </Button>
            <Button
              mode="outlined"
              onPress={handleUnregister}
              disabled={!isRegistered}
              style={styles.button}
            >
              Desregistrar
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Última Notificação Recebida" />
        <Card.Content>
          {lastNotification ? (
            <>
              <Text variant="labelLarge">{lastNotification.title}</Text>
              <Text variant="bodyMedium" style={styles.notifBody}>
                {lastNotification.body}
              </Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                Recebida às {lastNotification.timestamp}
              </Text>
              {lastNotification.data && (
                <View style={styles.dataContainer}>
                  <Text variant="bodySmall" style={styles.dataLabel}>
                    Dados:
                  </Text>
                  <Text variant="bodySmall" style={styles.dataText}>
                    {JSON.stringify(lastNotification.data, null, 2)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text variant="bodyMedium">Nenhuma notificação recebida ainda</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Testar Notificações de Pedido" />
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleTestOrderConfirmation}
            style={styles.testButton}
            icon="check-circle"
          >
            Confirmar Pedido
          </Button>
          <Button
            mode="contained"
            onPress={handleTestPaymentApproved}
            style={styles.testButton}
            icon="credit-card-check"
          >
            Pagamento Aprovado
          </Button>
          <Button
            mode="contained"
            onPress={handleTestPaymentFailed}
            style={styles.testButton}
            icon="credit-card-remove"
          >
            Pagamento Recusado
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Testar Notificações de Evento" />
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleTestEventReminder}
            style={styles.testButton}
            icon="bell"
          >
            Lembrete de Evento
          </Button>
          <Button
            mode="contained"
            onPress={handleTestTicketAvailable}
            style={styles.testButton}
            icon="ticket"
          >
            Ingresso Disponível
          </Button>
          <Button
            mode="contained"
            onPress={handleTestEventCancelled}
            style={styles.testButton}
            icon="cancel"
          >
            Evento Cancelado
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Gerenciar Badge" />
        <Card.Content>
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleClearBadge}
              style={styles.button}
              icon="close-circle"
            >
              Limpar Badge
            </Button>
            <Button
              mode="outlined"
              onPress={handleSetBadge}
              style={styles.button}
              icon="numeric-5-box"
            >
              Badge = 5
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Instruções" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.instruction}>
            1. Certifique-se de estar em um dispositivo físico (push não funciona em
            emuladores)
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            2. Clique em "Registrar" para obter permissões e token
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            3. Teste as notificações locais clicando nos botões acima
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            4. Para testar notificações push remotas, copie o Push Token e use a
            ferramenta: https://expo.dev/notifications
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            5. Ao tocar em uma notificação, você será navegado para a tela apropriada
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    marginLeft: 8,
  },
  tokenContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#c62828',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  notifBody: {
    marginTop: 8,
  },
  timestamp: {
    marginTop: 8,
    color: '#666',
  },
  dataContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  dataLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  testButton: {
    marginBottom: 8,
  },
  instruction: {
    marginBottom: 8,
    lineHeight: 20,
  },
});
