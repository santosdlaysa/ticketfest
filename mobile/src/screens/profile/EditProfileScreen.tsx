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
  Avatar,
  TouchableRipple,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { authApi, getApiErrorMessage } from '../../services/api';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setAuth } = useAuthStore();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
  };

  const handleCpfChange = (value: string) => {
    setCpf(formatCpf(value));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a sua galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a camera para tirar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleChoosePhoto = () => {
    Alert.alert(
      'Alterar foto',
      'Escolha uma opcao',
      [
        { text: 'Tirar foto', onPress: takePhoto },
        { text: 'Escolher da galeria', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== parseInt(numbers[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    return digit === parseInt(numbers[10]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome e obrigatorio.');
      return;
    }

    if (cpf && !validateCpf(cpf)) {
      Alert.alert('Erro', 'CPF invalido.');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await authApi.updateProfile({
        name: name.trim(),
        phone: phone.replace(/\D/g, '') || undefined,
        cpf: cpf.replace(/\D/g, '') || undefined,
      });

      // Atualizar o estado local
      if (user) {
        await setAuth({
          user: { ...user, ...updatedUser },
          accessToken: useAuthStore.getState().accessToken || '',
          refreshToken: useAuthStore.getState().refreshToken || '',
        });
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', getApiErrorMessage(error, 'Nao foi possivel atualizar o perfil.'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Editar Perfil" titleStyle={{ color: colors.text }} />
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
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableRipple onPress={handleChoosePhoto} style={styles.avatarContainer}>
              <>
                {avatar ? (
                  <Avatar.Image size={120} source={{ uri: avatar }} />
                ) : (
                  <Avatar.Text
                    size={120}
                    label={getInitials(name || 'U')}
                    style={{ backgroundColor: lumeraColors.roxoLumera }}
                  />
                )}
                <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                </View>
              </>
            </TouchableRipple>
            <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
              Toque para alterar a foto
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Nome completo"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            <TextInput
              label="E-mail"
              value={user?.email || ''}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              disabled
              outlineColor={colors.border}
              textColor={colors.textSecondary}
            />

            <TextInput
              label="Telefone"
              value={phone}
              onChangeText={handlePhoneChange}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
              keyboardType="phone-pad"
              maxLength={15}
              placeholder="(00) 00000-0000"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            <TextInput
              label="CPF"
              value={cpf}
              onChangeText={handleCpfChange}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="card-account-details" />}
              keyboardType="numeric"
              maxLength={14}
              placeholder="000.000.000-00"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />
          </View>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
            buttonColor={lumeraColors.roxoLumera}
            contentStyle={styles.saveButtonContent}
          >
            Salvar alteracoes
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
});
