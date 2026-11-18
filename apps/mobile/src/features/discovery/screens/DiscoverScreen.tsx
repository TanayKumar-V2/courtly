import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { List, Map as MapIcon, MapPin, Navigation } from 'lucide-react-native';
import { useAuth } from '../../../auth/use-auth';
import { colors, radius, spacing, typography } from '../../../theme';
import {
  DEFAULT_DISCOVERY_FILTERS,
  DiscoveryFilters,
  MapBounds,
} from '../types/discovery.types';
import { getAmenities } from '../services/discovery-service';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useVenueSearch } from '../hooks/useVenueSearch';
import { useVenueMap } from '../hooks/useVenueMap';
import { SearchBar } from '../components/SearchBar';
import { SportFilterChips } from '../components/SportFilterChips';
import { FilterButton } from '../components/FilterButton';
import { SortSelector } from '../components/SortSelector';
import { VenueList } from '../components/VenueList';
import { VenueMap } from '../components/VenueMap';
import { FilterBottomSheet } from '../components/FilterBottomSheet';
import { LocationPermissionPrompt } from '../components/LocationPermissionPrompt';

const DEFAULT_MAP_BOUNDS: MapBounds = {
  north: 35.5,
  south: 6.5,
  east: 97.4,
  west: 68.1,
};

