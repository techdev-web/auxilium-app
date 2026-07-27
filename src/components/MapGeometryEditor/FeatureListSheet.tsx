import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Eye, EyeOff, List, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getFeatureTypeMeta,
  isFeatureVisible,
  isImageOverlay,
  type MapFeature,
  type MapGeometry,
  type MapImageOverlay,
} from '../../types/mapGeometry';

type Props = {
  visible: boolean;
  geometries: MapGeometry[];
  imageOverlays: MapImageOverlay[];
  selectedId: string | null;
  editable?: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  /** Override safe-area bottom padding (e.g. when a dock already handles it). */
  bottomInset?: number;
};

function featureDisplayName(feature: MapFeature): string {
  const label = feature.label?.trim();
  if (label) {
    return label;
  }
  if (isImageOverlay(feature)) {
    return 'Image Overlay';
  }
  return getFeatureTypeMeta(feature.featureType).label;
}

function featureTypeLabel(feature: MapFeature): string {
  if (isImageOverlay(feature)) {
    return 'ImageOverlay';
  }
  const meta = getFeatureTypeMeta(feature.featureType);
  if (feature.featureType) {
    return `${feature.kind} · ${meta.label}`;
  }
  return feature.kind;
}

export default function FeatureListSheet({
  visible,
  geometries,
  imageOverlays,
  selectedId,
  editable = true,
  onClose,
  onSelect,
  onToggleVisibility,
  onDelete,
  bottomInset,
}: Props) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const safeBottom = bottomInset ?? insets.bottom;

  if (!visible) {
    return null;
  }

  const features: MapFeature[] = [
    ...geometries,
    ...imageOverlays,
  ].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(safeBottom, theme.gap(2)) },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <List size={18} color={theme.colors.text} />
              <Text style={styles.title}>Features</Text>
            </View>
            <Text style={styles.subtitle}>
              {features.length} on map
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close feature list">
            <X size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        {features.length === 0 ? (
          <Text style={styles.empty}>No features on this map yet.</Text>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {features.map(feature => {
              const selected = feature.id === selectedId;
              const isVisible = isFeatureVisible(feature);
              const overlay = isImageOverlay(feature) ? feature : null;
              const geometry = overlay ? null : (feature as MapGeometry);

              return (
                <Pressable
                  key={feature.id}
                  onPress={() => onSelect(feature.id)}
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                    !isVisible && styles.rowHidden,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${featureDisplayName(feature)}`}>
                  {overlay ? (
                    <Image
                      source={{ uri: overlay.imageUri }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: geometry!.color },
                      ]}
                    />
                  )}

                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {featureDisplayName(feature)}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {featureTypeLabel(feature)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onToggleVisibility(feature.id)}
                    hitSlop={8}
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isVisible ? 'Hide on map' : 'Show on map'
                    }>
                    {isVisible ? (
                      <Eye size={18} color={theme.colors.text} />
                    ) : (
                      <EyeOff size={18} color={theme.colors.textMuted} />
                    )}
                  </Pressable>

                  {editable ? (
                    <Pressable
                      onPress={() => onDelete(feature.id)}
                      hitSlop={8}
                      style={styles.iconButton}
                      accessibilityRole="button"
                      accessibilityLabel="Delete feature">
                      <Trash2 size={18} color="#C62828" />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 12,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.gap(2.5),
    paddingTop: theme.gap(2),
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    gap: theme.gap(1.25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.gap(2),
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textMuted,
    paddingVertical: theme.gap(2),
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: theme.gap(1),
    paddingBottom: theme.gap(1),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1.25),
    paddingVertical: theme.gap(1.25),
    paddingHorizontal: theme.gap(1.25),
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  rowSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  rowHidden: {
    opacity: 0.55,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  rowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  iconButton: {
    padding: 4,
  },
}));
