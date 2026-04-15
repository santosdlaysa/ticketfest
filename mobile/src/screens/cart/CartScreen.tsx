import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
  Platform,
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { CartScreenSkeleton } from '../../components/common/SkeletonLoader';
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
  }, []);

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
      <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.surface }]}>
        {/* Ticket notch decorations */}
        <View style={[styles.ticketNotchLeft, { backgroundColor: isDark ? colors.background : '#F5F3FF' }]} />
        <View style={[styles.ticketNotchRight, { backgroundColor: isDark ? colors.background : '#F5F3FF' }]} />

        {/* Top section: Event info */}
        <View style={styles.itemTop}>
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <View style={[styles.eventIconContainer, { backgroundColor: colors.primary + '12' }]}>
                <MaterialCommunityIcons name="calendar-star" size={18} color={colors.primary} />
              </View>
              <View style={styles.eventTitleContainer}>
                <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
                  {item.ticket.event?.name || 'Evento'}
                </Text>
                {item.ticket.event?.date && (
                  <View style={styles.eventDateRow}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.eventDate, { color: colors.textMuted }]}>
                      {formatEventDate(item.ticket.event.date)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.removeButton, { backgroundColor: isDark ? '#3d1a1a' : '#FFF0F0' }]}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View style={[styles.ticketBadge, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="ticket-confirmation" size={13} color={colors.primary} />
            <Text style={[styles.ticketName, { color: colors.primary }]}>{item.ticket.name}</Text>
          </View>
        </View>

        {/* Dashed divider */}
        <View style={styles.ticketDivider}>
          <View style={[styles.dashedLine, { borderBottomColor: isDark ? colors.divider : '#F0EAFF' }]} />
        </View>

        {/* Bottom section: Price and quantity */}
        <View style={styles.itemBottom}>
          <View style={styles.unitPriceContainer}>
            <Text style={[styles.unitPriceLabel, { color: colors.textMuted }]}>Unitário</Text>
            <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>{formatPrice(item.ticket.price)}</Text>
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
              style={[
                styles.quantityButton,
                {
                  borderColor: item.quantity <= 1 ? (isDark ? '#3A3A40' : '#E8E4F0') : colors.primary + '30',
                  backgroundColor: item.quantity <= 1 ? 'transparent' : colors.primary + '08',
                },
              ]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="minus"
                size={16}
                color={item.quantity <= 1 ? colors.textMuted : colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
              style={[
                styles.quantityButton,
                {
                  borderColor: colors.primary + '30',
                  backgroundColor: colors.primary + '08',
                },
              ]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.itemTotalContainer}>
            <Text style={[styles.itemTotalLabel, { color: colors.textMuted }]}>Total</Text>
            <Text style={[styles.itemTotal, { color: colors.primary }]}>{formatPrice(itemTotal)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !cart) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F5F3FF' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Carrinho</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
        <CartScreenSkeleton />
      </View>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F5F3FF' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Surface style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: isDark ? colors.surfaceVariant : lumeraColors.roxoLumera + '10' }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={isDark ? colors.text : lumeraColors.roxoLumera} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="cart" size={20} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Carrinho</Text>
          </View>
          {!isEmpty && (
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {getTotalItems()} {getTotalItems() === 1 ? 'ingresso' : 'ingressos'}
            </Text>
          )}
        </View>

        {!isEmpty ? (
          <TouchableOpacity
            onPress={handleClearCart}
            style={[styles.clearButton, { backgroundColor: isDark ? '#3d1a1a' : '#FFF0F0' }]}
          >
            <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </Surface>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.surfaceVariant : lumeraColors.roxoLumera + '08' }]}>
            <View style={[styles.emptyIconInner, { backgroundColor: isDark ? colors.surface : lumeraColors.roxoLumera + '12' }]}>
              <MaterialCommunityIcons name="cart-off" size={48} color={isDark ? colors.textMuted : lumeraColors.lilasNeon} />
            </View>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Seu carrinho está vazio</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Explore os eventos e adicione{'\n'}ingressos ao seu carrinho
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.browseButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
              style={styles.browseButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="calendar-search" size={20} color="#fff" />
              <Text style={styles.browseButtonText}>Explorar eventos</Text>
            </LinearGradient>
          </TouchableOpacity>
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
              <View style={[styles.sectionIconContainer, { backgroundColor: colors.primary + '12' }]}>
                <MaterialCommunityIcons name="ticket-confirmation" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Seus Ingressos</Text>
              <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>{cart.items.length}</Text>
              </View>
            </View>

            {cart.items.map((item, index) => renderCartItem(item, index))}

            {/* Info badges */}
            <View style={styles.infoBadgesContainer}>
              <View style={[styles.infoBadge, { backgroundColor: isDark ? colors.surfaceVariant : '#F0FFF0' }]}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
                <Text style={[styles.infoBadgeText, { color: '#4CAF50' }]}>Compra 100% segura</Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDark ? colors.surfaceVariant : '#FFF8E1' }]}>
                <MaterialCommunityIcons name="flash" size={16} color="#FF9800" />
                <Text style={[styles.infoBadgeText, { color: '#FF9800' }]}>Entrega instantânea</Text>
              </View>
            </View>
          </ScrollView>

          {/* Summary Footer */}
          <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
            {/* Subtotal row */}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Subtotal ({getTotalItems()} {getTotalItems() === 1 ? 'ingresso' : 'ingressos'})
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(cart.subtotal || 0)}</Text>
            </View>

            {/* Taxa row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabelRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxa de serviço</Text>
                <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
              </View>
              <Text style={[styles.freeLabel, { color: '#4CAF50' }]}>Grátis</Text>
            </View>

            {/* Total + Checkout */}
            <View style={[styles.totalContainer, { borderTopColor: isDark ? colors.divider : '#F0EAFF' }]}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(cart.total || 0)}</Text>
              </View>

              <TouchableOpacity
                onPress={handleCheckout}
                style={styles.checkoutButton}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                  style={styles.checkoutButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.checkoutButtonText}>Finalizar compra</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
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
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  browseButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  browseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  sectionIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Cart Item (Ticket Style)
  cartItem: {
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'visible',
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
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
    zIndex: 1,
  },
  itemTop: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  eventDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: spacing.sm,
    gap: 5,
  },
  ticketName: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Ticket divider
  ticketDivider: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  dashedLine: {
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },

  // Item bottom
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  unitPriceContainer: {
    alignItems: 'flex-start',
    minWidth: 70,
  },
  unitPriceLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  unitPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: 28,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '800',
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  itemTotalLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  // Info Badges
  infoBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Summary
  summaryContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  freeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  checkoutButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
