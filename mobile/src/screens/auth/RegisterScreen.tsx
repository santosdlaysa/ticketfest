import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  HelperText,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { theme, spacing, fontSize } from '../../theme';

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Preencha os dados para começar</Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Nome Completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                mode="outlined"
                error={!!errors.name}
                style={styles.input}
                disabled={isLoading}
              />
              {errors.name ? (
                <HelperText type="error" visible={!!errors.name}>
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
                mode="outlined"
                error={!!errors.email}
                style={styles.input}
                disabled={isLoading}
              />
              {errors.email ? (
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email}
                </HelperText>
              ) : null}

              <TextInput
                label="Telefone (opcional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                mode="outlined"
                style={styles.input}
                disabled={isLoading}
              />

              <TextInput
                label="CPF (opcional)"
                value={cpf}
                onChangeText={setCpf}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                disabled={isLoading}
              />

              <TextInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                mode="outlined"
                error={!!errors.password}
                style={styles.input}
                disabled={isLoading}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {errors.password ? (
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password}
                </HelperText>
              ) : null}

              <TextInput
                label="Confirmar Senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                mode="outlined"
                error={!!errors.confirmPassword}
                style={styles.input}
                disabled={isLoading}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              {errors.confirmPassword ? (
                <HelperText type="error" visible={!!errors.confirmPassword}>
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
              >
                Cadastrar
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
                style={styles.loginButton}
              >
                Já tem conta? Faça login
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
});
