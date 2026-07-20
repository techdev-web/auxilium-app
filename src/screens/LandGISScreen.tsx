import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Plus } from 'lucide-react-native';
import Button from '../components/Button';
import CreateProjectModal, {
  type CreateProjectFormValues,
} from '../components/CreateProjectModal';

export default function LandGISScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSave = (_values: CreateProjectFormValues) => {
    // Persist when API is ready
    setModalVisible(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Land GIS</Text>
        <Text style={styles.screenSubtitle}>
          Create and manage GIS projects for land listings
        </Text>
      </View>

      <Button
        title="Create Project"
        icon={Plus}
        onPress={() => setModalVisible(true)}
        style={styles.createButton}
      />

      <CreateProjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.gap(3),
  },
  header: {
    gap: theme.gap(1),
    marginBottom: theme.gap(3),
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  screenSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  createButton: {
    alignSelf: 'flex-start',
  },
}));
