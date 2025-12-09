import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// ========================================
// LUMERA - Identidade Visual
// "Uma nova era de brilho"
// ========================================

// Paleta Principal Lumera
export const lumeraColors = {
  // Cores Principais
  roxoLumera: '#7B2EFF',      // Primária - moderno, premium, noturno
  azulGlow: '#4A6CFF',        // Secundária - brilho, tecnologia
  pretoObsidian: '#0E0E0F',   // Elegância, contraste
  brancoLuminoso: '#F8F8FF',  // Leveza, minimalismo

  // Cores Secundárias
  lilasNeon: '#C084FF',       // Destaque, elementos vibrantes
  douradoSuave: '#E0C87A',    // Premium, VIP
  cinzaFumaca: '#2A2A2E',     // Base para UI

  // Gradientes (para uso programático)
  gradientStart: '#7B2EFF',
  gradientEnd: '#4A6CFF',
};

// Light theme colors (Lumera)
export const lightColors = {
  primary: lumeraColors.roxoLumera,
  secondary: lumeraColors.azulGlow,
  tertiary: lumeraColors.lilasNeon,
  error: '#E53935',
  background: lumeraColors.brancoLuminoso,
  surface: '#ffffff',
  surfaceVariant: '#F5F3FF',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onBackground: lumeraColors.pretoObsidian,
  onSurface: lumeraColors.pretoObsidian,
  onSurfaceVariant: '#666666',
  onError: '#ffffff',
  accent: lumeraColors.lilasNeon,
  border: '#E0D4FF',
  card: '#ffffff',
  text: lumeraColors.pretoObsidian,
  textSecondary: '#666666',
  textMuted: '#999999',
  divider: '#F0EAFF',
  statusBar: 'dark' as const,
  // Cores especiais Lumera
  vip: lumeraColors.douradoSuave,
  highlight: lumeraColors.lilasNeon,
  glow: lumeraColors.azulGlow,
};

// Dark theme colors (Lumera Premium)
export const darkColors = {
  primary: lumeraColors.roxoLumera,
  secondary: lumeraColors.azulGlow,
  tertiary: lumeraColors.lilasNeon,
  error: '#FF6B6B',
  background: lumeraColors.pretoObsidian,
  surface: lumeraColors.cinzaFumaca,
  surfaceVariant: '#3A3A40',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onBackground: lumeraColors.brancoLuminoso,
  onSurface: lumeraColors.brancoLuminoso,
  onSurfaceVariant: '#b0b0b0',
  onError: '#000000',
  accent: lumeraColors.lilasNeon,
  border: '#4A4A50',
  card: lumeraColors.cinzaFumaca,
  text: lumeraColors.brancoLuminoso,
  textSecondary: '#b0b0b0',
  textMuted: '#666666',
  divider: '#3A3A40',
  statusBar: 'light' as const,
  // Cores especiais Lumera
  vip: lumeraColors.douradoSuave,
  highlight: lumeraColors.lilasNeon,
  glow: lumeraColors.azulGlow,
};

// Light theme (default)
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
  roundness: 8,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  roundness: 8,
};

// Default export (light theme for backwards compatibility)
export const theme = lightTheme;

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Get theme based on mode
export const getTheme = (isDark: boolean) => isDark ? darkTheme : lightTheme;

// Common styles generator based on theme
export const getCommonStyles = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;

  return {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
      elevation: 2,
    },
    shadow: {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.5 : 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  };
};

// Backward compatible commonStyles
export const commonStyles = getCommonStyles(false);
