import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { getTheme } from './src/theme';
import { useThemeStore } from './src/stores/themeStore';

export default function App() {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </PaperProvider>
  );
}
