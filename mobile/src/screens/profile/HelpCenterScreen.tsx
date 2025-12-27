import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  Appbar,
  Surface,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: 'Compras',
    question: 'Como comprar ingressos?',
    answer: 'Para comprar ingressos, navegue ate o evento desejado, selecione a quantidade de ingressos e clique em "Adicionar ao carrinho". Depois, va ao carrinho e finalize a compra escolhendo a forma de pagamento.',
  },
  {
    id: '2',
    category: 'Compras',
    question: 'Quais formas de pagamento sao aceitas?',
    answer: 'Aceitamos PIX, cartao de credito e cartao de debito. O PIX e processado instantaneamente, enquanto cartoes podem levar alguns minutos para confirmar.',
  },
  {
    id: '3',
    category: 'Compras',
    question: 'Posso parcelar minha compra?',
    answer: 'Sim! Compras com cartao de credito podem ser parceladas em ate 12x, dependendo do valor total e das condicoes do evento.',
  },
  {
    id: '4',
    category: 'Ingressos',
    question: 'Onde encontro meus ingressos?',
    answer: 'Seus ingressos ficam disponiveis na aba "Ingressos" do aplicativo. La voce pode ver o QR code para apresentar na entrada do evento.',
  },
  {
    id: '5',
    category: 'Ingressos',
    question: 'Posso transferir meu ingresso para outra pessoa?',
    answer: 'A transferencia de ingressos depende da politica de cada evento. Alguns eventos permitem, outros nao. Verifique as informacoes do evento antes da compra.',
  },
  {
    id: '6',
    category: 'Ingressos',
    question: 'O que fazer se perder meu celular?',
    answer: 'Nao se preocupe! Basta fazer login em outro dispositivo com sua conta e seus ingressos estarao disponiveis normalmente.',
  },
  {
    id: '7',
    category: 'Conta',
    question: 'Como alterar minha senha?',
    answer: 'Va em Perfil > Alterar senha. Voce precisara informar sua senha atual e depois escolher uma nova senha.',
  },
  {
    id: '8',
    category: 'Conta',
    question: 'Esqueci minha senha, o que fazer?',
    answer: 'Na tela de login, clique em "Esqueci minha senha" e informe seu e-mail. Enviaremos um link para redefinir sua senha.',
  },
  {
    id: '9',
    category: 'Pagamentos',
    question: 'Meu pagamento nao foi aprovado, o que fazer?',
    answer: 'Verifique se os dados do cartao estao corretos e se ha limite disponivel. Se o problema persistir, tente outra forma de pagamento ou entre em contato com seu banco.',
  },
  {
    id: '10',
    category: 'Pagamentos',
    question: 'Como solicitar reembolso?',
    answer: 'A politica de reembolso varia por evento. Em geral, reembolsos podem ser solicitados ate 7 dias antes do evento. Entre em contato conosco para mais informacoes.',
  },
];

const CATEGORIES = ['Todos', 'Compras', 'Ingressos', 'Conta', 'Pagamentos'];

interface AccordionProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ item, isExpanded, onToggle, isDark }) => {
  const colors = isDark ? darkColors : lightColors;

  return (
    <TouchableOpacity
      style={[styles.accordionItem, { backgroundColor: colors.surface }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.accordionHeader}>
        <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.textMuted}
        />
      </View>
      {isExpanded && (
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function HelpCenterScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQ = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContact = () => {
    Alert.alert(
      'Fale Conosco',
      'Como deseja entrar em contato?',
      [
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/5595991371313'),
        },
        {
          text: 'E-mail',
          onPress: () => Linking.openURL('mailto:suporte@lumera.com.br'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Central de Ajuda" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <Searchbar
          placeholder="Buscar duvida..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: colors.surface }]}
          inputStyle={{ color: colors.text }}
          iconColor={colors.textMuted}
          placeholderTextColor={colors.textMuted}
        />

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && { backgroundColor: lumeraColors.roxoLumera },
              ]}
              textStyle={{
                color: selectedCategory === category ? '#fff' : colors.text,
              }}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={styles.faqContainer}>
          {filteredFAQ.length === 0 ? (
            <Surface style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="help-circle-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhuma duvida encontrada
              </Text>
            </Surface>
          ) : (
            filteredFAQ.map((item, index) => (
              <View key={item.id}>
                <Accordion
                  item={item}
                  isExpanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  isDark={isDark}
                />
                {index < filteredFAQ.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                )}
              </View>
            ))
          )}
        </View>

        {/* Contact Section */}
        <Surface style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="headset" size={40} color={lumeraColors.roxoLumera} />
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            Nao encontrou sua resposta?
          </Text>
          <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
            Nossa equipe esta pronta para ajudar
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: lumeraColors.roxoLumera }]}
            onPress={handleContact}
          >
            <MaterialCommunityIcons name="message-text" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Falar com suporte</Text>
          </TouchableOpacity>
        </Surface>
      </ScrollView>
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
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  categoriesScroll: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  categoriesContainer: {
    gap: spacing.sm,
  },
  categoryChip: {
    borderRadius: 20,
  },
  faqContainer: {
    gap: spacing.sm,
  },
  accordionItem: {
    borderRadius: 12,
    padding: spacing.md,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  answer: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
  },
  emptyContainer: {
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  contactCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  contactSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
