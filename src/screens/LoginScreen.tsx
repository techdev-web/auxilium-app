import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthShell from '../components/AuthShell';
import CircleActionButton from '../components/CircleActionButton';
import { UniTextInput } from '../components/UniTextInput';
import { loginUrl } from '../constants/urls';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignIn = async () => {
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers:{
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthShell
      footer={
        <Pressable onPress={() => navigation.navigate('Otp')}>
          <Text style={styles.footerText}>
            Prefer a one-time password?{' '}
            <Text style={styles.footerAccent}>OTP</Text>
          </Text>
        </Pressable>
      }>
      <View style={styles.intro}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <UniTextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.passwordRow}>
            <UniTextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
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

        <Pressable
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </Pressable>

        <CircleActionButton label="Sign in" onPress={handleSignIn} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create(theme => ({
  intro: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.gap(5),
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.gap(1),
  },
  subtitle: {
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
  },
  form: {
    width: '100%',
    gap: theme.gap(2),
  },
  field: {
    width: '100%',
  },
  input: {
    width: '100%',
    borderWidth: 0,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(3),
    paddingVertical: 18,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  passwordRow: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 72,
  },
  eyeButton: {
    position: 'absolute',
    right: 20,
    height: '100%',
    justifyContent: 'center',
  },
  eyeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: theme.gap(0.5),
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
    color: theme.colors.textMuted,
  },
  footerAccent: {
    fontWeight: '700',
    color: theme.colors.text,
  },
}));
