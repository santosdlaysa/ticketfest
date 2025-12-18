import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TextInput,
  Button,
  Text,
  HelperText,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { theme, spacing, fontSize, lumeraColors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { login, isLoading, setAuth } = useAuthStore();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    // Reset errors
    setErrors({ email: '', password: '' });

    // Validate
    let hasError = false;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email é obrigatório' }));
      hasError = true;
    } else if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Email inválido' }));
      hasError = true;
    }

    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Senha é obrigatória' }));
      hasError = true;
    } else if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Senha deve ter no mínimo 6 caracteres' }));
      hasError = true;
    }

    if (hasError) return;

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        'Erro no login',
        error?.response?.data?.error || 'Ocorreu um erro ao fazer login. Tente novamente.'
      );
    }
  };

  // Login rápido sem autenticação (modo demo)
  const handleQuickAccess = async () => {
    // Criar usuário de demonstração
    const demoUser = {
      user: {
        id: 'demo-user-id',
        email: 'demo@Lumera.com',
        name: 'Usuário Demo',
        role: 'USER' as const,
        createdAt: new Date().toISOString(),
      },
      accessToken: 'demo-token',
      refreshToken: 'demo-refresh-token',
    };

    await setAuth(demoUser);
  };

  return (
    <LinearGradient
      colors={[lumeraColors.pretoObsidian, '#1A1A2E', lumeraColors.roxoLumera + '40']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo e Marca */}
            <View style={styles.logoContainer}>
              <Text style={styles.title}>LUMERA</Text>
              <Text style={styles.tagline}>Uma nova era de brilho</Text>
            </View>

            <Text style={styles.subtitle}>Bem-vindo de volta!</Text>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                mode="flat"
                error={!!errors.email}
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={{
                  colors: {
                    primary: lumeraColors.roxoLumera,
                    onSurfaceVariant: '#aaa',
                    surfaceVariant: 'rgba(255,255,255,0.08)',
                  },
                }}
              />
              {errors.email ? (
                <HelperText type="error" visible={!!errors.email} style={styles.errorText}>
                  {errors.email}
                </HelperText>
              ) : null}

              <TextInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                mode="flat"
                error={!!errors.password}
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={{
                  colors: {
                    primary: lumeraColors.roxoLumera,
                    onSurfaceVariant: '#aaa',
                    surfaceVariant: 'rgba(255,255,255,0.08)',
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    iconColor="#aaa"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {errors.password ? (
                <HelperText type="error" visible={!!errors.password} style={styles.errorText}>
                  {errors.password}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={lumeraColors.roxoLumera}
                textColor="#fff"
              >
                Entrar
              </Button>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>

              <Button
                mode="outlined"
                onPress={handleQuickAccess}
                disabled={isLoading}
                style={styles.quickAccessButton}
                contentStyle={styles.buttonContent}
                icon="account-arrow-right"
                textColor={lumeraColors.lilasNeon}
              >
                Entrar sem senha
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isLoading}
                style={styles.forgotPasswordButton}
                textColor={lumeraColors.lilasNeon}
              >
                Esqueci minha senha
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
                style={styles.registerButton}
                textColor={lumeraColors.brancoLuminoso}
              >
                Não tem conta? Cadastre-se
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: lumeraColors.brancoLuminoso,
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: lumeraColors.roxoLumera,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: lumeraColors.lilasNeon,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: lumeraColors.brancoLuminoso,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: '300',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(123, 46, 255, 0.2)',
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  errorText: {
    color: '#FF6B6B',
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: 12,
    elevation: 8,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: fontSize.sm,
  },
  quickAccessButton: {
    borderColor: lumeraColors.lilasNeon,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  forgotPasswordButton: {
    marginTop: spacing.md,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
});
