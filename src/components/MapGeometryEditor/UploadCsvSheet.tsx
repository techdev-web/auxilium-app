import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FileUp } from 'lucide-react-native';
import Button from '../Button';
import Modal from '../Modal';

/** Matches headers accepted by parseCsvCoordinates (longitude + latitude). */
export const SAMPLE_CSV_TEXT = `longitude,latitude
77.5946,12.9716
77.6090,12.9750
77.6200,12.9800`;

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpload: () => void | Promise<void>;
};

export default function UploadCsvSheet({ visible, onClose, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    try {
      await onUpload();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={styles.title}>Import CSV</Text>
      <Text style={styles.hint}>
        Use columns named longitude and latitude (or lng/lat). One coordinate
        pair per row. Points create markers; with Line or Polygon mode selected,
        rows become vertices of a single shape.
      </Text>

      <View style={styles.sampleBox}>
        <Text style={styles.sampleLabel}>Example</Text>
        <Text style={styles.sampleText} selectable>
          {SAMPLE_CSV_TEXT}
        </Text>
      </View>

      <Button
        title={uploading ? 'Opening…' : 'Upload CSV'}
        icon={FileUp}
        onPress={handleUpload}
        loading={uploading}
        disabled={uploading}
        variant="secondary"
      />
      <Button title="Cancel" onPress={onClose} variant="ghost" />
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: -theme.gap(0.5),
    lineHeight: 19,
  },
  sampleBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      theme.colors.border === 'transparent' ? '#E5E7EB' : theme.colors.border,
    padding: theme.gap(1.5),
    gap: theme.gap(0.75),
  },
  sampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sampleText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text,
  },
}));
