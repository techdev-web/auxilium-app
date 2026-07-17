import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  children: ReactNode;
};

export default function AuthShell({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.brand}>Auxilium</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.cardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.header,
  },
  header: {
    paddingHorizontal: theme.gap(3),
    paddingBottom: theme.gap(5),
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 160,
  },
  brand: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.textOnHeader,
    letterSpacing: 0.3,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.card,
    borderTopRightRadius: theme.radii.card,
    paddingTop: theme.gap(4),
    paddingHorizontal: theme.gap(3),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.gap(2),
  },
}));
