import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, MapPinned, Pencil, Plus } from 'lucide-react-native';
import Button from '../components/Button';
import CreateProjectModal, {
  type CreateProjectFormValues,
} from '../components/CreateProjectModal';
import ProjectLocationMap from '../components/ProjectLocationMap';
import type { LandGISStackParamList } from '../navigation/types';
import {
  createProject,
  getProjects,
  updateProject,
} from '../services/projectApi';
import { parseListingCenter } from '../services/locationApi';
import type { Project } from '../types/project';

function formatProjectLocation(project: Project): string {
  return [
    project.villageName,
    project.subDistrictName,
    project.districtName,
    project.stateName,
  ]
    .filter(Boolean)
    .join(', ');
}

export default function LandGISScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const navigation =
    useNavigation<NativeStackNavigationProp<LandGISStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async () => {
    const data = await getProjects();
    setProjects(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadProjects()
      .catch(() => {
        if (!cancelled) {
          Toast.show({
            type: 'error',
            text1: 'Unable to load projects',
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProjects();
    } catch {
      Toast.show({ type: 'error', text1: 'Unable to refresh projects' });
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditingProject(null);
    setModalVisible(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProject(null);
  };

  const handleSave = async (values: CreateProjectFormValues) => {
    if (values.stateId == null || values.districtId == null) {
      throw new Error('State and district are required');
    }

    const payload = {
      title: values.title,
      listingCenter: values.listingCenter,
      substationCoordinates: values.substationCoordinates,
      stateId: values.stateId,
      districtId: values.districtId,
      subDistrictId: values.subDistrictId,
      villageId: values.villageId,
      stateName: values.stateName,
      districtName: values.districtName,
      subDistrictName: values.subDistrictName,
      villageName: values.villageName,
    };

    if (editingProject) {
      await updateProject(editingProject.id, payload);
      Toast.show({ type: 'success', text1: 'Project updated' });
    } else {
      await createProject(payload);
      Toast.show({ type: 'success', text1: 'Project saved' });
    }

    await loadProjects();
    closeModal();
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
        onPress={openCreate}
        style={styles.createButton}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading projects…</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={item => item.id}
          contentContainerStyle={
            projects.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.muted}>
                Create a project to get started with land GIS.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const coords =
              parseListingCenter(item.listingCenter) ??
              parseListingCenter(item.substationCoordinates);
            const location = formatProjectLocation(item);

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => openEdit(item)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${item.title}`}
                      style={styles.iconButton}>
                      <Pencil size={18} color={theme.colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('ProjectMapWorkspace', {
                          projectId: item.id,
                          projectTitle: item.title,
                        })
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Open map for ${item.title}`}
                      style={styles.iconButton}>
                      <MapPinned size={18} color={theme.colors.primary} />
                    </Pressable>
                  </View>
                </View>

                {location ? (
                  <View style={styles.locationRow}>
                    <MapPin size={14} color={theme.colors.textMuted} />
                    <Text style={styles.cardMeta}>{location}</Text>
                  </View>
                ) : null}

                {coords ? (
                  <ProjectLocationMap
                    latitude={coords.latitude}
                    longitude={coords.longitude}
                  />
                ) : null}

                <Text style={styles.cardMeta}>
                  Saved {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          }}
        />
      )}

      <CreateProjectModal
        visible={modalVisible}
        project={editingProject}
        onClose={closeModal}
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
    marginBottom: theme.gap(3),
  },
  list: {
    paddingBottom: theme.gap(4),
    gap: theme.gap(2),
  },
  emptyList: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.gap(1),
    paddingVertical: theme.gap(6),
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  muted: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.input,
    padding: theme.gap(2.5),
    gap: theme.gap(1),
    backgroundColor: theme.colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.gap(1),
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(0.5),
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(0.5),
  },
  cardMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
}));
