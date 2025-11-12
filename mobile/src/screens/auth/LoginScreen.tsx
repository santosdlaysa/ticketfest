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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { login, isLoading } = useAuthStore();

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
          <Text style={styles.title}>TicketFest</Text>
          <Text style={styles.subtitle}>Bem-vindo de volta!</Text>

          <Card style={styles.card}>
            <Card.Content>
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
                label="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
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

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Entrar
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
                style={styles.registerButton}
              >
                Não tem conta? Cadastre-se
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
  registerButton: {
    marginTop: spacing.sm,
  },
});
