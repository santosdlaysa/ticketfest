import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, fontSize } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import type { CartItem } from '../../types';
import type { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const {
    cart,
    loading,
    fetchCart,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEE, dd 'de' MMM 'às' HH:mm", { locale: ptBR });
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao atualizar quantidade');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remover item',
      'Deseja remover este item do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(itemId);
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.error || 'Erro ao remover item');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Limpar carrinho',
      'Deseja remover todos os itens do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.error || 'Erro ao limpar carrinho');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!user) {
      Alert.alert(
        'Login necessário',
        'Você precisa estar logado para finalizar a compra',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer login', onPress: () => navigation.navigate('HomeMain') },
        ]
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  const getTotalItems = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const renderCartItem = (item: CartItem, index: number) => {
    const itemTotal = item.ticket.price * item.quantity;

    return (
      <Surface key={item.id} style={[styles.cartItem, { backgroundColor: colors.surface }]}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
              {item.ticket.event?.name || 'Evento'}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.ticketBadge, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="ticket" size={12} color={colors.primary} />
            <Text style={[styles.ticketName, { color: colors.primary }]}>{item.ticket.name}</Text>
          </View>

          <View style={styles.eventDateRow}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
              {item.ticket.event?.date && formatEventDate(item.ticket.event.date)}
            </Text>
          </View>

          {/* Price and Quantity Row */}
          <View style={[styles.priceQuantityRow, { borderTopColor: colors.divider }]}>
            <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>{formatPrice(item.ticket.price)}</Text>

            <View style={[styles.quantityContainer, { backgroundColor: colors.surfaceVariant }]}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                style={styles.quantityButton}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={18}
                  color={item.quantity <= 1 ? colors.textMuted : colors.primary}
                />
              </TouchableOpacity>

              <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                style={styles.quantityButton}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.itemTotal, { color: colors.primary }]}>{formatPrice(itemTotal)}</Text>
          </View>
        </View>
      </Surface>
    );
  };

  if (loading && !cart) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando carrinho...</Text>
      </View>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Carrinho</Text>
          {!isEmpty && (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
            </Text>
          )}
        </View>

        {!isEmpty ? (
          <TouchableOpacity onPress={handleClearCart} style={[styles.clearButton, { backgroundColor: isDark ? '#3d1a1a' : '#FFEBEE' }]}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="cart-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Seu carrinho está vazio</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Explore os eventos e adicione ingressos ao seu carrinho
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.browseButton}
            contentStyle={styles.browseButtonContent}
            icon="calendar-search"
          >
            Explorar eventos
          </Button>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.itemsList}
            contentContainerStyle={styles.itemsListContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Items Header */}
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="ticket-confirmation" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Seus Ingressos</Text>
            </View>

            {cart.items.map((item, index) => renderCartItem(item, index))}

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#4CAF50" />
              <Text style={styles.securityText}>Compra 100% segura</Text>
            </View>
          </ScrollView>

          {/* Summary Footer */}
          <Surface style={[styles.summaryContainer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface }]}>
            {/* Summary Details */}
            <View style={[styles.summaryDetails, { borderBottomColor: colors.divider }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal ({getTotalItems()} itens)</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(cart.subtotal || 0)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxa de serviço</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(0)}</Text>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalContainer}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(cart.total || 0)}</Text>
              </View>

              <Button
                mode="contained"
                onPress={handleCheckout}
                style={styles.checkoutButton}
                contentStyle={styles.checkoutButtonContent}
                labelStyle={styles.checkoutButtonLabel}
              >
                Finalizar
              </Button>
            </View>
          </Surface>
        </>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  browseButton: {
    borderRadius: 12,
  },
  browseButtonContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  // Items List
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Cart Item
  cartItem: {
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
  },
  itemContent: {
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: spacing.xs,
    gap: 4,
  },
  ticketName: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  eventDate: {
    fontSize: 12,
  },
  priceQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  itemPrice: {
    fontSize: 13,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  securityText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },

  // Summary
  summaryContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryDetails: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    borderRadius: 12,
    minWidth: 140,
  },
  checkoutButtonContent: {
    paddingVertical: spacing.sm,
  },
  checkoutButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
