import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUnistyles } from 'react-native-unistyles';
import type { LucideIcon } from 'lucide-react-native';
import { LayoutDashboard, CircleUser, ScrollText, Map } from 'lucide-react-native';
import type { MainTabParamList } from './types';
import DashboardScreen from '../screens/DashboardScreen';
import ListingsStack from './ListingsStack';
import ProfileScreen from '../screens/ProfileScreen';
import LandGISScreen from '../screens/LandGISScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Partial<Record<keyof MainTabParamList, LucideIcon>> = {
  Dashboard: LayoutDashboard,
  Listings: ScrollText,
  Profile: CircleUser,
  LandGIS: Map
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
        tabBarIcon: ({ color, size }) => {
          const Icon = TAB_ICONS[route.name];
          if (!Icon) {
            return null;
          }
          return <Icon color={color} size={size} />;
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Listings" component={ListingsStack} />
      <Tab.Screen name="LandGIS" component={LandGISScreen} options={{title: 'GIS'}} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {/* <Tab.Screen name="Owners" component={OwnersScreen} /> */}
      {/* <Tab.Screen name="Transactions" component={TransactionsScreen} /> */}
    </Tab.Navigator>
  );
}
