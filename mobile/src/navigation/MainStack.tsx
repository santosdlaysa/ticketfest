import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';

// Import navigators and screens
import HomeTabs from './HomeTabs';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      {/* Other screens will be added as modals */}
    </Stack.Navigator>
  );
}