export const DiscoverScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebouncedValue(searchInput, 350);

  const [filters, setFilters] = useState<DiscoveryFilters>({
    ...DEFAULT_DISCOVERY_FILTERS,
    city: user?.profile?.city || '',
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds>(DEFAULT_MAP_BOUNDS);

  const activeFilters = useMemo<DiscoveryFilters>(
    () => ({
      ...filters,
      q: debouncedQuery.trim(),
    }),
    [filters, debouncedQuery],
  );

  const hasCoordinates =
    activeFilters.latitude !== undefined &&
    activeFilters.longitude !== undefined;

  const { data: amenitiesRes } = useQuery({
    queryKey: ['discovery', 'amenities'],
    queryFn: getAmenities,
    staleTime: 10 * 60_000,
  });

  const searchQuery = useVenueSearch(activeFilters, 20);
  const mapQuery = useVenueMap(
    mapBounds,
    activeFilters,
    viewMode === 'map',
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sport) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined)
      count++;
    if (filters.indoor !== undefined) count++;
    if (filters.amenityIds.length > 0) count += filters.amenityIds.length;
    if (filters.sort !== 'NEWEST') count++;
    return count;
  }, [filters]);

  const userInitials = useMemo(() => {
    if (!user?.fullName) return 'PL';
    return user.fullName
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user?.fullName]);

  const locationDisplayLabel = hasCoordinates
    ? `Near You (${filters.radiusKm ?? 10} km)`
    : filters.city?.trim()
      ? filters.city.trim()
      : 'All Cities';

  const handleSelectVenue = (venueId: string) => {
    router.push({
      pathname: '/venues/[venueId]',
      params: { venueId },
    } as any);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      ...DEFAULT_DISCOVERY_FILTERS,
    });
  };

  const headerControls = (
    <View style={styles.controlsWrap}>
      <SearchBar
        value={searchInput}
        onChangeText={setSearchInput}
        isLoading={searchQuery.isFetching && !searchQuery.isFetchingNextPage}
      />

      <View style={styles.sportRow}>
        <SportFilterChips
          selectedSport={filters.sport ?? null}
          onSelectSport={(sport) => setFilters((prev) => ({ ...prev, sport }))}
        />
      </View>

      {/* Quick Filters + List/Map Toggle */}
      <View style={styles.quickRow}>
        <FilterButton
          activeCount={activeFilterCount}
          onPress={() => setFilterSheetVisible(true)}
        />

        <Pressable
          onPress={() =>
            setFilters((prev) => ({
              ...prev,
              indoor: prev.indoor === true ? undefined : true,
            }))
          }
          style={[
            styles.quickPill,
            filters.indoor === true && styles.quickPillActive,
          ]}
        >
          <Text
            style={[
              styles.quickPillText,
              filters.indoor === true && styles.quickPillTextActive,
            ]}
          >
            Indoor
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setFilters((prev) => ({
              ...prev,
              indoor: prev.indoor === false ? undefined : false,
            }))
          }
          style={[
            styles.quickPill,
            filters.indoor === false && styles.quickPillActive,
          ]}
        >
          <Text
            style={[
              styles.quickPillText,
              filters.indoor === false && styles.quickPillTextActive,
            ]}
          >
            Outdoor
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={() =>
            setViewMode((prev) => (prev === 'list' ? 'map' : 'list'))
          }
          accessibilityRole="button"
          accessibilityLabel={
            viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'
          }
          style={styles.modeToggleBtn}
        >
          {viewMode === 'list' ? (
            <>
              <MapIcon size={15} color={colors.textInverse} />
              <Text style={styles.modeToggleText}>Map</Text>
            </>
          ) : (
            <>
              <List size={15} color={colors.textInverse} />
              <Text style={styles.modeToggleText}>List</Text>
            </>
          )}
        </Pressable>
      </View>

      {viewMode === 'list' && (
        <>
          <View style={styles.sortRow}>
            <SortSelector
              value={filters.sort}
              hasLocation={hasCoordinates}
              onChange={(sort) => setFilters((prev) => ({ ...prev, sort }))}
            />
          </View>
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {searchQuery.isLoading
                ? 'Searching verified venues...'
                : `${searchQuery.total} ${searchQuery.total === 1 ? 'venue' : 'venues'} found`}
            </Text>
            {(activeFilterCount > 0 || searchInput.trim().length > 0) && (
              <Pressable onPress={handleResetFilters}>
                <Text style={styles.resetText}>Clear</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Brand + Location + Profile Avatar Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>COURTLY</Text>
          <Pressable
            onPress={() => setLocationSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change search city or use current location"
            style={styles.locationBtn}
          >
            {hasCoordinates ? (
              <Navigation size={14} color={colors.primary} />
            ) : (
              <MapPin size={14} color={colors.primary} />
            )}
            <Text style={styles.locationText} numberOfLines={1}>
              {locationDisplayLabel}
            </Text>
            <Text style={styles.locationCaret}>▾</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/(tabs)/profile' as any)}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={styles.avatarBtn}
        >
          <Text style={styles.avatarText}>{userInitials}</Text>
        </Pressable>
      </View>

      {viewMode === 'list' ? (
        <VenueList
          venues={searchQuery.venues}
          isLoading={searchQuery.isLoading}
          isRefetching={searchQuery.isRefetching}
          isFetchingNextPage={searchQuery.isFetchingNextPage}
          hasNextPage={searchQuery.hasNextPage}
          error={searchQuery.error as Error | null}
          onRefresh={() => {
            void searchQuery.refetch();
          }}
          onLoadMore={() => {
            void searchQuery.fetchNextPage();
          }}
          onSelectVenue={handleSelectVenue}
          onResetFilters={handleResetFilters}
          ListHeaderComponent={headerControls}
        />
      ) : (
        <View style={styles.mapModeWrap}>
          {headerControls}
          <VenueMap
            markers={mapQuery.data?.markers || []}
            isLoading={mapQuery.isFetching}
            hasMore={mapQuery.data?.hasMore}
            initialCenter={
              hasCoordinates
                ? {
                    latitude: activeFilters.latitude!,
                    longitude: activeFilters.longitude!,
                  }
                : undefined
            }
            userLocation={
              hasCoordinates
                ? {
                    latitude: activeFilters.latitude!,
                    longitude: activeFilters.longitude!,
                  }
                : null
            }
            onSearchArea={(bounds) => setMapBounds(bounds)}
            onSelectVenueDetails={handleSelectVenue}
            onLocateMe={() => setLocationSheetVisible(true)}
            onSwitchToList={() => setViewMode('list')}
          />
        </View>
      )}

      <FilterBottomSheet
        visible={filterSheetVisible}
        filters={filters}
        amenities={amenitiesRes?.amenities || []}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(next) => setFilters(next)}
      />

      <LocationPermissionPrompt
        visible={locationSheetVisible}
        currentCity={filters.city}
        hasCoordinates={hasCoordinates}
        radiusKm={filters.radiusKm ?? 10}
        onClose={() => setLocationSheetVisible(false)}
        onSelectCity={(city) =>
          setFilters((prev) => ({
            ...prev,
            city,
            latitude: undefined,
            longitude: undefined,
            sort: prev.sort === 'DISTANCE' ? 'NEWEST' : prev.sort,
          }))
        }
        onSelectCoordinates={(coords, radiusKm) => {
          setFilters((prev) => ({
            ...prev,
            city: '',
            latitude: coords.latitude,
            longitude: coords.longitude,
            radiusKm,
            sort: 'DISTANCE',
          }));
          setMapBounds({
            north: Math.min(90, coords.latitude + 0.15),
            south: Math.max(-90, coords.latitude - 0.15),
            east: Math.min(180, coords.longitude + 0.15),
            west: Math.max(-180, coords.longitude - 0.15),
          });
        }}
        onChangeRadius={(radiusKm) =>
          setFilters((prev) => ({ ...prev, radiusKm }))
        }
        onClearLocation={() =>
          setFilters((prev) => ({
            ...prev,
            city: '',
            state: '',
            latitude: undefined,
            longitude: undefined,
            sort: prev.sort === 'DISTANCE' ? 'NEWEST' : prev.sort,
          }))
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    ...typography.overline,
    color: colors.primary,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  locationText: {
    ...typography.h4,
    color: colors.textPrimary,
    maxWidth: 220,
  },
  locationCaret: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  controlsWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sportRow: {
    marginTop: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  quickPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPillActive: {
    backgroundColor: 'rgba(198, 243, 107, 0.16)',
    borderColor: colors.primary,
  },
  quickPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  quickPillTextActive: {
    color: colors.primary,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  modeToggleText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '800',
  },
  sortRow: {
    marginTop: spacing.sm,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  countText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  resetText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  mapModeWrap: {
    flex: 1,
  },
});
