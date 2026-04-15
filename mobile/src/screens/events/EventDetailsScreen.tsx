import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Share,
  Platform,
  Linking,
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
import { EventDetailsSkeleton } from '../../components/common/SkeletonLoader';
import type { Event, Ticket } from '../../types';
import type { HomeStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.45;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 90;

// Helper to fix localhost URLs for mobile
const fixImageUrl = (url: string): string => {
  if (!url) return 'https://via.placeholder.com/400x250?text=Evento';
  return url.replace('http://localhost:3000', 'http://192.168.100.136:3000');
};

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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

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
      weekday: format(date, 'EEEE', { locale: ptBR }),
      full: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
      time: format(date, 'HH:mm', { locale: ptBR }),
      year: format(date, 'yyyy', { locale: ptBR }),
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
      Alert.alert('Sucesso', 'Item adicionado ao carrinho!');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || error.message || 'Erro ao adicionar ao carrinho');
    }
  };

  const handleShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.name,
        message: `${event.name}\n${formatEventDate(event.date).full} às ${formatEventDate(event.date).time}\n${event.location}`,
      });
    } catch (error) {
      // User cancelled
    }
  }, [event]);

  const handleOpenMap = useCallback(() => {
    if (!event) return;
    const address = encodeURIComponent(event.address || event.location);
    const url = Platform.select({
      ios: `maps:?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });
    if (url) Linking.openURL(url);
  }, [event]);

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
    const prices = tickets.filter(t => isTicketAvailable(t)).map(t => t.price);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  if (loading) {
    return <EventDetailsSkeleton />;
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

  const imageUrl = fixImageUrl(event.images?.[0] || '');
  const dateInfo = formatEventDate(event.date);
  const category = categoryConfig[event.category] || { icon: 'calendar', color: theme.colors.primary };
  const minPrice = getMinPrice();

  // Parallax effect
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
    outputRange: [IMAGE_HEIGHT / 2, 0, -IMAGE_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [IMAGE_HEIGHT - HEADER_HEIGHT - 50, IMAGE_HEIGHT - HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const shouldTruncateDescription = (event.description?.length || 0) > 200;
  const displayDescription = shouldTruncateDescription && !descriptionExpanded
    ? event.description?.substring(0, 200) + '...'
    : event.description;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Floating Header (appears on scroll) */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[lumeraColors.pretoObsidian, lumeraColors.pretoObsidian + 'F0']}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={20} color="#fff" />
            {itemCount > 0 && (
              <View style={styles.headerCartBadge}>
                <Text style={styles.headerCartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image with Parallax */}
        <View style={styles.heroContainer}>
          <Animated.Image
            source={{ uri: imageUrl }}
            style={[
              styles.heroImage,
              {
                transform: [
                  { translateY: imageTranslateY },
                  { scale: imageScale },
                ],
              },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', lumeraColors.pretoObsidian + 'EE']}
            locations={[0.2, 0.6, 1]}
            style={styles.heroGradient}
          />

          {/* Top Buttons */}
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.topButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.topRightButtons}>
              <TouchableOpacity style={styles.topButton} onPress={handleShare}>
                <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <MaterialCommunityIcons name="cart-outline" size={22} color="#fff" />
                {itemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{itemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + 'DD' }]}>
              <MaterialCommunityIcons name={category.icon as any} size={14} color="#fff" />
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
            <Text style={styles.heroTitle}>{event.name}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="calendar" size={16} color={lumeraColors.lilasNeon} />
                <Text style={styles.heroMetaText}>{dateInfo.full}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={lumeraColors.lilasNeon} />
                <Text style={styles.heroMetaText}>{dateInfo.time}h</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Quick Info Cards */}
          <View style={styles.quickInfoContainer}>
            <Surface style={styles.quickInfoCard}>
              <View style={[styles.quickInfoIconContainer, { backgroundColor: lumeraColors.roxoLumera + '12' }]}>
                <MaterialCommunityIcons name="calendar-month" size={22} color={lumeraColors.roxoLumera} />
              </View>
              <View style={styles.quickInfoTextContainer}>
                <Text style={styles.quickInfoLabel}>Data</Text>
                <Text style={styles.quickInfoValue}>{dateInfo.day} {dateInfo.month}</Text>
              </View>
              <Text style={styles.quickInfoHighlight}>{dateInfo.time}h</Text>
            </Surface>

            <Surface style={styles.quickInfoCard}>
              <View style={[styles.quickInfoIconContainer, { backgroundColor: lumeraColors.azulGlow + '12' }]}>
                <MaterialCommunityIcons name="map-marker" size={22} color={lumeraColors.azulGlow} />
              </View>
              <View style={styles.quickInfoTextContainer}>
                <Text style={styles.quickInfoLabel}>Local</Text>
                <Text style={styles.quickInfoValue} numberOfLines={1}>{event.location}</Text>
              </View>
              <TouchableOpacity onPress={handleOpenMap}>
                <MaterialCommunityIcons name="directions" size={22} color={lumeraColors.azulGlow} />
              </TouchableOpacity>
            </Surface>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.roxoLumera + '12' }]}>
                <MaterialCommunityIcons name="text-box-outline" size={18} color={lumeraColors.roxoLumera} />
              </View>
              <Text style={styles.sectionTitle}>Sobre o evento</Text>
            </View>
            <Text style={styles.description}>{displayDescription}</Text>
            {shouldTruncateDescription && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                <Text style={styles.readMoreText}>
                  {descriptionExpanded ? 'Ler menos' : 'Ler mais'}
                </Text>
                <MaterialCommunityIcons
                  name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={lumeraColors.roxoLumera}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Location Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.azulGlow + '12' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={18} color={lumeraColors.azulGlow} />
              </View>
              <Text style={styles.sectionTitle}>Localização</Text>
            </View>
            <Surface style={styles.locationCard}>
              <View style={styles.locationContent}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{event.location}</Text>
                  <Text style={styles.locationAddress}>{event.address}</Text>
                </View>
                <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
                  <LinearGradient
                    colors={[lumeraColors.azulGlow, lumeraColors.roxoLumera]}
                    style={styles.mapButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="directions" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Surface>
          </View>

          {/* Organizer */}
          {event.organizer && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.douradoSuave + '25' }]}>
                  <MaterialCommunityIcons name="account-star" size={18} color={lumeraColors.douradoSuave} />
                </View>
                <Text style={styles.sectionTitle}>Organizador</Text>
              </View>
              <Surface style={styles.organizerCard}>
                <LinearGradient
                  colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                  style={styles.organizerAvatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name="account" size={22} color="#fff" />
                </LinearGradient>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerLabel}>Organizado por</Text>
                  <Text style={styles.organizerName}>{event.organizer.name}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
              </Surface>
            </View>
          )}

          {/* Tickets Section */}
          <View style={styles.ticketsSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.lilasNeon + '20' }]}>
                <MaterialCommunityIcons name="ticket-confirmation" size={18} color={lumeraColors.lilasNeon} />
              </View>
              <Text style={styles.sectionTitle}>Ingressos</Text>
              {minPrice !== null && (
                <View style={styles.startingPrice}>
                  <Text style={styles.startingPriceLabel}>a partir de</Text>
                  <Text style={styles.startingPriceValue}>{formatPrice(minPrice)}</Text>
                </View>
              )}
            </View>

            {tickets.length === 0 ? (
              <View style={styles.noTickets}>
                <View style={styles.noTicketsIcon}>
                  <MaterialCommunityIcons name="ticket-outline" size={40} color={lumeraColors.lilasNeon} />
                </View>
                <Text style={styles.noTicketsTitle}>Ingressos em breve</Text>
                <Text style={styles.noTicketsText}>Fique atento para quando as vendas iniciarem</Text>
              </View>
            ) : (
              tickets.map((ticket) => {
                const available = isTicketAvailable(ticket);
                const status = getTicketStatus(ticket);

                return (
                  <View key={ticket.id} style={[styles.ticketCard, !available && styles.ticketCardDisabled]}>
                    {/* Ticket notch decorations */}
                    <View style={styles.ticketNotchLeft} />
                    <View style={styles.ticketNotchRight} />

                    <View style={styles.ticketTop}>
                      <View style={styles.ticketMain}>
                        <View style={styles.ticketNameRow}>
                          <Text style={styles.ticketName}>{ticket.name}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                            <MaterialCommunityIcons name={status.icon as any} size={12} color={status.color} />
                            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                          </View>
                        </View>
                        {ticket.description && (
                          <Text style={styles.ticketDescription} numberOfLines={2}>{ticket.description}</Text>
                        )}
                      </View>
                    </View>

                    {/* Dashed divider */}
                    <View style={styles.ticketDivider}>
                      <View style={styles.dashedLine} />
                    </View>

                    <View style={styles.ticketBottom}>
                      <View style={styles.ticketPriceContainer}>
                        <Text style={styles.ticketPriceLabel}>Valor</Text>
                        <Text style={styles.ticketPrice}>{formatPrice(ticket.price)}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.selectButton, !available && styles.selectButtonDisabled]}
                        onPress={() => handleSelectTicket(ticket)}
                        disabled={!available}
                        activeOpacity={0.8}
                      >
                        {available ? (
                          <LinearGradient
                            colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                            style={styles.selectButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <MaterialCommunityIcons name="cart-plus" size={16} color="#fff" />
                            <Text style={styles.selectButtonText}>Comprar</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.selectButtonDisabledInner}>
                            <Text style={styles.selectButtonTextDisabled}>Indisponível</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>

                    {ticket.features && ticket.features.length > 0 && (
                      <View style={styles.featuresContainer}>
                        {ticket.features.map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <MaterialCommunityIcons name="check-circle" size={14} color={lumeraColors.roxoLumera} />
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Bottom spacer for cart bar */}
          <View style={{ height: itemCount > 0 ? 80 : 20 }} />
        </View>
      </Animated.ScrollView>

      {/* Cart Bottom Bar */}
      {itemCount > 0 && (
        <View style={styles.bottomBarWrapper}>
          <LinearGradient
            colors={['transparent', 'rgba(245,245,245,0.9)', '#f5f5f5']}
            style={styles.bottomBarGradient}
          />
          <Surface style={styles.bottomBar}>
            <View style={styles.bottomContent}>
              <View style={styles.bottomPricing}>
                <MaterialCommunityIcons name="cart" size={20} color={lumeraColors.roxoLumera} />
                <Text style={styles.bottomLabel}>
                  {itemCount === 1 ? '1 item' : `${itemCount} itens`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => navigation.navigate('Cart')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                  style={styles.bottomButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.bottomButtonText}>Ver carrinho</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Surface>
        </View>
      )}

      {/* Quantity Selection Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <LinearGradient
              colors={[lumeraColors.roxoLumera + '15', lumeraColors.azulGlow + '10']}
              style={styles.modalIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="ticket-confirmation" size={28} color={lumeraColors.roxoLumera} />
            </LinearGradient>
            <Text style={styles.modalTitle}>Selecionar quantidade</Text>
          </View>

          {selectedTicket && (
            <>
              <Surface style={styles.modalTicketInfo}>
                <Text style={styles.modalTicketName}>{selectedTicket.name}</Text>
                <Text style={styles.modalTicketPrice}>{formatPrice(selectedTicket.price)} / un</Text>
              </Surface>

              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="minus" size={22} color={quantity <= 1 ? '#D0D0D0' : lumeraColors.roxoLumera} />
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
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={22}
                    color={(quantity >= selectedTicket.quantity - selectedTicket.sold || quantity >= 10) ? '#D0D0D0' : lumeraColors.roxoLumera}
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
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                  style={styles.addToCartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {cartLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cart-plus" size={20} color="#fff" />
                      <Text style={styles.addToCartText}>Adicionar ao carrinho</Text>
                    </>
                  )}
                </LinearGradient>
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
    backgroundColor: '#F5F3FF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F5F3FF',
  },
  errorTitle: {
    fontSize: 18,
    color: '#666',
    marginVertical: spacing.md,
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: spacing.md,
    zIndex: 100,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // Hero
  heroContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
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
    height: IMAGE_HEIGHT * 0.7,
  },
  topButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 44,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: spacing.sm,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginBottom: spacing.sm,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Content
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Quick Info Cards
  quickInfoContainer: {
    gap: spacing.sm,
    marginTop: -30,
    marginBottom: spacing.lg,
  },
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    elevation: 3,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: spacing.sm,
  },
  quickInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickInfoTextContainer: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  quickInfoHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: lumeraColors.roxoLumera,
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
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: lumeraColors.roxoLumera,
  },

  // Location
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  locationAddress: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    lineHeight: 18,
  },
  mapButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Organizer
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  organizerLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  organizerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },

  // Tickets
  ticketsSection: {
    marginBottom: spacing.md,
  },
  startingPrice: {
    alignItems: 'flex-end',
  },
  startingPriceLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  startingPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: lumeraColors.roxoLumera,
  },
  noTickets: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  noTicketsIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: lumeraColors.lilasNeon + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noTicketsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  noTicketsText: {
    fontSize: 13,
    color: '#999',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'visible',
  },
  ticketCardDisabled: {
    opacity: 0.55,
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    zIndex: 1,
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    zIndex: 1,
  },
  ticketTop: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  ticketMain: {
    flex: 1,
  },
  ticketNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },
  ticketDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketDivider: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  dashedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0EAFF',
    borderStyle: 'dashed',
  },
  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  ticketPriceContainer: {},
  ticketPriceLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  ticketPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: lumeraColors.roxoLumera,
    marginTop: 2,
  },
  selectButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    gap: 6,
  },
  selectButtonDisabled: {},
  selectButtonDisabledInner: {
    backgroundColor: '#E8E4F0',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  selectButtonTextDisabled: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: lumeraColors.roxoLumera + '06',
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0EAFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
  },

  // Bottom Bar
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarGradient: {
    height: 30,
  },
  bottomBar: {
    backgroundColor: '#fff',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bottomPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bottomLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  bottomButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  bottomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    gap: 8,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal
  modal: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    borderRadius: 28,
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  modalTicketInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: lumeraColors.roxoLumera + '08',
    borderRadius: 14,
    marginBottom: spacing.lg,
    elevation: 0,
  },
  modalTicketName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  modalTicketPrice: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: lumeraColors.roxoLumera + '30',
    backgroundColor: lumeraColors.roxoLumera + '06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    borderColor: '#E8E4F0',
    backgroundColor: '#FAFAFA',
  },
  quantityDisplay: {
    width: 70,
    alignItems: 'center',
  },
  quantityNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: theme.colors.onSurface,
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0EAFF',
    marginBottom: spacing.lg,
  },
  modalTotalLabel: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  modalTotalValue: {
    fontSize: 26,
    fontWeight: '800',
    color: lumeraColors.roxoLumera,
  },
  addToCartButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});
