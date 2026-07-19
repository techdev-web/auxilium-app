import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { UniTextInput } from '../components/UniTextInput';
import { changePassword } from '../constants/urls';
import { authFetch } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword.trim() || !newPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Enter both current and new passwords',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'New password and confirmation must match',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Password too short',
        text2: 'Use at least 6 characters',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authFetch(changePassword, {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await response.json();

      if (response.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Session expired',
          text2: 'Please sign in again',
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1: 'Could not change password',
          text2: data?.message || 'Please try again',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Password updated',
        text2: 'Your password has been changed successfully',
      });
      navigation.goBack();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Network error',
        text2: 'Unable to reach the server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Change password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password you have not used before
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Current password</Text>
            <UniTextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={!showPasswords}
              autoCapitalize="none"
              textContentType="password"
              placeholder="Current password"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <UniTextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPasswords}
              autoCapitalize="none"
              textContentType="newPassword"
              placeholder="New password"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm new password</Text>
            <UniTextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPasswords}
              autoCapitalize="none"
              textContentType="newPassword"
              placeholder="Confirm new password"
            />
          </View>

          <Pressable
            onPress={() => setShowPasswords(prev => !prev)}
            style={styles.toggle}>
            <Text style={styles.toggleText}>
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.submit, isSubmitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Update password">
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.submitText}>Update password</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.gap(3),
  },
  back: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.gap(2),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.gap(1),
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    marginBottom: theme.gap(3),
  },
  form: {
    gap: theme.gap(2),
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
  },
  input: {
    width: '100%',
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(3),
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.inputText,
  },
  toggle: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  submit: {
    marginTop: theme.gap(1),
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
}));
