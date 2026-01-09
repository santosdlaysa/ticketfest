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
  IconButton,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api';
import { spacing, fontSize, lumeraColors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
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
            {/* Back Button */}
            <IconButton
              icon="arrow-left"
              iconColor={lumeraColors.brancoLuminoso}
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />

            {/* Logo e Marca */}
            <View style={styles.logoContainer}>
              <Text style={styles.title}>LUMERA</Text>
              <Text style={styles.tagline}>Uma nova era de brilho</Text>
            </View>

            {submitted ? (
              <View style={styles.formContainer}>
                <View style={styles.successIcon}>
                  <IconButton
                    icon="email-check"
                    iconColor={lumeraColors.roxoLumera}
                    size={48}
                  />
                </View>
                <Text style={styles.successTitle}>Email enviado!</Text>
                <Text style={styles.successText}>
                  Se o email informado estiver cadastrado, você receberá um link para redefinir sua senha.
                </Text>
                <Text style={styles.hintText}>
                  Não recebeu? Verifique sua caixa de spam ou tente novamente.
                </Text>

                <Button
                  mode="outlined"
                  onPress={() => setSubmitted(false)}
                  style={styles.retryButton}
                  textColor={lumeraColors.lilasNeon}
                >
                  Tentar novamente
                </Button>

                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backToLoginButton}
                  textColor={lumeraColors.brancoLuminoso}
                >
                  Voltar para o login
                </Button>
              </View>
            ) : (
              <>
                <Text style={styles.subtitle}>Esqueceu sua senha?</Text>
                <Text style={styles.description}>
                  Digite seu email para receber um link de recuperação
                </Text>

                <View style={styles.formContainer}>
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    mode="flat"
                    error={!!error}
                    style={styles.input}
                    disabled={loading}
                    textColor="#fff"
                    theme={{
                      colors: {
                        primary: lumeraColors.roxoLumera,
                        onSurfaceVariant: '#aaa',
                        surfaceVariant: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  />
                  {error ? (
                    <HelperText type="error" visible={!!error} style={styles.errorText}>
                      {error}
                    </HelperText>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor={lumeraColors.roxoLumera}
                    textColor="#fff"
                  >
                    Enviar link de recuperação
                  </Button>

                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Login')}
                    disabled={loading}
                    style={styles.backToLoginButton}
                    textColor={lumeraColors.brancoLuminoso}
                  >
                    Lembrou sua senha? Voltar para o login
                  </Button>
                </View>
              </>
            )}
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
  backButton: {
    position: 'absolute',
    top: spacing.xl + 20,
    left: spacing.sm,
    zIndex: 1,
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
    marginBottom: spacing.sm,
    fontWeight: '300',
  },
  description: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.xl,
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
  backToLoginButton: {
    marginTop: spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.xl,
    color: lumeraColors.brancoLuminoso,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  successText: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    borderColor: lumeraColors.lilasNeon,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
