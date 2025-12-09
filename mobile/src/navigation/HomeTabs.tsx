import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lightColors, darkColors, lumeraColors } from '../theme';
import { useThemeStore } from '../stores/themeStore';

// Import screens
import HomeScreen from '../screens/events/HomeScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import PaymentScreen from '../screens/checkout/PaymentScreen';
import MyTicketsScreen from '../screens/tickets/MyTicketsScreen';
import TicketDetailsScreen from '../screens/tickets/TicketDetailsScreen';
import TicketScannerScreen from '../screens/validation/TicketScannerScreen';
import ValidationResultScreen from '../screens/validation/ValidationResultScreen';
import ManualValidationScreen from '../screens/validation/ManualValidationScreen';
import PromoterDashboardScreen from '../screens/promoter/PromoterDashboardScreen';
import PromoterListScreen from '../screens/promoter/PromoterListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

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
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

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
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyTickets"
        component={TicketsStackScreen}
        options={{
          title: 'Ingressos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Validation"
        component={ValidationStackScreen}
        options={{
          title: 'Validar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsStackScreen}
        options={{
          title: 'Listas',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
