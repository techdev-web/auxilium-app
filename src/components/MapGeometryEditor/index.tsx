import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { Position } from 'geojson';
import { Layers, Save } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import Button from '../Button';
import {
  DEFAULT_GEOMETRY_COLOR,
  DEFAULT_IMAGE_OVERLAY_OPACITY,
  createMapGeometryId,
  defaultOverlayBounds,
  getDefaultOpacity,
  getFeatureTypeMeta,
  isFeatureVisible,
  isImageOverlay,
  type MapFeature,
  type MapGeometry,
  type MapImageOverlay,
} from '../../types/mapGeometry';
import {
  lineCoordinatesFromVertices,
  pointCoordinatesFromLngLat,
  polygonCoordinatesFromVertices,
  deleteGeometryVertex,
  getEditableVertices,
  insertGeometryVertex,
  minEditableVertexCount,
  updateGeometryVertex,
} from '../../utils/mapGeometryLayers';
import CoordinateEntrySheet from './CoordinateEntrySheet';
import DrawToolbar, { type DrawMode } from './DrawToolbar';
import FeatureInspector from './FeatureInspector';
import FeatureListSheet from './FeatureListSheet';
import { pickAndParseCsvCoordinates } from './importCsv';
import { pickImageFile } from './pickImage';
import MapCanvas from './MapCanvas';
import UploadCsvSheet from './UploadCsvSheet';

export type MapGeometryEditorProps = {
  geometries: MapGeometry[];
  onChange: (next: MapGeometry[]) => void;
  imageOverlays?: MapImageOverlay[];
  onOverlaysChange?: (next: MapImageOverlay[]) => void;
  /** Host persists; editor only invokes (e.g. Save button). */
  onSave?: (
    geometries: MapGeometry[],
    imageOverlays: MapImageOverlay[],
  ) => void | Promise<void>;
  /** Host removes; if omitted, editor removes locally via onChange. */
  onDeleteFeature?: (id: string) => void | Promise<void>;
  initialCamera?: {
    latitude: number;
    longitude: number;
    zoom?: number;
  };
  editable?: boolean;
  showSaveButton?: boolean;
};

function nextZIndex(geometries: MapGeometry[], overlays: MapImageOverlay[]): number {
  const all = [
    ...geometries.map(g => g.zIndex),
    ...overlays.map(o => o.zIndex),
  ];
  if (all.length === 0) {
    return 0;
  }
  return Math.max(...all) + 1;
}

function mapSnapshot(
  geometries: MapGeometry[],
  overlays: MapImageOverlay[],
): string {
  return JSON.stringify({ geometries, overlays });
}

