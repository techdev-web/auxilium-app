import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import MapGeometryEditor from '../components/MapGeometryEditor';
import type { LandGISStackParamList } from '../navigation/types';
import {
  getProject,
  updateProjectGeometries,
} from '../services/projectApi';
import { parseListingCenter } from '../services/locationApi';
import {
  normalizeMapGeometries,
  normalizeMapImageOverlays,
  type MapGeometry,
  type MapImageOverlay,
} from '../types/mapGeometry';
import type { Project } from '../types/project';

type Props = NativeStackScreenProps<
  LandGISStackParamList,
  'ProjectMapWorkspace'
>;

export default function ProjectMapWorkspaceScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const { projectId, projectTitle } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [geometries, setGeometries] = useState<MapGeometry[]>([]);
  const [imageOverlays, setImageOverlays] = useState<MapImageOverlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getProject(projectId);
      if (!next) {
        setError('Project not found');
        setProject(null);
        setGeometries([]);
        return;
      }
      setProject(next);
      setGeometries(normalizeMapGeometries(next.geometries ?? []));
      setImageOverlays(normalizeMapImageOverlays(next.imageOverlays ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const initialCamera = useMemo(() => {
    if (!project) {
      return undefined;
    }
    const fromListing = parseListingCenter(project.listingCenter);
    if (fromListing) {
      return {
        latitude: fromListing.latitude,
        longitude: fromListing.longitude,
        zoom: 13,
      };
    }
    const fromSubstation = parseListingCenter(project.substationCoordinates);
    if (fromSubstation) {
      return {
        latitude: fromSubstation.latitude,
        longitude: fromSubstation.longitude,
        zoom: 13,
      };
    }
    return undefined;
  }, [project]);

  const handleSave = useCallback(
    async (nextGeoms: MapGeometry[], nextOverlays: MapImageOverlay[]) => {
      await updateProjectGeometries(projectId, nextGeoms, nextOverlays);
      setGeometries(nextGeoms);
      setImageOverlays(nextOverlays);
    },
    [projectId],
  );

  const handleDeleteFeature = useCallback(
    async (id: string) => {
      const next = geometries.filter(g => g.id !== id);
      setGeometries(next);
      await updateProjectGeometries(projectId, next, imageOverlays);
    },
    [geometries, imageOverlays, projectId],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeft size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {projectTitle}
          </Text>
          <Text style={styles.subtitle}>Map workspace</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.secondary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => {
              Toast.hide();
              load();
            }}
            style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <MapGeometryEditor
          geometries={geometries}
          onChange={setGeometries}
          imageOverlays={imageOverlays}
          onOverlaysChange={setImageOverlays}
          onSave={handleSave}
          onDeleteFeature={handleDeleteFeature}
          initialCamera={initialCamera}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(0.25),
    paddingHorizontal: theme.gap(1),
    paddingTop: theme.gap(0.5),
    paddingBottom: theme.gap(0.5),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 0,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.gap(1.5),
    paddingHorizontal: theme.gap(3),
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
}));
