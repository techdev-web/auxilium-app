import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Close when tapping the dimmed backdrop. Defaults to true. */
  closeOnBackdropPress?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Modal({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  contentStyle,
}: Props) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={styles.backdrop}
          onPress={closeOnBackdropPress ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View style={[styles.card, contentStyle]}>{children}</View>
        {/* Same native window as the modal so toasts aren't hidden behind it */}
        <Toast />
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.gap(3),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    padding: theme.gap(3),
    gap: theme.gap(2),
    zIndex: 1,
  },
}));
