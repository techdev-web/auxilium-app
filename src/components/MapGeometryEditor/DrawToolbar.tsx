import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  Check,
  FileUp,
  Hand,
  Hexagon,
  ImagePlus,
  Keyboard,
  Layers,
  MapPin,
  Slash,
  Undo2,
} from 'lucide-react-native';
import type { MapGeometryKind } from '../../types/mapGeometry';

export type DrawMode = MapGeometryKind | 'select';

type Props = {
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
  draftVertexCount: number;
  editable?: boolean;
  onUndoVertex: () => void;
  onFinishShape: () => void;
  onOpenCoordinateEntry: () => void;
  onOpenCsvImport: () => void;
  onAddImageOverlay?: () => void;
  onOpenFeatureList?: () => void;
};

const MODES: {
  id: DrawMode;
  label: string;
  icon: typeof MapPin;
}[] = [
  { id: 'select', label: 'Select', icon: Hand },
  { id: 'Point', label: 'Point', icon: MapPin },
  { id: 'LineString', label: 'Line', icon: Slash },
  { id: 'Polygon', label: 'Polygon', icon: Hexagon },
];

export default function DrawToolbar({
  mode,
  onModeChange,
  draftVertexCount,
  editable = true,
  onUndoVertex,
  onFinishShape,
  onOpenCoordinateEntry,
  onOpenCsvImport,
  onAddImageOverlay,
  onOpenFeatureList,
}: Props) {
  const { theme } = useUnistyles();
  const canFinish =
    (mode === 'LineString' && draftVertexCount >= 2) ||
    (mode === 'Polygon' && draftVertexCount >= 3);
  const showDraftActions =
    editable && (mode === 'LineString' || mode === 'Polygon');
  const accent = theme.colors.secondary;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.modeSegment}>
        {MODES.map(item => {
          const active = mode === item.id;
          const Icon = item.icon;
          const disabled = !editable && item.id !== 'select';
          return (
            <Pressable
              key={item.id}
              disabled={disabled}
              onPress={() => onModeChange(item.id)}
              style={[
                styles.modeTab,
                active && styles.modeTabActive,
                disabled && styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}>
              <Icon size={15} color={active ? accent : theme.colors.textMuted} />
              <Text
                style={[
                  styles.modeText,
                  active && styles.modeTextActive,
                ]}>
                {item.label}
              </Text>
              {active ? <View style={styles.modeUnderline} /> : null}
            </Pressable>
          );
        })}
      </View>

      {editable || onOpenFeatureList ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionRow}
          style={styles.actionScroll}>
          {onOpenFeatureList ? (
            <Pressable
              onPress={onOpenFeatureList}
              style={styles.actionChip}
              accessibilityRole="button"
              accessibilityLabel="Show feature list">
              <Layers size={13} color={theme.colors.text} />
              <Text style={styles.actionText}>Layers</Text>
            </Pressable>
          ) : null}
          {editable ? (
            <>
              <Pressable
                onPress={onOpenCoordinateEntry}
                style={styles.actionChip}
                accessibilityRole="button"
                accessibilityLabel="Enter coordinates manually">
                <Keyboard size={13} color={theme.colors.text} />
                <Text style={styles.actionText}>Coords</Text>
              </Pressable>
              <Pressable
                onPress={onOpenCsvImport}
                style={styles.actionChip}
                accessibilityRole="button"
                accessibilityLabel="Import CSV">
                <FileUp size={13} color={theme.colors.text} />
                <Text style={styles.actionText}>CSV</Text>
              </Pressable>
              {onAddImageOverlay ? (
                <Pressable
                  onPress={onAddImageOverlay}
                  style={styles.actionChip}
                  accessibilityRole="button"
                  accessibilityLabel="Add image overlay">
                  <ImagePlus size={13} color={theme.colors.text} />
                  <Text style={styles.actionText}>Image</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      ) : null}

      {showDraftActions ? (
        <View style={styles.draftBar}>
          <View style={styles.draftMeta}>
            <Text style={styles.draftCount}>
              {draftVertexCount} vertex{draftVertexCount === 1 ? '' : 'es'}
            </Text>
            <Text style={styles.draftHint}>
              {mode === 'Polygon'
                ? 'Tap map · 3+ to finish'
                : 'Tap map · 2+ to finish'}
            </Text>
          </View>
          <View style={styles.draftActions}>
            <Pressable
              onPress={onUndoVertex}
              disabled={draftVertexCount === 0}
              style={[
                styles.draftChip,
                draftVertexCount === 0 && styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Undo last vertex">
              <Undo2 size={13} color={theme.colors.text} />
              <Text style={styles.draftChipText}>Undo</Text>
            </Pressable>
            <Pressable
              onPress={onFinishShape}
              disabled={!canFinish}
              style={[
                styles.finishChip,
                !canFinish && styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Finish shape">
              <Check size={13} color={theme.colors.onSecondary} />
              <Text style={styles.finishText}>Finish</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.gap(0.75),
    paddingHorizontal: theme.gap(1.5),
  },
  modeSegment: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 2,
    gap: 1,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: theme.gap(0.75),
    borderRadius: 8,
    position: 'relative',
  },
  modeTabActive: {
    backgroundColor: theme.colors.background,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  modeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  modeTextActive: {
    color: theme.colors.secondary,
    fontWeight: '700',
  },
  modeUnderline: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.secondary,
  },
  actionScroll: {
    flexGrow: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(0.75),
    paddingRight: theme.gap(0.75),
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.625),
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  draftBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.625),
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  draftMeta: {
    flex: 1,
    gap: 0,
    minWidth: 0,
  },
  draftCount: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  draftHint: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(0.5),
  },
  draftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.5),
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  draftChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  finishChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.gap(1.125),
    paddingVertical: theme.gap(0.5),
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
  },
  finishText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onSecondary,
  },
  disabled: {
    opacity: 0.4,
  },
}));
