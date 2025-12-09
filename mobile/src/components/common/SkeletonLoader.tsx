import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing } from '../../theme';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Componente base de Skeleton com animação de shimmer
export const Skeleton: React.FC<SkeletonProps> = ({
  width: skeletonWidth = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: skeletonWidth,
          height,
          borderRadius,
          backgroundColor: isDark ? colors.surfaceVariant : '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton para Card de Evento
export const EventCardSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.eventCard, { backgroundColor: colors.surface }]}>
      <Skeleton width="100%" height={150} borderRadius={0} />
      <View style={styles.eventContent}>
        <Skeleton width={120} height={12} />
        <Skeleton width="90%" height={20} style={{ marginTop: spacing.sm }} />
        <Skeleton width="70%" height={14} style={{ marginTop: spacing.xs }} />
        <Skeleton width={100} height={16} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
};

// Skeleton para Card de Destaque
export const FeaturedCardSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;
  const cardWidth = (width - spacing.md * 2) * 0.85;

  return (
    <View style={[styles.featuredCard, { width: cardWidth, backgroundColor: colors.surfaceVariant }]}>
      <Skeleton width="100%" height={180} borderRadius={8} />
    </View>
  );
};

// Skeleton para Detalhes do Evento
export const EventDetailsSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
      {/* Imagem do evento */}
      <Skeleton width="100%" height={250} borderRadius={0} />

      {/* Conteúdo */}
      <View style={styles.detailsContent}>
        <Skeleton width="80%" height={28} />
        <Skeleton width="60%" height={16} style={{ marginTop: spacing.sm }} />

        {/* Info cards */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={80} height={14} style={{ marginTop: spacing.xs }} />
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={80} height={14} style={{ marginTop: spacing.xs }} />
          </View>
        </View>

        {/* Descrição */}
        <Skeleton width="100%" height={14} style={{ marginTop: spacing.lg }} />
        <Skeleton width="100%" height={14} style={{ marginTop: spacing.xs }} />
        <Skeleton width="70%" height={14} style={{ marginTop: spacing.xs }} />

        {/* Tickets */}
        <Skeleton width={120} height={20} style={{ marginTop: spacing.lg }} />
        <View style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
          <Skeleton width="60%" height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: spacing.xs }} />
          <Skeleton width={100} height={24} style={{ marginTop: spacing.sm }} />
        </View>
        <View style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
          <Skeleton width="50%" height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: spacing.xs }} />
          <Skeleton width={100} height={24} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </View>
  );
};

// Skeleton para Item do Carrinho
export const CartItemSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.cartItem, { backgroundColor: colors.surface }]}>
      <Skeleton width={80} height={80} borderRadius={8} />
      <View style={styles.cartItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={14} style={{ marginTop: spacing.xs }} />
        <Skeleton width={80} height={18} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
};

// Skeleton para Ticket
export const TicketSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.ticketItem, { backgroundColor: colors.surface }]}>
      <View style={styles.ticketHeader}>
        <Skeleton width="60%" height={18} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
      <Skeleton width="50%" height={14} style={{ marginTop: spacing.xs }} />
      <View style={styles.ticketFooter}>
        <Skeleton width={100} height={100} borderRadius={8} />
      </View>
    </View>
  );
};

// Skeleton para a Home completa
export const HomeScreenSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.homeContainer, { backgroundColor: colors.background }]}>
      {/* Featured Section */}
      <View style={styles.section}>
        <Skeleton width={100} height={20} style={{ marginHorizontal: spacing.md }} />
        <View style={styles.featuredRow}>
          <FeaturedCardSkeleton />
          <FeaturedCardSkeleton />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={70} height={32} borderRadius={16} style={{ marginRight: spacing.sm }} />
        ))}
      </View>

      {/* Section Title */}
      <Skeleton width={150} height={20} style={{ marginHorizontal: spacing.md, marginTop: spacing.md }} />

      {/* Event Cards */}
      <EventCardSkeleton />
      <EventCardSkeleton />
      <EventCardSkeleton />
    </View>
  );
};

// Skeleton para Meus Ingressos
export const MyTicketsScreenSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.homeContainer, { backgroundColor: colors.background }]}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.myTicketCard, { backgroundColor: colors.surface }]}>
          <View style={styles.myTicketLeft}>
            <Skeleton width={68} height={68} borderRadius={4} />
          </View>
          <View style={styles.myTicketDivider}>
            <View style={[styles.myTicketNotch, { backgroundColor: colors.background }]} />
            <Skeleton width={2} height={60} />
            <View style={[styles.myTicketNotch, { backgroundColor: colors.background }]} />
          </View>
          <View style={styles.myTicketRight}>
            <Skeleton width="80%" height={16} />
            <Skeleton width="50%" height={14} style={{ marginTop: spacing.xs }} />
            <Skeleton width="70%" height={12} style={{ marginTop: spacing.sm }} />
            <Skeleton width={80} height={24} borderRadius={12} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Skeleton para Carrinho
export const CartScreenSkeleton: React.FC = () => {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.homeContainer, { backgroundColor: colors.background }]}>
      <View style={styles.cartHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={120} height={18} style={{ marginLeft: spacing.sm }} />
      </View>

      {[1, 2].map((i) => (
        <View key={i} style={[styles.cartSkeletonItem, { backgroundColor: colors.surface }]}>
          <View style={styles.cartSkeletonHeader}>
            <Skeleton width="70%" height={16} />
            <Skeleton width={20} height={20} borderRadius={10} />
          </View>
          <Skeleton width={100} height={24} borderRadius={6} style={{ marginTop: spacing.xs }} />
          <View style={styles.cartSkeletonDateRow}>
            <Skeleton width={14} height={14} borderRadius={7} />
            <Skeleton width={150} height={12} style={{ marginLeft: spacing.xs }} />
          </View>
          <View style={[styles.cartSkeletonPriceRow, { borderTopColor: colors.divider }]}>
            <Skeleton width={60} height={14} />
            <Skeleton width={90} height={32} borderRadius={8} />
            <Skeleton width={70} height={16} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  eventContent: {
    padding: spacing.md,
  },
  featuredCard: {
    height: 180,
    marginRight: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailsContainer: {
    flex: 1,
  },
  detailsContent: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  infoCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  ticketCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  cartItem: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  cartItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  ticketItem: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketFooter: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  homeContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  section: {
    marginTop: spacing.md,
  },
  featuredRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  // My Tickets Skeleton
  myTicketCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  myTicketLeft: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myTicketDivider: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  myTicketNotch: {
    width: 20,
    height: 10,
    borderRadius: 10,
  },
  myTicketRight: {
    flex: 1,
    padding: spacing.md,
  },
  // Cart Skeleton
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cartSkeletonItem: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  cartSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartSkeletonDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cartSkeletonPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});

export default Skeleton;
