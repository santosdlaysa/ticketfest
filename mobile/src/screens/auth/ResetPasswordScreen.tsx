import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      await authApi.verifyResetToken(token);
      setTokenValid(true);
    } catch (err: any) {
      setTokenValid(false);
      setTokenError(err.response?.data?.error || 'Token inválido ou expirado');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setErrors({ password: '', confirmPassword: '' });

    let hasError = false;

    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Senha é obrigatória' }));
      hasError = true;
    } else if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Senha deve ter no mínimo 6 caracteres' }));
      hasError = true;
    }

    if (!confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Confirmação é obrigatória' }));
      hasError = true;
    } else if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'As senhas não conferem' }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <LinearGradient
        colors={[lumeraColors.pretoObsidian, '#1A1A2E', lumeraColors.roxoLumera + '40']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lumeraColors.roxoLumera} />
          <Text style={styles.loadingText}>Verificando link...</Text>
        </View>
      </LinearGradient>
    );
  }

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

            {success ? (
              <View style={styles.formContainer}>
                <View style={styles.successIcon}>
                  <IconButton
                    icon="check-circle"
                    iconColor="#4CAF50"
                    size={48}
                  />
                </View>
                <Text style={styles.successTitle}>Senha redefinida!</Text>
                <Text style={styles.successText}>
                  Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
                </Text>

                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  buttonColor={lumeraColors.roxoLumera}
                  textColor="#fff"
                >
                  Ir para o login
                </Button>
              </View>
            ) : tokenValid ? (
              <>
                <Text style={styles.subtitle}>Nova senha</Text>
                <Text style={styles.description}>
                  Digite sua nova senha abaixo
                </Text>

                <View style={styles.formContainer}>
                  <TextInput
                    label="Nova senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    mode="flat"
                    error={!!errors.password}
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
                    label="Confirmar senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    mode="flat"
                    error={!!errors.confirmPassword}
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
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor={lumeraColors.roxoLumera}
                    textColor="#fff"
                  >
                    Redefinir senha
                  </Button>
                </View>
              </>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.errorIcon}>
                  <IconButton
                    icon="close-circle"
                    iconColor="#FF6B6B"
                    size={48}
                  />
                </View>
                <Text style={styles.errorTitle}>Link inválido</Text>
                <Text style={styles.errorDescription}>
                  {tokenError || 'Este link de recuperação expirou ou já foi utilizado.'}
                </Text>

                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  buttonColor={lumeraColors.roxoLumera}
                  textColor="#fff"
                >
                  Solicitar novo link
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fontSize.md,
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
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  errorIcon: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    color: lumeraColors.brancoLuminoso,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  errorDescription: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
});
