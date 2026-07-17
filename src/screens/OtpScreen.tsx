import React, { useRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AuthShell from '../components/AuthShell';
import CircleActionButton from '../components/CircleActionButton';
import { UniTextInput } from '../components/UniTextInput';

const OTP_LENGTH = 6;

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ navigation }: Props) {
  const { theme } = useUnistyles();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(''),
  );
  const inputRefs = useRef<Array<TextInputType | null>>([]);

  const handleVerifyOtp = () => {
    // TODO: wire up OTP verification
    const otp = otpDigits.join('');
    console.log({ phoneOrEmail, otp });
  };

  const handleSendOtp = () => {
    // TODO: wire up OTP send
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the code sent to you</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <UniTextInput
            style={styles.input}
            placeholder="Email or Phone"
            value={phoneOrEmail}
            onChangeText={setPhoneOrEmail}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable style={styles.sendOtp} onPress={handleSendOtp}>
          <Text style={styles.sendOtpText}>Send OTP</Text>
        </Pressable>

        <View style={styles.otpRow}>
          {otpDigits.map((digit, index) => (
            <TextInput
              key={`otp-${index}`}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={styles.otpBox}
              value={digit}
              onChangeText={value => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleOtpKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              placeholderTextColor={theme.colors.placeholder}
              textAlign="center"
            />
          ))}
        </View>

        <CircleActionButton
          label="Verify"
          onPress={handleVerifyOtp}
          tone="primary"
        />
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
  sendOtp: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  sendOtpText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.gap(1),
    marginTop: theme.gap(1),
    width: '100%',
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    fontSize: 20,
    fontWeight: '700',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
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
