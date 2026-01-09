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
  Button,
  Text,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { getApiErrorMessage } from '../../services/api';
import { spacing, fontSize, lumeraColors } from '../../theme';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const { login, isLoading, setAuth } = useAuthStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada com animação
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
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de brilho contínua
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

  const handleLogin = async () => {
    setErrors({ email: '', password: '' });

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
      const errorMessage = getApiErrorMessage(error, 'Ocorreu um erro ao fazer login. Tente novamente.');
      const errorLower = errorMessage.toLowerCase();

      // Try to identify which field has the error
      if (errorLower.includes('email') || errorLower.includes('usuário não encontrado') || errorLower.includes('user not found')) {
        setErrors((prev) => ({ ...prev, email: 'Email não encontrado' }));
      } else if (errorLower.includes('senha') || errorLower.includes('password') || errorLower.includes('incorreta') || errorLower.includes('incorrect') || errorLower.includes('inválid')) {
        setErrors((prev) => ({ ...prev, password: 'Senha incorreta' }));
      } else {
        Alert.alert('Erro no login', errorMessage);
      }
    }
  };

  const handleQuickAccess = async () => {
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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

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
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              }
            ]}
          >
            {/* Logo Icon */}
            <View style={styles.logoIconContainer}>
              <LinearGradient
                colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="diamond-stone" size={40} color="#fff" />
              </LinearGradient>
              <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            </View>

            {/* Brand Name */}
            <Text style={styles.brandName}>LUMERA</Text>
            <Text style={styles.tagline}>Brilhe em cada momento</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
              <View style={styles.formInner}>
                <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
                <Text style={styles.subtitleText}>Entre para continuar</Text>

                {/* Email Input */}
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'email' && styles.inputWrapperFocused,
                  errors.email && styles.inputWrapperError,
                ]}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={22}
                    color={focusedInput === 'email' ? lumeraColors.roxoLumera : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Seu email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    mode="flat"
                    style={styles.input}
                    disabled={isLoading}
                    textColor="#fff"
                    onFocus={() => setFocusedInput('email')}
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
                </View>
                {errors.email ? (
                  <HelperText type="error" visible style={styles.errorText}>
                    {errors.email}
                  </HelperText>
                ) : null}

                {/* Password Input */}
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'password' && styles.inputWrapperFocused,
                  errors.password && styles.inputWrapperError,
                ]}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={22}
                    color={focusedInput === 'password' ? lumeraColors.roxoLumera : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Sua senha"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    mode="flat"
                    style={styles.input}
                    disabled={isLoading}
                    textColor="#fff"
                    onFocus={() => setFocusedInput('password')}
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
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <HelperText type="error" visible style={styles.errorText}>
                    {errors.password}
                  </HelperText>
                ) : null}

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotButton}
                >
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  style={styles.loginButtonWrapper}
                >
                  <LinearGradient
                    colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                    style={styles.loginButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Entrar</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>ou continue com</Text>
                  <View style={styles.divider} />
                </View>

                {/* Quick Access Button */}
                <TouchableOpacity
                  onPress={handleQuickAccess}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  style={styles.quickAccessButton}
                >
                  <MaterialCommunityIcons
                    name="account-arrow-right-outline"
                    size={22}
                    color={lumeraColors.lilasNeon}
                  />
                  <Text style={styles.quickAccessText}>Acesso rápido (Demo)</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>

          {/* Register Link */}
          <Animated.View
            style={[
              styles.registerContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Cadastre-se</Text>
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
              <Text style={styles.loadingTitle}>Entrando...</Text>
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
    paddingTop: height * 0.08,
    paddingBottom: spacing.xl,
  },

  // Decorative Circles
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: lumeraColors.roxoLumera,
    opacity: 0.15,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: lumeraColors.azulGlow,
    opacity: 0.1,
  },
  decorCircle3: {
    position: 'absolute',
    top: height * 0.4,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: lumeraColors.lilasNeon,
    opacity: 0.08,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIconContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 34,
    backgroundColor: lumeraColors.roxoLumera,
    opacity: 0.4,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 6,
    textShadowColor: lumeraColors.roxoLumera,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  tagline: {
    fontSize: 14,
    color: lumeraColors.lilasNeon,
    marginTop: spacing.xs,
    letterSpacing: 2,
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
    padding: spacing.xl,
    backgroundColor: 'rgba(20, 20, 30, 0.6)',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: 15,
    color: '#888',
    marginBottom: spacing.xl,
  },

  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.md,
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
    fontSize: 16,
    height: 52,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },

  // Forgot Password
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    color: lumeraColors.lilasNeon,
    fontSize: 14,
    fontWeight: '500',
  },

  // Login Button
  loginButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: spacing.sm,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: '#666',
    fontSize: 13,
  },

  // Quick Access
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(173, 139, 255, 0.3)',
    backgroundColor: 'rgba(173, 139, 255, 0.05)',
    gap: spacing.sm,
  },
  quickAccessText: {
    color: lumeraColors.lilasNeon,
    fontSize: 15,
    fontWeight: '600',
  },

  // Register
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    color: '#888',
    fontSize: 15,
  },
  registerLink: {
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
