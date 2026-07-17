import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthShell from '../components/AuthShell';
import { UniTextInput } from '../components/UniTextInput';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignIn = () => {
    // TODO: wire up email/password authentication
  };

  return (
    <AuthShell>
      <View style={styles.intro}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your details below</Text>
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

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <UniTextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              textContentType="password"
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setIsPasswordVisible(prev => !prev)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? 'Hide password' : 'Show password'
              }>
              <Text style={styles.eyeButtonText}>
                {isPasswordVisible ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSignIn}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>

        <Pressable
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Otp')}>
          <Text style={styles.secondaryButtonText}>Sign in with OTP</Text>
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
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
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
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 64,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  eyeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
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
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1.5),
    marginTop: theme.gap(1),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: theme.colors.textSecondary,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderRadius: theme.radii.input,
    paddingVertical: 16,
    alignItems: 'center',
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.card,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
}));
