import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUnistyles } from 'react-native-unistyles';
import type { MainTabParamList } from './types';
import DashboardScreen from '../screens/DashboardScreen';
import ListingsScreen from '../screens/ListingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OwnersScreen from '../screens/OwnersScreen';
import TransactionsScreen from '../screens/TransactionsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Dashboard: '⌂',
  Listings: '☰',
  Profile: '☺',
  Owners: '◉',
  Transactions: '⇄',
};

export default function MainTabs() {
  const { theme } = useUnistyles();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 6,
        },
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size - 4 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      {/* <Tab.Screen name="Owners" component={OwnersScreen} /> */}
      {/* <Tab.Screen name="Transactions" component={TransactionsScreen} /> */}
    </Tab.Navigator>
  );
}
