import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/theme';

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
