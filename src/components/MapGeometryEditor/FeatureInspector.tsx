import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UniTextInput } from '../UniTextInput';
import {
  GEOMETRY_COLOR_PALETTE,
  MAP_FEATURE_TYPE_OPTIONS,
  clampOpacity,
  getFeatureTypeMeta,
  isImageOverlay,
  resolveOpacity,
  type MapFeature,
  type MapFeatureType,
  type MapGeometry,
  type MapImageOverlay,
} from '../../types/mapGeometry';

type Props = {
  feature: MapFeature;
  editable?: boolean;
  onChange: (next: MapFeature) => void;
  onDelete: () => void;
  onClose: () => void;
  /** Override safe-area bottom padding (e.g. when a dock already handles it). */
  bottomInset?: number;
  /** Start collapsed when the feature is first shown. */
  initialMinimized?: boolean;
};

/** Header-only height when collapsed; expanded uses 60% of the map area. */
const MINIMIZED_HEIGHT = 72;

export default function FeatureInspector({
  feature,
  editable = true,
  onChange,
  onDelete,
  onClose,
  bottomInset,
  initialMinimized = false,
}: Props) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const [minimized, setMinimized] = useState(initialMinimized);
  const safeBottom = bottomInset ?? insets.bottom;

  const overlay = isImageOverlay(feature) ? feature : null;
  const geometry = overlay ? null : (feature as MapGeometry);
  const meta = geometry ? getFeatureTypeMeta(geometry.featureType) : null;

  const titleText = overlay
    ? feature.label || 'Image Overlay'
    : feature.label || meta!.label;
  const subtitleText = overlay
    ? 'ImageOverlay'
    : `${geometry!.kind}${feature.label ? ` · ${meta!.label}` : ''}`;

  useEffect(() => {
    setMinimized(initialMinimized);
  }, [feature.id, initialMinimized]);

  const setFeatureType = (featureType: MapFeatureType) => {
    if (!geometry) {
      return;
    }
    const nextMeta = getFeatureTypeMeta(featureType);
    onChange({
      ...geometry,
      featureType,
      color:
        geometry.color === meta!.defaultColor
          ? nextMeta.defaultColor
          : geometry.color,
    });
  };

  const sheetHeight = minimized
    ? MINIMIZED_HEIGHT + safeBottom
    : ('60%' as const);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            paddingBottom: minimized
              ? safeBottom + theme.gap(1)
              : Math.max(safeBottom, theme.gap(2)),
          },
        ]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {titleText}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitleText}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {editable ? (
                <Pressable
                  onPress={onDelete}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Delete feature"
                  style={styles.iconButton}>
                  <Trash2 size={20} color="#C62828" />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setMinimized(prev => !prev)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  minimized ? 'Expand inspector' : 'Minimize inspector'
                }
                style={styles.iconButton}>
                {minimized ? (
                  <ChevronUp size={22} color={theme.colors.text} />
                ) : (
                  <ChevronDown size={22} color={theme.colors.text} />
                )}
              </Pressable>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>Done</Text>
              </Pressable>
            </View>
          </View>

          {!minimized ? (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>

              {overlay ? (
                <OverlayInspectorBody
                  overlay={overlay}
                  editable={editable}
                  onChange={onChange}
                />
              ) : (
                <GeometryInspectorBody
                  feature={geometry!}
                  meta={meta!}
                  editable={editable}
                  onChange={onChange}
                  setFeatureType={setFeatureType}
                />
              )}
            </ScrollView>
          ) : null}
      </View>
    </View>
  );
}

