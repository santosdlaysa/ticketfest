import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { theme, spacing, fontSize, lumeraColors } from '../../theme';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { ordersApi } from '../../services/api';
import {
  formatCardNumber,
  PaymentResult,
} from '../../services/paymentService';
import type { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';
type CheckoutStep = 'review' | 'card_form' | 'pix_qr' | 'processing' | 'success' | 'failed';

const PAYMENT_METHODS = [
  {
    id: 'PIX' as PaymentMethod,
    label: 'PIX',
    description: 'Aprovação instantânea',
    icon: 'qrcode',
    color: '#00A884',
  },
  {
    id: 'CREDIT_CARD' as PaymentMethod,
    label: 'Crédito',
    description: 'Parcele em até 12x',
    icon: 'credit-card',
    color: lumeraColors.azulGlow,
  },
  {
    id: 'DEBIT_CARD' as PaymentMethod,
    label: 'Débito',
    description: 'Débito à vista',
    icon: 'credit-card-outline',
    color: lumeraColors.roxoLumera,
  },
];

export default function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { cart, clearCart, fetchCart, loading: cartLoading } = useCartStore();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  // PIX state
  const [pixCode, setPixCode] = useState('');
  const [pixQrData, setPixQrData] = useState('');
  const [pixPaymentId, setPixPaymentId] = useState('');
  const [orderId, setOrderId] = useState('');

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCart = async () => {
      try {
        await fetchCart();
      } finally {
        setInitialLoadDone(true);
      }
    };
    loadCart();
  }, []);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getTotalItems = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (couponCode.toUpperCase() === 'DESCONTO10') {
        const discountValue = (cart?.subtotal || 0) * 0.1;
        setDiscount(discountValue);
        setCouponApplied(true);
        Alert.alert('Cupom aplicado!', '10% de desconto aplicado');
      } else if (couponCode.toUpperCase() === 'DESCONTO20') {
        const discountValue = (cart?.subtotal || 0) * 0.2;
        setDiscount(discountValue);
        setCouponApplied(true);
        Alert.alert('Cupom aplicado!', '20% de desconto aplicado');
      } else {
        Alert.alert('Cupom inválido', 'Este cupom não existe ou expirou');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setCouponApplied(false);
  };

  const handleProceedToPayment = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      Alert.alert('Erro', 'Carrinho vazio');
      return;
    }

    if (paymentMethod === 'PIX') {
      handlePixPayment();
    } else if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') {
      setStep('card_form');
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleCardPayment = async () => {
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      Alert.alert('Erro', 'Preencha todos os campos do cartão');
      return;
    }

    if (!cart || !cart.items.length) return;

    setStep('processing');
    setLoading(true);

    try {
      const tokenResponse = await ordersApi.createCardToken({
        number: cardNumber.replace(/\s/g, ''),
        holderName: cardHolder,
        expMonth: parseInt(expiryMonth),
        expYear: parseInt(expiryYear),
        cvv,
      });

      const orderData = {
        items: cart.items.map((item) => ({
          ticketId: item.ticket.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        cardToken: tokenResponse.token,
        installments: 1,
        couponCode: couponApplied ? couponCode : undefined,
      };

      const response = await ordersApi.create(orderData);

      if (response.payment?.card?.status === 'paid') {
        await clearCart();
        setStep('success');
      } else if (response.payment?.card?.status === 'pending') {
        await clearCart();
        setStep('success');
      } else {
        setErrorMessage('Pagamento recusado. Verifique os dados do cartão e tente novamente.');
        setStep('failed');
      }
    } catch (error: any) {
      console.error('Erro no pagamento com cartão:', error);
      const message = error.response?.data?.error || 'Falha ao processar pagamento. Tente novamente.';
      setErrorMessage(message);
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    if (!cart || !cart.items.length) return;

    setStep('processing');
    setLoading(true);

    try {
      const orderData = {
        items: cart.items.map((item) => ({
          ticketId: item.ticket.id,
          quantity: item.quantity,
        })),
        paymentMethod: 'PIX' as const,
        couponCode: couponApplied ? couponCode : undefined,
      };

      const response = await ordersApi.create(orderData);

      if (response.payment?.pix) {
        setPixCode(response.payment.pix.qrCode);
        setPixQrData(response.payment.pix.qrCodeUrl);
        setPixPaymentId(response.payment.pix.chargeId);
        setOrderId(response.order.id);
        setStep('pix_qr');
      } else {
        Alert.alert('Erro', 'Falha ao gerar PIX');
        setStep('review');
      }
    } catch (error: any) {
      console.error('Erro ao criar pedido PIX:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Falha ao gerar PIX');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPix = async () => {
    setLoading(true);

    try {
      const order = await ordersApi.getById(orderId);

      if (order.paymentStatus === 'PAID') {
        await clearCart();
        setStep('success');
      } else {
        Alert.alert(
          'Aguardando pagamento',
          'O pagamento PIX ainda não foi confirmado. Após pagar, aguarde alguns segundos e tente novamente.'
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao verificar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (paymentResult: PaymentResult) => {
    if (!cart || !cart.items.length) return;

    try {
      const orderData = {
        items: cart.items.map((item) => ({
          ticketId: item.ticket.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        couponCode: couponApplied ? couponCode : undefined,
      };

      await ordersApi.create(orderData);
      await clearCart();

      setStep('success');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar pedido');
    }
  };

  const copyPixCode = async () => {
    await Clipboard.setStringAsync(pixCode);
    Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
  };

  if (!initialLoadDone || (cartLoading && !cart)) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={lumeraColors.roxoLumera} />
        <Text style={[styles.emptySubtitle, { marginTop: spacing.md }]}>
          Carregando carrinho...
        </Text>
      </View>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.emptyIconOuter}>
          <View style={styles.emptyIconInner}>
            <MaterialCommunityIcons name="cart-off" size={48} color={lumeraColors.lilasNeon} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptySubtitle}>
          Adicione itens ao carrinho para continuar
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.emptyButton}>
          <LinearGradient
            colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
            style={styles.emptyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color="#fff" />
            <Text style={styles.emptyButtonText}>Voltar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = cart.subtotal || 0;
  const serviceFee = 0;
  const total = subtotal - discount + serviceFee;

  const getStepNumber = () => {
    if (step === 'review') return 2;
    if (step === 'card_form' || step === 'pix_qr') return 3;
    return 3;
  };

  const renderHeader = () => (
    <Surface style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity
        onPress={() => {
          if (step === 'review') {
            navigation.goBack();
          } else if (step === 'card_form') {
            setStep('review');
          } else if (step === 'pix_qr') {
            setStep('review');
          } else if (step === 'failed') {
            setStep('card_form');
            setErrorMessage('');
          } else if (step === 'success') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeMain' }],
            });
          }
        }}
        style={styles.backButton}
      >
        <MaterialCommunityIcons
          name={step === 'success' ? 'close' : 'arrow-left'}
          size={22}
          color={lumeraColors.roxoLumera}
        />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>
          {step === 'review' && 'Checkout'}
          {step === 'card_form' && 'Dados do Cartão'}
          {step === 'pix_qr' && 'Pagamento PIX'}
          {step === 'processing' && 'Processando'}
          {step === 'success' && 'Sucesso!'}
          {step === 'failed' && 'Pagamento Recusado'}
        </Text>
      </View>

      <View style={styles.headerPlaceholder} />
    </Surface>
  );

  const renderProgressSteps = () => {
    if (step === 'processing' || step === 'success' || step === 'failed') return null;

    const currentStep = getStepNumber();

    const renderDot = (stepNum: number, label: string) => {
      const isCompleted = currentStep > stepNum;
      const isCurrent = currentStep === stepNum;
      const isActive = isCompleted || isCurrent;

      return (
        <View style={styles.progressStep}>
          {isCompleted ? (
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.progressDot}
            >
              <MaterialCommunityIcons name="check" size={13} color="#fff" />
            </LinearGradient>
          ) : isCurrent ? (
            <LinearGradient
              colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
              style={styles.progressDot}
            >
              <Text style={styles.progressDotText}>{stepNum}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.progressDot, styles.progressDotInactive]}>
              <Text style={styles.progressDotTextInactive}>{stepNum}</Text>
            </View>
          )}
          <Text style={[
            styles.progressLabel,
            isCompleted && styles.progressLabelCompleted,
            isCurrent && styles.progressLabelCurrent,
          ]}>{label}</Text>
        </View>
      );
    };

    return (
      <View style={styles.progressContainer}>
        {renderDot(1, 'Carrinho')}
        <View style={[styles.progressLine, currentStep > 1 && styles.progressLineCompleted]} />
        {renderDot(2, 'Revisão')}
        <View style={[styles.progressLine, currentStep > 2 && styles.progressLineCompleted]} />
        {renderDot(3, 'Pagamento')}
      </View>
    );
  };

  const renderReviewStep = () => (
    <>
      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.roxoLumera + '12' }]}>
            <MaterialCommunityIcons name="account-circle" size={16} color={lumeraColors.roxoLumera} />
          </View>
          <Text style={styles.sectionTitle}>Comprador</Text>
          <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
        </View>
        <Surface style={styles.card}>
          <View style={styles.userInfoRow}>
            <LinearGradient
              colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
              style={styles.userAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.userAvatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.lilasNeon + '18' }]}>
            <MaterialCommunityIcons name="ticket-confirmation" size={16} color={lumeraColors.lilasNeon} />
          </View>
          <Text style={styles.sectionTitle}>Ingressos</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>{getTotalItems()}</Text>
          </View>
        </View>
        <Surface style={styles.card}>
          {cart.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.orderItem,
                index < cart.items.length - 1 && styles.orderItemBorder,
              ]}
            >
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{item.quantity}x</Text>
              </View>
              <View style={styles.orderItemCenter}>
                <Text style={styles.orderItemName}>{item.ticket.name}</Text>
                <Text style={styles.orderItemEvent} numberOfLines={1}>
                  {item.ticket.event?.name}
                </Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.ticket.price * item.quantity)}
              </Text>
            </View>
          ))}
        </Surface>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.azulGlow + '12' }]}>
            <MaterialCommunityIcons name="credit-card-outline" size={16} color={lumeraColors.azulGlow} />
          </View>
          <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        </View>
        <View style={styles.paymentMethodsGrid}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => setPaymentMethod(method.id)}
                style={[
                  styles.paymentMethodCard,
                  isSelected && styles.paymentMethodCardSelected,
                ]}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.paymentMethodIcon,
                  { backgroundColor: isSelected ? method.color + '20' : '#f5f5f5' }
                ]}>
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={22}
                    color={isSelected ? method.color : '#999'}
                  />
                </View>
                <Text style={[
                  styles.paymentMethodLabel,
                  isSelected && { color: method.color }
                ]}>
                  {method.label}
                </Text>
                <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                {isSelected && (
                  <View style={styles.paymentMethodCheck}>
                    <MaterialCommunityIcons name="check-circle" size={18} color={method.color} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Coupon */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: lumeraColors.douradoSuave + '20' }]}>
            <MaterialCommunityIcons name="tag-outline" size={16} color={lumeraColors.douradoSuave} />
          </View>
          <Text style={styles.sectionTitle}>Cupom de desconto</Text>
        </View>
        <Surface style={styles.card}>
          {couponApplied ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedInfo}>
                <View style={styles.couponCheckIcon}>
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                </View>
                <View>
                  <Text style={styles.couponAppliedCode}>{couponCode.toUpperCase()}</Text>
                  <Text style={styles.couponAppliedDiscount}>
                    -{formatPrice(discount)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} style={styles.couponRemoveButton}>
                <MaterialCommunityIcons name="close" size={16} color="#999" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Código do cupom"
                value={couponCode}
                onChangeText={setCouponCode}
                style={styles.couponInput}
                autoCapitalize="characters"
                outlineStyle={styles.couponInputOutline}
                outlineColor="#E0D4FF"
                activeOutlineColor={lumeraColors.roxoLumera}
                dense
              />
              <TouchableOpacity
                onPress={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode.trim()}
                style={[styles.couponApplyButton, (!couponCode.trim() || applyingCoupon) && styles.couponApplyButtonDisabled]}
              >
                <LinearGradient
                  colors={(!couponCode.trim() || applyingCoupon)
                    ? ['#E0E0E0', '#D0D0D0']
                    : [lumeraColors.roxoLumera, lumeraColors.azulGlow]}
                  style={styles.couponApplyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {applyingCoupon ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.couponApplyText}>Aplicar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Surface>
      </View>

      {/* Spacer */}
      <View style={{ height: 140 }} />
    </>
  );

  const renderCardForm = () => (
    <View style={styles.cardFormContainer}>
      <Surface style={styles.card}>
        <View style={styles.cardFormHeader}>
          <View style={[styles.cardFormIconContainer, { backgroundColor: lumeraColors.azulGlow + '12' }]}>
            <MaterialCommunityIcons name="credit-card" size={20} color={lumeraColors.azulGlow} />
          </View>
          <Text style={styles.cardFormTitle}>
            {paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Cartão de Débito'}
          </Text>
        </View>

        <TextInput
          label="Número do Cartão"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          placeholder="0000 0000 0000 0000"
          outlineStyle={styles.inputOutline}
          outlineColor="#E0D4FF"
          activeOutlineColor={lumeraColors.roxoLumera}
          left={<TextInput.Icon icon="credit-card-outline" color="#999" />}
        />

        <TextInput
          label="Nome no Cartão"
          value={cardHolder}
          onChangeText={setCardHolder}
          autoCapitalize="characters"
          mode="outlined"
          style={styles.input}
          placeholder="NOME COMO NO CARTÃO"
          outlineStyle={styles.inputOutline}
          outlineColor="#E0D4FF"
          activeOutlineColor={lumeraColors.roxoLumera}
          left={<TextInput.Icon icon="account-outline" color="#999" />}
        />

        <View style={styles.cardFormRow}>
          <TextInput
            label="Mês"
            value={expiryMonth}
            onChangeText={(v) => setExpiryMonth(v.slice(0, 2))}
            keyboardType="numeric"
            mode="outlined"
            style={[styles.input, styles.smallInput]}
            placeholder="MM"
            outlineStyle={styles.inputOutline}
            outlineColor="#E0D4FF"
            activeOutlineColor={lumeraColors.roxoLumera}
          />
          <TextInput
            label="Ano"
            value={expiryYear}
            onChangeText={(v) => setExpiryYear(v.slice(0, 2))}
            keyboardType="numeric"
            mode="outlined"
            style={[styles.input, styles.smallInput]}
            placeholder="AA"
            outlineStyle={styles.inputOutline}
            outlineColor="#E0D4FF"
            activeOutlineColor={lumeraColors.roxoLumera}
          />
          <TextInput
            label="CVV"
            value={cvv}
            onChangeText={(v) => setCvv(v.slice(0, 4))}
            keyboardType="numeric"
            mode="outlined"
            style={[styles.input, styles.smallInput]}
            placeholder="123"
            secureTextEntry
            outlineStyle={styles.inputOutline}
            outlineColor="#E0D4FF"
            activeOutlineColor={lumeraColors.roxoLumera}
          />
        </View>

        <View style={styles.cardBrands}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#4CAF50" />
          <Text style={styles.cardBrandsText}>Pagamento seguro</Text>
          <View style={styles.cardBrandsDot} />
          <Text style={styles.cardBrandsText}>Visa, Master, Elo, Amex</Text>
        </View>
      </Surface>

      <View style={{ height: 140 }} />
    </View>
  );

  const renderPixQr = () => (
    <View style={styles.pixContainer}>
      <Surface style={styles.pixCard}>
        <View style={styles.pixHeader}>
          <View style={styles.pixIconContainer}>
            <MaterialCommunityIcons name="qrcode" size={28} color="#00A884" />
          </View>
          <Text style={styles.pixTitle}>Pague com PIX</Text>
          <Text style={styles.pixSubtitle}>Escaneie o QR Code ou copie o código</Text>
        </View>

        <View style={styles.qrContainer}>
          <Image
            source={{ uri: pixQrData }}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.pixAmountContainer}>
          <Text style={styles.pixAmountLabel}>Valor a pagar</Text>
          <Text style={styles.pixAmountValue}>{formatPrice(total)}</Text>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={copyPixCode} activeOpacity={0.8}>
          <LinearGradient
            colors={[lumeraColors.roxoLumera + '10', lumeraColors.azulGlow + '10']}
            style={styles.copyButtonInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="content-copy" size={18} color={lumeraColors.roxoLumera} />
            <Text style={styles.copyButtonText}>Copiar código PIX</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.pixTimer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
          <Text style={styles.pixTimerText}>O código expira em 1 hora</Text>
        </View>
      </Surface>

      <TouchableOpacity
        onPress={handleConfirmPix}
        style={styles.confirmPixButton}
        disabled={loading}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
          style={styles.confirmPixGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.confirmPixText}>Já paguei</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStep('review')}
        style={styles.backTextButton}
      >
        <Text style={styles.backTextButtonLabel}>Escolher outra forma de pagamento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingIconOuter}>
        <LinearGradient
          colors={[lumeraColors.roxoLumera + '20', lumeraColors.azulGlow + '10']}
          style={styles.processingIconInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="large" color={lumeraColors.roxoLumera} />
        </LinearGradient>
      </View>
      <Text style={styles.processingTitle}>Processando pagamento...</Text>
      <Text style={styles.processingSubtitle}>Aguarde, não feche o aplicativo</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.successIconContainer}
      >
        <MaterialCommunityIcons name="check" size={56} color="#fff" />
      </LinearGradient>
      <Text style={styles.successTitle}>Pagamento aprovado!</Text>
      <Text style={styles.successSubtitle}>
        Seus ingressos já estão disponíveis na aba "Ingressos"
      </Text>

      <Surface style={styles.successCard}>
        <View style={styles.successCardRow}>
          <Text style={styles.successCardLabel}>Valor pago</Text>
          <Text style={styles.successCardValue}>{formatPrice(total)}</Text>
        </View>
        <View style={[styles.successCardRow, styles.successCardRowMiddle]}>
          <Text style={styles.successCardLabel}>Método</Text>
          <Text style={styles.successCardValue}>
            {paymentMethod === 'PIX' ? 'PIX' : 'Cartão'}
          </Text>
        </View>
        <View style={styles.successCardRow}>
          <Text style={styles.successCardLabel}>Ingressos</Text>
          <Text style={styles.successCardValue}>{getTotalItems()}</Text>
        </View>
      </Surface>

      <TouchableOpacity
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeMain' }],
          });
        }}
        style={styles.successButton}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
          style={styles.successButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons name="ticket" size={20} color="#fff" />
          <Text style={styles.successButtonText}>Ver meus ingressos</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.failedContainer}>
      <View style={styles.failedIconContainer}>
        <MaterialCommunityIcons name="close" size={56} color="#fff" />
      </View>
      <Text style={styles.failedTitle}>Pagamento recusado</Text>
      <Text style={styles.failedSubtitle}>
        {errorMessage || 'Não foi possível processar seu pagamento.'}
      </Text>

      <Surface style={styles.failedCard}>
        <View style={styles.failedTipRow}>
          <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#FF9800" />
          <Text style={styles.failedTipTitle}>Dicas para tentar novamente:</Text>
        </View>
        {[
          'Verifique o número do cartão',
          'Confira a data de validade',
          'Verifique se há limite disponível',
          'Tente outro cartão ou forma de pagamento',
        ].map((tip, index) => (
          <View key={index} style={styles.failedTipItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={14} color={lumeraColors.roxoLumera} />
            <Text style={styles.failedTipText}>{tip}</Text>
          </View>
        ))}
      </Surface>

      <TouchableOpacity
        onPress={() => {
          setStep('card_form');
          setErrorMessage('');
        }}
        style={styles.retryButton}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
          style={styles.retryButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setStep('review');
          setErrorMessage('');
        }}
        style={styles.changeMethodButton}
      >
        <Text style={styles.changeMethodText}>Escolher outra forma de pagamento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSummaryFooter = () => {
    if (step === 'processing' || step === 'success' || step === 'pix_qr' || step === 'failed') return null;

    return (
      <View style={[styles.summaryContainer, { paddingBottom: insets.bottom + 8 }]}>
        {/* Summary rows */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>

        {discount > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.discountLabelRow}>
              <MaterialCommunityIcons name="tag" size={14} color="#4CAF50" />
              <Text style={styles.discountLabel}>Desconto</Text>
            </View>
            <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
          </View>
        )}

        {/* Divider + Total + Button */}
        <View style={styles.totalContainer}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>

          <TouchableOpacity
            onPress={step === 'review' ? handleProceedToPayment : handleCardPayment}
            style={styles.payButton}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
              style={styles.payButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.payButtonText}>
                    {step === 'review' ? 'Pagar' : 'Confirmar'}
                  </Text>
                  <MaterialCommunityIcons
                    name={step === 'review' ? 'arrow-right' : 'lock'}
                    size={18}
                    color="#fff"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderHeader()}
      {renderProgressSteps()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'review' && renderReviewStep()}
        {step === 'card_form' && renderCardForm()}
        {step === 'pix_qr' && renderPixQr()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
        {step === 'failed' && renderFailed()}
      </ScrollView>

      {renderSummaryFooter()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: lumeraColors.roxoLumera + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 40,
  },

  // Progress Steps
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAFF',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotInactive: {
    backgroundColor: '#E8E4F0',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  progressDotTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  progressLine: {
    width: 36,
    height: 3,
    backgroundColor: '#E8E4F0',
    marginHorizontal: spacing.xs,
    borderRadius: 2,
  },
  progressLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  progressLabelCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressLabelCurrent: {
    color: lumeraColors.roxoLumera,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F5F3FF',
  },
  emptyIconOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: lumeraColors.roxoLumera + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: lumeraColors.roxoLumera + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },

  // Sections
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
    letterSpacing: -0.2,
  },
  itemCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: lumeraColors.lilasNeon,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    elevation: 2,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  // User Info
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  // Order Items
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAFF',
  },
  quantityBadge: {
    backgroundColor: lumeraColors.roxoLumera + '12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
  },
  orderItemCenter: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  orderItemEvent: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: lumeraColors.roxoLumera,
  },

  // Payment Methods
  paymentMethodsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0EAFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  paymentMethodCardSelected: {
    borderColor: lumeraColors.roxoLumera,
    backgroundColor: lumeraColors.roxoLumera + '05',
    elevation: 3,
    shadowColor: lumeraColors.roxoLumera,
    shadowOpacity: 0.1,
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentMethodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  paymentMethodDesc: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  paymentMethodCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  // Coupon
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#fff',
    height: 44,
  },
  couponInputOutline: {
    borderRadius: 12,
  },
  couponApplyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  couponApplyButtonDisabled: {
    opacity: 0.7,
  },
  couponApplyGradient: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  couponApplyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  couponCheckIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponAppliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  couponAppliedDiscount: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  couponRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card Form
  cardFormContainer: {
    flex: 1,
  },
  cardFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardFormIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 12,
  },
  cardFormRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallInput: {
    flex: 1,
  },
  cardBrands: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  cardBrandsText: {
    fontSize: 12,
    color: '#888',
  },
  cardBrandsDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCC',
  },

  // PIX
  pixContainer: {
    alignItems: 'center',
  },
  pixCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  pixHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pixIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#00A884' + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pixTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  pixSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0EAFF',
    marginBottom: spacing.lg,
  },
  pixAmountContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pixAmountLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  pixAmountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: lumeraColors.roxoLumera,
    marginTop: 2,
  },
  copyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
    width: '100%',
  },
  copyButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: lumeraColors.roxoLumera,
  },
  pixTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pixTimerText: {
    fontSize: 12,
    color: '#999',
  },
  confirmPixButton: {
    marginTop: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    elevation: 4,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  confirmPixGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmPixText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backTextButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  backTextButtonLabel: {
    fontSize: 14,
    color: lumeraColors.roxoLumera,
    fontWeight: '600',
  },

  // Processing
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  processingIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: lumeraColors.roxoLumera + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  processingIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: spacing.sm,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  successCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  successCardRowMiddle: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0EAFF',
  },
  successCardLabel: {
    fontSize: 14,
    color: '#888',
  },
  successCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  successButton: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    elevation: 4,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  successButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Failed
  failedContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  failedIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    elevation: 6,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F44336',
    letterSpacing: -0.3,
  },
  failedSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  failedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  failedTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  failedTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9800',
  },
  failedTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  failedTipText: {
    fontSize: 13,
    color: '#666',
  },
  retryButton: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    elevation: 4,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  changeMethodButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  changeMethodText: {
    fontSize: 14,
    color: lumeraColors.roxoLumera,
    fontWeight: '600',
  },

  // Summary Footer
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountLabel: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '700',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EAFF',
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  payButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: lumeraColors.roxoLumera,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
