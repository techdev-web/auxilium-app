import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { listings as listingsUrl } from '../constants/urls';
import { authFetch } from '../services/api';
import type { Listing, ListingsResponse } from '../types/listing';

const PAGE_SIZE = 20;

type ListingsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Listings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatPrice(value?: string | null) {
  const num = Number(value);
  if (!value || Number.isNaN(num) || num <= 0) {
    return null;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatLocation(listing: Listing) {
  return [
    listing.village?.name,
    listing.district?.district_name,
    listing.state?.state_name,
  ]
    .filter(Boolean)
    .join(', ');
}

function getCoverImage(listing: Listing) {
  const images = listing.media?.filter(m => m.media_type === 'IMAGE') ?? [];
  return (images.find(m => m.is_primary) ?? images[0])?.media_url ?? null;
}

type ListingCardProps = {
  listing: Listing;
};

function ListingCard({ listing }: ListingCardProps) {
  const cover = getCoverImage(listing);
  const location = formatLocation(listing);
  const price = formatPrice(listing.asking_price);
  const isLease = listing.offering_type === 'LEASE';
  const tags = useMemo(() => {
    const suitable = (listing.suitable_for ?? []).map(titleCase);
    const land = (listing.land_type ?? []).map(titleCase);
    return [...suitable, ...land].slice(0, 3);
  }, [listing.suitable_for, listing.land_type]);

  return (
    <View style={styles.card}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImagePlaceholderIcon}>▦</Text>
          <Text style={styles.cardImagePlaceholderText}>No photos yet</Text>
        </View>
      )}

      <View
        style={[styles.offeringBadge, isLease ? styles.offeringLease : styles.offeringSell]}>
        <Text style={styles.offeringBadgeText}>
          {isLease ? 'For Lease' : 'For Sale'}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {listing.listing_title}
        </Text>
        {location ? (
          <Text style={styles.cardLocation} numberOfLines={1}>
            {location}
          </Text>
        ) : null}

        {tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Text style={styles.footerLabel}>Acreage</Text>
            <Text style={styles.footerValue}>
              {listing.total_acreage ? `${listing.total_acreage} ac` : '—'}
            </Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerStat}>
            <Text style={styles.footerLabel}>Asking price</Text>
            <View style={styles.priceRow}>
              <Text style={styles.footerValue}>{price ?? '—'}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ListingsScreen() {
  const navigation = useNavigation<ListingsNavigation>();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();

  const [items, setItems] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const requestIdRef = useRef(0);

  const resetToLogin = useCallback(() => {
    const rootNavigation =
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    rootNavigation?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation]);

  const fetchPage = useCallback(
    async (page: number, query: string, mode: 'initial' | 'refresh' | 'more') => {
      const requestId = ++requestIdRef.current;
      if (mode === 'initial') {
        setIsLoading(true);
      } else if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }
      if (mode !== 'more') {
        setError(null);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (query) {
          params.set('search', query);
        }
        const response = await authFetch(`${listingsUrl}?${params.toString()}`);

        if (response.status === 401) {
          resetToLogin();
          return;
        }

        const data = (await response.json()) as ListingsResponse & {
          message?: string;
        };
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          setError(data?.message || 'Unable to load listings');
          return;
        }

        pageRef.current = page;
        setTotalCount(data.count);
        setPageCount(data.pageCount);
        setItems(prev => (mode === 'more' ? [...prev, ...data.data] : data.data));
      } catch {
        if (requestId === requestIdRef.current) {
          setError('Unable to load listings. Check your connection and retry.');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [resetToLogin],
  );

  useEffect(() => {
    fetchPage(1, search, 'initial');
  }, [fetchPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || isRefreshing) {
      return;
    }
    if (pageRef.current >= pageCount) {
      return;
    }
    fetchPage(pageRef.current + 1, search, 'more');
  };

  const listEmpty = () => {
    if (isLoading) {
      return null;
    }
    if (error) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateMessage}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => fetchPage(1, search, 'initial')}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateTitle}>
          {search ? 'No matches found' : 'No listings yet'}
        </Text>
        <Text style={styles.stateMessage}>
          {search
            ? `Nothing matched “${search}”. Try a different title or district.`
            : 'Active listings will show up here once they are added.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Listings</Text>
        {!isLoading && !error ? (
          <Text style={styles.countText}>
            {totalCount} {totalCount === 1 ? 'listing' : 'listings'}
          </Text>
        ) : null}
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by title, district…"
          placeholderTextColor={theme.colors.placeholder}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchInput.length > 0 ? (
          <Pressable
            onPress={() => setSearchInput('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search">
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading listings…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.listing_id)}
          renderItem={({ item }) => <ListingCard listing={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchPage(1, search, 'refresh')}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={listEmpty}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                style={styles.footerSpinner}
                color={theme.colors.primary}
              />
            ) : null
          }
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: theme.gap(3),
    marginBottom: theme.gap(2),
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingBottom: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.gap(3),
    marginBottom: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    borderRadius: theme.radii.input,
    backgroundColor: theme.colors.surface,
    gap: theme.gap(1),
  },
  searchIcon: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.inputText,
  },
  clearIcon: {
    fontSize: 14,
    color: theme.colors.textMuted,
    padding: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.gap(1.5),
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  listContent: {
    paddingHorizontal: theme.gap(3),
    gap: theme.gap(2),
    flexGrow: 1,
  },
  footerSpinner: {
    paddingVertical: theme.gap(2),
  },
  card: {
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '1A',
    gap: 4,
  },
  cardImagePlaceholderIcon: {
    fontSize: 26,
    color: theme.colors.primary,
  },
  cardImagePlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  offeringBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  offeringSell: {
    backgroundColor: theme.colors.primary,
  },
  offeringLease: {
    backgroundColor: theme.colors.secondary,
  },
  offeringBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  cardBody: {
    padding: theme.gap(2),
    gap: theme.gap(1),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardLocation: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.gap(1),
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.primary + '14',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.gap(0.5),
    paddingTop: theme.gap(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary + '14',
  },
  footerStat: {
    flex: 1,
    gap: 2,
  },
  footerDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.primary + '14',
    marginHorizontal: theme.gap(2),
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1),
  },
  negotiable: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  stateCard: {
    marginTop: theme.gap(4),
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.gap(3),
    gap: theme.gap(1),
    alignItems: 'flex-start',
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  stateMessage: {
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
