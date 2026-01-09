import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Appbar,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../stores/themeStore';
import { authApi, getApiErrorMessage } from '../../services/api';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 0.25;
    if (/[a-z]/.test(password)) strength += 0.25;
    if (/[A-Z]/.test(password)) strength += 0.25;
    if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 0.25;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    if (strength <= 0.25) return { label: 'Fraca', color: '#e74c3c' };
    if (strength <= 0.5) return { label: 'Razoavel', color: '#f39c12' };
    if (strength <= 0.75) return { label: 'Boa', color: '#3498db' };
    return { label: 'Forte', color: '#27ae60' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getStrengthLabel(passwordStrength);

  const handleSave = async () => {
    if (!currentPassword) {
      Alert.alert('Erro', 'Informe sua senha atual.');
      return;
    }

    if (!newPassword) {
      Alert.alert('Erro', 'Informe a nova senha.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Erro', 'A nova senha deve ter no minimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas nao conferem.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Erro', 'A nova senha deve ser diferente da atual.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      Alert.alert('Sucesso', 'Senha alterada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel alterar a senha.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Alterar Senha" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: lumeraColors.roxoLumera + '20' }]}>
              <MaterialCommunityIcons name="lock-reset" size={48} color={lumeraColors.roxoLumera} />
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Para sua seguranca, informe sua senha atual e depois escolha uma nova senha forte.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Senha atual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showCurrentPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            <View style={styles.divider} />

            <TextInput
              label="Nova senha"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showNewPassword}
              left={<TextInput.Icon icon="lock-plus" />}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <ProgressBar
                  progress={passwordStrength}
                  color={strengthInfo.color}
                  style={styles.strengthBar}
                />
                <Text style={[styles.strengthLabel, { color: strengthInfo.color }]}>
                  Forca: {strengthInfo.label}
                </Text>
              </View>
            )}

            <TextInput
              label="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              error={confirmPassword.length > 0 && newPassword !== confirmPassword}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>As senhas nao conferem</Text>
            )}
          </View>

          {/* Tips */}
          <View style={[styles.tipsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Dicas para uma senha forte:</Text>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name={newPassword.length >= 8 ? 'check-circle' : 'circle-outline'}
                size={18}
                color={newPassword.length >= 8 ? '#27ae60' : colors.textMuted}
              />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Minimo de 8 caracteres
              </Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name={/[A-Z]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={18}
                color={/[A-Z]/.test(newPassword) ? '#27ae60' : colors.textMuted}
              />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Letras maiusculas
              </Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name={/[a-z]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={18}
                color={/[a-z]/.test(newPassword) ? '#27ae60' : colors.textMuted}
              />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Letras minusculas
              </Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name={/[0-9]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={18}
                color={/[0-9]/.test(newPassword) ? '#27ae60' : colors.textMuted}
              />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Numeros
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            style={styles.saveButton}
            buttonColor={lumeraColors.roxoLumera}
            contentStyle={styles.saveButtonContent}
          >
            Alterar senha
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
  divider: {
    height: spacing.md,
  },
  strengthContainer: {
    marginTop: -spacing.sm,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: fontSize.sm,
    marginTop: -spacing.sm,
  },
  tipsContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
});
