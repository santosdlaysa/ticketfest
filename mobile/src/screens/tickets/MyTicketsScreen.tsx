import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme, spacing } from '../../theme';

export default function MyTicketsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Ingressos</Text>
      <Text style={styles.subtitle}>(Em desenvolvimento)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
