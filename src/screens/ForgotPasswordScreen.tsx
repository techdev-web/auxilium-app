import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthShell from '../components/AuthShell';
import CircleActionButton from '../components/CircleActionButton';
import { UniTextInput } from '../components/UniTextInput';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    // TODO: wire up password reset
  };

  return (
    <AuthShell
      footer={
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.footerText}>
            Back to <Text style={styles.footerAccent}>Sign in</Text>
          </Text>
        </Pressable>
      }>
      <View style={styles.intro}>
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send a reset link
        </Text>
      </View>

      <View style={styles.form}>
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

        <CircleActionButton label="Send link" onPress={handleResetPassword} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create(theme => ({
  intro: {
    alignItems: 'center',
    marginBottom: theme.gap(5),
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.gap(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: theme.gap(2),
  },
  input: {
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
  footerText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  footerAccent: {
    fontWeight: '700',
    color: theme.colors.text,
  },
}));
