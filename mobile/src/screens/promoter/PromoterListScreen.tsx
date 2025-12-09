import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  IconButton,
  TextInput,
  Button,
  Portal,
  Modal,
  Surface,
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePromoterStore } from '../../stores/promoterStore';
import { ListsStackParamList } from '../../navigation/types';
import { theme, spacing } from '../../theme';
import type { ListItem, ListType } from '../../types';

type ScreenProps = NativeStackScreenProps<ListsStackParamList, 'PromoterList'>;
type NavigationProp = NativeStackNavigationProp<ListsStackParamList>;

const listTypeConfig: Record<ListType, { label: string; color: string; bgColor: string; icon: string }> = {
  vip: { label: 'VIP', color: '#B8860B', bgColor: '#FFF8DC', icon: 'star' },
  desconto: { label: 'Desconto', color: '#2E7D32', bgColor: '#E8F5E9', icon: 'percent' },
  divulgador: { label: 'Divulgador', color: '#1565C0', bgColor: '#E3F2FD', icon: 'bullhorn' },
};

export default function PromoterListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenProps['route']>();
  const { listId } = route.params;

  const {
    currentList,
    currentListItems,
    loading,
    error,
    fetchListById,
    fetchListItems,
    addItemToList,
    removeItemFromList,
    checkInItem,
    uncheckInItem,
    clearError,
  } = usePromoterStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchListById(listId);
      fetchListItems(listId);
    }, [listId, fetchListById, fetchListItems])
  );

  const handleRefresh = () => {
    fetchListById(listId);
    fetchListItems(listId);
  };

  const isListExpired = (): boolean => {
    if (!currentList) return true;
    return new Date(currentList.expiresAt) < new Date();
  };

  const isListFull = (): boolean => {
    if (!currentList) return true;
    return currentList.currentItems >= currentList.maxItems;
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome');
      return;
    }

    setSubmitting(true);
    try {
      await addItemToList(listId, {
        name: newItemName.trim(),
        phone: '',
      });
      setAddModalVisible(false);
      setNewItemName('');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível adicionar o nome');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveItem = (item: ListItem) => {
    if (item.checkedIn) {
      Alert.alert('Erro', 'Não é possível remover um nome que já fez check-in');
      return;
    }

    Alert.alert(
      'Remover nome',
      `Deseja remover "${item.name}" da lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItemFromList(item.id);
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Não foi possível remover o nome');
            }
          },
        },
      ]
    );
  };

  const handleToggleCheckIn = async (item: ListItem) => {
    setCheckingIn(item.id);
    try {
      if (item.checkedIn) {
        await uncheckInItem(item.id);
      } else {
        await checkInItem(item.id);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível atualizar o check-in');
    } finally {
      setCheckingIn(null);
    }
  };

  const filteredItems = currentListItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedInCount = currentListItems.filter(item => item.checkedIn).length;
  const pendingCount = currentListItems.filter(item => !item.checkedIn).length;

  // Stats Cards Component
  const StatsCards = () => {
    if (!currentList) return null;

    const progress = currentList.maxItems > 0
      ? (currentList.currentItems / currentList.maxItems) * 100
      : 0;

    return (
      <View style={styles.statsContainer}>
        <Surface style={[styles.statCard, styles.statCardPrimary]}>
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>{currentList.currentItems}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </Surface>

        <Surface style={[styles.statCard, styles.statCardSuccess]}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{checkedInCount}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </Surface>

        <Surface style={[styles.statCard, styles.statCardWarning]}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#FF9800" />
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </Surface>
      </View>
    );
  };

  // Header Component
  const ListHeader = () => {
    if (!currentList) return null;

    const typeConfig = listTypeConfig[currentList.type];
    const expired = isListExpired();
    const progress = currentList.maxItems > 0
      ? (currentList.currentItems / currentList.maxItems) * 100
      : 0;

    return (
      <View style={styles.headerContainer}>
        {/* Info Card */}
        <Surface style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoTitleRow}>
              <Text style={styles.listTitle}>{currentList.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
                <MaterialCommunityIcons
                  name={typeConfig.icon as any}
                  size={14}
                  color={typeConfig.color}
                />
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
              </View>
            </View>

            {currentList.event && (
              <View style={styles.eventRow}>
                <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                <Text style={styles.eventText}>
                  {currentList.event.name}
                </Text>
              </View>
            )}

            {currentList.event && (
              <View style={styles.eventRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                <Text style={styles.eventText}>
                  {format(new Date(currentList.event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </Text>
              </View>
            )}
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Capacidade da lista</Text>
              <Text style={styles.progressValue}>
                {currentList.currentItems}/{currentList.maxItems}
              </Text>
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

          {/* Status */}
          {expired ? (
            <View style={styles.expiredBanner}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
              <Text style={styles.expiredText}>Lista expirada</Text>
            </View>
          ) : (
            <View style={styles.expiresInfo}>
              <MaterialCommunityIcons name="timer-sand" size={16} color="#666" />
              <Text style={styles.expiresText}>
                Expira em {format(new Date(currentList.expiresAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>
          )}
        </Surface>

        {/* Stats */}
        <StatsCards />

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List Count */}
        <View style={styles.listCountRow}>
          <Text style={styles.listCountText}>
            {filteredItems.length} {filteredItems.length === 1 ? 'pessoa' : 'pessoas'}
          </Text>
        </View>
      </View>
    );
  };

  // List Item Component
  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    const isCheckingThis = checkingIn === item.id;

    return (
      <Surface style={[styles.listItem, item.checkedIn && styles.listItemCheckedIn]}>
        {/* Check-in Button */}
        <TouchableOpacity
          onPress={() => handleToggleCheckIn(item)}
          disabled={isCheckingThis}
          style={[
            styles.checkButton,
            item.checkedIn && styles.checkButtonChecked
          ]}
          activeOpacity={0.7}
        >
          {isCheckingThis ? (
            <ActivityIndicator size={18} color={item.checkedIn ? '#fff' : theme.colors.primary} />
          ) : item.checkedIn ? (
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
          ) : (
            <View style={styles.checkButtonEmpty} />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.itemContent}>
          <View style={styles.itemMainRow}>
            <Text style={[styles.itemName, item.checkedIn && styles.itemNameChecked]}>
              {item.name}
            </Text>
            <Text style={styles.itemIndex}>#{index + 1}</Text>
          </View>

          {item.checkedIn && item.checkedInAt ? (
            <View style={styles.checkedInInfo}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.checkedInTime}>
                Check-in às {format(new Date(item.checkedInAt), "HH:mm")}
              </Text>
            </View>
          ) : (
            <Text style={styles.pendingText}>Aguardando check-in</Text>
          )}
        </View>

        {/* Delete Button */}
        {!item.checkedIn && !isListExpired() && (
          <TouchableOpacity
            onPress={() => handleRemoveItem(item)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </Surface>
    );
  };

  // Empty State
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="account-group-outline" size={48} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Nenhum resultado' : 'Lista vazia'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Nenhum nome encontrado com esse termo'
          : 'Toque no botão + para adicionar pessoas'}
      </Text>
    </View>
  );

  // Loading State
  if (loading && !currentList) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando lista...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Lista de Convidados</Text>
        <View style={styles.headerActions}>
          {/* Futuro: botão de exportar */}
        </View>
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
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
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

      {/* FAB */}
      {!isListExpired() && !isListFull() && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add Modal */}
      <Portal>
        <Modal
          visible={addModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="account-plus" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Adicionar à Lista</Text>
            <Text style={styles.modalSubtitle}>
              Digite o nome da pessoa que deseja adicionar
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label="Nome completo"
            value={newItemName}
            onChangeText={setNewItemName}
            style={styles.modalInput}
            autoFocus
            autoCapitalize="words"
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setAddModalVisible(false);
                setNewItemName('');
              }}
              style={styles.modalButtonCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleAddItem}
              style={styles.modalButtonConfirm}
              loading={submitting}
              disabled={submitting || !newItemName.trim()}
            >
              Adicionar
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
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

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  headerActions: {
    width: 40,
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
    paddingBottom: 100,
  },

  // Header Container
  headerContainer: {
    marginBottom: spacing.md,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  infoHeader: {
    marginBottom: spacing.md,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
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
    fontSize: 12,
    fontWeight: '600',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  eventText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },

  // Progress
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressBarFull: {
    backgroundColor: '#4CAF50',
  },

  // Expires/Expired
  expiresInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expiresText: {
    fontSize: 12,
    color: '#666',
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFEBEE',
    padding: spacing.sm,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '500',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 1,
  },
  statCardPrimary: {},
  statCardSuccess: {},
  statCardWarning: {},
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  // Search
  searchContainer: {
    marginBottom: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    elevation: 1,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 48,
    fontSize: 15,
  },
  clearButton: {
    padding: spacing.xs,
  },

  // List Count
  listCountRow: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  listCountText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
  },
  listItemCheckedIn: {
    backgroundColor: '#F1F8E9',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },

  // Check Button
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkButtonChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkButtonEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },

  // Item Content
  itemContent: {
    flex: 1,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    flex: 1,
  },
  itemNameChecked: {
    color: '#2E7D32',
  },
  itemIndex: {
    fontSize: 12,
    color: '#999',
    marginLeft: spacing.sm,
  },
  checkedInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  checkedInTime: {
    fontSize: 12,
    color: '#4CAF50',
  },
  pendingText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  // Delete Button
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
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
    backgroundColor: '#f5f5f5',
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
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Modal
  modal: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    borderRadius: 20,
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
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: spacing.lg,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButtonCancel: {
    flex: 1,
  },
  modalButtonConfirm: {
    flex: 1,
  },
});
