import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  Text,
  Surface,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, spacing, lumeraColors, lightColors, darkColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { useValidationStore } from '../../stores/validationStore';
import { ValidationStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ValidationStackParamList>;

export default function ManualValidationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [code, setCode] = useState('');
  const { validateTicket, loading, lastValidation, clearLastValidation } = useValidationStore();

  const handleValidate = async () => {
    if (!code.trim()) return;

    clearLastValidation();
    const result = await validateTicket(code.trim().toUpperCase());

    if (result) {
      navigation.navigate('ValidationResult', { result });
    }
  };

  const formatCode = (text: string) => {
    // Remove caracteres nao alfanumericos e converte para maiusculo
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    // Limita a 20 caracteres
    return cleaned.slice(0, 20);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Validacao Manual</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="keyboard" size={40} color="#fff" />
          </View>
          <Text style={styles.headerSubtitle}>
            Digite o codigo do ingresso para validar manualmente
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Codigo do Ingresso
            </Text>
            <TextInput
              mode="outlined"
              value={code}
              onChangeText={(text) => setCode(formatCode(text))}
              placeholder="Ex: ABC123XYZ456"
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              outlineColor={colors.border}
              activeOutlineColor={lumeraColors.roxoLumera}
              left={
                <TextInput.Icon
                  icon="ticket-confirmation"
                  color={code ? lumeraColors.roxoLumera : colors.textMuted}
                />
              }
              right={
                code ? (
                  <TextInput.Icon
                    icon="close-circle"
                    color={colors.textMuted}
                    onPress={() => setCode('')}
                  />
                ) : null
              }
            />
            <Text style={[styles.inputHint, { color: colors.textMuted }]}>
              O codigo esta localizado abaixo do QR Code no ingresso
            </Text>
          </View>

          {/* Instrucoes */}
          <View style={styles.instructions}>
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              Onde encontrar o codigo?
            </Text>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionNumber, { backgroundColor: `${lumeraColors.roxoLumera}15` }]}>
                <Text style={[styles.instructionNumberText, { color: lumeraColors.roxoLumera }]}>1</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Abra o ingresso no app ou e-mail do cliente
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionNumber, { backgroundColor: `${lumeraColors.roxoLumera}15` }]}>
                <Text style={[styles.instructionNumberText, { color: lumeraColors.roxoLumera }]}>2</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Localize o codigo alfanumerico abaixo do QR Code
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionNumber, { backgroundColor: `${lumeraColors.roxoLumera}15` }]}>
                <Text style={[styles.instructionNumberText, { color: lumeraColors.roxoLumera }]}>3</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Digite o codigo no campo acima e toque em "Validar"
              </Text>
            </View>
          </View>
        </Surface>

        {/* Exemplo visual */}
        <Surface style={[styles.exampleCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.exampleTitle, { color: colors.text }]}>
            Exemplo de codigo
          </Text>
          <View style={styles.exampleCodeContainer}>
            <MaterialCommunityIcons name="qrcode" size={60} color={colors.textMuted} />
            <View style={styles.exampleCodeBox}>
              <Text style={styles.exampleCode}>TKT-7B2EFF-2024</Text>
            </View>
          </View>
        </Surface>
      </ScrollView>

      {/* Action Button */}
      <View style={[styles.actionContainer, { backgroundColor: colors.background }]}>
        <Button
          mode="contained"
          onPress={handleValidate}
          disabled={!code.trim() || loading}
          loading={loading}
          style={[
            styles.validateButton,
            !code.trim() && styles.validateButtonDisabled,
          ]}
          contentStyle={styles.validateButtonContent}
          icon={loading ? undefined : 'check-circle'}
        >
          {loading ? 'Validando...' : 'Validar Ingresso'}
        </Button>

        <TouchableOpacity
          style={styles.scannerLink}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={18}
            color={lumeraColors.roxoLumera}
          />
          <Text style={styles.scannerLinkText}>
            Prefere escanear? Voltar ao scanner
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 160,
  },

  // Card
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 2,
    marginBottom: spacing.md,
  },

  // Input
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 18,
    letterSpacing: 2,
  },
  inputHint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },

  // Instructions
  instructions: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: spacing.lg,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Example Card
  exampleCard: {
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 2,
    alignItems: 'center',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  exampleCodeContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  exampleCodeBox: {
    backgroundColor: '#F5F5F5',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  exampleCode: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    color: '#666',
  },

  // Action
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  validateButton: {
    borderRadius: 12,
    backgroundColor: lumeraColors.roxoLumera,
  },
  validateButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  validateButtonContent: {
    height: 52,
  },
  scannerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  scannerLinkText: {
    fontSize: 14,
    color: lumeraColors.roxoLumera,
    fontWeight: '500',
  },
});
