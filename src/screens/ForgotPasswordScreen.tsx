import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthShell from '../components/AuthShell';
import { UniTextInput } from '../components/UniTextInput';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    // TODO: wire up password reset
  };

  return (
    <AuthShell>
      <View style={styles.intro}>
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your
          password
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <UniTextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleResetPassword}>
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        </Pressable>

        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create(theme => ({
  intro: {
    alignItems: 'center',
    marginBottom: theme.gap(4),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.gap(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: theme.gap(2.5),
  },
  field: {
    gap: theme.gap(1),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(2),
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  primaryButton: {
    borderRadius: theme.radii.input,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.gap(1),
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    alignItems: 'center',
    marginTop: theme.gap(1),
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
}));
