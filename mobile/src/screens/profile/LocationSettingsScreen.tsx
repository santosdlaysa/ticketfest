import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  Appbar,
  Surface,
  Switch,
  Button,
  TextInput,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';

const LOCATION_KEY = '@lumera/location_settings';

interface LocationSettings {
  enabled: boolean;
  city: string | null;
  state: string | null;
  manualCity: string | null;
}

const POPULAR_CITIES = [
  'Sao Paulo, SP',
  'Rio de Janeiro, RJ',
  'Belo Horizonte, MG',
  'Brasilia, DF',
  'Salvador, BA',
  'Curitiba, PR',
  'Fortaleza, CE',
  'Recife, PE',
  'Porto Alegre, RS',
  'Manaus, AM',
];

export default function LocationSettingsScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const [settings, setSettings] = useState<LocationSettings>({
    enabled: false,
    city: null,
    state: null,
    manualCity: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    loadSettings();
    checkPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading location settings:', error);
    }
  };

  const saveSettings = async (newSettings: LocationSettings) => {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const checkPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);

    if (status === 'granted') {
      await handleEnableLocation(true);
    } else if (status === 'denied') {
      Alert.alert(
        'Permissao negada',
        'Para usar sua localizacao, permita o acesso nas configuracoes do dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuracoes', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleEnableLocation = async (enabled: boolean) => {
    if (enabled) {
      if (permissionStatus !== 'granted') {
        await requestPermission();
        return;
      }

      setIsLoading(true);
      try {
        const location = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const newSettings: LocationSettings = {
          enabled: true,
          city: address?.city || address?.subregion || null,
          state: address?.region || null,
          manualCity: null,
        };

        await saveSettings(newSettings);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Erro', 'Nao foi possivel obter sua localizacao.');
      } finally {
        setIsLoading(false);
      }
    } else {
      await saveSettings({
        ...settings,
        enabled: false,
      });
    }
  };

  const handleSelectCity = async (city: string) => {
    const [cityName, state] = city.split(', ');
    await saveSettings({
      enabled: false,
      city: cityName,
      state: state || null,
      manualCity: city,
    });
    setShowCityPicker(false);
    setSearchCity('');
  };

  const getCurrentLocation = () => {
    if (settings.manualCity) return settings.manualCity;
    if (settings.city && settings.state) return `${settings.city}, ${settings.state}`;
    if (settings.city) return settings.city;
    return 'Nao definida';
  };

  const filteredCities = POPULAR_CITIES.filter((city) =>
    city.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Localizacao" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Location */}
        <Surface style={[styles.locationCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.locationIcon, { backgroundColor: lumeraColors.roxoLumera + '20' }]}>
            <MaterialCommunityIcons name="map-marker" size={32} color={lumeraColors.roxoLumera} />
          </View>
          <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>
            Sua localizacao atual
          </Text>
          <Text style={[styles.locationValue, { color: colors.text }]}>
            {getCurrentLocation()}
          </Text>
        </Surface>

        {/* Auto Location */}
        <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Localizacao automatica
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Usar GPS para detectar sua cidade
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleEnableLocation}
              color={lumeraColors.roxoLumera}
              disabled={isLoading}
            />
          </View>
          {isLoading && (
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Obtendo localizacao...
            </Text>
          )}
        </Surface>

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <Surface style={[styles.warningCard, { backgroundColor: '#fff3e0' }]}>
            <MaterialCommunityIcons name="alert" size={24} color="#ff9800" />
            <View style={styles.warningContent}>
              <Text style={[styles.warningText, { color: '#e65100' }]}>
                Acesso a localizacao negado
              </Text>
              <Button
                mode="text"
                onPress={() => Linking.openSettings()}
                textColor="#ff9800"
                compact
              >
                Abrir configuracoes
              </Button>
            </View>
          </Surface>
        )}

        {/* Manual Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Ou escolha manualmente
          </Text>

          <TextInput
            placeholder="Buscar cidade..."
            value={searchCity}
            onChangeText={setSearchCity}
            onFocus={() => setShowCityPicker(true)}
            mode="outlined"
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            right={
              searchCity ? (
                <TextInput.Icon icon="close" onPress={() => setSearchCity('')} />
              ) : undefined
            }
          />

          {(showCityPicker || searchCity) && (
            <Surface style={[styles.citiesList, { backgroundColor: colors.surface }]}>
              {filteredCities.map((city) => (
                <List.Item
                  key={city}
                  title={city}
                  onPress={() => handleSelectCity(city)}
                  left={(props) => <List.Icon {...props} icon="city" />}
                  style={styles.cityItem}
                  titleStyle={{ color: colors.text }}
                />
              ))}
              {filteredCities.length === 0 && (
                <Text style={[styles.noResults, { color: colors.textSecondary }]}>
                  Nenhuma cidade encontrada
                </Text>
              )}
            </Surface>
          )}
        </View>

        {/* Info */}
        <Surface style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="information" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Sua localizacao e usada para mostrar eventos proximos e melhorar sua experiencia.
            Voce pode alterar isso a qualquer momento.
          </Text>
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
  locationCard: {
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  locationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  locationValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  settingCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  loadingText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginLeft: 40,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: 'transparent',
  },
  citiesList: {
    marginTop: spacing.sm,
    borderRadius: 12,
    maxHeight: 300,
  },
  cityItem: {
    paddingVertical: spacing.xs,
  },
  noResults: {
    padding: spacing.lg,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
