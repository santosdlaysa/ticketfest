import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { theme, spacing, fontSize } from '../../theme';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { ordersApi } from '../../services/api';
import {
  processCardPayment,
  generatePixPayment,
  confirmPixPayment,
  formatCardNumber,
  CardData,
  PaymentResult,
} from '../../services/paymentService';
import type { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';
type CheckoutStep = 'review' | 'card_form' | 'pix_qr' | 'processing' | 'success';

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
    label: 'Cartão de Crédito',
    description: 'Parcele em até 12x',
    icon: 'credit-card',
    color: '#1976D2',
  },
  {
    id: 'DEBIT_CARD' as PaymentMethod,
    label: 'Cartão de Débito',
    description: 'Débito à vista',
    icon: 'credit-card-outline',
    color: '#7B1FA2',
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

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Buscar o carrinho ao montar a tela
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

    setStep('processing');
    setLoading(true);

    try {
      const cardData: CardData = {
        number: cardNumber,
        holderName: cardHolder,
        expiryMonth,
        expiryYear,
        cvv,
      };

      const result = await processCardPayment(total, cardData, `order-${Date.now()}`);

      if (result.success) {
        await createOrder(result);
      } else {
        Alert.alert('Pagamento recusado', result.message);
        setStep('card_form');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar pagamento');
      setStep('card_form');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    setStep('processing');
    setLoading(true);

    try {
      const result = await generatePixPayment(total, `order-${Date.now()}`);

      if (result.success && result.pixCode && result.pixQrCode) {
        setPixCode(result.pixCode);
        setPixQrData(result.pixQrCode);
        setPixPaymentId(result.paymentId);
        setStep('pix_qr');
      } else {
        Alert.alert('Erro', 'Falha ao gerar PIX');
        setStep('review');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar PIX');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPix = async () => {
    setLoading(true);

    try {
      const result = await confirmPixPayment(pixPaymentId);

      if (result.success) {
        await createOrder(result);
      } else {
        Alert.alert('Erro', 'Pagamento não confirmado');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao confirmar pagamento');
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

  // Mostrar loading enquanto carrega o carrinho pela primeira vez
  if (!initialLoadDone || (cartLoading && !cart)) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.emptySubtitle, { marginTop: spacing.md }]}>
          Carregando carrinho...
        </Text>
      </View>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons name="cart-off" size={64} color="#ccc" />
        </View>
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptySubtitle}>
          Adicione itens ao carrinho para continuar
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.emptyButton}
        >
          Voltar
        </Button>
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
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity
        onPress={() => {
          if (step === 'review') {
            navigation.goBack();
          } else if (step === 'card_form') {
            setStep('review');
          } else if (step === 'pix_qr') {
            setStep('review');
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
          size={24}
          color={theme.colors.onSurface}
        />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>
          {step === 'review' && 'Checkout'}
          {step === 'card_form' && 'Dados do Cartão'}
          {step === 'pix_qr' && 'Pagamento PIX'}
          {step === 'processing' && 'Processando'}
          {step === 'success' && 'Sucesso!'}
        </Text>
      </View>

      <View style={styles.headerPlaceholder} />
    </View>
  );

  const renderProgressSteps = () => {
    if (step === 'processing' || step === 'success') return null;

    const currentStep = getStepNumber();

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotCompleted]}>
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelCompleted]}>Carrinho</Text>
        </View>
        <View style={[styles.progressLine, styles.progressLineCompleted]} />
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 2 && (currentStep === 2 ? styles.progressDotCurrent : styles.progressDotCompleted)
          ]}>
            {currentStep > 2 ? (
              <MaterialCommunityIcons name="check" size={14} color="#fff" />
            ) : (
              <Text style={[styles.progressDotText, currentStep < 2 && styles.progressDotTextInactive]}>2</Text>
            )}
          </View>
          <Text style={[
            styles.progressLabel,
            currentStep === 2 && styles.progressLabelCurrent,
            currentStep > 2 && styles.progressLabelCompleted
          ]}>Revisão</Text>
        </View>
        <View style={[styles.progressLine, currentStep > 2 && styles.progressLineCompleted]} />
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 3 && styles.progressDotCurrent
          ]}>
            <Text style={[styles.progressDotText, currentStep < 3 && styles.progressDotTextInactive]}>3</Text>
          </View>
          <Text style={[styles.progressLabel, currentStep >= 3 && styles.progressLabelCurrent]}>Pagamento</Text>
        </View>
      </View>
    );
  };

  const renderReviewStep = () => (
    <>
      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Comprador</Text>
          <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
        </View>
        <Surface style={styles.card}>
          <View style={styles.userInfoRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
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
          <MaterialCommunityIcons name="ticket-confirmation" size={20} color={theme.colors.primary} />
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
          <MaterialCommunityIcons name="credit-card-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        </View>
        <View style={styles.paymentMethodsGrid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setPaymentMethod(method.id)}
              style={[
                styles.paymentMethodCard,
                paymentMethod === method.id && styles.paymentMethodCardSelected,
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.paymentMethodIcon,
                { backgroundColor: method.color + '15' }
              ]}>
                <MaterialCommunityIcons
                  name={method.icon as any}
                  size={24}
                  color={method.color}
                />
              </View>
              <Text style={[
                styles.paymentMethodLabel,
                paymentMethod === method.id && styles.paymentMethodLabelSelected
              ]}>
                {method.label}
              </Text>
              <Text style={styles.paymentMethodDesc}>{method.description}</Text>
              {paymentMethod === method.id && (
                <View style={styles.paymentMethodCheck}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Coupon */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="tag-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Cupom</Text>
        </View>
        <Surface style={styles.card}>
          {couponApplied ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedInfo}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                <View>
                  <Text style={styles.couponAppliedCode}>{couponCode.toUpperCase()}</Text>
                  <Text style={styles.couponAppliedDiscount}>
                    -{formatPrice(discount)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#999" />
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
                dense
              />
              <Button
                mode="contained"
                onPress={handleApplyCoupon}
                loading={applyingCoupon}
                disabled={applyingCoupon || !couponCode.trim()}
                style={styles.couponButton}
                compact
              >
                Aplicar
              </Button>
            </View>
          )}
        </Surface>
      </View>

      {/* Spacer */}
      <View style={{ height: 180 }} />
    </>
  );

  const renderCardForm = () => (
    <View style={styles.cardFormContainer}>
      <Surface style={styles.card}>
        <View style={styles.cardFormHeader}>
          <MaterialCommunityIcons name="credit-card" size={24} color={theme.colors.primary} />
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
          />
        </View>

        <View style={styles.cardBrands}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
          <Text style={styles.cardBrandsText}>Pagamento seguro • Visa, Master, Elo, Amex</Text>
        </View>
      </Surface>

      {/* Spacer */}
      <View style={{ height: 180 }} />
    </View>
  );

  const renderPixQr = () => (
    <View style={styles.pixContainer}>
      <Surface style={styles.pixCard}>
        <View style={styles.pixHeader}>
          <View style={styles.pixIconContainer}>
            <MaterialCommunityIcons name="qrcode" size={32} color="#00A884" />
          </View>
          <Text style={styles.pixTitle}>Pague com PIX</Text>
          <Text style={styles.pixSubtitle}>Escaneie o QR Code ou copie o código</Text>
        </View>

        <View style={styles.qrContainer}>
          <QRCode value={pixQrData} size={180} />
        </View>

        <View style={styles.pixAmountContainer}>
          <Text style={styles.pixAmountLabel}>Valor a pagar</Text>
          <Text style={styles.pixAmountValue}>{formatPrice(total)}</Text>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={copyPixCode}>
          <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.primary} />
          <Text style={styles.copyButtonText}>Copiar código PIX</Text>
        </TouchableOpacity>

        <View style={styles.pixTimer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
          <Text style={styles.pixTimerText}>O código expira em 30 minutos</Text>
        </View>
      </Surface>

      <Button
        mode="contained"
        onPress={handleConfirmPix}
        style={styles.confirmPixButton}
        contentStyle={styles.confirmPixButtonContent}
        loading={loading}
        disabled={loading}
        icon="check"
      >
        Já paguei
      </Button>

      <Button
        mode="text"
        onPress={() => setStep('review')}
        style={styles.backTextButton}
      >
        Escolher outra forma de pagamento
      </Button>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.processingTitle}>Processando pagamento...</Text>
      <Text style={styles.processingSubtitle}>Aguarde, não feche o aplicativo</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconContainer}>
        <MaterialCommunityIcons name="check" size={64} color="#fff" />
      </View>
      <Text style={styles.successTitle}>Pagamento aprovado!</Text>
      <Text style={styles.successSubtitle}>
        Seus ingressos já estão disponíveis na aba "Ingressos"
      </Text>

      <Surface style={styles.successCard}>
        <View style={styles.successCardRow}>
          <Text style={styles.successCardLabel}>Valor pago</Text>
          <Text style={styles.successCardValue}>{formatPrice(total)}</Text>
        </View>
        <View style={styles.successCardRow}>
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

      <Button
        mode="contained"
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeMain' }],
          });
        }}
        style={styles.successButton}
        contentStyle={styles.successButtonContent}
        icon="ticket"
      >
        Ver meus ingressos
      </Button>
    </View>
  );

  const renderSummaryFooter = () => {
    if (step === 'processing' || step === 'success' || step === 'pix_qr') return null;

    return (
      <Surface style={[styles.summaryContainer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.summaryDetails}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.discountLabelRow}>
                <MaterialCommunityIcons name="tag" size={16} color="#4CAF50" />
                <Text style={styles.discountLabel}>Desconto</Text>
              </View>
              <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalContainer}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>

          <Button
            mode="contained"
            onPress={step === 'review' ? handleProceedToPayment : handleCardPayment}
            style={styles.payButton}
            contentStyle={styles.payButtonContent}
            labelStyle={styles.payButtonLabel}
            loading={loading}
            disabled={loading}
            icon={step === 'review' ? 'arrow-right' : 'lock'}
          >
            {step === 'review' ? 'Pagar' : 'Confirmar'}
          </Button>
        </View>
      </Surface>
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
      </ScrollView>

      {renderSummaryFooter()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
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
    borderBottomColor: '#eee',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressDotCurrent: {
    backgroundColor: theme.colors.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  progressDotTextInactive: {
    color: '#999',
  },
  progressLine: {
    width: 40,
    height: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: spacing.xs,
  },
  progressLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  progressLabelCompleted: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  progressLabelCurrent: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#f5f5f5',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: 12,
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
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  itemCountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    elevation: 2,
  },

  // User Info
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  userDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
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
    borderBottomColor: '#f0f0f0',
  },
  quantityBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  orderItemCenter: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  orderItemEvent: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },

  // Payment Methods
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  paymentMethodCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    elevation: 1,
  },
  paymentMethodCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentMethodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  paymentMethodLabelSelected: {
    color: theme.colors.primary,
  },
  paymentMethodDesc: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  paymentMethodCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    borderRadius: 10,
  },
  couponButton: {
    borderRadius: 10,
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
  couponAppliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  couponAppliedDiscount: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
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
  cardFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 10,
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
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardBrandsText: {
    fontSize: 12,
    color: '#666',
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
    elevation: 2,
  },
  pixHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pixIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00A884' + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pixTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  pixSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: spacing.lg,
  },
  pixAmountContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pixAmountLabel: {
    fontSize: 13,
    color: '#666',
  },
  pixAmountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  pixTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pixTimerText: {
    fontSize: 12,
    color: '#666',
  },
  confirmPixButton: {
    marginTop: spacing.lg,
    borderRadius: 12,
    width: '100%',
  },
  confirmPixButtonContent: {
    paddingVertical: spacing.sm,
  },
  backTextButton: {
    marginTop: spacing.sm,
  },

  // Processing
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: spacing.lg,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: spacing.sm,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
    elevation: 2,
  },
  successCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  successCardLabel: {
    fontSize: 14,
    color: '#666',
  },
  successCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  successButton: {
    borderRadius: 12,
    width: '100%',
  },
  successButtonContent: {
    paddingVertical: spacing.sm,
  },

  // Summary
  summaryContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryDetails: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountLabel: {
    fontSize: 14,
    color: '#4CAF50',
  },
  discountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  payButton: {
    borderRadius: 12,
    minWidth: 140,
  },
  payButtonContent: {
    paddingVertical: spacing.sm,
  },
  payButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
