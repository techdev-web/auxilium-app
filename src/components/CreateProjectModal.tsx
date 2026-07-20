import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Map, MapPin } from 'lucide-react-native';
import Button from './Button';
import MapCoordinatePicker from './MapCoordinatePicker';
import Modal from './Modal';
import SearchableSelect, { type SelectOption } from './SearchableSelect';
import { UniTextInput } from './UniTextInput';
import { forwardGeocodeCoordinates } from '../services/geocode';
import {
  fetchDistricts,
  fetchStates,
  formatListingCenter,
  parseListingCenter,
  resolveLocationFromCoordinates,
  searchSubDistricts,
  searchVillages,
  villageCoordinates,
} from '../services/locationApi';
import {
  getCurrentCoordinates,
  requestLocationPermission,
  type LocationPermissionStatus,
} from '../services/locationPermission';
import type {
  District,
  State,
  SubDistrict,
  Village,
} from '../types/location';
import type { Project } from '../types/project';

export type CreateProjectFormValues = {
  title: string;
  listingCenter: string;
  substationCoordinates: string;
  stateId: number | null;
  districtId: number | null;
  subDistrictId: number | null;
  villageId: number | null;
  stateName: string | null;
  districtName: string | null;
  subDistrictName: string | null;
  villageName: string | null;
};

type CoordinateMode = 'listing' | 'substation';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (values: CreateProjectFormValues) => void | Promise<void>;
  /** When set, modal opens in edit mode and hydrates from this project. */
  project?: Project | null;
};

type LocationSource = 'idle' | 'coords' | 'cascade';

const COORD_RESOLVE_DEBOUNCE_MS = 700;

