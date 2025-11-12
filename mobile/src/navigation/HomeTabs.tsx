import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeTabsParamList } from './types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import screens (will be created later)
import HomeScreen from '../screens/events/HomeScreen';
import MyTicketsScreen from '../screens/tickets/MyTicketsScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<HomeTabsParamList>();

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{
          title: 'Ingressos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
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
