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
import { spacing, fontSize, lumeraColors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { register, isLoading } = useAuthStore();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async () => {
    // Reset errors
    setErrors({ name: '', email: '', password: '', confirmPassword: '' });

    // Validate
    let hasError = false;
    if (!name) {
      setErrors((prev) => ({ ...prev, name: 'Nome é obrigatório' }));
      hasError = true;
    }

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
      setErrors((prev) => ({
        ...prev,
        password: 'Senha deve ter no mínimo 6 caracteres',
      }));
      hasError = true;
    }

    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Senhas não conferem' }));
      hasError = true;
    }

    if (hasError) return;

    try {
      await register({
        name,
        email,
        password,
        phone: phone || undefined,
        cpf: cpf || undefined,
      });
    } catch (error: any) {
      Alert.alert(
        'Erro no cadastro',
        error?.response?.data?.error || 'Ocorreu um erro ao cadastrar. Tente novamente.'
      );
    }
  };

  const inputTheme = {
    colors: {
      primary: lumeraColors.roxoLumera,
      onSurfaceVariant: '#aaa',
      surfaceVariant: 'rgba(255,255,255,0.08)',
    },
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Criar Conta</Text>
              <Text style={styles.subtitle}>Preencha os dados para começar</Text>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <TextInput
                label="Nome Completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                mode="flat"
                error={!!errors.name}
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={inputTheme}
                left={<TextInput.Icon icon="account" iconColor="#aaa" />}
              />
              {errors.name ? (
                <HelperText type="error" visible={!!errors.name} style={styles.errorText}>
                  {errors.name}
                </HelperText>
              ) : null}

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
                theme={inputTheme}
                left={<TextInput.Icon icon="email" iconColor="#aaa" />}
              />
              {errors.email ? (
                <HelperText type="error" visible={!!errors.email} style={styles.errorText}>
                  {errors.email}
                </HelperText>
              ) : null}

              <TextInput
                label="Telefone (opcional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                mode="flat"
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={inputTheme}
                left={<TextInput.Icon icon="phone" iconColor="#aaa" />}
              />

              <TextInput
                label="CPF (opcional)"
                value={cpf}
                onChangeText={setCpf}
                keyboardType="numeric"
                mode="flat"
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={inputTheme}
                left={<TextInput.Icon icon="card-account-details" iconColor="#aaa" />}
              />

              <TextInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                mode="flat"
                error={!!errors.password}
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={inputTheme}
                left={<TextInput.Icon icon="lock" iconColor="#aaa" />}
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

              <TextInput
                label="Confirmar Senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                mode="flat"
                error={!!errors.confirmPassword}
                style={styles.input}
                disabled={isLoading}
                textColor="#fff"
                theme={inputTheme}
                left={<TextInput.Icon icon="lock-check" iconColor="#aaa" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    iconColor="#aaa"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              {errors.confirmPassword ? (
                <HelperText type="error" visible={!!errors.confirmPassword} style={styles.errorText}>
                  {errors.confirmPassword}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={lumeraColors.roxoLumera}
                textColor="#fff"
              >
                Cadastrar
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
                style={styles.loginButton}
                textColor={lumeraColors.brancoLuminoso}
              >
                Já tem conta? Faça login
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
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: lumeraColors.brancoLuminoso,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: spacing.sm,
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
  loginButton: {
    marginTop: spacing.md,
  },
});