export default function MapGeometryEditor({
  geometries,
  onChange,
  imageOverlays: imageOverlaysProp,
  onOverlaysChange: onOverlaysChangeProp,
  onSave,
  onDeleteFeature,
  initialCamera,
  editable = true,
  showSaveButton,
}: MapGeometryEditorProps) {
  const [mode, setMode] = useState<DrawMode>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(
    null,
  );
  const [draftVertices, setDraftVertices] = useState<Position[]>([]);
  const [coordsVisible, setCoordsVisible] = useState(false);
  const [uploadCsvVisible, setUploadCsvVisible] = useState(false);
  const [featureListVisible, setFeatureListVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(initialCamera?.zoom ?? 4.5);
  const [localOverlays, setLocalOverlays] = useState<MapImageOverlay[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    mapSnapshot(geometries, imageOverlaysProp ?? []),
  );
  const [inspectorMinimized, setInspectorMinimized] = useState(false);

  const overlays = imageOverlaysProp ?? localOverlays;
  const setOverlays = onOverlaysChangeProp ?? setLocalOverlays;

  const selected: MapFeature | null = useMemo(() => {
    const geom = geometries.find(g => g.id === selectedId);
    if (geom) {
      return geom;
    }
    return overlays.find(o => o.id === selectedId) ?? null;
  }, [geometries, overlays, selectedId]);

  const isDirty = useMemo(
    () => mapSnapshot(geometries, overlays) !== savedSnapshot,
    [geometries, overlays, savedSnapshot],
  );
  const canPersist = showSaveButton ?? Boolean(onSave);
  const shouldShowSave = canPersist && isDirty;
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const featureCount = geometries.length + overlays.length;

  const upsertGeometry = (geometry: MapGeometry) => {
    const index = geometries.findIndex(g => g.id === geometry.id);
    if (index < 0) {
      onChange([...geometries, geometry]);
      return;
    }
    const next = [...geometries];
    next[index] = geometry;
    onChange(next);
  };

  const upsertOverlay = (overlay: MapImageOverlay) => {
    const index = overlays.findIndex(o => o.id === overlay.id);
    if (index < 0) {
      setOverlays([...overlays, overlay]);
      return;
    }
    const next = [...overlays];
    next[index] = overlay;
    setOverlays(next);
  };

  const upsertFeature = (feature: MapFeature) => {
    if (isImageOverlay(feature)) {
      upsertOverlay(feature);
    } else {
      upsertGeometry(feature);
    }
  };

  const handleAddImageOverlay = async () => {
    if (!editable) {
      return;
    }
    const uri = await pickImageFile();
    if (!uri) {
      return;
    }
    const centerLng = initialCamera?.longitude ?? 78.6569;
    const centerLat = initialCamera?.latitude ?? 22.9734;
    const overlay: MapImageOverlay = {
      id: createMapGeometryId(),
      kind: 'ImageOverlay',
      imageUri: uri,
      bounds: defaultOverlayBounds(centerLng, centerLat, zoom),
      rotation: 0,
      opacity: DEFAULT_IMAGE_OVERLAY_OPACITY,
      zIndex: nextZIndex(geometries, overlays),
      label: '',
      visible: true,
    };
    setOverlays([...overlays, overlay]);
    setInspectorMinimized(false);
    setSelectedId(overlay.id);
    setMode('select');
    Toast.show({ type: 'success', text1: 'Image overlay added' });
  };

  const createPoint = (longitude: number, latitude: number) => {
    const id = createMapGeometryId();
    const geometry: MapGeometry = {
      id,
      kind: 'Point',
      featureType: null,
      coordinates: pointCoordinatesFromLngLat(longitude, latitude),
      color: DEFAULT_GEOMETRY_COLOR,
      opacity: getDefaultOpacity('Point'),
      zIndex: nextZIndex(geometries, overlays),
      label: '',
      visible: true,
    };
    onChange([...geometries, geometry]);
    setInspectorMinimized(true);
    setSelectedId(id);
    return geometry;
  };

  const finishDraft = () => {
    if (mode === 'LineString' && draftVertices.length >= 2) {
      const id = createMapGeometryId();
      const geometry: MapGeometry = {
        id,
        kind: 'LineString',
        featureType: null,
        coordinates: lineCoordinatesFromVertices(draftVertices),
        color: DEFAULT_GEOMETRY_COLOR,
        opacity: getDefaultOpacity('LineString'),
        zIndex: nextZIndex(geometries, overlays),
        label: '',
        visible: true,
      };
      onChange([...geometries, geometry]);
      setInspectorMinimized(false);
      setSelectedId(id);
      setDraftVertices([]);
      return;
    }
    if (mode === 'Polygon' && draftVertices.length >= 3) {
      const id = createMapGeometryId();
      const geometry: MapGeometry = {
        id,
        kind: 'Polygon',
        featureType: null,
        coordinates: polygonCoordinatesFromVertices(draftVertices),
        color: getFeatureTypeMeta('land_parcel').defaultColor,
        opacity: getDefaultOpacity('Polygon'),
        zIndex: nextZIndex(geometries, overlays),
        label: '',
        visible: true,
      };
      onChange([...geometries, geometry]);
      setInspectorMinimized(false);
      setSelectedId(id);
      setDraftVertices([]);
      return;
    }
    Toast.show({
      type: 'info',
      text1: 'Not enough vertices',
      text2:
        mode === 'Polygon'
          ? 'Polygons need at least 3 points'
          : 'Lines need at least 2 points',
    });
  };

  const handleMapPress = (longitude: number, latitude: number) => {
    if (!editable) {
      return;
    }
    if (mode === 'select') {
      const selectedGeom =
        selectedId != null
          ? geometries.find(g => g.id === selectedId)
          : undefined;
      if (
        selectedGeom &&
        (selectedGeom.kind === 'LineString' ||
          selectedGeom.kind === 'Polygon') &&
        selectedVertexIndex != null
      ) {
        const vertices = getEditableVertices(selectedGeom);
        if (
          selectedVertexIndex < 0 ||
          selectedVertexIndex >= vertices.length
        ) {
          setSelectedVertexIndex(null);
          return;
        }

        // Lines: tap with the start selected prepends (extend before start).
        // Otherwise insert after the selected vertex (between it and the next,
        // or after the end when the last vertex is selected).
        const insertAt =
          selectedGeom.kind === 'LineString' && selectedVertexIndex === 0
            ? 0
            : selectedVertexIndex + 1;
        const updated = insertGeometryVertex(
          selectedGeom,
          insertAt,
          longitude,
          latitude,
        );
        upsertGeometry(updated);
        setSelectedVertexIndex(insertAt);
        setInspectorMinimized(false);
        return;
      }
      setSelectedId(null);
      setSelectedVertexIndex(null);
      return;
    }
    if (mode === 'Point') {
      createPoint(longitude, latitude);
      return;
    }
    if (mode === 'LineString' || mode === 'Polygon') {
      setDraftVertices(prev => [...prev, [longitude, latitude]]);
      setSelectedId(null);
      setSelectedVertexIndex(null);
    }
  };

  const handleModeChange = (next: DrawMode) => {
    if (draftVertices.length > 0 && next !== mode) {
      setDraftVertices([]);
    }
    setSelectedVertexIndex(null);
    setMode(next);
    if (next !== 'select') {
      setSelectedId(null);
    }
  };

  const handleCoordinateConfirm = (latitude: number, longitude: number) => {
    setCoordsVisible(false);
    if (!editable) {
      return;
    }
    if (mode === 'Point' || mode === 'select') {
      if (mode === 'select') {
        setMode('Point');
      }
      createPoint(longitude, latitude);
      return;
    }
    setDraftVertices(prev => [...prev, [longitude, latitude]]);
  };

  const handleImportCsv = async () => {
    if (!editable) {
      return;
    }
    const positions = await pickAndParseCsvCoordinates();
    if (!positions || positions.length === 0) {
      return;
    }

    setUploadCsvVisible(false);

    const importMode: DrawMode =
      mode === 'select' ? 'Point' : mode === 'Point' ? 'Point' : mode;

    if (importMode === 'Point') {
      let z = nextZIndex(geometries, overlays);
      const created: MapGeometry[] = positions.map(([lng, lat]) => {
        const geometry: MapGeometry = {
          id: createMapGeometryId(),
          kind: 'Point',
          featureType: null,
          coordinates: pointCoordinatesFromLngLat(lng, lat),
          color: DEFAULT_GEOMETRY_COLOR,
          opacity: getDefaultOpacity('Point'),
          zIndex: z,
          label: '',
          visible: true,
        };
        z += 1;
        return geometry;
      });
      onChange([...geometries, ...created]);
      setInspectorMinimized(true);
      setSelectedId(created[created.length - 1]?.id ?? null);
      Toast.show({
        type: 'success',
        text1: `Added ${created.length} point(s)`,
      });
      return;
    }

    if (importMode === 'LineString') {
      if (positions.length < 2) {
        Toast.show({
          type: 'error',
          text1: 'Need at least 2 points for a line',
        });
        return;
      }
      const id = createMapGeometryId();
      const geometry: MapGeometry = {
        id,
        kind: 'LineString',
        featureType: null,
        coordinates: lineCoordinatesFromVertices(positions),
        color: DEFAULT_GEOMETRY_COLOR,
        opacity: getDefaultOpacity('LineString'),
        zIndex: nextZIndex(geometries, overlays),
        label: '',
        visible: true,
      };
      onChange([...geometries, geometry]);
      setInspectorMinimized(false);
      setSelectedId(id);
      Toast.show({ type: 'success', text1: 'Line imported from CSV' });
      return;
    }

    if (positions.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Need at least 3 points for a polygon',
      });
      return;
    }
    const id = createMapGeometryId();
    const geometry: MapGeometry = {
      id,
      kind: 'Polygon',
      featureType: null,
      coordinates: polygonCoordinatesFromVertices(positions),
      color: getFeatureTypeMeta('land_parcel').defaultColor,
      opacity: getDefaultOpacity('Polygon'),
      zIndex: nextZIndex(geometries, overlays),
      label: '',
      visible: true,
    };
    onChange([...geometries, geometry]);
    setInspectorMinimized(false);
    setSelectedId(id);
    Toast.show({ type: 'success', text1: 'Polygon imported from CSV' });
  };

  const handleDeleteById = async (id: string) => {
    const overlay = overlays.find(o => o.id === id);
    if (overlay) {
      setOverlays(overlays.filter(o => o.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedVertexIndex(null);
      }
      return;
    }
    const nextGeometries = geometries.filter(g => g.id !== id);
    if (onDeleteFeature) {
      await onDeleteFeature(id);
      // Host persists deletes immediately — treat as clean.
      setSavedSnapshot(mapSnapshot(nextGeometries, overlays));
    } else {
      onChange(nextGeometries);
    }
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedVertexIndex(null);
    }
  };

  const handleDelete = async () => {
    if (!selected) {
      return;
    }
    await handleDeleteById(selected.id);
  };

  const handleToggleVisibility = (id: string) => {
    const geom = geometries.find(g => g.id === id);
    if (geom) {
      upsertGeometry({
        ...geom,
        visible: !isFeatureVisible(geom),
      });
      return;
    }
    const overlay = overlays.find(o => o.id === id);
    if (overlay) {
      upsertOverlay({
        ...overlay,
        visible: !isFeatureVisible(overlay),
      });
    }
  };

  const handleSelectFromList = (id: string) => {
    const geom = geometries.find(g => g.id === id);
    if (geom && !isFeatureVisible(geom)) {
      upsertGeometry({ ...geom, visible: true });
    }
    const overlay = overlays.find(o => o.id === id);
    if (overlay && !isFeatureVisible(overlay)) {
      upsertOverlay({ ...overlay, visible: true });
    }
    setSelectedId(id);
    setSelectedVertexIndex(null);
    setMode('select');
    setDraftVertices([]);
    setInspectorMinimized(false);
    setFeatureListVisible(false);
  };

  const handleMoveVertex = (
    geometryId: string,
    vertexIndex: number,
    longitude: number,
    latitude: number,
  ) => {
    if (!editable) {
      return;
    }
    const target = geometries.find(g => g.id === geometryId);
    if (!target) {
      return;
    }
    const updated = updateGeometryVertex(
      target,
      vertexIndex,
      longitude,
      latitude,
    );
    upsertGeometry(updated);
  };

  const handleInsertVertex = (
    geometryId: string,
    insertAtIndex: number,
    longitude: number,
    latitude: number,
  ) => {
    if (!editable) {
      return;
    }
    const target = geometries.find(g => g.id === geometryId);
    if (!target) {
      return;
    }
    const updated = insertGeometryVertex(
      target,
      insertAtIndex,
      longitude,
      latitude,
    );
    upsertGeometry(updated);
    setSelectedVertexIndex(insertAtIndex);
    setInspectorMinimized(false);
    setSelectedId(geometryId);
    setMode('select');
  };

  const handleDeleteVertex = () => {
    if (!editable || selectedId == null || selectedVertexIndex == null) {
      return;
    }
    const target = geometries.find(g => g.id === selectedId);
    if (
      !target ||
      (target.kind !== 'LineString' && target.kind !== 'Polygon')
    ) {
      return;
    }
    const updated = deleteGeometryVertex(target, selectedVertexIndex);
    if (!updated) {
      Toast.show({
        type: 'info',
        text1: 'Cannot delete point',
        text2:
          target.kind === 'Polygon'
            ? 'Polygons need at least 3 points'
            : 'Lines need at least 2 points',
      });
      return;
    }
    upsertGeometry(updated);
    const nextCount = getEditableVertices(updated).length;
    setSelectedVertexIndex(
      nextCount === 0
        ? null
        : Math.min(selectedVertexIndex, nextCount - 1),
    );
  };

  const canDeleteSelectedVertex = useMemo(() => {
    if (selectedId == null || selectedVertexIndex == null) {
      return false;
    }
    const target = geometries.find(g => g.id === selectedId);
    if (
      !target ||
      (target.kind !== 'LineString' && target.kind !== 'Polygon')
    ) {
      return false;
    }
    return (
      getEditableVertices(target).length >
      minEditableVertexCount(target.kind)
    );
  }, [geometries, selectedId, selectedVertexIndex]);

  const handleMoveDraftVertex = (
    vertexIndex: number,
    longitude: number,
    latitude: number,
  ) => {
    if (!editable) {
      return;
    }
    setDraftVertices(prev => {
      if (vertexIndex < 0 || vertexIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      next[vertexIndex] = [longitude, latitude];
      return next;
    });
  };

  const handleInsertDraftVertex = (
    insertAtIndex: number,
    longitude: number,
    latitude: number,
  ) => {
    if (!editable) {
      return;
    }
    setDraftVertices(prev => {
      if (insertAtIndex < 0 || insertAtIndex > prev.length) {
        return prev;
      }
      const next = [...prev];
      next.splice(insertAtIndex, 0, [longitude, latitude]);
      return next;
    });
  };

  const handleSave = async () => {
    if (!onSave) {
      return;
    }
    setSaving(true);
    try {
      await onSave(geometries, overlays);
      setSavedSnapshot(mapSnapshot(geometries, overlays));
      Toast.show({ type: 'success', text1: 'Map saved' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const modeHint =
    mode === 'Point'
      ? 'Tap the map to place a point'
      : mode === 'LineString'
        ? 'Tap to draw a line'
        : mode === 'Polygon'
          ? 'Tap to draw a polygon'
          : null;

  return (
    <View
      style={[
        styles.root,
        !shouldShowSave && {
          paddingBottom: Math.max(insets.bottom, theme.gap(0.5)),
        },
      ]}>
      <DrawToolbar
        mode={mode}
        onModeChange={handleModeChange}
        draftVertexCount={draftVertices.length}
        editable={editable}
        onUndoVertex={() => setDraftVertices(prev => prev.slice(0, -1))}
        onFinishShape={finishDraft}
        onOpenCoordinateEntry={() => setCoordsVisible(true)}
        onOpenCsvImport={() => setUploadCsvVisible(true)}
        onAddImageOverlay={handleAddImageOverlay}
        onOpenFeatureList={() => setFeatureListVisible(true)}
        selectedVertexIndex={selectedVertexIndex}
        canDeleteVertex={canDeleteSelectedVertex}
        onDeleteVertex={handleDeleteVertex}
      />

      <View style={styles.mapStage}>
        <MapCanvas
          geometries={geometries}
          imageOverlays={overlays}
          selectedId={selectedId}
          selectedVertexIndex={selectedVertexIndex}
          mode={mode}
          draftVertices={draftVertices}
          initialLatitude={initialCamera?.latitude}
          initialLongitude={initialCamera?.longitude}
          initialZoom={initialCamera?.zoom}
          editable={editable}
          onMapPress={handleMapPress}
          onSelectFeature={id => {
            setInspectorMinimized(false);
            if (id !== selectedId) {
              setSelectedVertexIndex(null);
            }
            setSelectedId(id);
            if (id) {
              setMode('select');
              setDraftVertices([]);
            }
          }}
          onSelectVertex={index => {
            setSelectedVertexIndex(index);
          }}
          onMoveVertex={handleMoveVertex}
          onInsertVertex={handleInsertVertex}
          onMoveDraftVertex={handleMoveDraftVertex}
          onInsertDraftVertex={handleInsertDraftVertex}
          onUpdateOverlay={upsertOverlay}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        <Pressable
          onPress={() => setFeatureListVisible(true)}
          style={styles.featureBadge}
          accessibilityRole="button"
          accessibilityLabel={`${featureCount} features, open list`}>
          <Layers size={12} color={theme.colors.secondary} />
          <Text style={styles.featureBadgeText}>
            {featureCount} feature{featureCount === 1 ? '' : 's'}
          </Text>
        </Pressable>

        {modeHint && draftVertices.length === 0 && !selected ? (
          <View style={styles.modeHint} pointerEvents="none">
            <Text style={styles.modeHintText}>{modeHint}</Text>
          </View>
        ) : null}

        {selected && !featureListVisible ? (
          <FeatureInspector
            feature={selected}
            editable={editable}
            onChange={next => upsertFeature(next)}
            onDelete={handleDelete}
            onClose={() => {
              setSelectedId(null);
              setSelectedVertexIndex(null);
            }}
            bottomInset={shouldShowSave && editable ? 0 : undefined}
            initialMinimized={inspectorMinimized}
          />
        ) : null}

        <FeatureListSheet
          visible={featureListVisible}
          geometries={geometries}
          imageOverlays={overlays}
          selectedId={selectedId}
          editable={editable}
          onClose={() => setFeatureListVisible(false)}
          onSelect={handleSelectFromList}
          onToggleVisibility={handleToggleVisibility}
          onDelete={id => {
            void handleDeleteById(id);
          }}
          bottomInset={shouldShowSave && editable ? 0 : undefined}
        />
      </View>

      {shouldShowSave && editable ? (
        <View
          style={[
            styles.saveDock,
            { paddingBottom: Math.max(insets.bottom, theme.gap(1)) },
          ]}>
          <Button
            title={saving ? 'Saving…' : 'Save'}
            icon={Save}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            variant="secondary"
            size="sm"
            style={styles.saveButton}
          />
        </View>
      ) : null}

      <CoordinateEntrySheet
        visible={coordsVisible}
        onClose={() => setCoordsVisible(false)}
        onConfirm={handleCoordinateConfirm}
      />

      <UploadCsvSheet
        visible={uploadCsvVisible}
        onClose={() => setUploadCsvVisible(false)}
        onUpload={handleImportCsv}
      />
    </View>
  );
}

export type { MapGeometry, MapImageOverlay, DrawMode };

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    gap: theme.gap(0.75),
  },
  mapStage: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  featureBadge: {
    position: 'absolute',
    top: theme.gap(1),
    left: theme.gap(1),
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.gap(1.125),
    paddingVertical: theme.gap(0.625),
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  featureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modeHint: {
    position: 'absolute',
    top: theme.gap(5),
    left: theme.gap(1),
    right: theme.gap(1),
    zIndex: 4,
    alignItems: 'flex-start',
  },
  modeHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: theme.gap(1.125),
    paddingVertical: theme.gap(0.5),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  saveDock: {
    paddingHorizontal: theme.gap(1.5),
    paddingTop: theme.gap(0.75),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
  },
  saveButton: {
    width: '100%',
    borderRadius: 10,
    minHeight: 40,
  },
}));
