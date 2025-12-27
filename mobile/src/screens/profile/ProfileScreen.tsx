import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  Avatar,
  Switch,
  Badge,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useLogStore } from '../../stores/logStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface MenuItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  iconColor?: string;
  badge?: string;
  isDark?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
  iconColor,
  badge,
  isDark = false,
}) => {
  const colors = isDark ? darkColors : lightColors;
  const defaultIconColor = iconColor || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: defaultIconColor + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={defaultIconColor} />
      </View>
      <View style={styles.menuContent}>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {badge && (
          <Badge style={[styles.menuBadge, { backgroundColor: colors.primary }]}>{badge}</Badge>
        )}
        {rightElement}
        {showChevron && !rightElement && (
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { logs } = useLogStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const colors = isDark ? darkColors : lightColors;

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCpf = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Administrador', color: '#e74c3c', icon: 'shield-crown' as IconName };
      case 'ORGANIZER':
        return { label: 'Organizador', color: '#9b59b6', icon: 'calendar-star' as IconName };
      case 'PROMOTER':
        return { label: 'Promoter', color: '#3498db', icon: 'account-star' as IconName };
      case 'USER':
      default:
        return { label: 'Usuário', color: colors.primary, icon: 'account' as IconName };
    }
  };

  const roleInfo = getRoleInfo(user?.role || 'USER');

  const handleContact = () => {
    Alert.alert(
      'Fale Conosco',
      'Como deseja entrar em contato?',
      [
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/5595991371313'),
        },
        {
          text: 'E-mail',
          onPress: () => Linking.openURL('mailto:suporte@lumera.com.br'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleRateApp = () => {
    // TODO: Substituir pela URL real da loja
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/lumera/id000000000'
      : 'https://play.google.com/store/apps/details?id=com.lumera.app';
    Linking.openURL(storeUrl).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir a loja de aplicativos.');
    });
  };

  const gradientColors: [string, string] = isDark
    ? [lumeraColors.pretoObsidian, lumeraColors.roxoLumera + '80']
    : [lumeraColors.roxoLumera, lumeraColors.azulGlow];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header with Gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={90}
              label={user?.name ? getInitials(user.name) : 'U'}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.secondary }]} onPress={() => navigation.navigate('EditProfile')}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '30' }]}>
            <MaterialCommunityIcons name={roleInfo.icon} size={14} color="#fff" />
            <Text style={styles.roleText}>{roleInfo.label}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <Surface style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.getParent()?.navigate('MyTickets')}>
          <View style={[styles.statIcon, { backgroundColor: isDark ? '#1b4332' : '#e8f5e9' }]}>
            <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#4caf50" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ingressos</Text>
        </TouchableOpacity>

        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

        <TouchableOpacity style={styles.statItem} onPress={() => navigation.getParent()?.navigate('MyTickets')}>
          <View style={[styles.statIcon, { backgroundColor: isDark ? '#3d2608' : '#fff3e0' }]}>
            <MaterialCommunityIcons name="calendar-check" size={20} color="#ff9800" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>5</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Eventos</Text>
        </TouchableOpacity>

        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Favorites')}>
          <View style={[styles.statIcon, { backgroundColor: isDark ? '#4a1942' : '#fce4ec' }]}>
            <MaterialCommunityIcons name="heart" size={20} color="#e91e63" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>8</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoritos</Text>
        </TouchableOpacity>
      </Surface>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Dados Pessoais</Text>
        <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <MenuItem
            icon="account-outline"
            title="Nome completo"
            subtitle={user?.name || 'Não informado'}
            showChevron={false}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="email-outline"
            title="E-mail"
            subtitle={user?.email || 'Não informado'}
            showChevron={false}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="card-account-details-outline"
            title="CPF"
            subtitle={user?.cpf ? formatCpf(user.cpf) : 'Não informado'}
            showChevron={false}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="phone-outline"
            title="Telefone"
            subtitle={user?.phone ? formatPhone(user.phone) : 'Não informado'}
            showChevron={false}
            isDark={isDark}
          />
        </Surface>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Minha Conta</Text>
        <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <MenuItem
            icon="account-edit-outline"
            title="Editar perfil"
            subtitle="Alterar suas informações"
            onPress={() => navigation.navigate('EditProfile')}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="lock-outline"
            title="Alterar senha"
            subtitle="Atualizar senha de acesso"
            onPress={() => navigation.navigate('ChangePassword')}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="credit-card-outline"
            title="Formas de pagamento"
            subtitle="Gerenciar cartões salvos"
            onPress={() => navigation.navigate('PaymentMethods')}
            isDark={isDark}
          />
        </Surface>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferências</Text>
        <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <MenuItem
            icon="bell-outline"
            title="Notificações"
            subtitle="Alertas de eventos e promoções"
            showChevron={false}
            isDark={isDark}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={colors.primary}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="theme-light-dark"
            title="Modo escuro"
            subtitle={isDark ? 'Ativado' : 'Desativado'}
            showChevron={false}
            isDark={isDark}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                color={colors.primary}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="map-marker-outline"
            title="Localização"
            subtitle="Permitir acesso à localização"
            onPress={() => navigation.navigate('LocationSettings')}
            isDark={isDark}
          />
        </Surface>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Ajuda e Suporte</Text>
        <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <MenuItem
            icon="help-circle-outline"
            title="Central de ajuda"
            subtitle="Dúvidas frequentes"
            onPress={() => navigation.navigate('HelpCenter')}
            iconColor="#2196f3"
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="message-text-outline"
            title="Fale conosco"
            subtitle="Chat e suporte"
            onPress={handleContact}
            iconColor="#4caf50"
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="star-outline"
            title="Avaliar o app"
            subtitle="Deixe sua opinião"
            onPress={handleRateApp}
            iconColor="#ff9800"
            isDark={isDark}
          />
        </Surface>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Legal</Text>
        <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <MenuItem
            icon="file-document-outline"
            title="Termos de uso"
            onPress={() => navigation.navigate('TermsOfService')}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="shield-check-outline"
            title="Política de privacidade"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <MenuItem
            icon="information-outline"
            title="Sobre o Lumera"
            subtitle="Versão 1.0.0"
            onPress={() => navigation.navigate('About')}
            isDark={isDark}
          />
        </Surface>
      </View>

      {/* Developer Tools - Only show in DEV mode */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Desenvolvedor</Text>
          <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <MenuItem
              icon="api"
              title="API Logs"
              subtitle={`${logs.length} requisições capturadas`}
              onPress={() => navigation.navigate('ApiLogs')}
              iconColor="#9C27B0"
              isDark={isDark}
            />
          </Surface>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.error, backgroundColor: colors.surface }]}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Sair da conta</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerBrand, { color: lumeraColors.roxoLumera }]}>LUMERA</Text>
        <Text style={[styles.footerTagline, { color: lumeraColors.lilasNeon }]}>Uma nova era de brilho</Text>
        <Text style={[styles.footerCopyright, { color: colors.textMuted }]}>© 2024 Lumera. Todos os direitos reservados.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.md,
    color: '#fff',
  },
  userEmail: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  roleText: {
    fontSize: fontSize.sm,
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: -30,
    borderRadius: 16,
    padding: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginVertical: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  menuBadge: {
    marginRight: spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  footerBrand: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: 4,
  },
  footerTagline: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  footerCopyright: {
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
});
