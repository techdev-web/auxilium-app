import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import Button from './Button';
import Modal from './Modal';
import { UniTextInput } from './UniTextInput';
import {
  requestLocationPermission,
  type LocationPermissionStatus,
} from '../services/locationPermission';

export type CreateProjectFormValues = {
  title: string;
  listingCenter: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (values: CreateProjectFormValues) => void;
};

export default function CreateProjectModal({ visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [listingCenter, setListingCenter] = useState('');
  const [locationStatus, setLocationStatus] =
    useState<LocationPermissionStatus | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    setLocationStatus(null);

    requestLocationPermission().then(status => {
      if (!cancelled) {
        setLocationStatus(status);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const resetAndClose = () => {
    setTitle('');
    setListingCenter('');
    setLocationStatus(null);
    onClose();
  };

  const handleSave = () => {
    onSave({ title: title.trim(), listingCenter: listingCenter.trim() });
    setTitle('');
    setListingCenter('');
    setLocationStatus(null);
  };

  const showLocationWarning =
    locationStatus === 'denied' || locationStatus === 'unavailable';

  return (
    <Modal visible={visible} onClose={resetAndClose}>
      <Text style={styles.title}>Create Project</Text>
      <Text style={styles.subtitle}>Enter project details to get started</Text>

      {showLocationWarning ? (
        <View style={styles.warningBanner} accessibilityRole="alert">
          <Text style={styles.warningTitle}>Location access declined</Text>
          <Text style={styles.warningMessage}>
            Without location access, listing center cannot be set from your
            current position. You can still enter it manually, or enable
            location in Settings and try again.
          </Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <UniTextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Project title"
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Listing Center</Text>
        <UniTextInput
          style={styles.input}
          value={listingCenter}
          onChangeText={setListingCenter}
          placeholder="Ex: 23.723081, 90.409136"
          returnKeyType="done"
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={resetAndClose}
          style={styles.actionButton}
        />
        <Button title="Save" onPress={handleSave} style={styles.actionButton} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    marginTop: -theme.gap(1),
  },
  warningBanner: {
    backgroundColor: '#FFF4E5',
    borderRadius: 16,
    padding: theme.gap(2),
    gap: 6,
    borderWidth: 1,
    borderColor: '#F5C26B',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A5A00',
  },
  warningMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A5A00',
  },
  field: {
    gap: theme.gap(1),
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(2),
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.inputText,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.gap(1.5),
    marginTop: theme.gap(1),
  },
  actionButton: {
    flex: 1,
  },
}));
