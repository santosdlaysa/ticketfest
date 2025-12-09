import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePromoterStore } from '../../stores/promoterStore';
import { ListsStackParamList } from '../../navigation/types';
import { theme, spacing } from '../../theme';
import type { PromoterList, ListType } from '../../types';

type NavigationProp = NativeStackNavigationProp<ListsStackParamList>;

const listTypeConfig: Record<ListType, { label: string; color: string; bgColor: string; icon: string }> = {
  vip: { label: 'VIP', color: '#B8860B', bgColor: '#FFF8DC', icon: 'star' },
  desconto: { label: 'Desconto', color: '#2E7D32', bgColor: '#E8F5E9', icon: 'percent' },
  divulgador: { label: 'Divulgador', color: '#1565C0', bgColor: '#E3F2FD', icon: 'bullhorn' },
};

export default function PromoterDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { lists, stats, loading, error, fetchMyLists, fetchStats, clearError } = usePromoterStore();

  useFocusEffect(
    useCallback(() => {
      fetchMyLists();
      fetchStats();
    }, [fetchMyLists, fetchStats])
  );

  const handleRefresh = () => {
    fetchMyLists();
    fetchStats();
  };

  const handleListPress = (list: PromoterList) => {
    navigation.navigate('PromoterList', { listId: list.id });
  };

  const isListExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  };

  // Stats Section
  const StatsSection = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialCommunityIcons name="clipboard-list" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.activeLists}</Text>
            <Text style={styles.statLabel}>Listas Ativas</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#4CAF50' + '15' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.totalListItems}</Text>
            <Text style={styles.statLabel}>Total de Nomes</Text>
          </Surface>
        </View>
      </View>
    );
  };

  // List Header
  const ListHeaderComponent = () => (
    <View>
      <StatsSection />
      <View style={styles.listSectionHeader}>
        <Text style={styles.sectionTitle}>Suas Listas</Text>
        <Text style={styles.listCount}>{lists.length} {lists.length === 1 ? 'lista' : 'listas'}</Text>
      </View>
    </View>
  );

  // List Item
  const renderListItem = ({ item }: { item: PromoterList }) => {
    const typeConfig = listTypeConfig[item.type];
    const expired = isListExpired(item.expiresAt);
    const progress = item.maxItems > 0 ? (item.currentItems / item.maxItems) * 100 : 0;

    return (
      <TouchableOpacity
        onPress={() => handleListPress(item)}
        activeOpacity={0.7}
      >
        <Surface style={[styles.listCard, expired && styles.listCardExpired]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
                <MaterialCommunityIcons
                  name={typeConfig.icon as any}
                  size={12}
                  color={typeConfig.color}
                />
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
              </View>
            </View>

            {/* Event Info */}
            {item.event && (
              <View style={styles.eventSection}>
                {item.event.images?.[0] && (
                  <Image
                    source={{ uri: item.event.images[0] }}
                    style={styles.eventImage}
                  />
                )}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName} numberOfLines={1}>
                    {item.event.name}
                  </Text>
                  <View style={styles.eventDateRow}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                    <Text style={styles.eventDate}>
                      {format(new Date(item.event.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressStats}>
                <MaterialCommunityIcons name="account-multiple" size={16} color="#666" />
                <Text style={styles.progressText}>
                  {item.currentItems} / {item.maxItems}
                </Text>
              </View>
              {expired ? (
                <View style={styles.expiredBadge}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color="#D32F2F" />
                  <Text style={styles.expiredText}>Expirada</Text>
                </View>
              ) : (
                <View style={styles.expiresInfo}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                  <Text style={styles.expiresText}>
                    {format(new Date(item.expiresAt), "dd/MM HH:mm", { locale: ptBR })}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(progress, 100)}%` },
                  progress >= 100 && styles.progressBarFull
                ]}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.tapHint}>Toque para gerenciar</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  // Empty State
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma lista encontrada</Text>
      <Text style={styles.emptySubtitle}>
        Você ainda não possui listas de convidados.{'\n'}
        Entre em contato com o organizador do evento para solicitar acesso.
      </Text>
    </View>
  );

  // Loading State
  if (loading && lists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando suas listas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Listas</Text>
        <Text style={styles.headerSubtitle}>Gerencie suas listas de convidados</Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <MaterialCommunityIcons name="close" size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderListItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
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
    fontSize: 14,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: '#D32F2F',
    fontSize: 13,
  },

  // List Content
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Stats Section
  statsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // List Section Header
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listCount: {
    fontSize: 13,
    color: '#666',
  },

  // List Card
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
    overflow: 'hidden',
  },
  listCardExpired: {
    opacity: 0.7,
  },

  // Card Header
  cardHeader: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Event Section
  eventSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },

  // Progress Section
  progressSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  expiresInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiresText: {
    fontSize: 12,
    color: '#666',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 11,
    color: '#D32F2F',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressBarFull: {
    backgroundColor: '#4CAF50',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
