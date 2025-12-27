import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Appbar,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface LinkItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  isDark: boolean;
}

const LinkItem: React.FC<LinkItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  iconColor,
  isDark,
}) => {
  const colors = isDark ? darkColors : lightColors;

  return (
    <TouchableOpacity style={[styles.linkItem, { backgroundColor: colors.surface }]} onPress={onPress}>
      <View style={[styles.linkIcon, { backgroundColor: (iconColor || colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor || colors.primary} />
      </View>
      <View style={styles.linkContent}>
        <Text style={[styles.linkTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.linkSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

export default function AboutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Sobre" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Brand */}
        <View style={styles.brandSection}>
          <View style={[styles.logoContainer, { backgroundColor: lumeraColors.roxoLumera }]}>
            <MaterialCommunityIcons name="ticket-confirmation" size={48} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: lumeraColors.roxoLumera }]}>LUMERA</Text>
          <Text style={[styles.tagline, { color: lumeraColors.lilasNeon }]}>Uma nova era de brilho</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Versao {appVersion} (Build {buildNumber})
          </Text>
        </View>

        {/* Description */}
        <Surface style={[styles.descriptionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            O Lumera e a plataforma mais completa para compra de ingressos para eventos.
            Encontre festas, shows, festivais e muito mais em um so lugar.
          </Text>
        </Surface>

        {/* Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Redes Sociais</Text>
          <Surface style={[styles.linksContainer, { backgroundColor: colors.surface }]}>
            <LinkItem
              icon="instagram"
              title="Instagram"
              subtitle="@lumera.app"
              onPress={() => openLink('https://instagram.com/lumera.app')}
              iconColor="#E4405F"
              isDark={isDark}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <LinkItem
              icon="facebook"
              title="Facebook"
              subtitle="/lumeraapp"
              onPress={() => openLink('https://facebook.com/lumeraapp')}
              iconColor="#1877F2"
              isDark={isDark}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <LinkItem
              icon="twitter"
              title="Twitter / X"
              subtitle="@lumera_app"
              onPress={() => openLink('https://twitter.com/lumera_app')}
              iconColor="#1DA1F2"
              isDark={isDark}
            />
          </Surface>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Legal</Text>
          <Surface style={[styles.linksContainer, { backgroundColor: colors.surface }]}>
            <LinkItem
              icon="file-document-outline"
              title="Termos de Uso"
              onPress={() => navigation.navigate('TermsOfService')}
              isDark={isDark}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <LinkItem
              icon="shield-check-outline"
              title="Politica de Privacidade"
              onPress={() => navigation.navigate('PrivacyPolicy')}
              isDark={isDark}
            />
          </Surface>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Contato</Text>
          <Surface style={[styles.linksContainer, { backgroundColor: colors.surface }]}>
            <LinkItem
              icon="web"
              title="Site oficial"
              subtitle="www.lumera.com.br"
              onPress={() => openLink('https://lumera.com.br')}
              iconColor={lumeraColors.roxoLumera}
              isDark={isDark}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <LinkItem
              icon="email-outline"
              title="E-mail"
              subtitle="contato@lumera.com.br"
              onPress={() => openLink('mailto:contato@lumera.com.br')}
              iconColor="#4CAF50"
              isDark={isDark}
            />
          </Surface>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Feito com amor no Brasil
          </Text>
          <Text style={[styles.copyright, { color: colors.textMuted }]}>
            © 2024 Lumera. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  version: {
    fontSize: fontSize.sm,
    marginTop: spacing.md,
  },
  descriptionCard: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  descriptionText: {
    fontSize: fontSize.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  linksContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  linkTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  linkSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.sm,
  },
  copyright: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
