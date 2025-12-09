import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { theme, spacing, lumeraColors, lightColors, darkColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { ValidationStackParamList } from '../../navigation/types';
import type { ValidationResult } from '../../stores/validationStore';

type ScreenProps = NativeStackScreenProps<ValidationStackParamList, 'ValidationResult'>;
type NavigationProp = NativeStackNavigationProp<ValidationStackParamList>;

export default function ValidationResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenProps['route']>();
  const { result } = route.params;
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isValid = result.status === 'valid';
  const isUsed = result.status === 'already_used';
  const isInvalid = result.status === 'invalid';

  useEffect(() => {
    // Vibrar baseado no resultado
    if (isValid) {
      Vibration.vibrate([0, 100, 50, 100]); // Padrao de sucesso
    } else {
      Vibration.vibrate([0, 200, 100, 200]); // Padrao de erro
    }

    // Animacoes
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusConfig = () => {
    if (isValid) {
      return {
        icon: 'check-circle',
        title: 'Ingresso Valido!',
        subtitle: 'Check-in realizado com sucesso',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        gradientColors: ['#43A047', '#66BB6A'] as const,
      };
    }
    if (isUsed) {
      return {
        icon: 'alert-circle',
        title: 'Ja Utilizado',
        subtitle: 'Este ingresso ja foi validado anteriormente',
        color: '#FF9800',
        bgColor: '#FFF3E0',
        gradientColors: ['#FB8C00', '#FFA726'] as const,
      };
    }
    return {
      icon: 'close-circle',
      title: 'Ingresso Invalido',
      subtitle: result.message || 'QR Code nao reconhecido',
      color: '#F44336',
      bgColor: '#FFEBEE',
      gradientColors: ['#E53935', '#EF5350'] as const,
    };
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={config.gradientColors}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Icone principal animado */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={80}
              color={config.color}
            />
          </View>
        </Animated.View>

        <Text style={styles.statusTitle}>{config.title}</Text>
        <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
      </LinearGradient>

      {/* Conteudo */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Informacoes do Ticket (se disponivel) */}
          {result.ticket && (
            <Surface style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
              <View style={styles.ticketHeader}>
                <MaterialCommunityIcons
                  name="ticket-confirmation"
                  size={24}
                  color={lumeraColors.roxoLumera}
                />
                <Text style={[styles.ticketHeaderTitle, { color: colors.text }]}>
                  Detalhes do Ingresso
                </Text>
              </View>

              <View style={styles.ticketDivider} />

              {/* Evento */}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-star" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Evento</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {result.ticket.eventName}
                  </Text>
                </View>
              </View>

              {/* Tipo de Ingresso */}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="ticket" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tipo</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {result.ticket.ticketName}
                  </Text>
                </View>
              </View>

              {/* Titular */}
              {result.ticket.holderName && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Titular</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {result.ticket.holderName}
                    </Text>
                  </View>
                </View>
              )}

              {/* Data/Hora do Evento */}
              {result.ticket.eventDate && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Data e Hora</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {format(new Date(result.ticket.eventDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </Text>
                  </View>
                </View>
              )}

              {/* Codigo do Ingresso */}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="barcode" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Codigo</Text>
                  <Text style={[styles.infoCode, { color: colors.text }]}>
                    {result.ticket.code}
                  </Text>
                </View>
              </View>

              {/* Check-in anterior (se ja usado) */}
              {isUsed && result.ticket.checkedInAt && (
                <View style={[styles.warningBox, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="history" size={20} color="#FF9800" />
                  <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>Check-in anterior</Text>
                    <Text style={styles.warningText}>
                      {format(new Date(result.ticket.checkedInAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </Text>
                  </View>
                </View>
              )}
            </Surface>
          )}

          {/* Timestamp da validacao */}
          <View style={styles.timestampContainer}>
            <MaterialCommunityIcons name="clock-check-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.timestampText, { color: colors.textMuted }]}>
              Validado em {format(new Date(result.validatedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Acoes */}
      <View style={[styles.actions, { backgroundColor: colors.background }]}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('TicketScanner')}
          style={styles.scanButton}
          contentStyle={styles.scanButtonContent}
          icon="qrcode-scan"
        >
          Escanear Proximo
        </Button>

        {isValid && (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            contentStyle={styles.backButtonContent}
          >
            Voltar
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Gradient
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  // Status Text
  statusTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Content
  content: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  // Ticket Card
  ticketCard: {
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 2,
    marginBottom: spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ticketHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: spacing.md,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoCode: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    color: '#F57C00',
  },

  // Timestamp
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timestampText: {
    fontSize: 12,
  },

  // Actions
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  scanButton: {
    borderRadius: 12,
    backgroundColor: lumeraColors.roxoLumera,
  },
  scanButtonContent: {
    height: 52,
  },
  backButton: {
    borderRadius: 12,
    borderColor: lumeraColors.roxoLumera,
  },
  backButtonContent: {
    height: 48,
  },
});
