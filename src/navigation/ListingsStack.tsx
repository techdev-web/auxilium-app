import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUnistyles } from 'react-native-unistyles';
import type { ListingsStackParamList } from './types';
import ManageListingsScreen from '../screens/ManageListingsScreen';
import ViewListingsScreen from '../screens/ViewListingsScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import ImportFromGisScreen from '../screens/ImportFromGisScreen';

const Stack = createNativeStackNavigator<ListingsStackParamList>();

export default function ListingsStack() {
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="ManageListings" component={ManageListingsScreen} />
      <Stack.Screen
        name="ViewListings"
        component={ViewListingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ImportFromGis"
        component={ImportFromGisScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
