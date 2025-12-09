import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Chip,
  Divider,
} from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme, spacing, fontSize } from '../../theme';
import type { TicketsStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type TicketDetailsRouteProp = RouteProp<TicketsStackParamList, 'TicketDetails'>;
type NavigationProp = NativeStackNavigationProp<TicketsStackParamList>;

type TabType = 'qrcode' | 'details';

export default function TicketDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TicketDetailsRouteProp>();
  const { ticket } = route.params;

  const [activeTab, setActiveTab] = useState<TabType>('qrcode');

  const formatEventDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatEventTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: ptBR });
  };

  const formatFullDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const isEventPast = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'PIX':
        return 'PIX';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'DEBIT_CARD':
        return 'Cartão de Débito';
      case 'BOLETO':
        return 'Boleto';
      default:
        return method;
    }
  };

  const isPast = isEventPast(ticket.eventDate);

  const renderQRCodeTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      <Surface style={styles.qrCard}>
        <Text style={styles.eventName}>{ticket.eventName}</Text>
        <Text style={styles.ticketType}>{ticket.ticketName}</Text>

        <View style={styles.qrWrapper}>
          <View style={[styles.qrContainer, ticket.checkedIn && styles.qrContainerUsed]}>
            <QRCode
              value={ticket.qrCodeData || ticket.id}
              size={width * 0.6}
              backgroundColor="#fff"
              color={ticket.checkedIn ? '#999' : '#000'}
            />
          </View>

          {ticket.checkedIn && (
            <View style={styles.checkedInOverlay}>
              <IconButton icon="check-circle" size={60} iconColor="#4caf50" />
              <Text style={styles.checkedInOverlayText}>Utilizado</Text>
            </View>
          )}
        </View>

        <View style={styles.validationCodeContainer}>
          <Text style={styles.validationLabel}>Código de Validação</Text>
          <Text style={styles.validationCode}>
            {ticket.id.slice(-12).toUpperCase()}
          </Text>
        </View>

        {ticket.checkedIn && ticket.checkedInAt ? (
          <View style={styles.checkedInBanner}>
            <IconButton icon="check-decagram" size={24} iconColor="#4caf50" />
            <View>
              <Text style={styles.checkedInText}>Check-in realizado</Text>
              <Text style={styles.checkedInDate}>
                {formatFullDate(ticket.checkedInAt)}
              </Text>
            </View>
          </View>
        ) : !isPast ? (
          <View style={styles.instructionBanner}>
            <IconButton icon="information" size={24} iconColor={theme.colors.primary} />
            <Text style={styles.instructionText}>
              Apresente este QR Code na entrada do evento
            </Text>
          </View>
        ) : null}
      </Surface>

      <View style={styles.securityNotice}>
        <IconButton icon="shield-check" size={20} iconColor="#666" />
        <Text style={styles.securityText}>
          Ingresso protegido por criptografia
        </Text>
      </View>
    </ScrollView>
  );

  const renderDetailsTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Event Info */}
      <Surface style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Evento</Text>
        <Text style={styles.eventNameDetails}>{ticket.eventName}</Text>

        <View style={styles.detailRow}>
          <IconButton
            icon="calendar"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.detailIcon}
          />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Data</Text>
            <Text style={styles.detailValue}>
              {formatEventDate(ticket.eventDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <IconButton
            icon="clock-outline"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.detailIcon}
          />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Horário</Text>
            <Text style={styles.detailValue}>
              {formatEventTime(ticket.eventDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <IconButton
            icon="map-marker"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.detailIcon}
          />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Local</Text>
            <Text style={styles.detailValue}>{ticket.eventLocation}</Text>
          </View>
        </View>
      </Surface>

      {/* Ticket Info */}
      <Surface style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Ingresso</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo</Text>
          <Text style={styles.infoValue}>{ticket.ticketName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Código</Text>
          <Text style={styles.infoValueMono}>#{ticket.id.slice(-8).toUpperCase()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          {ticket.checkedIn ? (
            <Chip icon="check-circle" style={styles.usedChip} textStyle={styles.chipText}>
              Utilizado
            </Chip>
          ) : isPast ? (
            <Chip icon="clock-outline" style={styles.expiredChip} textStyle={styles.chipText}>
              Encerrado
            </Chip>
          ) : (
            <Chip icon="ticket-confirmation" style={styles.validChip} textStyle={styles.chipText}>
              Válido
            </Chip>
          )}
        </View>
      </Surface>

      {/* Order Info */}
      <Surface style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Dados da Compra</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pedido</Text>
          <Text style={styles.infoValueMono}>#{ticket.orderId.slice(0, 8)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data da compra</Text>
          <Text style={styles.infoValue}>{formatFullDate(ticket.orderDate)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pagamento</Text>
          <Text style={styles.infoValue}>
            {getPaymentMethodLabel(ticket.paymentMethod)}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Valor do ingresso</Text>
          <Text style={styles.infoValue}>{formatPrice(ticket.ticketPrice)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.totalLabel}>Total do pedido</Text>
          <Text style={styles.totalValue}>{formatPrice(ticket.orderTotal)}</Text>
        </View>
      </Surface>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Ingresso</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qrcode' && styles.tabActive]}
          onPress={() => setActiveTab('qrcode')}
          activeOpacity={0.7}
        >
          <IconButton
            icon="qrcode"
            size={20}
            iconColor={activeTab === 'qrcode' ? theme.colors.primary : '#666'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'qrcode' && styles.tabTextActive]}>
            QR Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
          activeOpacity={0.7}
        >
          <IconButton
            icon="file-document-outline"
            size={20}
            iconColor={activeTab === 'details' ? theme.colors.primary : '#666'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Detalhes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'qrcode' ? renderQRCodeTab() : renderDetailsTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabIcon: {
    margin: 0,
    marginRight: -4,
  },
  tabText: {
    fontSize: fontSize.md,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  qrCard: {
    borderRadius: theme.roundness * 2,
    backgroundColor: '#fff',
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 3,
  },
  eventName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  ticketType: {
    fontSize: fontSize.md,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  qrWrapper: {
    position: 'relative',
  },
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: theme.roundness,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  qrContainerUsed: {
    borderColor: '#ccc',
    opacity: 0.5,
  },
  checkedInOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.roundness,
  },
  checkedInOverlayText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: -spacing.sm,
  },
  validationCodeContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  validationLabel: {
    fontSize: fontSize.xs,
    color: '#999',
    marginBottom: spacing.xs,
  },
  validationCode: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginTop: spacing.lg,
    width: '100%',
  },
  checkedInText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#4caf50',
  },
  checkedInDate: {
    fontSize: fontSize.sm,
    color: '#666',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginTop: spacing.lg,
    width: '100%',
  },
  instructionText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    flex: 1,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  securityText: {
    fontSize: fontSize.xs,
    color: '#666',
  },
  detailsCard: {
    borderRadius: theme.roundness,
    backgroundColor: '#fff',
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  eventNameDetails: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailIcon: {
    margin: 0,
    marginRight: spacing.sm,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: '#999',
  },
  detailValue: {
    fontSize: fontSize.md,
    color: theme.colors.onSurface,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: '#666',
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  infoValueMono: {
    fontSize: fontSize.sm,
    color: theme.colors.onSurface,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  divider: {
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  validChip: {
    backgroundColor: '#e8f5e9',
    height: 28,
  },
  usedChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  expiredChip: {
    backgroundColor: '#fafafa',
    height: 28,
  },
  chipText: {
    fontSize: fontSize.xs,
  },
});
