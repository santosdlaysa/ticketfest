import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import type { TicketsStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type TicketDetailsRouteProp = RouteProp<TicketsStackParamList, 'TicketDetails'>;
type NavigationProp = NativeStackNavigationProp<TicketsStackParamList>;

type TabType = 'qrcode' | 'details';

export default function TicketDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TicketDetailsRouteProp>();
  const insets = useSafeAreaInsets();
  const { ticket } = route.params;
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

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
      <Surface style={[styles.qrCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.eventName, { color: colors.text }]}>{ticket.eventName}</Text>
        <Text style={[styles.ticketType, { color: colors.primary }]}>{ticket.ticketName}</Text>

        <View style={styles.qrWrapper}>
          <View style={[styles.qrContainer, { borderColor: colors.primary }, ticket.checkedIn && styles.qrContainerUsed]}>
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
          <Text style={[styles.validationLabel, { color: colors.textMuted }]}>Código de Validação</Text>
          <Text style={[styles.validationCode, { color: colors.text }]}>
            {ticket.id.slice(-12).toUpperCase()}
          </Text>
        </View>

        {ticket.checkedIn && ticket.checkedInAt ? (
          <View style={[styles.checkedInBanner, { backgroundColor: isDark ? '#1b4332' : '#e8f5e9' }]}>
            <IconButton icon="check-decagram" size={24} iconColor="#4caf50" />
            <View>
              <Text style={styles.checkedInText}>Check-in realizado</Text>
              <Text style={[styles.checkedInDate, { color: colors.textSecondary }]}>
                {formatFullDate(ticket.checkedInAt)}
              </Text>
            </View>
          </View>
        ) : !isPast ? (
          <View style={[styles.instructionBanner, { backgroundColor: colors.primary + '10' }]}>
            <IconButton icon="information" size={24} iconColor={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.primary }]}>
              Apresente este QR Code na entrada do evento
            </Text>
          </View>
        ) : null}
      </Surface>

      <View style={styles.securityNotice}>
        <IconButton icon="shield-check" size={20} iconColor={colors.textSecondary} />
        <Text style={[styles.securityText, { color: colors.textSecondary }]}>
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
      <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Evento</Text>
        <Text style={[styles.eventNameDetails, { color: colors.primary }]}>{ticket.eventName}</Text>

        <View style={styles.detailRow}>
          <IconButton
            icon="calendar"
            size={20}
            iconColor={colors.primary}
            style={styles.detailIcon}
          />
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Data</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatEventDate(ticket.eventDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <IconButton
            icon="clock-outline"
            size={20}
            iconColor={colors.primary}
            style={styles.detailIcon}
          />
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Horário</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatEventTime(ticket.eventDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <IconButton
            icon="map-marker"
            size={20}
            iconColor={colors.primary}
            style={styles.detailIcon}
          />
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Local</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{ticket.eventLocation}</Text>
          </View>
        </View>
      </Surface>

      {/* Ticket Info */}
      <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingresso</Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tipo</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{ticket.ticketName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Código</Text>
          <Text style={[styles.infoValueMono, { color: colors.text }]}>#{ticket.id.slice(-8).toUpperCase()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
          {ticket.checkedIn ? (
            <Chip icon="check-circle" style={[styles.usedChip, { backgroundColor: isDark ? '#1a3a5c' : '#e3f2fd' }]} textStyle={[styles.chipText, { color: isDark ? '#90caf9' : '#1976d2' }]}>
              Utilizado
            </Chip>
          ) : isPast ? (
            <Chip icon="clock-outline" style={[styles.expiredChip, { backgroundColor: colors.surfaceVariant }]} textStyle={[styles.chipText, { color: colors.textSecondary }]}>
              Encerrado
            </Chip>
          ) : (
            <Chip icon="ticket-confirmation" style={[styles.validChip, { backgroundColor: isDark ? '#1b4332' : '#e8f5e9' }]} textStyle={[styles.chipText, { color: isDark ? '#81c784' : '#388e3c' }]}>
              Válido
            </Chip>
          )}
        </View>
      </Surface>

      {/* Order Info */}
      <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados da Compra</Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Pedido</Text>
          <Text style={[styles.infoValueMono, { color: colors.text }]}>#{ticket.orderId.slice(0, 8)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Data da compra</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{formatFullDate(ticket.orderDate)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Pagamento</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {getPaymentMethodLabel(ticket.paymentMethod)}
          </Text>
        </View>

        <Divider style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Valor do ingresso</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{formatPrice(ticket.ticketPrice)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total do pedido</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(ticket.orderTotal)}</Text>
        </View>
      </Surface>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header com gradiente Lumera */}
      <LinearGradient
        colors={isDark
          ? [lumeraColors.pretoObsidian, lumeraColors.cinzaFumaca]
          : [lumeraColors.roxoLumera, lumeraColors.azulGlow]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          iconColor="#fff"
        />
        <Text style={styles.headerTitle}>Ingresso</Text>
        <View style={{ width: 48 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qrcode' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('qrcode')}
          activeOpacity={0.7}
        >
          <IconButton
            icon="qrcode"
            size={20}
            iconColor={activeTab === 'qrcode' ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'qrcode' && [styles.tabTextActive, { color: colors.primary }]]}>
            QR Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('details')}
          activeOpacity={0.7}
        >
          <IconButton
            icon="file-document-outline"
            size={20}
            iconColor={activeTab === 'details' ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'details' && [styles.tabTextActive, { color: colors.primary }]]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
    elevation: 8,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
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
    borderBottomWidth: 2,
  },
  tabIcon: {
    margin: 0,
    marginRight: -4,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  qrCard: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 3,
  },
  eventName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ticketType: {
    fontSize: fontSize.md,
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
    borderRadius: 8,
    borderWidth: 2,
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
    borderRadius: 8,
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
    marginBottom: spacing.xs,
  },
  validationCode: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
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
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
    width: '100%',
  },
  instructionText: {
    fontSize: fontSize.sm,
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
  },
  detailsCard: {
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  eventNameDetails: {
    fontSize: fontSize.lg,
    fontWeight: '600',
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
  },
  detailValue: {
    fontSize: fontSize.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  infoValueMono: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  divider: {
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  validChip: {
    height: 28,
  },
  usedChip: {
    height: 28,
  },
  expiredChip: {
    height: 28,
  },
  chipText: {
    fontSize: fontSize.xs,
  },
});
