import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
  Surface,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, lumeraColors } from '../../theme';
import { eventsApi, ticketsApi } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import type { Event, Ticket } from '../../types';
import type { HomeStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.4;

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type RouteProps = RouteProp<HomeStackParamList, 'EventDetails'>;

const categoryConfig: Record<string, { icon: string; color: string }> = {
  'Música': { icon: 'music', color: lumeraColors.roxoLumera },
  'Festival': { icon: 'party-popper', color: lumeraColors.lilasNeon },
  'Teatro': { icon: 'drama-masks', color: lumeraColors.azulGlow },
  'Esporte': { icon: 'soccer', color: '#4CAF50' },
  'Comédia': { icon: 'emoticon-happy', color: lumeraColors.douradoSuave },
  'Balada': { icon: 'glass-cocktail', color: lumeraColors.roxoLumera },
  'Cultura': { icon: 'palette', color: lumeraColors.azulGlow },
};

export default function EventDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { eventId } = route.params;
  const { addToCart, loading: cartLoading, itemCount } = useCartStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const [eventData, ticketsData] = await Promise.all([
        eventsApi.getById(eventId),
        ticketsApi.getByEvent(eventId),
      ]);
      setEvent(eventData);
      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do evento');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: format(date, 'dd', { locale: ptBR }),
      month: format(date, 'MMM', { locale: ptBR }).toUpperCase(),
      full: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
      time: format(date, 'HH:mm', { locale: ptBR }),
    };
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setQuantity(1);
    setModalVisible(true);
  };

  const handleAddToCart = async () => {
    if (!selectedTicket) return;

    try {
      await addToCart(selectedTicket.id, quantity);
      setModalVisible(false);
      Alert.alert(
        'Adicionado ao carrinho',
        `${quantity}x ${selectedTicket.name}`,
        [
          { text: 'Continuar', style: 'cancel' },
          { text: 'Ver carrinho', onPress: () => navigation.navigate('Cart') },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao adicionar ao carrinho');
    }
  };

  const isTicketAvailable = (ticket: Ticket) => {
    const now = new Date();
    const salesStart = new Date(ticket.salesStart);
    const salesEnd = new Date(ticket.salesEnd);
    const available = ticket.quantity - ticket.sold;
    return now >= salesStart && now <= salesEnd && available > 0;
  };

  const getTicketStatus = (ticket: Ticket) => {
    const now = new Date();
    const salesStart = new Date(ticket.salesStart);
    const salesEnd = new Date(ticket.salesEnd);
    const available = ticket.quantity - ticket.sold;

    if (now < salesStart) return { text: 'Em breve', color: '#FF9800', icon: 'clock-outline' };
    if (now > salesEnd) return { text: 'Encerrado', color: '#9E9E9E', icon: 'close-circle' };
    if (available <= 0) return { text: 'Esgotado', color: '#F44336', icon: 'close-circle' };
    if (available <= 10) return { text: `Últimas ${available}!`, color: '#FF5722', icon: 'fire' };
    return { text: `${available} disponíveis`, color: '#4CAF50', icon: 'check-circle' };
  };

  const getMinPrice = () => {
    if (tickets.length === 0) return null;
    const prices = tickets.map(t => t.price);
    return Math.min(...prices);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorTitle}>Evento não encontrado</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }

  const imageUrl = event.images?.[0] || 'https://via.placeholder.com/400x250?text=Evento';
  const dateInfo = formatEventDate(event.date);
  const category = categoryConfig[event.category] || { icon: 'calendar', color: theme.colors.primary };
  const minPrice = getMinPrice();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', lumeraColors.pretoObsidian + 'E6']}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Cart Button */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#fff" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Date Badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{dateInfo.day}</Text>
            <Text style={styles.dateMonth}>{dateInfo.month}</Text>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
              <MaterialCommunityIcons name={category.icon as any} size={14} color="#fff" />
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
            <Text style={styles.heroTitle}>{event.name}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Quick Info Cards */}
          <View style={styles.quickInfoContainer}>
            <Surface style={styles.quickInfoCard}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} />
              <Text style={styles.quickInfoLabel}>Data e hora</Text>
              <Text style={styles.quickInfoValue}>{dateInfo.full}</Text>
              <Text style={styles.quickInfoSubvalue}>{dateInfo.time}</Text>
            </Surface>

            <Surface style={styles.quickInfoCard}>
              <MaterialCommunityIcons name="map-marker" size={24} color={theme.colors.primary} />
              <Text style={styles.quickInfoLabel}>Local</Text>
              <Text style={styles.quickInfoValue} numberOfLines={2}>{event.location}</Text>
            </Surface>
          </View>

          {/* Location Card */}
          <Surface style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MaterialCommunityIcons name="map-marker-radius" size={24} color={theme.colors.primary} />
              <Text style={styles.locationTitle}>Endereço</Text>
            </View>
            <Text style={styles.locationName}>{event.location}</Text>
            <Text style={styles.locationAddress}>{event.address}</Text>
            <TouchableOpacity style={styles.mapButton}>
              <MaterialCommunityIcons name="directions" size={18} color={theme.colors.primary} />
              <Text style={styles.mapButtonText}>Ver no mapa</Text>
            </TouchableOpacity>
          </Surface>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information" size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Sobre o evento</Text>
            </View>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Organizer */}
          {event.organizer && (
            <Surface style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <MaterialCommunityIcons name="account" size={24} color="#fff" />
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerLabel}>Organizado por</Text>
                <Text style={styles.organizerName}>{event.organizer.name}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
            </Surface>
          )}

          {/* Tickets Section */}
          <View style={styles.ticketsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="ticket" size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Ingressos</Text>
            </View>

            {tickets.length === 0 ? (
              <View style={styles.noTickets}>
                <MaterialCommunityIcons name="ticket-outline" size={48} color="#ccc" />
                <Text style={styles.noTicketsText}>Ingressos em breve</Text>
              </View>
            ) : (
              tickets.map((ticket) => {
                const available = isTicketAvailable(ticket);
                const status = getTicketStatus(ticket);

                return (
                  <Surface key={ticket.id} style={[styles.ticketCard, !available && styles.ticketCardDisabled]}>
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketMain}>
                        <Text style={styles.ticketName}>{ticket.name}</Text>
                        {ticket.description && (
                          <Text style={styles.ticketDescription}>{ticket.description}</Text>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                          <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
                          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                        </View>
                      </View>

                      <View style={styles.ticketPricing}>
                        <Text style={styles.ticketPrice}>{formatPrice(ticket.price)}</Text>
                        <TouchableOpacity
                          style={[styles.selectButton, !available && styles.selectButtonDisabled]}
                          onPress={() => handleSelectTicket(ticket)}
                          disabled={!available}
                        >
                          <Text style={[styles.selectButtonText, !available && styles.selectButtonTextDisabled]}>
                            {available ? 'Selecionar' : 'Indisponível'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {ticket.features && ticket.features.length > 0 && (
                      <View style={styles.featuresContainer}>
                        {ticket.features.map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <MaterialCommunityIcons name="check" size={16} color="#4CAF50" />
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Surface>
                );
              })
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Bar */}
      {minPrice !== null && (
        <Surface style={styles.bottomBar}>
          <View style={styles.bottomPricing}>
            <Text style={styles.bottomLabel}>A partir de</Text>
            <Text style={styles.bottomPrice}>{formatPrice(minPrice)}</Text>
          </View>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => {
              const availableTicket = tickets.find(t => isTicketAvailable(t));
              if (availableTicket) handleSelectTicket(availableTicket);
            }}
          >
            <Text style={styles.bottomButtonText}>Comprar ingresso</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </Surface>
      )}

      {/* Quantity Selection Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="ticket" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Selecionar quantidade</Text>
          </View>

          {selectedTicket && (
            <>
              <View style={styles.modalTicketInfo}>
                <Text style={styles.modalTicketName}>{selectedTicket.name}</Text>
                <Text style={styles.modalTicketPrice}>{formatPrice(selectedTicket.price)} / un</Text>
              </View>

              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <MaterialCommunityIcons name="minus" size={24} color={quantity <= 1 ? '#ccc' : theme.colors.primary} />
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityNumber}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.quantityButton, (quantity >= selectedTicket.quantity - selectedTicket.sold || quantity >= 10) && styles.quantityButtonDisabled]}
                  onPress={() => {
                    const maxAvailable = selectedTicket.quantity - selectedTicket.sold;
                    if (quantity < maxAvailable && quantity < 10) {
                      setQuantity(quantity + 1);
                    }
                  }}
                  disabled={quantity >= selectedTicket.quantity - selectedTicket.sold || quantity >= 10}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={24}
                    color={(quantity >= selectedTicket.quantity - selectedTicket.sold || quantity >= 10) ? '#ccc' : theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalTotal}>
                <Text style={styles.modalTotalLabel}>Total</Text>
                <Text style={styles.modalTotalValue}>{formatPrice(selectedTicket.price * quantity)}</Text>
              </View>

              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
                disabled={cartLoading}
              >
                {cartLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cart-plus" size={20} color="#fff" />
                    <Text style={styles.addToCartText}>Adicionar ao carrinho</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: spacing.md,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 18,
    color: '#666',
    marginVertical: spacing.md,
  },

  // Hero
  heroContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: IMAGE_HEIGHT * 0.6,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
    position: 'absolute',
    top: 48,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  dateBadge: {
    position: 'absolute',
    top: 48,
    right: spacing.md + 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    elevation: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: spacing.sm,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Content
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },

  // Quick Info
  quickInfoContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: -40,
    marginBottom: spacing.md,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 4,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginTop: 4,
  },
  quickInfoSubvalue: {
    fontSize: 18,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
    marginTop: 2,
  },

  // Location
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },

  // Organizer
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  organizerLabel: {
    fontSize: 12,
    color: '#999',
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },

  // Tickets
  ticketsSection: {
    marginBottom: spacing.lg,
  },
  noTickets: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  noTicketsText: {
    fontSize: 16,
    color: '#999',
    marginTop: spacing.md,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
    overflow: 'hidden',
  },
  ticketCardDisabled: {
    opacity: 0.6,
  },
  ticketContent: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  ticketMain: {
    flex: 1,
    marginRight: spacing.md,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  ticketDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ticketPricing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
    marginBottom: spacing.sm,
  },
  selectButton: {
    backgroundColor: lumeraColors.roxoLumera,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButtonTextDisabled: {
    color: '#999',
  },
  featuresContainer: {
    backgroundColor: '#FAFAFA',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
  },
  bottomPricing: {},
  bottomLabel: {
    fontSize: 12,
    color: '#999',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lumeraColors.roxoLumera,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    elevation: 6,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal
  modal: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    borderRadius: 24,
    padding: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  modalTicketInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTicketName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  modalTicketPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    borderColor: '#E0E0E0',
  },
  quantityDisplay: {
    width: 80,
    alignItems: 'center',
  },
  quantityNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: spacing.lg,
  },
  modalTotalLabel: {
    fontSize: 16,
    color: '#666',
  },
  modalTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lumeraColors.roxoLumera,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    elevation: 6,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