export default function CreateProjectModal({
  visible,
  onClose,
  onSave,
  project = null,
}: Props) {
  const isEditing = project != null;
  const { theme } = useUnistyles();
  const [title, setTitle] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [coordinateMode, setCoordinateMode] =
    useState<CoordinateMode>('listing');
  const [locationStatus, setLocationStatus] =
    useState<LocationPermissionStatus | null>(null);

  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null,
  );
  const [selectedSubDistrict, setSelectedSubDistrict] =
    useState<SubDistrict | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  const locationSourceRef = useRef<LocationSource>('idle');
  const resolveSeqRef = useRef(0);
  const hydratedProjectIdRef = useRef<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setCoordinates('');
    setCoordinateMode('listing');
    setMapPickerVisible(false);
    setLocationStatus(null);
    setDistricts([]);
    setSubDistricts([]);
    setVillages([]);
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedSubDistrict(null);
    setSelectedVillage(null);
    locationSourceRef.current = 'idle';
    resolveSeqRef.current += 1;
    hydratedProjectIdRef.current = null;
  }, []);

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      hydratedProjectIdRef.current = null;
      return;
    }
    if (!project) {
      resetForm();
    }
  }, [visible, project, resetForm]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    setLocationStatus(null);
    setLoadingStates(true);

    requestLocationPermission().then(status => {
      if (!cancelled) {
        setLocationStatus(status);
      }
    });

    fetchStates()
      .then(data => {
        if (!cancelled) {
          setStates(data.filter(s => s.is_active !== false));
        }
      })
      .catch(() => {
        if (!cancelled) {
          Toast.show({
            type: 'error',
            text1: 'Unable to load states',
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStates(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Hydrate form when editing an existing project.
  useEffect(() => {
    if (!visible || !project || !states.length) {
      return;
    }
    if (hydratedProjectIdRef.current === project.id) {
      return;
    }
    hydratedProjectIdRef.current = project.id;

    let cancelled = false;

    const hydrate = async () => {
      locationSourceRef.current = 'cascade';
      setTitle(project.title);

      const hasListing = Boolean(project.listingCenter?.trim());
      const hasSubstation = Boolean(project.substationCoordinates?.trim());
      setCoordinateMode(
        hasSubstation && !hasListing ? 'substation' : 'listing',
      );
      setCoordinates(
        (hasListing
          ? project.listingCenter
          : project.substationCoordinates
        ).trim(),
      );

      const state =
        states.find(s => s.state_id === project.stateId) ??
        (project.stateName
          ? {
              state_id: project.stateId,
              state_name: project.stateName,
              is_active: true,
            }
          : null);
      setSelectedState(state);

      if (!state) {
        return;
      }

      setLoadingDistricts(true);
      try {
        const nextDistricts = await fetchDistricts(state.state_id);
        if (cancelled) {
          return;
        }
        const list = (nextDistricts ?? []).filter(
          d => d && d.is_active !== false,
        );
        setDistricts(list);
        const district =
          list.find(d => d.district_id === project.districtId) ??
          (project.districtName
            ? {
                district_id: project.districtId,
                district_name: project.districtName,
                state_id: project.stateId,
                is_active: true,
              }
            : null);
        setSelectedDistrict(district);

        if (!district) {
          return;
        }

        setLoadingSubDistricts(true);
        try {
          const nextSubs = await searchSubDistricts({
            districtId: district.district_id,
            limit: 50,
          });
          if (cancelled) {
            return;
          }
          const subs = (nextSubs ?? []).filter(Boolean);
          const subDistrict =
            (project.subDistrictId != null
              ? subs.find(s => s.id === project.subDistrictId)
              : null) ??
            (project.subDistrictId != null && project.subDistrictName
              ? {
                  id: project.subDistrictId,
                  name: project.subDistrictName,
                  district_id: district.district_id,
                }
              : null);
          setSubDistricts(
            subDistrict && !subs.some(s => s.id === subDistrict.id)
              ? [subDistrict, ...subs]
              : subs,
          );
          setSelectedSubDistrict(subDistrict);

          if (!subDistrict) {
            return;
          }

          setLoadingVillages(true);
          try {
            const nextVillages = await searchVillages({
              subDistrictId: subDistrict.id,
              limit: 50,
            });
            if (cancelled) {
              return;
            }
            const villageList = (nextVillages ?? []).filter(Boolean);
            const village =
              (project.villageId != null
                ? villageList.find(v => v.id === project.villageId)
                : null) ??
              (project.villageId != null && project.villageName
                ? {
                    id: project.villageId,
                    name: project.villageName,
                    sub_district_id: subDistrict.id,
                  }
                : null);
            setVillages(
              village && !villageList.some(v => v.id === village.id)
                ? [village, ...villageList]
                : villageList,
            );
            setSelectedVillage(village);
          } catch {
            if (!cancelled && project.villageId != null && project.villageName) {
              const village = {
                id: project.villageId,
                name: project.villageName,
                sub_district_id: subDistrict.id,
              };
              setVillages([village]);
              setSelectedVillage(village);
            }
          } finally {
            if (!cancelled) {
              setLoadingVillages(false);
            }
          }
        } catch {
          if (
            !cancelled &&
            project.subDistrictId != null &&
            project.subDistrictName
          ) {
            const subDistrict = {
              id: project.subDistrictId,
              name: project.subDistrictName,
              district_id: district.district_id,
            };
            setSubDistricts([subDistrict]);
            setSelectedSubDistrict(subDistrict);
          }
        } finally {
          if (!cancelled) {
            setLoadingSubDistricts(false);
          }
        }
      } catch {
        if (!cancelled) {
          Toast.show({ type: 'error', text1: 'Unable to load project location' });
        }
      } finally {
        if (!cancelled) {
          setLoadingDistricts(false);
          // Keep cascade briefly so opening coords don't reverse-overwrite fields.
          setTimeout(() => {
            if (locationSourceRef.current === 'cascade') {
              locationSourceRef.current = 'idle';
            }
          }, COORD_RESOLVE_DEBOUNCE_MS + 50);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [visible, project, states]);

  const applyResolvedLocation = useCallback(
    async (latitude: number, longitude: number) => {
      const seq = ++resolveSeqRef.current;
      setResolvingLocation(true);
      locationSourceRef.current = 'coords';

      try {
        const resolved = await resolveLocationFromCoordinates(
          latitude,
          longitude,
        );
        if (seq !== resolveSeqRef.current) {
          return;
        }

        if (!resolved?.state) {
          Toast.show({
            type: 'info',
            text1: 'Location found',
            text2: 'Could not match state / village in the directory',
          });
          setSelectedState(null);
          setSelectedDistrict(null);
          setSelectedSubDistrict(null);
          setSelectedVillage(null);
          setDistricts([]);
          setSubDistricts([]);
          setVillages([]);
          return;
        }

        const { state, district, subDistrict, village } = resolved;

        setSelectedState(state);
        setSelectedDistrict(district);
        setSelectedSubDistrict(subDistrict);
        setSelectedVillage(village);

        setLoadingDistricts(true);
        try {
          const nextDistricts = await fetchDistricts(state.state_id);
          if (seq !== resolveSeqRef.current) {
            return;
          }
          setDistricts(
            (nextDistricts ?? []).filter(d => d && d.is_active !== false),
          );
        } catch {
          if (seq === resolveSeqRef.current) {
            setDistricts([]);
          }
        } finally {
          if (seq === resolveSeqRef.current) {
            setLoadingDistricts(false);
          }
        }

        if (!district) {
          setSubDistricts([]);
          setVillages([]);
          Toast.show({
            type: 'info',
            text1: 'Partial match',
            text2: 'State matched — select district, sub-district and village',
          });
          return;
        }

        setLoadingSubDistricts(true);
        try {
          const nextSubs = await searchSubDistricts({
            districtId: district.district_id,
            limit: 50,
          });
          if (seq !== resolveSeqRef.current) {
            return;
          }
          const subs = (nextSubs ?? []).filter(Boolean);
          setSubDistricts(
            subDistrict && !subs.some(s => s.id === subDistrict.id)
              ? [subDistrict, ...subs]
              : subs,
          );
        } catch {
          if (seq === resolveSeqRef.current) {
            setSubDistricts(subDistrict ? [subDistrict] : []);
          }
        } finally {
          if (seq === resolveSeqRef.current) {
            setLoadingSubDistricts(false);
          }
        }

        if (!subDistrict) {
          setVillages([]);
          Toast.show({
            type: 'info',
            text1: 'Partial match',
            text2: 'Select sub-district and village to continue',
          });
          return;
        }

        setLoadingVillages(true);
        try {
          const nextVillages = await searchVillages({
            subDistrictId: subDistrict.id,
            limit: 50,
          });
          if (seq !== resolveSeqRef.current) {
            return;
          }
          const list = (nextVillages ?? []).filter(Boolean);
          setVillages(
            village && !list.some(v => v.id === village.id)
              ? [village, ...list]
              : list,
          );
        } catch {
          if (seq === resolveSeqRef.current) {
            setVillages(village ? [village] : []);
          }
        } finally {
          if (seq === resolveSeqRef.current) {
            setLoadingVillages(false);
          }
        }

        if (!village) {
          Toast.show({
            type: 'info',
            text1: 'Partial match',
            text2: 'Select a village to continue',
          });
        }
      } catch {
        if (seq === resolveSeqRef.current) {
          Toast.show({
            type: 'error',
            text1: 'Could not resolve location',
            text2: 'Check the coordinates and try again',
          });
        }
      } finally {
        if (seq === resolveSeqRef.current) {
          setResolvingLocation(false);
        }
      }
    },
    [],
  );

  // Debounced resolve when listing center is typed / set from GPS.
  useEffect(() => {
    if (!visible) {
      return;
    }

    const parsed = parseListingCenter(coordinates);
    if (!parsed) {
      return;
    }

    const handle = setTimeout(() => {
      // Skip if cascade just wrote these coords.
      if (locationSourceRef.current === 'cascade') {
        locationSourceRef.current = 'idle';
        return;
      }
      applyResolvedLocation(parsed.latitude, parsed.longitude);
    }, COORD_RESOLVE_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [coordinates, visible, applyResolvedLocation]);

  const fillListingCenterFromVillage = useCallback(
    async (
      village: Village,
      subDistrict: SubDistrict | null,
      district: District | null,
      state: State | null,
    ) => {
      const fromVillage = villageCoordinates(village);
      if (fromVillage) {
        locationSourceRef.current = 'cascade';
        setCoordinates(
          formatListingCenter(fromVillage.latitude, fromVillage.longitude),
        );
        return;
      }

      const parts = [
        village.name,
        subDistrict?.name,
        district?.district_name,
        state?.state_name,
        'India',
      ].filter(Boolean);
      setResolvingLocation(true);
      try {
        const coords = await forwardGeocodeCoordinates(parts.join(', '));
        if (!coords) {
          Toast.show({
            type: 'info',
            text1: 'Village selected',
            text2: 'Could not determine village coordinates automatically',
          });
          return;
        }
        locationSourceRef.current = 'cascade';
        setCoordinates(
          formatListingCenter(coords.latitude, coords.longitude),
        );
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Unable to geocode village',
        });
      } finally {
        setResolvingLocation(false);
      }
    },
    [],
  );

  const handleUseCurrentLocation = async () => {
    setFetchingCurrent(true);
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) {
        const status = await requestLocationPermission();
        setLocationStatus(status);
        Toast.show({
          type: 'error',
          text1: 'Location unavailable',
          text2: 'Allow location access or enter coordinates manually',
        });
        return;
      }
      setLocationStatus('granted');
      locationSourceRef.current = 'coords';
      setCoordinates(
        formatListingCenter(coords.latitude, coords.longitude),
      );
    } finally {
      setFetchingCurrent(false);
    }
  };

  const handleSelectState = async (option: SelectOption) => {
    const state = states.find(s => s.state_id === option.id) ?? null;
    locationSourceRef.current = 'cascade';
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedSubDistrict(null);
    setSelectedVillage(null);
    setDistricts([]);
    setSubDistricts([]);
    setVillages([]);
    setCoordinates('');

    if (!state) {
      return;
    }

    setLoadingDistricts(true);
    try {
      const data = await fetchDistricts(state.state_id);
      setDistricts((data ?? []).filter(d => d && d.is_active !== false));
    } catch {
      setDistricts([]);
      Toast.show({ type: 'error', text1: 'Unable to load districts' });
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleSelectDistrict = async (option: SelectOption) => {
    const district = districts.find(d => d.district_id === option.id) ?? null;
    locationSourceRef.current = 'cascade';
    setSelectedDistrict(district);
    setSelectedSubDistrict(null);
    setSelectedVillage(null);
    setSubDistricts([]);
    setVillages([]);
    setCoordinates('');

    if (!district) {
      return;
    }

    setLoadingSubDistricts(true);
    try {
      const data = await searchSubDistricts({
        districtId: district.district_id,
        limit: 50,
      });
      setSubDistricts((data ?? []).filter(Boolean));
    } catch {
      setSubDistricts([]);
      Toast.show({ type: 'error', text1: 'Unable to load sub-districts' });
    } finally {
      setLoadingSubDistricts(false);
    }
  };

  const handleSelectSubDistrict = async (option: SelectOption) => {
    const subDistrict = subDistricts.find(s => s.id === option.id) ?? null;
    locationSourceRef.current = 'cascade';
    setSelectedSubDistrict(subDistrict);
    setSelectedVillage(null);
    setVillages([]);
    setCoordinates('');

    if (!subDistrict) {
      return;
    }

    setLoadingVillages(true);
    try {
      const data = await searchVillages({
        subDistrictId: subDistrict.id,
        limit: 50,
      });
      setVillages((data ?? []).filter(Boolean));
    } catch {
      setVillages([]);
      Toast.show({ type: 'error', text1: 'Unable to load villages' });
    } finally {
      setLoadingVillages(false);
    }
  };

  const handleSelectVillage = async (option: SelectOption) => {
    const village = villages.find(v => v.id === option.id) ?? null;
    setSelectedVillage(village);
    if (!village) {
      return;
    }
    await fillListingCenterFromVillage(
      village,
      selectedSubDistrict,
      selectedDistrict,
      selectedState,
    );
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    if (!selectedState || !selectedDistrict) {
      Toast.show({
        type: 'error',
        text1: 'Location incomplete',
        text2: 'Select at least state and district',
      });
      return;
    }

    const trimmedCoordinates = coordinates.trim();
    if (trimmedCoordinates && !parseListingCenter(trimmedCoordinates)) {
      Toast.show({
        type: 'error',
        text1:
          coordinateMode === 'substation'
            ? 'Invalid substation coordinates'
            : 'Invalid listing center',
        text2: 'Use format: latitude, longitude',
      });
      return;
    }

    setSaving(true);
    try {
      // Coordinates are optional: derive them from the selected admin area
      // when not provided so downstream detail lookups can still work.
      let resolvedCoordinates = trimmedCoordinates;
      if (!resolvedCoordinates) {
        const parts = [
          selectedVillage?.name,
          selectedSubDistrict?.name,
          selectedDistrict.district_name,
          selectedState.state_name,
          'India',
        ].filter(Boolean);
        try {
          const coords = await forwardGeocodeCoordinates(parts.join(', '));
          if (coords) {
            resolvedCoordinates = formatListingCenter(
              coords.latitude,
              coords.longitude,
            );
          }
        } catch {
          // Non-fatal: save without coordinates if geocoding fails.
        }
      }

      await onSave({
        title: trimmedTitle,
        listingCenter:
          coordinateMode === 'listing' ? resolvedCoordinates : '',
        substationCoordinates:
          coordinateMode === 'substation' ? resolvedCoordinates : '',
        stateId: selectedState.state_id,
        districtId: selectedDistrict.district_id,
        subDistrictId: selectedSubDistrict?.id ?? null,
        villageId: selectedVillage?.id ?? null,
        stateName: selectedState.state_name,
        districtName: selectedDistrict.district_name,
        subDistrictName: selectedSubDistrict?.name ?? null,
        villageName: selectedVillage?.name ?? null,
      });
      resetForm();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Unable to save project',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCoordinatesChange = (text: string) => {
    locationSourceRef.current = 'coords';
    setCoordinates(text);
  };

  const handleMapCoordinatesConfirm = (
    latitude: number,
    longitude: number,
  ) => {
    locationSourceRef.current = 'coords';
    setCoordinates(formatListingCenter(latitude, longitude));
    setMapPickerVisible(false);
  };

  const parsedCoordinates = parseListingCenter(coordinates);

  const showLocationWarning =
    locationStatus === 'denied' || locationStatus === 'unavailable';

  const stateOptions: SelectOption[] = states
    .filter(s => s != null)
    .map(s => ({
      id: s.state_id,
      label: s.state_name,
    }));
  const districtOptions: SelectOption[] = districts
    .filter(d => d != null)
    .map(d => ({
      id: d.district_id,
      label: d.district_name,
    }));
  const subDistrictOptions: SelectOption[] = subDistricts
    .filter(s => s != null)
    .map(s => ({
      id: s.id,
      label: s.name,
    }));
  const villageOptions: SelectOption[] = villages
    .filter(v => v != null)
    .map(v => ({
      id: v.id,
      label: v.name,
    }));

  return (
    <>
      <Modal
        visible={visible}
        onClose={resetAndClose}
        contentStyle={styles.modalContent}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Project' : 'Create Project'}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? 'Update project details'
              : 'Enter project details to get started'}
          </Text>

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
          <View style={styles.coordToggle}>
            <Pressable
              style={[
                styles.coordToggleOption,
                coordinateMode === 'listing' && styles.coordToggleOptionActive,
              ]}
              onPress={() => setCoordinateMode('listing')}
              accessibilityRole="button"
              accessibilityState={{ selected: coordinateMode === 'listing' }}>
              <Text
                style={[
                  styles.coordToggleText,
                  coordinateMode === 'listing' && styles.coordToggleTextActive,
                ]}>
                Listing Center
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.coordToggleOption,
                coordinateMode === 'substation' &&
                  styles.coordToggleOptionActive,
              ]}
              onPress={() => setCoordinateMode('substation')}
              accessibilityRole="button"
              accessibilityState={{
                selected: coordinateMode === 'substation',
              }}>
              <Text
                style={[
                  styles.coordToggleText,
                  coordinateMode === 'substation' &&
                    styles.coordToggleTextActive,
                ]}>
                Substation
              </Text>
            </Pressable>
          </View>
          <UniTextInput
            style={styles.input}
            value={coordinates}
            onChangeText={handleCoordinatesChange}
            placeholder="Ex: 23.723081, 90.409136"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />
          <View style={styles.locationActions}>
            <Button
              title="Use current location"
              icon={MapPin}
              variant="outline"
              size="sm"
              loading={fetchingCurrent}
              onPress={handleUseCurrentLocation}
              style={styles.locationButton}
            />
            <Button
              title="Choose on map"
              icon={Map}
              variant="outline"
              size="sm"
              onPress={() => setMapPickerVisible(true)}
              style={styles.locationButton}
            />
          </View>
        </View>

        {resolvingLocation ? (
          <View style={styles.resolvingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.resolvingText}>
              Resolving location details…
            </Text>
          </View>
        ) : null}

        <SearchableSelect
          label="State"
          placeholder="Select state"
          value={
            selectedState
              ? { id: selectedState.state_id, label: selectedState.state_name }
              : null
          }
          options={stateOptions}
          onSelect={handleSelectState}
          loading={loadingStates}
        />

        <SearchableSelect
          label="District"
          placeholder="Select district"
          value={
            selectedDistrict
              ? {
                  id: selectedDistrict.district_id,
                  label: selectedDistrict.district_name,
                }
              : null
          }
          options={districtOptions}
          onSelect={handleSelectDistrict}
          disabled={!selectedState}
          loading={loadingDistricts}
        />

        <SearchableSelect
          label="Sub-district"
          placeholder="Select sub-district"
          value={
            selectedSubDistrict
              ? { id: selectedSubDistrict.id, label: selectedSubDistrict.name }
              : null
          }
          options={subDistrictOptions}
          onSelect={handleSelectSubDistrict}
          disabled={!selectedDistrict}
          loading={loadingSubDistricts}
        />

        <SearchableSelect
          label="Village"
          placeholder="Select village"
          value={
            selectedVillage
              ? { id: selectedVillage.id, label: selectedVillage.name }
              : null
          }
          options={villageOptions}
          onSelect={handleSelectVillage}
          disabled={!selectedSubDistrict}
          loading={loadingVillages}
        />

        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={resetAndClose}
            style={styles.actionButton}
            disabled={saving}
          />
          <Button
            title={isEditing ? 'Update' : 'Save'}
            onPress={handleSave}
            style={styles.actionButton}
            loading={saving}
            disabled={resolvingLocation || fetchingCurrent || saving}
          />
        </View>
      </ScrollView>
      </Modal>
      <MapCoordinatePicker
        visible={mapPickerVisible}
        initialLatitude={parsedCoordinates?.latitude}
        initialLongitude={parsedCoordinates?.longitude}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={handleMapCoordinatesConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  modalContent: {
    maxHeight: '90%',
    paddingVertical: theme.gap(2),
  },
  scrollContent: {
    gap: theme.gap(2),
    paddingBottom: theme.gap(1),
  },
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
  coordToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.input,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coordToggleOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.input,
    alignItems: 'center',
  },
  coordToggleOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  coordToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  coordToggleTextActive: {
    color: theme.colors.textOnHeader,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(2),
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.inputText,
  },
  locationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.gap(1),
  },
  locationButton: {
    flexGrow: 1,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1),
  },
  resolvingText: {
    fontSize: 13,
    color: theme.colors.textMuted,
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
