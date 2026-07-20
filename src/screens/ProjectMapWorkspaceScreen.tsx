import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LandGISStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<
  LandGISStackParamList,
  'ProjectMapWorkspace'
>;

export default function ProjectMapWorkspaceScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { projectTitle } = route.params;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={8}
        style={styles.backButton}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>{projectTitle}</Text>
        <Text style={styles.subtitle}>Project map workspace</Text>
        <Text style={styles.body}>
          This is a placeholder screen for map editing tools. Parcel drawing,
          layers, and measurement tools will live here.
        </Text>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: theme.gap(3),
    gap: theme.gap(1.5),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    marginTop: theme.gap(1),
  },
}));
