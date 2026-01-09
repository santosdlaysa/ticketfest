import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Surface,
  RadioButton,
  IconButton,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// QRCode não é mais necessário - usamos a imagem do Pagar.me
import * as Clipboard from 'expo-clipboard';
import { theme, spacing, fontSize } from '../../theme';
import { useCartStore } from '../../stores/cartStore';
import { ordersApi } from '../../services/api';
import {
  processCardPayment,
  generatePixPayment,
  generateBoletoPayment,
  checkPixPayment,
  formatCardNumber,
  getCardBrand,
  CardData,
  PaymentResult,
} from '../../services/paymentService';
import type { HomeStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type RouteProps = RouteProp<HomeStackParamList, 'Payment'>;

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO';
type PaymentStep = 'method' | 'card_form' | 'pix_qr' | 'boleto' | 'processing' | 'success';

export default function PaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { cart, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [step, setStep] = useState<PaymentStep>('method');
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

  // Boleto state
  const [boletoBarcode, setBoletoBarcode] = useState('');

  const amount = cart?.total || 0;

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSelectMethod = () => {
    if (paymentMethod === 'PIX') {
      handlePixPayment();
    } else if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') {
      setStep('card_form');
    } else if (paymentMethod === 'BOLETO') {
      handleBoletoPayment();
    }
  };

  const handleCardPayment = async () => {
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      Alert.alert('Erro', 'Preencha todos os campos do cartão');
      return;
    }

    if (!cart || !cart.items.length) {
      Alert.alert('Erro', 'Carrinho vazio');
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

      const cartItems = cart.items.map((item) => ({
        ticketId: item.ticket.id,
        quantity: item.quantity,
      }));

      const installments = 1; // You can add UI for installment selection later
      const result = await processCardPayment(
        cartItems,
        cardData,
        installments,
        paymentMethod as 'CREDIT_CARD' | 'DEBIT_CARD'
      );

      if (result.success && result.status === 'approved') {
        await clearCart();
        setStep('success');
      } else if (result.success && result.status === 'pending') {
        Alert.alert(
          'Pagamento em processamento',
          result.message,
          [
            {
              text: 'OK',
              onPress: async () => {
                await clearCart();
                setStep('success');
              },
            },
          ]
        );
      } else {
        Alert.alert('Pagamento recusado', result.message);
        setStep('card_form');
      }
    } catch (error: any) {
      console.error('Card payment error:', error);
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
      const cartItems = cart.items.map((item) => ({
        ticketId: item.ticket.id,
        quantity: item.quantity,
      }));

      // Generate PIX payment using the new payment service
      const result = await generatePixPayment(cartItems);

      if (result.success && result.pixCode && result.qrCodeUrl) {
        // Set PIX data from Pagar.me response
        setPixCode(result.pixCode);
        setPixQrData(result.qrCodeUrl); // URL da imagem do QR code
        setPixPaymentId(result.chargeId || result.paymentId);
        setOrderId(result.orderId || '');
        setStep('pix_qr');
      } else {
        Alert.alert('Erro', result.message || 'Falha ao gerar PIX');
        setStep('method');
      }
    } catch (error: any) {
      console.error('Erro ao criar pedido PIX:', error);
      Alert.alert('Erro', error.message || 'Falha ao gerar PIX');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPix = async () => {
    if (!orderId) {
      Alert.alert('Erro', 'ID do pedido não encontrado');
      return;
    }

    setLoading(true);

    try {
      // Check PIX payment status using the payment service
      const result = await checkPixPayment(orderId);

      if (result.paid) {
        await clearCart();
        setStep('success');
      } else {
        Alert.alert(
          'Aguardando pagamento',
          'O pagamento PIX ainda não foi confirmado. Após pagar, aguarde alguns segundos e tente novamente.'
        );
      }
    } catch (error: any) {
      console.error('Error checking PIX payment:', error);
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
      const cartItems = cart.items.map((item) => ({
        ticketId: item.ticket.id,
        quantity: item.quantity,
      }));

      // Generate Boleto payment using the new payment service
      const result = await generateBoletoPayment(cartItems);

      if (result.success && result.boletoBarcode) {
        setBoletoBarcode(result.boletoBarcode);
        setStep('boleto');
        // Note: Cart will be cleared when payment is confirmed via webhook
        // For now, we show the boleto and user can proceed
        await clearCart();
      } else {
        Alert.alert('Erro', result.message || 'Falha ao gerar boleto');
        setStep('method');
      }
    } catch (error: any) {
      console.error('Boleto payment error:', error);
      Alert.alert('Erro', error.message || 'Falha ao gerar boleto');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBoleto = async () => {
    // Boleto is confirmed via webhook in production
    // User just needs to pay the boleto and wait for confirmation
    // For now, we just show success after generating the boleto
    setStep('success');
  };

  const copyPixCode = async () => {
    await Clipboard.setStringAsync(pixCode);
    Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
  };

  const copyBoletoCode = async () => {
    await Clipboard.setStringAsync(boletoBarcode);
    Alert.alert('Copiado!', 'Código de barras copiado para a área de transferência');
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const renderMethodSelection = () => (
    <View>
      <Text style={styles.sectionTitle}>Escolha a forma de pagamento</Text>

      <Surface style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total a pagar</Text>
        <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
      </Surface>

      <RadioButton.Group
        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
        value={paymentMethod}
      >
        <Surface style={styles.paymentOption}>
          <RadioButton value="PIX" />
          <IconButton icon="qrcode" size={24} iconColor={theme.colors.primary} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>PIX</Text>
            <Text style={styles.paymentDescription}>Aprovação instantânea</Text>
          </View>
        </Surface>

        <Surface style={styles.paymentOption}>
          <RadioButton value="CREDIT_CARD" />
          <IconButton icon="credit-card" size={24} iconColor={theme.colors.primary} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Cartão de Crédito</Text>
            <Text style={styles.paymentDescription}>Parcele em até 12x</Text>
          </View>
        </Surface>

        <Surface style={styles.paymentOption}>
          <RadioButton value="DEBIT_CARD" />
          <IconButton icon="credit-card-outline" size={24} iconColor={theme.colors.primary} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Cartão de Débito</Text>
            <Text style={styles.paymentDescription}>Débito à vista</Text>
          </View>
        </Surface>

        <Surface style={styles.paymentOption}>
          <RadioButton value="BOLETO" />
          <IconButton icon="barcode" size={24} iconColor={theme.colors.primary} />
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Boleto Bancário</Text>
            <Text style={styles.paymentDescription}>Vencimento em 3 dias</Text>
          </View>
        </Surface>
      </RadioButton.Group>

      <Button
        mode="contained"
        onPress={handleSelectMethod}
        style={styles.continueButton}
        contentStyle={styles.buttonContent}
      >
        Continuar
      </Button>
    </View>
  );

  const renderCardForm = () => (
    <View>
      <Text style={styles.sectionTitle}>Dados do Cartão</Text>

      <Surface style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total a pagar</Text>
        <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
      </Surface>

      <TextInput
        label="Número do Cartão"
        value={cardNumber}
        onChangeText={handleCardNumberChange}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        placeholder="0000 0000 0000 0000"
        right={<TextInput.Icon icon="credit-card" />}
      />

      <TextInput
        label="Nome no Cartão"
        value={cardHolder}
        onChangeText={setCardHolder}
        autoCapitalize="characters"
        mode="outlined"
        style={styles.input}
        placeholder="NOME COMO NO CARTÃO"
      />

      <View style={styles.row}>
        <TextInput
          label="Mês"
          value={expiryMonth}
          onChangeText={(v) => setExpiryMonth(v.slice(0, 2))}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, styles.smallInput]}
          placeholder="MM"
        />
        <TextInput
          label="Ano"
          value={expiryYear}
          onChangeText={(v) => setExpiryYear(v.slice(0, 2))}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, styles.smallInput]}
          placeholder="AA"
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
        />
      </View>

      <View style={styles.cardBrands}>
        <Text style={styles.cardBrandsLabel}>Aceitamos:</Text>
        <View style={styles.brandIcons}>
          <IconButton icon="credit-card" size={20} />
          <Text style={styles.brandText}>Visa, Master, Elo, Amex</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleCardPayment}
        style={styles.continueButton}
        contentStyle={styles.buttonContent}
        loading={loading}
        disabled={loading}
      >
        Pagar {formatPrice(amount)}
      </Button>

      <Button
        mode="text"
        onPress={() => setStep('method')}
        style={styles.backButton}
      >
        Voltar
      </Button>
    </View>
  );

  const renderPixQr = () => (
    <View style={styles.centerContent}>
      <Text style={styles.sectionTitle}>Pague com PIX</Text>

      <Surface style={styles.qrContainer}>
        <Image
          source={{ uri: pixQrData }}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Surface>

      <Text style={styles.pixInstructions}>
        Escaneie o QR Code acima com o app do seu banco
      </Text>

      <Divider style={styles.divider} />

      <Text style={styles.pixOrLabel}>ou copie o código PIX:</Text>

      <Surface style={styles.pixCodeContainer}>
        <Text style={styles.pixCode} numberOfLines={2}>
          {pixCode}
        </Text>
        <IconButton
          icon="content-copy"
          size={24}
          onPress={copyPixCode}
          iconColor={theme.colors.primary}
        />
      </Surface>

      <Surface style={styles.amountCard}>
        <Text style={styles.amountLabel}>Valor</Text>
        <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
      </Surface>

      <Button
        mode="contained"
        onPress={handleConfirmPix}
        style={styles.continueButton}
        contentStyle={styles.buttonContent}
        loading={loading}
        disabled={loading}
      >
        Já paguei
      </Button>

      <Button
        mode="text"
        onPress={() => setStep('method')}
        style={styles.backButton}
      >
        Escolher outra forma de pagamento
      </Button>
    </View>
  );

  const renderBoleto = () => (
    <View style={styles.centerContent}>
      <Text style={styles.sectionTitle}>Boleto Bancário</Text>

      <Surface style={styles.boletoContainer}>
        <IconButton icon="barcode" size={60} iconColor={theme.colors.primary} />
        <Text style={styles.boletoTitle}>Boleto gerado!</Text>
        <Text style={styles.boletoInfo}>Vencimento: 3 dias úteis</Text>
      </Surface>

      <Text style={styles.boletoLabel}>Código de barras:</Text>

      <Surface style={styles.pixCodeContainer}>
        <Text style={styles.boletoCode} numberOfLines={2}>
          {boletoBarcode}
        </Text>
        <IconButton
          icon="content-copy"
          size={24}
          onPress={copyBoletoCode}
          iconColor={theme.colors.primary}
        />
      </Surface>

      <Surface style={styles.amountCard}>
        <Text style={styles.amountLabel}>Valor</Text>
        <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
      </Surface>

      <Button
        mode="contained"
        onPress={handleConfirmBoleto}
        style={styles.continueButton}
        contentStyle={styles.buttonContent}
        loading={loading}
        disabled={loading}
      >
        Entendi
      </Button>

      <Button
        mode="text"
        onPress={() => setStep('method')}
        style={styles.backButton}
      >
        Escolher outra forma de pagamento
      </Button>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.processingText}>Processando pagamento...</Text>
      <Text style={styles.processingSubtext}>Aguarde, não feche o aplicativo</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.centerContent}>
      <IconButton
        icon="check-circle"
        size={100}
        iconColor="#4caf50"
      />
      <Text style={styles.successTitle}>Pagamento aprovado!</Text>
      <Text style={styles.successSubtitle}>
        Seus ingressos já estão disponíveis
      </Text>

      <Button
        mode="contained"
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeMain' }],
          });
        }}
        style={styles.continueButton}
        contentStyle={styles.buttonContent}
      >
        Ver meus ingressos
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => {
            if (step === 'method' || step === 'success') {
              navigation.goBack();
            } else {
              setStep('method');
            }
          }}
        />
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: theme.colors.onBackground,
  },
  amountCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    marginBottom: spacing.lg,
    alignItems: 'center',
    elevation: 2,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    color: '#666',
  },
  amountValue: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: spacing.xs,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: theme.roundness,
    elevation: 1,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  paymentDescription: {
    fontSize: fontSize.sm,
    color: '#666',
    marginTop: 2,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  cardBrands: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cardBrandsLabel: {
    fontSize: fontSize.sm,
    color: '#666',
  },
  brandIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  brandText: {
    fontSize: fontSize.sm,
    color: '#666',
  },
  centerContent: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    elevation: 2,
    marginBottom: spacing.lg,
  },
  pixInstructions: {
    fontSize: fontSize.md,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    marginVertical: spacing.lg,
  },
  pixOrLabel: {
    fontSize: fontSize.sm,
    color: '#666',
    marginBottom: spacing.sm,
  },
  pixCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginBottom: spacing.lg,
    width: '100%',
    elevation: 1,
  },
  pixCode: {
    flex: 1,
    fontSize: fontSize.xs,
    color: theme.colors.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  boletoContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: theme.roundness,
    marginBottom: spacing.lg,
    width: '100%',
    elevation: 2,
  },
  boletoTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  boletoInfo: {
    fontSize: fontSize.sm,
    color: '#666',
    marginTop: spacing.xs,
  },
  boletoLabel: {
    fontSize: fontSize.sm,
    color: '#666',
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  boletoCode: {
    flex: 1,
    fontSize: fontSize.xs,
    color: theme.colors.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  processingText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    color: theme.colors.onBackground,
  },
  processingSubtext: {
    fontSize: fontSize.md,
    color: '#666',
    marginTop: spacing.sm,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: spacing.md,
  },
  successSubtitle: {
    fontSize: fontSize.md,
    color: '#666',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
