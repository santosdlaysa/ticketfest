import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lightColors, darkColors, lumeraColors } from '../theme';
import { useThemeStore } from '../stores/themeStore';
import { usePermissions, TabName } from '../hooks/usePermissions';

// Import screens
import HomeScreen from '../screens/events/HomeScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import PaymentScreen from '../screens/checkout/PaymentScreen';
import MyTicketsScreen from '../screens/tickets/MyTicketsScreen';
import TicketDetailsScreen from '../screens/tickets/TicketDetailsScreen';
import EventSelectionScreen from '../screens/validation/EventSelectionScreen';
import TicketScannerScreen from '../screens/validation/TicketScannerScreen';
import ValidationResultScreen from '../screens/validation/ValidationResultScreen';
import ManualValidationScreen from '../screens/validation/ManualValidationScreen';
import PromoterDashboardScreen from '../screens/promoter/PromoterDashboardScreen';
import PromoterListScreen from '../screens/promoter/PromoterListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import LocationSettingsScreen from '../screens/profile/LocationSettingsScreen';
import HelpCenterScreen from '../screens/profile/HelpCenterScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import FavoritesScreen from '../screens/profile/FavoritesScreen';
import ApiLogsScreen from '../screens/profile/ApiLogsScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';

// Stack para aba Home/Eventos
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="EventDetails" component={EventDetailsScreen} />
      <HomeStack.Screen name="Cart" component={CartScreen} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStack.Screen name="Payment" component={PaymentScreen} />
    </HomeStack.Navigator>
  );
}

// Stack para aba Ingressos
const TicketsStack = createNativeStackNavigator();
function TicketsStackScreen() {
  return (
    <TicketsStack.Navigator screenOptions={{ headerShown: false }}>
      <TicketsStack.Screen name="MyTicketsMain" component={MyTicketsScreen} />
      <TicketsStack.Screen name="TicketDetails" component={TicketDetailsScreen} />
    </TicketsStack.Navigator>
  );
}

// Stack para aba Validacao
const ValidationStack = createNativeStackNavigator();
function ValidationStackScreen() {
  return (
    <ValidationStack.Navigator screenOptions={{ headerShown: false }}>
      <ValidationStack.Screen name="EventSelection" component={EventSelectionScreen} />
      <ValidationStack.Screen name="TicketScanner" component={TicketScannerScreen} />
      <ValidationStack.Screen name="ValidationResult" component={ValidationResultScreen} />
      <ValidationStack.Screen name="ManualValidation" component={ManualValidationScreen} />
    </ValidationStack.Navigator>
  );
}

// Stack para aba Listas
const ListsStack = createNativeStackNavigator();
function ListsStackScreen() {
  return (
    <ListsStack.Navigator screenOptions={{ headerShown: false }}>
      <ListsStack.Screen name="ListsMain" component={PromoterDashboardScreen} />
      <ListsStack.Screen name="PromoterList" component={PromoterListScreen} />
    </ListsStack.Navigator>
  );
}

// Stack para aba Perfil
const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <ProfileStack.Screen name="LocationSettings" component={LocationSettingsScreen} />
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
      <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
      <ProfileStack.Screen name="ApiLogs" component={ApiLogsScreen} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <ProfileStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

// Configuração das tabs com seus componentes e opções
type TabConfig = {
  name: TabName;
  component: React.ComponentType<any>;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'Home',
    component: HomeStackScreen,
    title: 'Eventos',
    icon: 'home',
  },
  {
    name: 'MyTickets',
    component: TicketsStackScreen,
    title: 'Ingressos',
    icon: 'ticket',
  },
  {
    name: 'Validation',
    component: ValidationStackScreen,
    title: 'Validar',
    icon: 'qrcode-scan',
  },
  {
    name: 'Lists',
    component: ListsStackScreen,
    title: 'Listas',
    icon: 'clipboard-list',
  },
  {
    name: 'Profile',
    component: ProfileStackScreen,
    title: 'Perfil',
    icon: 'account',
  },
];

export default function HomeTabs() {
  const { isDark } = useThemeStore();
  const { allowedTabs } = usePermissions();

  // Filtra apenas as tabs permitidas para o role do usuário
  const visibleTabs = TAB_CONFIG.filter((tab) => allowedTabs.includes(tab.name));

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lumeraColors.roxoLumera,
        tabBarInactiveTintColor: isDark ? '#666' : '#999',
        tabBarStyle: {
          backgroundColor: isDark ? lumeraColors.cinzaFumaca : '#fff',
          borderTopColor: isDark ? 'rgba(123, 46, 255, 0.2)' : 'rgba(123, 46, 255, 0.1)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 8,
          shadowColor: lumeraColors.roxoLumera,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {visibleTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
