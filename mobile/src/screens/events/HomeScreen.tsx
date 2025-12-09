import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Searchbar,
  Chip,
  Card,
  ActivityIndicator,
  IconButton,
  Badge,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { lightColors, darkColors, spacing, fontSize, lightTheme, darkTheme, lumeraColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { eventsApi } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import { HomeScreenSkeleton } from '../../components/common/SkeletonLoader';
import type { Event } from '../../types';
import type { HomeStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.md * 2;

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'SHOW', label: 'Shows' },
  { id: 'FESTIVAL', label: 'Festivais' },
  { id: 'TEATRO', label: 'Teatro' },
  { id: 'ESPORTE', label: 'Esportes' },
  { id: 'FESTA', label: 'Festas' },
  { id: 'OUTRO', label: 'Outros' },
];

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { itemCount, fetchCart } = useCartStore();
  const { isDark } = useThemeStore();
  const insets = useSafeAreaInsets();

  const colors = isDark ? darkColors : lightColors;
  const theme = isDark ? darkTheme : lightTheme;

  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadEvents = useCallback(async () => {
    try {
      const params: { category?: string; search?: string } = {};

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const [eventsResponse, featured] = await Promise.all([
        eventsApi.getAll(params),
        eventsApi.getFeatured(),
      ]);

      setEvents(eventsResponse.events || []);
      setFeaturedEvents(featured || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadEvents();
    fetchCart();
  }, [loadEvents, fetchCart]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const handleSearch = useCallback(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMM, HH:mm", { locale: ptBR });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getLowestPrice = (event: Event) => {
    if (!event.tickets || event.tickets.length === 0) return null;
    const prices = event.tickets.map((t) => t.price);
    return Math.min(...prices);
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const lowestPrice = getLowestPrice(item);
    const imageUrl = item.images?.[0] || 'https://via.placeholder.com/400x200?text=Evento';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        activeOpacity={0.8}
      >
        <Card style={[styles.eventCard, { backgroundColor: colors.surface }]}>
          <Image source={{ uri: imageUrl }} style={styles.eventImage} />
          <Card.Content style={styles.eventContent}>
            <Text style={[styles.eventDate, { color: colors.primary }]}>{formatEventDate(item.date)}</Text>
            <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location}
            </Text>
            {lowestPrice !== null && (
              <Text style={[styles.eventPrice, { color: colors.primary }]}>
                A partir de {formatPrice(lowestPrice)}
              </Text>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFeaturedEvent = ({ item }: { item: Event }) => {
    const imageUrl = item.images?.[0] || 'https://via.placeholder.com/400x200?text=Destaque';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        activeOpacity={0.8}
        style={[styles.featuredCard, { borderRadius: theme.roundness }]}
      >
        <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <Chip style={[styles.featuredChip, { backgroundColor: colors.primary }]} textStyle={styles.featuredChipText}>
            Destaque
          </Chip>
          <Text style={styles.featuredName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.featuredDate}>{formatEventDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Destaques</Text>
          <FlatList
            data={featuredEvents}
            renderItem={renderFeaturedEvent}
            keyExtractor={(item) => `featured-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={CATEGORIES}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item.id}
              onPress={() => {
                setSelectedCategory(item.id);
                setLoading(true);
              }}
              style={[
                styles.categoryChip,
                { backgroundColor: colors.surface },
                selectedCategory === item.id && { backgroundColor: colors.primary },
              ]}
              textStyle={[
                styles.categoryChipText,
                { color: colors.text },
                selectedCategory === item.id && styles.categoryChipTextSelected,
              ]}
            >
              {item.label}
            </Chip>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {selectedCategory === 'all' ? 'Todos os Eventos' : `Eventos de ${CATEGORIES.find(c => c.id === selectedCategory)?.label}`}
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {loading ? '' : 'Nenhum evento encontrado'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header with gradient */}
      <LinearGradient
        colors={isDark
          ? [lumeraColors.pretoObsidian, lumeraColors.cinzaFumaca]
          : [lumeraColors.roxoLumera, lumeraColors.azulGlow]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>LUMERA</Text>
        </View>

        {/* Search and Cart Row */}
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Buscar eventos..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            placeholderTextColor="rgba(255,255,255,0.6)"
            iconColor="rgba(255,255,255,0.8)"
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartButton}
          >
            <IconButton icon="cart" size={24} iconColor="#fff" />
            {itemCount > 0 && (
              <Badge style={styles.cartBadge}>{itemCount}</Badge>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <HomeScreenSkeleton />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    elevation: 8,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  searchInput: {
    fontSize: fontSize.sm,
    color: '#fff',
  },
  cartButton: {
    position: 'relative',
    marginLeft: spacing.xs,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: lumeraColors.lilasNeon,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  featuredSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  featuredList: {
    paddingHorizontal: spacing.md,
  },
  featuredCard: {
    width: CARD_WIDTH * 0.85,
    height: 180,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    backgroundColor: lumeraColors.roxoLumera,
  },
  featuredChipText: {
    color: '#fff',
    fontSize: fontSize.xs,
  },
  featuredName: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  featuredDate: {
    color: '#fff',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  categoriesSection: {
    marginVertical: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.md,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  categoryChipText: {
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  eventCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  eventContent: {
    padding: spacing.md,
  },
  eventDate: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  eventLocation: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  eventPrice: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
  },
});
