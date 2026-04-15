import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  Text,
  Surface,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { theme, spacing, fontSize, lumeraColors } from '../../theme';
import { useCartStore } from '../../stores/cartStore';
import {
  processCardPayment,
  generatePixPayment,
  generateBoletoPayment,
  checkPixPayment,
  formatCardNumber,
  CardData,
  PaymentResult,
} from '../../services/paymentService';
import type { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type RouteProps = RouteProp<HomeStackParamList, 'Payment'>;

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO';
type PaymentStep = 'method' | 'card_form' | 'pix_qr' | 'boleto' | 'processing' | 'success';

const PAYMENT_METHODS = [
  { id: 'PIX' as PaymentMethod, label: 'PIX', description: 'Aprovação instantânea', icon: 'qrcode', color: '#00A884' },
  { id: 'CREDIT_CARD' as PaymentMethod, label: 'Crédito', description: 'Parcele em até 12x', icon: 'credit-card', color: lumeraColors.azulGlow },
  { id: 'DEBIT_CARD' as PaymentMethod, label: 'Débito', description: 'Débito à vista', icon: 'credit-card-outline', color: lumeraColors.roxoLumera },
  { id: 'BOLETO' as PaymentMethod, label: 'Boleto', description: 'Vencimento em 3 dias', icon: 'barcode', color: '#FF9800' },
];

export default function PaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { cart, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [step, setStep] = useState<PaymentStep>('method');
  const [loading, setLoading] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const [pixCode, setPixCode] = useState('');
  const [pixPaymentId, setPixPaymentId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [boletoBarcode, setBoletoBarcode] = useState('');

  const amount = cart?.total || 0;

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSelectMethod = () => {
    if (paymentMethod === 'PIX') handlePixPayment();
    else if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') setStep('card_form');
    else if (paymentMethod === 'BOLETO') handleBoletoPayment();
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, '').length <= 16) setCardNumber(formatted);
  };

  const handleCardPayment = async () => {
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      Alert.alert('Erro', 'Preencha todos os campos do cartão');
      return;
    }
    if (!cart || !cart.items.length) { Alert.alert('Erro', 'Carrinho vazio'); return; }

    setStep('processing');
    setLoading(true);
    try {
      const cardData: CardData = { number: cardNumber, holderName: cardHolder, expiryMonth, expiryYear, cvv };
      const cartItems = cart.items.map((item) => ({ ticketId: item.ticket.id, quantity: item.quantity }));
      const result = await processCardPayment(cartItems, cardData, 1, paymentMethod as 'CREDIT_CARD' | 'DEBIT_CARD');

      if (result.success && result.status === 'approved') {
        await clearCart();
        setStep('success');
      } else if (result.success && result.status === 'pending') {
        Alert.alert('Pagamento em processamento', result.message, [{ text: 'OK', onPress: async () => { await clearCart(); setStep('success'); } }]);
      } else {
        Alert.alert('Pagamento recusado', result.message);
        setStep('card_form');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao processar pagamento');
      setStep('card_form');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    if (!cart || !cart.items.length) return;
    setStep('processing');
    setLoading(true);
    try {
      const cartItems = cart.items.map((item) => ({ ticketId: item.ticket.id, quantity: item.quantity }));
      const result = await generatePixPayment(cartItems);
      if (result.success && result.pixCode) {
        setPixCode(result.pixCode);
        setPixPaymentId(result.chargeId || result.paymentId);
        setOrderId(result.orderId || '');
        setStep('pix_qr');
      } else {
        Alert.alert('Erro', result.message || 'Falha ao gerar PIX');
        setStep('method');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao gerar PIX');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPix = async () => {
    if (!orderId) { Alert.alert('Erro', 'ID do pedido não encontrado'); return; }
    setLoading(true);
    try {
      const result = await checkPixPayment(orderId);
      if (result.paid) { await clearCart(); setStep('success'); }
      else Alert.alert('Aguardando pagamento', 'O pagamento PIX ainda não foi confirmado. Após pagar, aguarde alguns segundos e tente novamente.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao verificar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleBoletoPayment = async () => {
    if (!cart || !cart.items.length) return;
    setStep('processing');
    setLoading(true);
    try {
      const cartItems = cart.items.map((item) => ({ ticketId: item.ticket.id, quantity: item.quantity }));
      const result = await generateBoletoPayment(cartItems);
      if (result.success && result.boletoBarcode) {
        setBoletoBarcode(result.boletoBarcode);
        setStep('boleto');
        await clearCart();
      } else {
        Alert.alert('Erro', result.message || 'Falha ao gerar boleto');
        setStep('method');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao gerar boleto');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    await Clipboard.setStringAsync(pixCode);
    Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
  };

  const copyBoletoCode = async () => {
    await Clipboard.setStringAsync(boletoBarcode);
    Alert.alert('Copiado!', 'Código de barras copiado para a área de transferência');
  };

  const renderHeader = () => (
    <Surface style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity
        onPress={() => {
          if (step === 'method' || step === 'success') navigation.goBack();
          else setStep('method');
        }}
        style={styles.backButton}
      >
        <MaterialCommunityIcons name={step === 'success' ? 'close' : 'arrow-left'} size={22} color={lumeraColors.roxoLumera} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Pagamento</Text>
      </View>
      <View style={styles.headerPlaceholder} />
    </Surface>
  );

  const renderMethodSelection = () => (
    <>
      {/* Amount Card */}
      <Surface style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total a pagar</Text>
        <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
      </Surface>

      {/* Payment Methods */}
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
              style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentMethodIcon, { backgroundColor: isSelected ? method.color + '20' : '#f5f5f5' }]}>
                <MaterialCommunityIcons name={method.icon as any} size={22} color={isSelected ? method.color : '#999'} />
              </View>
              <Text style={[styles.paymentMethodLabel, isSelected && { color: method.color }]}>{method.label}</Text>
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

      <TouchableOpacity onPress={handleSelectMethod} style={styles.continueButton} activeOpacity={0.85}>
        <LinearGradient colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]} style={styles.continueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.continueText}>Continuar</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderCardForm = () => (
    <>
      <Surface style={styles.card}>
        <View style={styles.cardFormHeader}>
          <View style={[styles.cardFormIconContainer, { backgroundColor: lumeraColors.azulGlow + '12' }]}>
            <MaterialCommunityIcons name="credit-card" size={20} color={lumeraColors.azulGlow} />
          </View>
          <Text style={styles.cardFormTitle}>
            {paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Cartão de Débito'}
          </Text>
        </View>

        <TextInput label="Número do Cartão" value={cardNumber} onChangeText={handleCardNumberChange} keyboardType="numeric" mode="outlined" style={styles.input} placeholder="0000 0000 0000 0000" outlineStyle={styles.inputOutline} outlineColor="#E0D4FF" activeOutlineColor={lumeraColors.roxoLumera} left={<TextInput.Icon icon="credit-card-outline" color="#999" />} />
        <TextInput label="Nome no Cartão" value={cardHolder} onChangeText={setCardHolder} autoCapitalize="characters" mode="outlined" style={styles.input} placeholder="NOME COMO NO CARTÃO" outlineStyle={styles.inputOutline} outlineColor="#E0D4FF" activeOutlineColor={lumeraColors.roxoLumera} left={<TextInput.Icon icon="account-outline" color="#999" />} />

        <View style={styles.cardFormRow}>
          <TextInput label="Mês" value={expiryMonth} onChangeText={(v) => setExpiryMonth(v.slice(0, 2))} keyboardType="numeric" mode="outlined" style={[styles.input, styles.smallInput]} placeholder="MM" outlineStyle={styles.inputOutline} outlineColor="#E0D4FF" activeOutlineColor={lumeraColors.roxoLumera} />
          <TextInput label="Ano" value={expiryYear} onChangeText={(v) => setExpiryYear(v.slice(0, 2))} keyboardType="numeric" mode="outlined" style={[styles.input, styles.smallInput]} placeholder="AA" outlineStyle={styles.inputOutline} outlineColor="#E0D4FF" activeOutlineColor={lumeraColors.roxoLumera} />
          <TextInput label="CVV" value={cvv} onChangeText={(v) => setCvv(v.slice(0, 4))} keyboardType="numeric" mode="outlined" style={[styles.input, styles.smallInput]} placeholder="123" secureTextEntry outlineStyle={styles.inputOutline} outlineColor="#E0D4FF" activeOutlineColor={lumeraColors.roxoLumera} />
        </View>

        <View style={styles.cardBrands}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#4CAF50" />
          <Text style={styles.cardBrandsText}>Pagamento seguro</Text>
          <View style={styles.cardBrandsDot} />
          <Text style={styles.cardBrandsText}>Visa, Master, Elo, Amex</Text>
        </View>
      </Surface>

      <TouchableOpacity onPress={handleCardPayment} style={styles.continueButton} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]} style={styles.continueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <MaterialCommunityIcons name="lock" size={18} color="#fff" />
              <Text style={styles.continueText}>Pagar {formatPrice(amount)}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('method')} style={styles.backTextButton}>
        <Text style={styles.backTextLabel}>Voltar</Text>
      </TouchableOpacity>
    </>
  );

  const renderPixQr = () => (
    <View style={styles.centerContent}>
      <Surface style={styles.pixCard}>
        <View style={styles.pixIconContainer}>
          <MaterialCommunityIcons name="qrcode" size={28} color="#00A884" />
        </View>
        <Text style={styles.pixTitle}>Pague com PIX</Text>
        <Text style={styles.pixSubtitle}>Escaneie o QR Code ou copie o código</Text>

        <View style={styles.qrContainer}>
          {pixCode ? (
            <QRCode value={pixCode} size={200} backgroundColor="#fff" color="#000" />
          ) : (
            <ActivityIndicator size="large" color={lumeraColors.roxoLumera} />
          )}
        </View>

        <View style={styles.pixAmountContainer}>
          <Text style={styles.pixAmountLabel}>Valor a pagar</Text>
          <Text style={styles.pixAmountValue}>{formatPrice(amount)}</Text>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={copyPixCode} activeOpacity={0.8}>
          <LinearGradient colors={[lumeraColors.roxoLumera + '10', lumeraColors.azulGlow + '10']} style={styles.copyButtonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialCommunityIcons name="content-copy" size={18} color={lumeraColors.roxoLumera} />
            <Text style={styles.copyButtonText}>Copiar código PIX</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.pixTimer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
          <Text style={styles.pixTimerText}>O código expira em 1 hora</Text>
        </View>
      </Surface>

      <TouchableOpacity onPress={handleConfirmPix} style={styles.continueButton} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]} style={styles.continueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.continueText}>Já paguei</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('method')} style={styles.backTextButton}>
        <Text style={styles.backTextLabel}>Escolher outra forma de pagamento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBoleto = () => (
    <View style={styles.centerContent}>
      <Surface style={styles.pixCard}>
        <View style={[styles.pixIconContainer, { backgroundColor: '#FF980012' }]}>
          <MaterialCommunityIcons name="barcode" size={28} color="#FF9800" />
        </View>
        <Text style={styles.pixTitle}>Boleto gerado!</Text>
        <Text style={styles.pixSubtitle}>Vencimento: 3 dias úteis</Text>

        <View style={styles.pixAmountContainer}>
          <Text style={styles.pixAmountLabel}>Valor</Text>
          <Text style={styles.pixAmountValue}>{formatPrice(amount)}</Text>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={copyBoletoCode} activeOpacity={0.8}>
          <LinearGradient colors={[lumeraColors.roxoLumera + '10', lumeraColors.azulGlow + '10']} style={styles.copyButtonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialCommunityIcons name="content-copy" size={18} color={lumeraColors.roxoLumera} />
            <Text style={styles.copyButtonText}>Copiar código de barras</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Surface>

      <TouchableOpacity onPress={() => setStep('success')} style={styles.continueButton} activeOpacity={0.85}>
        <LinearGradient colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]} style={styles.continueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.continueText}>Entendi</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('method')} style={styles.backTextButton}>
        <Text style={styles.backTextLabel}>Escolher outra forma de pagamento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingIconOuter}>
        <LinearGradient colors={[lumeraColors.roxoLumera + '20', lumeraColors.azulGlow + '10']} style={styles.processingIconInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ActivityIndicator size="large" color={lumeraColors.roxoLumera} />
        </LinearGradient>
      </View>
      <Text style={styles.processingTitle}>Processando pagamento...</Text>
      <Text style={styles.processingSubtitle}>Aguarde, não feche o aplicativo</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.successIconContainer}>
        <MaterialCommunityIcons name="check" size={56} color="#fff" />
      </LinearGradient>
      <Text style={styles.successTitle}>Pagamento aprovado!</Text>
      <Text style={styles.successSubtitle}>Seus ingressos já estão disponíveis</Text>

      <TouchableOpacity
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'HomeMain' }] })}
        style={styles.continueButton}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]} style={styles.continueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <MaterialCommunityIcons name="ticket" size={20} color="#fff" />
          <Text style={styles.continueText}>Ver meus ingressos</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {renderHeader()}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 'method' && renderMethodSelection()}
        {step === 'card_form' && renderCardForm()}
        {step === 'pix_qr' && renderPixQr()}
        {step === 'boleto' && renderBoleto()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, zIndex: 10,
  },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: lumeraColors.roxoLumera + '10', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: -0.3 },
  headerPlaceholder: { width: 40 },
  content: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Amount
  amountCard: {
    padding: spacing.lg, borderRadius: 16, marginBottom: spacing.lg, alignItems: 'center',
    elevation: 3, backgroundColor: '#fff', shadowColor: lumeraColors.roxoLumera, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  amountLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: '500' },
  amountValue: { fontSize: 32, fontWeight: '800', color: lumeraColors.roxoLumera, marginTop: 4, letterSpacing: -0.5 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionIconContainer: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.onSurface, flex: 1, letterSpacing: -0.2 },

  // Payment Methods
  paymentMethodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  paymentMethodCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: spacing.md, alignItems: 'center',
    borderWidth: 2, borderColor: '#F0EAFF', elevation: 1,
  },
  paymentMethodCardSelected: { borderColor: lumeraColors.roxoLumera, backgroundColor: lumeraColors.roxoLumera + '05', elevation: 3 },
  paymentMethodIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  paymentMethodLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'center' },
  paymentMethodDesc: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 2 },
  paymentMethodCheck: { position: 'absolute', top: 6, right: 6 },

  // Continue Button
  continueButton: { borderRadius: 24, overflow: 'hidden', marginTop: spacing.lg, elevation: 4, shadowColor: lumeraColors.roxoLumera, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  continueGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backTextButton: { marginTop: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
  backTextLabel: { fontSize: 14, color: lumeraColors.roxoLumera, fontWeight: '600' },

  // Card Form
  card: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, elevation: 2, shadowColor: lumeraColors.roxoLumera, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardFormHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  cardFormIconContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardFormTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.onSurface },
  input: { marginBottom: spacing.md, backgroundColor: '#fff' },
  inputOutline: { borderRadius: 12 },
  cardFormRow: { flexDirection: 'row', gap: spacing.sm },
  smallInput: { flex: 1 },
  cardBrands: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  cardBrandsText: { fontSize: 12, color: '#888' },
  cardBrandsDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CCC' },

  // PIX
  centerContent: { alignItems: 'center' },
  pixCard: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, alignItems: 'center', width: '100%', elevation: 3, shadowColor: lumeraColors.roxoLumera, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  pixIconContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#00A88412', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  pixTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: -0.3 },
  pixSubtitle: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: spacing.lg },
  qrContainer: { padding: spacing.md, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0EAFF', marginBottom: spacing.lg },
  pixAmountContainer: { alignItems: 'center', marginBottom: spacing.lg },
  pixAmountLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: '500' },
  pixAmountValue: { fontSize: 26, fontWeight: '800', color: lumeraColors.roxoLumera, marginTop: 2 },
  copyButton: { borderRadius: 12, overflow: 'hidden', marginBottom: spacing.md, width: '100%' },
  copyButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: spacing.lg, borderRadius: 12 },
  copyButtonText: { fontSize: 14, fontWeight: '700', color: lumeraColors.roxoLumera },
  pixTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pixTimerText: { fontSize: 12, color: '#999' },

  // Processing
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  processingIconOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: lumeraColors.roxoLumera + '08', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  processingIconInner: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  processingTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: -0.3 },
  processingSubtitle: { fontSize: 14, color: '#888', marginTop: spacing.sm },

  // Success
  successContainer: { flex: 1, alignItems: 'center', paddingVertical: spacing.xxl },
  successIconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, elevation: 6, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#4CAF50', letterSpacing: -0.3 },
  successSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
});
