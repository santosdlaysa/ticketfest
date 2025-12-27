import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  TextInput,
  Text,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { getApiErrorMessage, getFieldErrors } from '../../services/api';
import { spacing, lumeraColors } from '../../theme';

const { width, height } = Dimensions.get('window');

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    general: '',
  });

  const { register, isLoading } = useAuthStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleRegister = async () => {
    setErrors({ name: '', email: '', password: '', confirmPassword: '', phone: '', cpf: '', general: '' });

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
        phone: phone.replace(/\D/g, '') || undefined,
        cpf: cpf.replace(/\D/g, '') || undefined,
      });
    } catch (error: any) {
      // First, check for field-specific validation errors from Zod
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          name: fieldErrors.name || '',
          email: fieldErrors.email || '',
          password: fieldErrors.password || '',
          cpf: fieldErrors.cpf || '',
          phone: fieldErrors.phone || '',
        }));
        return;
      }

      // Otherwise, try to identify which field has the error from the message
      const errorMessage = getApiErrorMessage(error, 'Ocorreu um erro ao cadastrar. Tente novamente.');
      const errorLower = errorMessage.toLowerCase();

      if (errorLower.includes('email') || errorLower.includes('e-mail')) {
        if (errorLower.includes('já') || errorLower.includes('already') || errorLower.includes('existe') || errorLower.includes('registered') || errorLower.includes('cadastrado')) {
          setErrors((prev) => ({ ...prev, email: 'Este email já está cadastrado' }));
        } else {
          setErrors((prev) => ({ ...prev, email: errorMessage }));
        }
      } else if (errorLower.includes('cpf')) {
        if (errorLower.includes('já') || errorLower.includes('already') || errorLower.includes('existe') || errorLower.includes('cadastrado')) {
          setErrors((prev) => ({ ...prev, cpf: 'Este CPF já está cadastrado' }));
        } else if (errorLower.includes('inválido') || errorLower.includes('invalid') || errorLower.includes('dígitos')) {
          setErrors((prev) => ({ ...prev, cpf: 'CPF inválido' }));
        } else {
          setErrors((prev) => ({ ...prev, cpf: errorMessage }));
        }
      } else if (errorLower.includes('telefone') || errorLower.includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: errorMessage }));
      } else if (errorLower.includes('senha') || errorLower.includes('password')) {
        setErrors((prev) => ({ ...prev, password: errorMessage }));
      } else if (errorLower.includes('nome') || errorLower.includes('name')) {
        setErrors((prev) => ({ ...prev, name: errorMessage }));
      } else {
        // Show general error as Alert for non-field-specific errors
        setErrors((prev) => ({ ...prev, general: errorMessage }));
        Alert.alert('Erro no cadastro', errorMessage);
      }
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    inputKey: string,
    options?: {
      secureTextEntry?: boolean;
      showToggle?: boolean;
      toggleValue?: boolean;
      onToggle?: () => void;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      autoCapitalize?: 'none' | 'words';
      error?: string;
      optional?: boolean;
    }
  ) => (
    <>
      <View
        style={[
          styles.inputWrapper,
          focusedInput === inputKey && styles.inputWrapperFocused,
          options?.error && styles.inputWrapperError,
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={focusedInput === inputKey ? lumeraColors.roxoLumera : '#666'}
          style={styles.inputIcon}
        />
        <TextInput
          placeholder={options?.optional ? `${placeholder} (opcional)` : placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          keyboardType={options?.keyboardType || 'default'}
          autoCapitalize={options?.autoCapitalize || 'none'}
          secureTextEntry={options?.secureTextEntry && !options?.toggleValue}
          mode="flat"
          style={styles.input}
          disabled={isLoading}
          textColor="#fff"
          onFocus={() => setFocusedInput(inputKey)}
          onBlur={() => setFocusedInput(null)}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          theme={{
            colors: {
              primary: 'transparent',
              onSurfaceVariant: '#666',
            },
          }}
        />
        {options?.showToggle && (
          <TouchableOpacity onPress={options.onToggle} style={styles.eyeButton}>
            <MaterialCommunityIcons
              name={options.toggleValue ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>
      {options?.error ? (
        <HelperText type="error" visible style={styles.errorText}>
          {options.error}
        </HelperText>
      ) : null}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A0A0F', '#12121A', '#1A1025', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles */}
      <Animated.View style={[styles.decorCircle1, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.decorCircle2, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.decorCircle3, { opacity: glowOpacity }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: headerScale }],
              },
            ]}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={[lumeraColors.azulGlow, lumeraColors.roxoLumera]}
                style={styles.headerIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="account-plus" size={32} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.headerTitle}>Criar Conta</Text>
            <Text style={styles.headerSubtitle}>Junte-se à Lumera</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
              <View style={styles.formInner}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressStep}>
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <Text style={styles.progressLabel}>Dados</Text>
                  </View>
                  <View style={styles.progressLine} />
                  <View style={styles.progressStep}>
                    <View style={styles.progressDot} />
                    <Text style={styles.progressLabel}>Segurança</Text>
                  </View>
                </View>

                {/* Name */}
                {renderInput('account-outline', 'Nome completo', name, setName, 'name', {
                  autoCapitalize: 'words',
                  error: errors.name,
                })}

                {/* Email */}
                {renderInput('email-outline', 'Seu email', email, setEmail, 'email', {
                  keyboardType: 'email-address',
                  error: errors.email,
                })}

                {/* Phone */}
                {renderInput(
                  'phone-outline',
                  'Telefone',
                  phone,
                  (text) => setPhone(formatPhone(text)),
                  'phone',
                  {
                    keyboardType: 'phone-pad',
                    optional: true,
                    error: errors.phone,
                  }
                )}

                {/* CPF */}
                {renderInput(
                  'card-account-details-outline',
                  'CPF',
                  cpf,
                  (text) => setCpf(formatCPF(text)),
                  'cpf',
                  {
                    keyboardType: 'numeric',
                    optional: true,
                    error: errors.cpf,
                  }
                )}

                {/* Divider */}
                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#666" />
                  <View style={styles.dividerLine} />
                </View>

                {/* Password */}
                {renderInput('lock-outline', 'Criar senha', password, setPassword, 'password', {
                  secureTextEntry: true,
                  showToggle: true,
                  toggleValue: showPassword,
                  onToggle: () => setShowPassword(!showPassword),
                  error: errors.password,
                })}

                {/* Confirm Password */}
                {renderInput(
                  'lock-check-outline',
                  'Confirmar senha',
                  confirmPassword,
                  setConfirmPassword,
                  'confirmPassword',
                  {
                    secureTextEntry: true,
                    showToggle: true,
                    toggleValue: showConfirmPassword,
                    onToggle: () => setShowConfirmPassword(!showConfirmPassword),
                    error: errors.confirmPassword,
                  }
                )}

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <View style={styles.requirementRow}>
                    <MaterialCommunityIcons
                      name={password.length >= 6 ? 'check-circle' : 'circle-outline'}
                      size={16}
                      color={password.length >= 6 ? '#4CAF50' : '#666'}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        password.length >= 6 && styles.requirementMet,
                      ]}
                    >
                      Mínimo 6 caracteres
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <MaterialCommunityIcons
                      name={
                        password && password === confirmPassword
                          ? 'check-circle'
                          : 'circle-outline'
                      }
                      size={16}
                      color={password && password === confirmPassword ? '#4CAF50' : '#666'}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        password && password === confirmPassword && styles.requirementMet,
                      ]}
                    >
                      Senhas conferem
                    </Text>
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  style={styles.registerButtonWrapper}
                >
                  <LinearGradient
                    colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                    style={styles.registerButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.registerButtonText}>Criar minha conta</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.termsText}>
                  Ao criar uma conta, você concorda com nossos{' '}
                  <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
                  <Text style={styles.termsLink}>Política de Privacidade</Text>
                </Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* Login Link */}
          <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <Modal
        visible={isLoading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loadingOverlay}>
          <BlurView intensity={30} tint="dark" style={styles.loadingBlur}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingIconContainer}>
                <LinearGradient
                  colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                  style={styles.loadingIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <ActivityIndicator color="#fff" size="large" />
                </LinearGradient>
              </View>
              <Text style={styles.loadingTitle}>Criando sua conta...</Text>
              <Text style={styles.loadingSubtitle}>Aguarde um momento</Text>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: height * 0.05,
    paddingBottom: spacing.xl,
  },

  // Decorative Circles
  decorCircle1: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: lumeraColors.azulGlow,
    opacity: 0.12,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: lumeraColors.roxoLumera,
    opacity: 0.1,
  },
  decorCircle3: {
    position: 'absolute',
    top: height * 0.5,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: lumeraColors.lilasNeon,
    opacity: 0.06,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: spacing.md,
  },
  headerIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: lumeraColors.lilasNeon,
    marginTop: spacing.xs,
    opacity: 0.9,
  },

  // Form Card
  formCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(123, 46, 255, 0.2)',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 28,
  },
  formInner: {
    padding: spacing.lg,
    backgroundColor: 'rgba(20, 20, 30, 0.6)',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: lumeraColors.roxoLumera,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.md,
  },
  progressLabel: {
    fontSize: 11,
    color: '#666',
  },

  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: lumeraColors.roxoLumera,
    backgroundColor: 'rgba(123, 46, 255, 0.08)',
  },
  inputWrapperError: {
    borderColor: '#FF6B6B',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 15,
    height: 50,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },

  // Section Divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Requirements
  requirementsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
  },
  requirementMet: {
    color: '#4CAF50',
  },

  // Register Button
  registerButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: spacing.sm,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    color: lumeraColors.lilasNeon,
    fontWeight: '500',
  },

  // Login
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    color: '#888',
    fontSize: 15,
  },
  loginLink: {
    color: lumeraColors.lilasNeon,
    fontSize: 15,
    fontWeight: '700',
  },

  // Loading Overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  loadingContent: {
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
  },
  loadingIconContainer: {
    marginBottom: spacing.lg,
  },
  loadingIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    color: '#888',
    fontSize: 14,
  },
});
