import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ListingsStackParamList } from '../navigation/types';
import PlaceholderScreen from './PlaceholderScreen';

type Props = NativeStackScreenProps<ListingsStackParamList, 'ImportFromGis'>;

export default function ImportFromGisScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <PlaceholderScreen
        title="Import from GIS Project"
        subtitle="GIS import flow coming soon"
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    paddingHorizontal: theme.gap(3),
    marginBottom: theme.gap(1),
  },
  backText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.primary,
  },
}));
