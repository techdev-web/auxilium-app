import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthShell from '../components/AuthShell';
import { UniTextInput } from '../components/UniTextInput';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ navigation }: Props) {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleVerifyOtp = () => {
    // TODO: wire up OTP verification
  };

  const handleSendOtp = () => {
    // TODO: wire up OTP send
  };

  return (
    <AuthShell>
      <View style={styles.intro}>
        <Text style={styles.title}>Sign in with OTP</Text>
        <Text style={styles.subtitle}>
          Enter your email or phone number to receive a one-time password
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email or Phone</Text>
          <UniTextInput
            style={styles.input}
            placeholder="Enter email or phone number"
            value={phoneOrEmail}
            onChangeText={setPhoneOrEmail}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable style={styles.outlineButton} onPress={handleSendOtp}>
          <Text style={styles.outlineButtonText}>Send OTP</Text>
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>OTP Code</Text>
          <UniTextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleVerifyOtp}>
          <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
        </Pressable>

        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Back to email sign in</Text>
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
  outlineButton: {
    borderWidth: 1.5,
    borderRadius: theme.radii.input,
    paddingVertical: 16,
    alignItems: 'center',
    borderColor: theme.colors.secondary,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
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
