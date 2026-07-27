import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Crosshair, MapPin } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import Button from '../Button';
import Modal from '../Modal';
import { UniTextInput } from '../UniTextInput';
import { getCurrentCoordinates } from '../../services/locationPermission';
import { parseListingCenter } from '../../services/locationApi';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (latitude: number, longitude: number) => void;
  title?: string;
};

export default function CoordinateEntrySheet({
  visible,
  onClose,
  onConfirm,
  title = 'Enter coordinates',
}: Props) {
  const { theme } = useUnistyles();
  const [text, setText] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);

  useEffect(() => {
    if (visible) {
      setText('');
    }
  }, [visible]);

  const handleConfirm = () => {
    const parsed = parseListingCenter(text);
    if (!parsed) {
      Toast.show({
        type: 'error',
        text1: 'Invalid coordinates',
        text2: 'Use format: latitude, longitude',
      });
      return;
    }
    onConfirm(parsed.latitude, parsed.longitude);
  };

  const handleUseCurrentLocation = async () => {
    setLoadingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) {
        Toast.show({
          type: 'error',
          text1: 'Location unavailable',
          text2: 'Allow location access and try again',
        });
        return;
      }
      setText(
        `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
      );
      onConfirm(coords.latitude, coords.longitude);
    } finally {
      setLoadingGps(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>
        Enter latitude, longitude — or use your current GPS position.
      </Text>

      <UniTextInput
        value={text}
        onChangeText={setText}
        placeholder="22.973400, 78.656900"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        style={styles.input}
      />

      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={loadingGps}
        style={styles.gpsRow}
        accessibilityRole="button"
        accessibilityLabel="Use current location">
        {loadingGps ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <Crosshair size={18} color={theme.colors.primary} />
        )}
        <Text style={styles.gpsText}>Use current location</Text>
      </Pressable>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onClose}
          style={styles.actionButton}
        />
        <Button
          title="Add point"
          icon={MapPin}
          onPress={handleConfirm}
          style={styles.actionButton}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: -theme.gap(0.5),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border === 'transparent' ? '#E5E7EB' : theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.5),
    fontSize: 16,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1),
    paddingVertical: theme.gap(0.5),
  },
  gpsText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.gap(1.5),
  },
  actionButton: {
    flex: 1,
  },
}));
