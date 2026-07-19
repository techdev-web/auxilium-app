import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { profileDetails } from '../constants/urls';
import { authFetch } from '../services/api';
import { clearAccessToken } from '../services/authStorage';
import type { ProfileDetails } from '../types/profile';

type ProfileNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function formatValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

function getInitials(first?: string | null, last?: string | null) {
  const firstInitial = first?.trim()?.[0] ?? '';
  const lastInitial = last?.trim()?.[0] ?? '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();
  return initials || '?';
}

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{formatValue(value)}</Text>
    </View>
  );
}

type ActionRowProps = {
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
};

function ActionRow({ label, subtitle, onPress, destructive }: ActionRowProps) {
  return (
    <Pressable
      style={styles.actionRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.actionCopy}>
        <Text
          style={[styles.actionLabel, destructive && styles.actionLabelDanger]}>
          {label}
        </Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={[styles.actionChevron, destructive && styles.actionLabelDanger]}>
        ›
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetToLogin = useCallback(() => {
    const rootNavigation =
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    rootNavigation?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation]);

  const loadProfile = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await authFetch(profileDetails);
      const data = await response.json();

      if (response.status === 401) {
        resetToLogin();
        return;
      }

      if (!response.ok) {
        setError(data?.message || 'Unable to load profile');
        setProfile(null);
        return;
      }

      setProfile(data as ProfileDetails);
    } catch {
      setError('Unable to load profile. Pull to retry.');
      setProfile(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [resetToLogin]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fullName = useMemo(() => {
    const first = profile?.user?.first_name?.trim() ?? '';
    const middle = profile?.middle_name?.trim() ?? '';
    const last = profile?.user?.last_name?.trim() ?? '';
    return [first, middle, last].filter(Boolean).join(' ') || 'Your profile';
  }, [profile]);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearAccessToken();
          Toast.show({
            type: 'success',
            text1: 'Logged out',
          });
          resetToLogin();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadProfile(true)}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Profile</Text>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadProfile()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              {profile?.profile_picture_path ? (
                <Image
                  source={{ uri: profile.profile_picture_path }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {getInitials(
                      profile?.user?.first_name,
                      profile?.user?.last_name,
                    )}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{formatValue(profile?.user?.email)}</Text>
            {profile?.verification_status ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {profile.verification_status}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionBody}>
              <InfoRow label="Phone" value={profile?.user?.phone_number} />
              <InfoRow
                label="Status"
                value={profile?.user?.is_active ? 'Active' : 'Inactive'}
              />
              <InfoRow
                label="Member since"
                value={
                  profile?.user?.created_at
                    ? new Date(profile.user.created_at).toLocaleDateString()
                    : null
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company</Text>
            <View style={styles.sectionBody}>
              <InfoRow label="Company" value={profile?.company_name} />
              <InfoRow label="Company email" value={profile?.company_email_id} />
              <InfoRow label="Contact" value={profile?.company_contact_no} />
              <InfoRow label="GST" value={profile?.gst_no} />
              <InfoRow label="PAN" value={profile?.pan_no} />
              <InfoRow label="Website" value={profile?.website} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.sectionBody}>
              <InfoRow label="Address" value={profile?.address_line_1} />
              <InfoRow label="City" value={profile?.city} />
              <InfoRow label="District" value={profile?.district} />
              <InfoRow label="State" value={profile?.state} />
              <InfoRow label="PIN" value={profile?.pin_code} />
            </View>
          </View>

          {(profile?.total_experience_years != null ||
            profile?.acreageAvailable) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional</Text>
              <View style={styles.sectionBody}>
                <InfoRow
                  label="Experience"
                  value={
                    profile?.total_experience_years != null
                      ? `${profile.total_experience_years} years`
                      : null
                  }
                />
                <InfoRow
                  label="Acreage available"
                  value={profile?.acreageAvailable}
                />
                <InfoRow
                  label="Past projects"
                  value={profile?.total_past_projects_executed}
                />
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionBody}>
          <ActionRow
            label="Change password"
            subtitle="Update your account password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <View style={styles.divider} />
          <ActionRow
            label="Log out"
            subtitle="Sign out of this device"
            onPress={handleLogout}
            destructive
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.gap(3),
    gap: theme.gap(2.5),
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.gap(1.5),
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: theme.gap(2),
    gap: theme.gap(1),
  },
  avatarWrap: {
    marginBottom: theme.gap(0.5),
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  badge: {
    marginTop: theme.gap(0.5),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
    textTransform: 'capitalize',
  },
  section: {
    gap: theme.gap(1),
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
  },
  sectionBody: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(0.5),
  },
  infoRow: {
    paddingVertical: 14,
    borderBottomWidth: RNStyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  actionCopy: {
    flex: 1,
    paddingRight: theme.gap(2),
    gap: 4,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionLabelDanger: {
    color: '#C62828',
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  actionChevron: {
    fontSize: 28,
    fontWeight: '300',
    color: theme.colors.textMuted,
    marginTop: -2,
  },
  divider: {
    height: RNStyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  errorCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.gap(3),
    gap: theme.gap(1),
    alignItems: 'flex-start',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  retryButton: {
    marginTop: theme.gap(1),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryButtonText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
}));
