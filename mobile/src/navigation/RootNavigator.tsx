import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Text, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from './types';

// Import stacks
import AuthStack from './AuthStack';
import MainStack from './MainStack';

// Import auth store (will be created later)
import { useAuthStore } from '../stores/authStore';

// Import notification ref setter
import { setNavigationRef } from '../hooks/useNotifications';

import { lumeraColors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Splash/Loading Screen Component
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#0A0A0F', '#12121A', '#1A1025', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />

      <View style={styles.splashContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[lumeraColors.roxoLumera, lumeraColors.azulGlow]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="diamond-stone" size={50} color="#fff" />
          </LinearGradient>
        </View>

        {/* Brand */}
        <Text style={styles.brandName}>LUMERA</Text>
        <Text style={styles.tagline}>Brilhe em cada momento</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={lumeraColors.lilasNeon} />
        </View>
      </View>
    </View>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isHydrating } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Only show loading during initial app hydration, not during login/register
  if (isHydrating) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setNavigationRef(navigationRef.current)}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  decorCircle1: {
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: lumeraColors.azulGlow,
  },
  decorCircle2: {
    bottom: -80,
    right: -80,
    width: 250,
    height: 250,
    backgroundColor: lumeraColors.roxoLumera,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: lumeraColors.lilasNeon,
    marginTop: 8,
    opacity: 0.9,
  },
  loadingContainer: {
    marginTop: 40,
  },
});
