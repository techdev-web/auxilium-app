import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUnistyles } from 'react-native-unistyles';
import type { LandGISStackParamList } from './types';
import LandGISScreen from '../screens/LandGISScreen';
import ProjectMapWorkspaceScreen from '../screens/ProjectMapWorkspaceScreen';

const Stack = createNativeStackNavigator<LandGISStackParamList>();

export default function LandGISStack() {
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="LandGISHome" component={LandGISScreen} />
      <Stack.Screen
        name="ProjectMapWorkspace"
        component={ProjectMapWorkspaceScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
