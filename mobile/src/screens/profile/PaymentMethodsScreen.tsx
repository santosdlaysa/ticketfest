import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Appbar,
  Surface,
  Button,
  TextInput,
  Portal,
  Modal,
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';

interface PaymentCard {
  id: string;
  last4: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex';
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

const CARDS_KEY = '@lumera/payment_cards';

const CARD_BRANDS: Record<string, { icon: string; color: string }> = {
  visa: { icon: 'credit-card', color: '#1A1F71' },
  mastercard: { icon: 'credit-card', color: '#EB001B' },
  elo: { icon: 'credit-card', color: '#00A4E0' },
  amex: { icon: 'credit-card', color: '#006FCF' },
};

export default function PaymentMethodsScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const stored = await AsyncStorage.getItem(CARDS_KEY);
      if (stored) {
        setCards(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCards = async (newCards: PaymentCard[]) => {
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(newCards));
    setCards(newCards);
  };

  const detectBrand = (number: string): PaymentCard['brand'] => {
    const firstDigit = number[0];
    const firstTwo = number.substring(0, 2);
    if (firstDigit === '4') return 'visa';
    if (['51', '52', '53', '54', '55'].includes(firstTwo)) return 'mastercard';
    if (firstTwo === '34' || firstTwo === '37') return 'amex';
    return 'elo';
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const handleAddCard = () => {
    const numbers = cardNumber.replace(/\D/g, '');

    if (numbers.length < 13) {
      Alert.alert('Erro', 'Numero do cartao invalido.');
      return;
    }

    if (!cardName.trim()) {
      Alert.alert('Erro', 'Informe o nome no cartao.');
      return;
    }

    const [month, year] = expiryDate.split('/');
    if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
      Alert.alert('Erro', 'Data de validade invalida.');
      return;
    }

    if (cvv.length < 3) {
      Alert.alert('Erro', 'CVV invalido.');
      return;
    }

    const newCard: PaymentCard = {
      id: Date.now().toString(),
      last4: numbers.slice(-4),
      brand: detectBrand(numbers),
      expiryMonth: month,
      expiryYear: year,
      isDefault: cards.length === 0,
    };

    saveCards([...cards, newCard]);
    resetForm();
    setShowAddModal(false);
    Alert.alert('Sucesso', 'Cartao adicionado com sucesso!');
  };

  const resetForm = () => {
    setCardNumber('');
    setCardName('');
    setExpiryDate('');
    setCvv('');
  };

  const setDefaultCard = async (cardId: string) => {
    const updated = cards.map((card) => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    await saveCards(updated);
  };

  const removeCard = (cardId: string) => {
    Alert.alert(
      'Remover cartao',
      'Deseja remover este cartao?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const updated = cards.filter((c) => c.id !== cardId);
            if (updated.length > 0 && !updated.some((c) => c.isDefault)) {
              updated[0].isDefault = true;
            }
            await saveCards(updated);
          },
        },
      ]
    );
  };

  const renderCard = (card: PaymentCard) => {
    const brandInfo = CARD_BRANDS[card.brand];

    return (
      <Surface key={card.id} style={[styles.cardItem, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => setDefaultCard(card.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIcon, { backgroundColor: brandInfo.color + '20' }]}>
            <MaterialCommunityIcons name="credit-card" size={24} color={brandInfo.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardNumber, { color: colors.text }]}>
              •••• •••• •••• {card.last4}
            </Text>
            <Text style={[styles.cardExpiry, { color: colors.textSecondary }]}>
              {card.brand.toUpperCase()} - Valido ate {card.expiryMonth}/{card.expiryYear}
            </Text>
          </View>
          <RadioButton
            value={card.id}
            status={card.isDefault ? 'checked' : 'unchecked'}
            onPress={() => setDefaultCard(card.id)}
            color={lumeraColors.roxoLumera}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeCard(card.id)}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </Surface>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Formas de Pagamento" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info */}
        <Surface style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#27ae60" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Seus dados de pagamento sao criptografados e armazenados com seguranca.
          </Text>
        </Surface>

        {/* Cards List */}
        {cards.length > 0 ? (
          <View style={styles.cardsList}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Cartoes salvos
            </Text>
            {cards.map(renderCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: lumeraColors.roxoLumera + '20' }]}>
              <MaterialCommunityIcons name="credit-card-plus" size={48} color={lumeraColors.roxoLumera} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum cartao salvo
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Adicione um cartao para compras mais rapidas
            </Text>
          </View>
        )}

        {/* Add Button */}
        <Button
          mode="contained"
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
          buttonColor={lumeraColors.roxoLumera}
          icon="plus"
        >
          Adicionar cartao
        </Button>

        {/* Other Methods */}
        <View style={styles.otherMethods}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Outras formas de pagamento
          </Text>
          <Surface style={[styles.methodItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.methodIcon, { backgroundColor: '#00B2A9' + '20' }]}>
              <MaterialCommunityIcons name="qrcode" size={24} color="#00B2A9" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, { color: colors.text }]}>PIX</Text>
              <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>
                Pagamento instantaneo
              </Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={24} color="#27ae60" />
          </Surface>
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => {
            setShowAddModal(false);
            resetForm();
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Cartao</Text>

          <TextInput
            label="Numero do cartao"
            value={cardNumber}
            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            maxLength={19}
            left={<TextInput.Icon icon="credit-card" />}
          />

          <TextInput
            label="Nome no cartao"
            value={cardName}
            onChangeText={setCardName}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
            left={<TextInput.Icon icon="account" />}
          />

          <View style={styles.row}>
            <TextInput
              label="Validade"
              value={expiryDate}
              onChangeText={(v) => setExpiryDate(formatExpiryDate(v))}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
              maxLength={5}
              placeholder="MM/AA"
              left={<TextInput.Icon icon="calendar" />}
            />

            <TextInput
              label="CVV"
              value={cvv}
              onChangeText={setCvv}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleAddCard}
              style={styles.modalButton}
              buttonColor={lumeraColors.roxoLumera}
            >
              Adicionar
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  cardsList: {
    marginBottom: spacing.lg,
  },
  cardItem: {
    borderRadius: 12,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardNumber: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  cardExpiry: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  otherMethods: {
    marginTop: spacing.md,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  methodName: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  methodDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  modal: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
