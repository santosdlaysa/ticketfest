import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, spacing, lumeraColors, lightColors, darkColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { useValidationStore } from '../../stores/validationStore';
import { ValidationStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

type NavigationProp = NativeStackNavigationProp<ValidationStackParamList>;

export default function TicketScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const { validateTicket, loading, lastValidation, clearLastValidation } = useValidationStore();

  // Animacao da linha de scan
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Navega para resultado quando validacao completa
  useEffect(() => {
    if (lastValidation && scanned) {
      navigation.navigate('ValidationResult', { result: lastValidation });
    }
  }, [lastValidation, scanned]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || loading) return;

    setScanned(true);
    Vibration.vibrate(100);

    await validateTicket(data);
  };

  const handleScanAgain = () => {
    setScanned(false);
    clearLastValidation();
  };

  // Permissao pendente
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Sem permissao
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Surface style={[styles.permissionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.permissionIconContainer}>
            <MaterialCommunityIcons
              name="camera-off"
              size={64}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Permissao de Camera
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            Para escanear QR Codes de ingressos, precisamos de acesso a sua camera.
          </Text>
          <Button
            mode="contained"
            onPress={requestPermission}
            style={styles.permissionButton}
            contentStyle={styles.permissionButtonContent}
          >
            Permitir Acesso
          </Button>
        </Surface>
      </View>
    );
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay escuro */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.overlayTop} />

        {/* Middle Row */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />

          {/* Scan Area */}
          <View style={styles.scanArea}>
            {/* Cantos decorativos */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            {/* Linha de scan animada */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanLineTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', lumeraColors.roxoLumera, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGradient}
              />
            </Animated.View>
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validar Ingresso</Text>
        <TouchableOpacity
          onPress={() => setFlashOn(!flashOn)}
          style={styles.flashButton}
        >
          <MaterialCommunityIcons
            name={flashOn ? 'flash' : 'flash-off'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Instrucoes */}
      <View style={styles.instructions}>
        <Surface style={styles.instructionCard}>
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={24}
            color={lumeraColors.roxoLumera}
          />
          <Text style={styles.instructionText}>
            Aponte a camera para o QR Code do ingresso
          </Text>
        </Surface>
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Surface style={styles.loadingCard}>
            <ActivityIndicator size="large" color={lumeraColors.roxoLumera} />
            <Text style={styles.loadingText}>Validando ingresso...</Text>
          </Surface>
        </View>
      )}

      {/* Botao de escanear novamente */}
      {scanned && !loading && (
        <View style={styles.bottomActions}>
          <Button
            mode="contained"
            onPress={handleScanAgain}
            style={styles.scanAgainButton}
            contentStyle={styles.scanAgainButtonContent}
            icon="qrcode-scan"
          >
            Escanear Novamente
          </Button>
        </View>
      )}

      {/* Botao manual */}
      <View style={styles.manualEntryContainer}>
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={() => navigation.navigate('ManualValidation')}
        >
          <MaterialCommunityIcons name="keyboard" size={20} color="#fff" />
          <Text style={styles.manualEntryText}>Digitar codigo manualmente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  // Scan Area
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: lumeraColors.roxoLumera,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },

  // Scan Line
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
  },
  scanLineGradient: {
    flex: 1,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Instructions
  instructions: {
    position: 'absolute',
    bottom: 180,
    left: spacing.lg,
    right: spacing.lg,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    elevation: 4,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
  },
  scanAgainButton: {
    borderRadius: 12,
    backgroundColor: lumeraColors.roxoLumera,
  },
  scanAgainButtonContent: {
    height: 52,
  },

  // Manual Entry
  manualEntryContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  manualEntryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Permission
  permissionCard: {
    margin: spacing.lg,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
  },
  permissionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${lumeraColors.roxoLumera}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 12,
    width: '100%',
  },
  permissionButtonContent: {
    height: 52,
  },
});