function GeometryInspectorBody({
  feature,
  meta,
  editable,
  onChange,
  setFeatureType,
}: {
  feature: MapGeometry;
  meta: { label: string; defaultColor: string };
  editable: boolean;
  onChange: (next: MapFeature) => void;
  setFeatureType: (ft: MapFeatureType) => void;
}) {
  const { theme } = useUnistyles();
  const isPolyShape =
    feature.kind === 'LineString' || feature.kind === 'Polygon';

  return (
    <>
      {editable && isPolyShape ? (
        <Text style={styles.gestureHint}>
          Long-press a filled handle to drag it. Tap a hollow handle to
          add a vertex on that edge.
        </Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRow}>
        <Pressable
          disabled={!editable}
          onPress={() => setFeatureType(null)}
          style={[
            styles.typeChip,
            feature.featureType == null && styles.typeChipActive,
          ]}>
          <Text
            style={[
              styles.typeChipText,
              feature.featureType == null && styles.typeChipTextActive,
            ]}>
            Pin
          </Text>
        </Pressable>
        {MAP_FEATURE_TYPE_OPTIONS.map(option => {
          const active = feature.featureType === option.value;
          const TypeIcon = option.icon;
          return (
            <Pressable
              key={option.value}
              disabled={!editable}
              onPress={() => setFeatureType(option.value)}
              style={[
                styles.typeChip,
                active && styles.typeChipActive,
              ]}>
              <TypeIcon
                size={14}
                color={
                  active ? theme.colors.onPrimary : theme.colors.text
                }
              />
              <Text
                style={[
                  styles.typeChipText,
                  active && styles.typeChipTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.fieldLabel}>Label</Text>
      <UniTextInput
        value={feature.label ?? ''}
        onChangeText={label => onChange({ ...feature, label })}
        editable={editable}
        placeholder="Label"
        style={styles.input}
      />

      <Text style={styles.fieldLabel}>Color</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorRow}>
        {GEOMETRY_COLOR_PALETTE.map(color => {
          const selected =
            feature.color.toLowerCase() === color.toLowerCase();
          return (
            <Pressable
              key={color}
              disabled={!editable}
              onPress={() => onChange({ ...feature, color })}
              style={[
                styles.swatch,
                { backgroundColor: color },
                selected && styles.swatchSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Color ${color}`}
            />
          );
        })}
      </ScrollView>

      <Text style={styles.fieldLabel}>Opacity</Text>
      <View style={styles.zRow}>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({
              ...feature,
              opacity: clampOpacity(resolveOpacity(feature) - 0.05),
            })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>−</Text>
        </Pressable>
        <Text style={styles.opacityValue}>
          {Math.round(resolveOpacity(feature) * 100)}%
        </Text>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({
              ...feature,
              opacity: clampOpacity(resolveOpacity(feature) + 0.05),
            })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Z-index</Text>
      <View style={styles.zRow}>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({ ...feature, zIndex: feature.zIndex - 1 })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>−</Text>
        </Pressable>
        <UniTextInput
          value={String(feature.zIndex)}
          editable={editable}
          keyboardType="number-pad"
          onChangeText={raw => {
            const parsed = Number.parseInt(raw, 10);
            if (!Number.isNaN(parsed)) {
              onChange({ ...feature, zIndex: parsed });
            } else if (raw.trim() === '' || raw === '-') {
              onChange({ ...feature, zIndex: 0 });
            }
          }}
          style={[styles.input, styles.zInput]}
        />
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({ ...feature, zIndex: feature.zIndex + 1 })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>+</Text>
        </Pressable>
      </View>
    </>
  );
}

function OverlayInspectorBody({
  overlay,
  editable,
  onChange,
}: {
  overlay: MapImageOverlay;
  editable: boolean;
  onChange: (next: MapFeature) => void;
}) {
  const { theme } = useUnistyles();

  return (
    <>
      <Image
        source={{ uri: overlay.imageUri }}
        style={styles.imagePreview}
        resizeMode="cover"
      />

      <Text style={styles.fieldLabel}>Label</Text>
      <UniTextInput
        value={overlay.label ?? ''}
        onChangeText={label => onChange({ ...overlay, label })}
        editable={editable}
        placeholder="Label"
        style={styles.input}
      />

      <Text style={styles.fieldLabel}>Opacity</Text>
      <View style={styles.zRow}>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({
              ...overlay,
              opacity: clampOpacity(resolveOpacity(overlay) - 0.05),
            })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>−</Text>
        </Pressable>
        <Text style={styles.opacityValue}>
          {Math.round(resolveOpacity(overlay) * 100)}%
        </Text>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({
              ...overlay,
              opacity: clampOpacity(resolveOpacity(overlay) + 0.05),
            })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Z-index</Text>
      <View style={styles.zRow}>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({ ...overlay, zIndex: overlay.zIndex - 1 })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>−</Text>
        </Pressable>
        <UniTextInput
          value={String(overlay.zIndex)}
          editable={editable}
          keyboardType="number-pad"
          onChangeText={raw => {
            const parsed = Number.parseInt(raw, 10);
            if (!Number.isNaN(parsed)) {
              onChange({ ...overlay, zIndex: parsed });
            } else if (raw.trim() === '' || raw === '-') {
              onChange({ ...overlay, zIndex: 0 });
            }
          }}
          style={[styles.input, styles.zInput]}
        />
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({ ...overlay, zIndex: overlay.zIndex + 1 })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Rotation</Text>
      <View style={styles.zRow}>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({ ...overlay, rotation: (overlay.rotation ?? 0) - 5 })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>−</Text>
        </Pressable>
        <Text style={styles.opacityValue}>
          {Math.round(overlay.rotation ?? 0)}°
        </Text>
        <Pressable
          disabled={!editable}
          onPress={() =>
            onChange({ ...overlay, rotation: (overlay.rotation ?? 0) + 5 })
          }
          style={styles.zButton}>
          <Text style={styles.zButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Bounds</Text>
      <View style={styles.boundsGrid}>
        <View style={styles.boundsRow}>
          <Text style={styles.boundsLabel}>N</Text>
          <Text style={styles.boundsValue}>{overlay.bounds.north.toFixed(6)}</Text>
        </View>
        <View style={styles.boundsRow}>
          <Text style={styles.boundsLabel}>S</Text>
          <Text style={styles.boundsValue}>{overlay.bounds.south.toFixed(6)}</Text>
        </View>
        <View style={styles.boundsRow}>
          <Text style={styles.boundsLabel}>E</Text>
          <Text style={styles.boundsValue}>{overlay.bounds.east.toFixed(6)}</Text>
        </View>
        <View style={styles.boundsRow}>
          <Text style={styles.boundsLabel}>W</Text>
          <Text style={styles.boundsValue}>{overlay.bounds.west.toFixed(6)}</Text>
        </View>
      </View>

      {editable ? (
        <Text style={styles.gestureHint}>
          Drag the center handle to move. Drag corner or edge handles to resize.
          Drag the orange handle to rotate.
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.gap(2.5),
    paddingTop: theme.gap(2),
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    gap: theme.gap(1.25),
    // Shadow so the sheet reads above the map
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1.5),
  },
  iconButton: {
    padding: 2,
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
  close: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: theme.gap(1.25),
    paddingBottom: theme.gap(1),
  },
  gestureHint: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  typeRow: {
    gap: theme.gap(1),
    paddingVertical: theme.gap(0.25),
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(1),
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  typeChipActive: {
    backgroundColor: theme.colors.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  typeChipTextActive: {
    color: theme.colors.onPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.25),
    fontSize: 15,
  },
  colorRow: {
    gap: theme.gap(1),
    paddingVertical: theme.gap(0.25),
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: theme.colors.text,
  },
  zRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1),
  },
  zButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  zButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
  },
  zInput: {
    flex: 1,
    textAlign: 'center',
  },
  opacityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: theme.radii.input,
    backgroundColor: theme.colors.surface,
  },
  boundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.gap(0.75),
  },
  boundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(0.5),
    width: '48%',
  },
  boundsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    width: 16,
  },
  boundsValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
}));
