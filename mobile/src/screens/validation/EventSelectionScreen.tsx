import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { Text, ActivityIndicator, Surface, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { eventsApi } from '../../services/api';
import { useValidationStore } from '../../stores/validationStore';
import { useThemeStore } from '../../stores/themeStore';
import { ValidationStackParamList } from '../../navigation/types';
import { lightColors, darkColors, spacing } from '../../theme';
import type { Event } from '../../types';

type NavigationProp = NativeStackNavigationProp<ValidationStackParamList>;

export default function EventSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { setSelectedEvent, selectedEventId, resetStats } = useValidationStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventsApi.getAll({ limit: 50 });
      // Filter to show only upcoming and published events
      const upcomingEvents = result.events.filter(
        (event) =>
          event.status === 'PUBLISHED' &&
          new Date(event.date) >= new Date(Date.now() - 24 * 60 * 60 * 1000) // Include events from last 24h
      );
      setEvents(upcomingEvents);
    } catch (err: any) {
      setError('Erro ao carregar eventos');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event.id);
    resetStats();
    navigation.navigate('TicketScanner');
  };

  const handleSkipSelection = () => {
    setSelectedEvent(null);
    resetStats();
    navigation.navigate('TicketScanner');
  };

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEventToday = (date: string): boolean => {
    const eventDate = new Date(date);
    const today = new Date();
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const isToday = isEventToday(item.date);
    const isSelected = selectedEventId === item.id;

    return (
      <TouchableOpacity
        onPress={() => handleEventSelect(item)}
        activeOpacity={0.7}
      >
        <Surface
          style={[
            styles.eventCard,
            { backgroundColor: colors.surface },
            isSelected && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <View style={styles.eventCardContent}>
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.eventImage} />
            ) : (
              <View style={[styles.eventImagePlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons name="calendar" size={32} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.eventInfo}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isToday && (
                  <View style={[styles.todayBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.todayBadgeText, { color: colors.primary }]}>Hoje</Text>
                  </View>
                )}
              </View>

              <View style={styles.eventDateRow}>
                <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                  {format(new Date(item.date), "dd MMM yyyy 'as' HH:mm", { locale: ptBR })}
                </Text>
              </View>

              <View style={styles.eventLocationRow}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
                <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textMuted}
            />
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
        Selecione um evento para iniciar o check-in. Isso permite validar apenas ingressos do evento selecionado.
      </Text>

      <Searchbar
        placeholder="Buscar evento..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.surface }]}
        inputStyle={{ color: colors.text }}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textMuted}
      />

      <TouchableOpacity
        onPress={handleSkipSelection}
        style={[styles.skipButton, { backgroundColor: colors.surfaceVariant }]}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.primary} />
        <Text style={[styles.skipButtonText, { color: colors.primary }]}>
          Validar sem filtrar por evento
        </Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum evento encontrado</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Tente buscar com outros termos'
          : 'Nao ha eventos disponiveis para check-in'}
      </Text>
    </View>
  );

  if (loading && events.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Selecionar Evento</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Escolha o evento para fazer check-in
        </Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: isDark ? '#3d1a1a' : '#FFEBEE' }]}>
          <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <MaterialCommunityIcons name="close" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  searchBar: {
    marginBottom: spacing.md,
    elevation: 2,
    borderRadius: 12,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Event Card
  eventCard: {
    borderRadius: 12,
    marginBottom: spacing.sm,
    elevation: 2,
    overflow: 'hidden',
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  eventImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.xs,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 12,
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
