import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { usePermissions, UserRole } from '../hooks/usePermissions';
import { useThemeStore } from '../stores/themeStore';
import { lightColors, darkColors, lumeraColors } from '../theme';

interface ProtectedScreenProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  screenName?: string;
  fallbackMessage?: string;
}

/**
 * Componente que protege telas baseado no role do usuário.
 * Se o usuário não tiver permissão, exibe uma mensagem de acesso negado.
 *
 * Uso:
 * ```tsx
 * <ProtectedScreen allowedRoles={['ADMIN', 'ORGANIZER']}>
 *   <SuaTelaAqui />
 * </ProtectedScreen>
 * ```
 */
export function ProtectedScreen({
  children,
  allowedRoles,
  screenName,
  fallbackMessage,
}: ProtectedScreenProps) {
  const { role } = usePermissions();
  const { isDark } = useThemeStore();
  const navigation = useNavigation();
  const colors = isDark ? darkColors : lightColors;

  const hasAccess = allowedRoles.includes(role);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Tela de acesso negado
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="shield-lock"
          size={80}
          color={lumeraColors.roxoLumera}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Acesso Restrito
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {fallbackMessage ||
            `Você não tem permissão para acessar ${screenName || 'esta tela'}.`}
        </Text>
        <Text style={[styles.roleInfo, { color: colors.textSecondary }]}>
          Seu perfil: <Text style={styles.roleBadge}>{getRoleLabel(role)}</Text>
        </Text>
        <Text style={[styles.requiredInfo, { color: colors.textSecondary }]}>
          Perfis permitidos: {allowedRoles.map(getRoleLabel).join(', ')}
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
          buttonColor={lumeraColors.roxoLumera}
        >
          Voltar
        </Button>
      </View>
    </View>
  );
}

// Helper para obter label do role
function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    USER: 'Usuário',
    ADMIN: 'Administrador',
    ORGANIZER: 'Organizador',
    PROMOTER: 'Promoter',
  };
  return labels[role] || role;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  roleInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  requiredInfo: {
    fontSize: 14,
    marginBottom: 24,
  },
  roleBadge: {
    fontWeight: 'bold',
    color: lumeraColors.roxoLumera,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
});

export default ProtectedScreen;
