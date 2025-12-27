import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Appbar,
  Surface,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';
import type { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface FavoriteEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  imageUrl?: string;
  price?: number;
}

const FAVORITES_KEY = '@lumera/favorites';

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (eventId: string) => {
    Alert.alert(
      'Remover favorito',
      'Deseja remover este evento dos favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const updated = favorites.filter((f) => f.id !== eventId);
            setFavorites(updated);
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const navigateToEvent = (eventId: string) => {
    // @ts-ignore - navegando para outra stack
    navigation.navigate('Home', {
      screen: 'EventDetails',
      params: { eventId },
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Gratis';
    return `A partir de R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const renderItem = ({ item }: { item: FavoriteEvent }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.surface }]}
      onPress={() => navigateToEvent(item.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: item.imageUrl || 'https://via.placeholder.com/120x120?text=Evento',
        }}
        style={styles.eventImage}
      />
      <View style={styles.eventContent}>
        <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.eventInfo}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
          <Text style={[styles.eventInfoText, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.eventInfo}>
          <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
          <Text style={[styles.eventInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        <Text style={[styles.eventPrice, { color: lumeraColors.roxoLumera }]}>
          {formatPrice(item.price)}
        </Text>
      </View>
      <IconButton
        icon="heart"
        iconColor="#e74c3c"
        size={24}
        onPress={() => removeFavorite(item.id)}
        style={styles.favoriteButton}
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: lumeraColors.roxoLumera + '20' }]}>
        <MaterialCommunityIcons name="heart-outline" size={64} color={lumeraColors.roxoLumera} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Nenhum evento favorito
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Adicione eventos aos favoritos tocando no coracao na pagina do evento
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: lumeraColors.roxoLumera }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.exploreButtonText}>Explorar eventos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Favoritos" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[lumeraColors.roxoLumera]}
            tintColor={lumeraColors.roxoLumera}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: 100,
    height: 120,
  },
  eventContent: {
    flex: 1,
    padding: spacing.md,
  },
  eventName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  eventInfoText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  eventPrice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  exploreButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
