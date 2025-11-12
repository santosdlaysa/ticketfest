import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { theme, spacing } from '../../theme';
import { useAuthStore } from '../../stores/authStore';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo, {user?.name}!</Text>
      <Text style={styles.subtitle}>Tela de Eventos (Em desenvolvimento)</Text>
      <Button mode="contained" onPress={logout} style={styles.button}>
        Sair
      </Button>
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
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
  },
});
