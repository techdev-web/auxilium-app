import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { LucideIcon } from 'lucide-react-native';
import { FolderInput, Map, Plus, ScrollText } from 'lucide-react-native';
import type { ListingsStackParamList, MainTabParamList } from '../navigation/types';

type ManageListingsNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<ListingsStackParamList, 'ManageListings'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type ActionItem = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onPress: (navigation: ManageListingsNavigation) => void;
};

const ACTIONS: ActionItem[] = [
  {
    title: 'View Listings',
    subtitle: 'Browse and search all active listings',
    icon: ScrollText,
    onPress: navigation => navigation.navigate('ViewListings'),
  },
  {
    title: 'Create Listing',
    subtitle: 'Add a new property listing manually',
    icon: Plus,
    onPress: navigation => navigation.navigate('CreateListing'),
  },
  {
    title: 'Import from GIS Project',
    subtitle: 'Bring in land data from an existing GIS project',
    icon: FolderInput,
    onPress: navigation => navigation.navigate('ImportFromGis'),
  },
  {
    title: 'Start with Map',
    subtitle: 'Draw boundaries and create a listing on the map',
    icon: Map,
    onPress: navigation => navigation.getParent()?.navigate('LandGIS'),
  },
];

type ActionButtonProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onPress: () => void;
};

function ActionButton({ title, subtitle, icon: Icon, onPress }: ActionButtonProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable
      style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={styles.actionIconWrap}>
        <Icon color={theme.colors.primary} size={22} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.actionChevron}>›</Text>
    </Pressable>
  );
}

export default function ManageListingsScreen() {
  const navigation = useNavigation<ManageListingsNavigation>();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Manage Listings</Text>
      <Text style={styles.screenSubtitle}>
        Choose how you want to work with your property listings
      </Text>

      <View style={styles.actions}>
        {ACTIONS.map(action => (
          <ActionButton
            key={action.title}
            title={action.title}
            subtitle={action.subtitle}
            icon={action.icon}
            onPress={() => action.onPress(navigation)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.gap(3),
    gap: theme.gap(2),
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  screenSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    marginBottom: theme.gap(1),
  },
  actions: {
    gap: theme.gap(1.5),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(2),
    padding: theme.gap(2),
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '14',
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  actionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },
  actionChevron: {
    fontSize: 28,
    fontWeight: '300',
    color: theme.colors.textMuted,
    marginTop: -2,
  },
}));
