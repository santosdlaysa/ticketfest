import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// Custom theme based on React Native Paper
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    tertiary: '#018786',
    error: '#b00020',
    background: '#f5f5f5',
    surface: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onBackground: '#000000',
    onSurface: '#000000',
    onError: '#ffffff',
    accent: '#6200ee',
  },
  roundness: 8,
};

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

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};
