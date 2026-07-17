import React, { type ReactNode } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import bg from '../assets/bg4.png';
import logo from '../assets/logo.png';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthShell({ children, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={bg} style={styles.root} resizeMode="cover">
      <View style={styles.overlay} pointerEvents="none" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
              paddingLeft: Math.max(insets.left, 28),
              paddingRight: Math.max(insets.right, 28),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={styles.logoWrap}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: theme.gap(3),
  },
  logo: {
    width: 220,
    height: 72,
  },
  content: {
    flexGrow: 1,
    width: '100%',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.gap(4),
    alignItems: 'center',
    width: '100%',
  },
}));
