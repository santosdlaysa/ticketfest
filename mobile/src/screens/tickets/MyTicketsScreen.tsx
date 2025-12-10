import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Surface,
  Chip,
  IconButton,
} from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { ordersApi } from '../../services/api';
import { MyTicketsScreenSkeleton } from '../../components/common/SkeletonLoader';
import type { TicketsStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<TicketsStackParamList>;

interface TicketItem {
  id: string;
  ticketName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCode: string;
  qrCodeData: string;
  checkedIn: boolean;
  checkedInAt?: string;
  orderId: string;
  orderDate: string;
  orderTotal: number;
  paymentStatus: string;
  paymentMethod: string;
  ticketPrice: number;
}

interface TicketSection {
  title: string;
  icon: string;
  data: TicketItem[];
}

export default function MyTicketsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();

  const colors = isDark ? darkColors : lightColors;

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const orders = await ordersApi.getUserOrders();
      const allTickets: TicketItem[] = [];

      orders
        .filter((order) => order.status === 'CONFIRMED' && order.paymentStatus === 'PAID')
        .forEach((order) => {
          order.items?.forEach((item) => {
            item.ticketInstances?.forEach((instance) => {
              allTickets.push({
                id: instance.id,
                ticketName: item.ticket?.name || 'Ingresso',
                eventName: order.event?.name || 'Evento',
                eventDate: order.event?.date || '',
                eventLocation: order.event?.location || '',
                qrCode: instance.qrCode,
                qrCodeData: instance.qrCodeData,
                checkedIn: instance.checkedIn,
                checkedInAt: instance.checkedInAt,
                orderId: order.id,
                orderDate: order.createdAt,
                orderTotal: order.total,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                ticketPrice: item.price,
              });
            });
          });
        });

      setTickets(allTickets);
    } catch (error) {
      console.error('Erro ao carregar ingressos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarregar quando a tela ganhar foco (para atualizar após validação)
  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTickets();
  }, [loadTickets]);

  // Separar ingressos em seções
  const sections = useMemo((): TicketSection[] => {
    const now = new Date();

    const activeTickets: TicketItem[] = [];
    const historyTickets: TicketItem[] = [];

    tickets.forEach((ticket) => {
      const eventDate = new Date(ticket.eventDate);
      const isPast = eventDate < now;

      if (ticket.checkedIn || isPast) {
        historyTickets.push(ticket);
      } else {
        activeTickets.push(ticket);
      }
    });

    // Ordenar ativos por data do evento (próximos primeiro)
    activeTickets.sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateA - dateB;
    });

    // Ordenar histórico por data de uso ou data do evento (mais recentes primeiro)
    historyTickets.sort((a, b) => {
      const dateA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : new Date(a.eventDate).getTime();
      const dateB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : new Date(b.eventDate).getTime();
      return dateB - dateA;
    });

    const result: TicketSection[] = [];

    if (activeTickets.length > 0) {
      result.push({
        title: 'Ingressos Ativos',
        icon: 'ticket-confirmation',
        data: activeTickets,
      });
    }

    if (historyTickets.length > 0) {
      result.push({
        title: 'Histórico',
        icon: 'history',
        data: historyTickets,
      });
    }

    return result;
  }, [tickets]);

  const formatEventDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "EEE, dd 'de' MMM 'às' HH:mm", { locale: ptBR });
  };

  const formatCheckedInDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const isEventPast = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const handleTicketPress = (ticket: TicketItem) => {
    navigation.navigate('TicketDetails', { ticket });
  };

  const renderSectionHeader = ({ section }: { section: TicketSection }) => (
    <View style={styles.sectionHeader}>
      <IconButton
        icon={section.icon}
        size={20}
        iconColor={colors.primary}
        style={styles.sectionIcon}
      />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
        ({section.data.length})
      </Text>
    </View>
  );

  const renderTicketCard = ({ item }: { item: TicketItem }) => {
    const isPast = isEventPast(item.eventDate);

    return (
      <TouchableOpacity
        onPress={() => handleTicketPress(item)}
        activeOpacity={0.8}
      >
        <Surface
          style={[
            styles.ticketCard,
            { backgroundColor: colors.surface },
            isPast && styles.ticketCardPast,
            item.checkedIn && styles.ticketCardUsed,
          ]}
        >
          <View style={[styles.ticketLeft, { backgroundColor: isDark ? colors.surfaceVariant : '#f9f9f9' }]}>
            <View style={[styles.qrPreview, { backgroundColor: '#fff' }]}>
              <QRCode
                value={item.qrCodeData || item.id}
                size={60}
                color={item.checkedIn ? '#999' : '#000'}
              />
            </View>
          </View>

          <View style={styles.ticketDivider}>
            <View style={[styles.ticketNotchTop, { backgroundColor: colors.background }]} />
            <View style={[styles.ticketDottedLine, { backgroundColor: colors.divider }]} />
            <View style={[styles.ticketNotchBottom, { backgroundColor: colors.background }]} />
          </View>

          <View style={styles.ticketRight}>
            <Text style={[styles.ticketEventName, { color: colors.text }]} numberOfLines={2}>
              {item.eventName}
            </Text>
            <Text style={[styles.ticketType, { color: colors.primary }]}>{item.ticketName}</Text>
            <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>{formatEventDate(item.eventDate)}</Text>

            <View style={styles.ticketStatus}>
              {item.checkedIn ? (
                <View>
                  <Chip
                    icon="check-circle"
                    style={[styles.usedChip, { backgroundColor: isDark ? '#1a3a5c' : '#e3f2fd' }]}
                    textStyle={[styles.chipText, { color: isDark ? '#90caf9' : '#1976d2' }]}
                  >
                    Utilizado
                  </Chip>
                  {item.checkedInAt && (
                    <Text style={[styles.checkedInDate, { color: colors.textMuted }]}>
                      {formatCheckedInDate(item.checkedInAt)}
                    </Text>
                  )}
                </View>
              ) : isPast ? (
                <Chip
                  icon="clock-outline"
                  style={[styles.expiredChip, { backgroundColor: isDark ? '#333' : '#fafafa' }]}
                  textStyle={[styles.chipText, { color: colors.textSecondary }]}
                >
                  Encerrado
                </Chip>
              ) : (
                <Chip
                  icon="ticket-confirmation"
                  style={[styles.validChip, { backgroundColor: isDark ? '#1b4332' : '#e8f5e9' }]}
                  textStyle={[styles.chipText, { color: isDark ? '#81c784' : '#388e3c' }]}
                >
                  Válido
                </Chip>
              )}
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="ticket-outline" size={80} iconColor={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum ingresso</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Seus ingressos comprados aparecerão aqui
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={isDark
            ? [lumeraColors.pretoObsidian, lumeraColors.cinzaFumaca]
            : [lumeraColors.roxoLumera, lumeraColors.azulGlow]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <Text style={styles.headerTitle}>Meus Ingressos</Text>
          <Text style={styles.headerSubtitle}>Seus ingressos comprados</Text>
        </LinearGradient>
        <MyTicketsScreenSkeleton />
      </View>
    );
  }

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
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={styles.headerTitle}>Meus Ingressos</Text>
        <Text style={styles.headerSubtitle}>Histórico de ingressos comprados</Text>
      </LinearGradient>
      <SectionList
        sections={sections}
        renderItem={renderTicketCard}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    elevation: 8,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    color: 'rgba(255,255,255,0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  ticketCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  ticketCardPast: {
    opacity: 0.7,
  },
  ticketCardUsed: {
    opacity: 0.6,
  },
  ticketLeft: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPreview: {
    padding: spacing.xs,
    borderRadius: 4,
  },
  ticketDivider: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketNotchTop: {
    width: 20,
    height: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  ticketDottedLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  ticketNotchBottom: {
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  ticketRight: {
    flex: 1,
    padding: spacing.md,
  },
  ticketEventName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  ticketType: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  ticketStatus: {
    marginTop: spacing.sm,
  },
  validChip: {
    alignSelf: 'flex-start',
  },
  usedChip: {
    alignSelf: 'flex-start',
  },
  expiredChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: fontSize.xs,
  },
  checkedInDate: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionIcon: {
    margin: 0,
    marginRight: -spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
