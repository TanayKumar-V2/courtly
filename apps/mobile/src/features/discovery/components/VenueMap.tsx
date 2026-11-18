import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { MapBounds, VenueMapMarkerItem } from '../types/discovery.types';
import {
  CourtlyMap,
  type CourtlyMapHandle,
} from '../../../components/maps/CourtlyMap';
import { SelectedVenueCard } from '../../../components/maps/SelectedVenueCard';
import { colors, radius, spacing, typography } from '../../../theme';

export interface VenueMapProps {
  markers: VenueMapMarkerItem[];
  isLoading: boolean;
  hasMore?: boolean;
  initialCenter?: { latitude: number; longitude: number };
  userLocation?: { latitude: number; longitude: number } | null;
  onSearchArea: (bounds: MapBounds) => void;
  onSelectVenueDetails: (venueId: string) => void;
  onLocateMe?: () => void;
  onSwitchToList?: () => void;
}

export const VenueMap: React.FC<VenueMapProps> = ({
  markers,
  isLoading,
  hasMore,
  initialCenter,
  userLocation = null,
  onSearchArea,
  onSelectVenueDetails,
  onLocateMe,
}) => {
  const mapHandleRef = useRef<CourtlyMapHandle>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [hasMovedCamera, setHasMovedCamera] = useState(false);

  const selectedVenue = useMemo(
    () => markers.find((m) => m.id === selectedVenueId) || null,
    [markers, selectedVenueId],
  );

  const handleBoundsChanged = (bounds: MapBounds) => {
    setPendingBounds(bounds);
    setHasMovedCamera(true);
  };

  const handleSearchThisArea = () => {
    if (pendingBounds) {
      setHasMovedCamera(false);
      onSearchArea(pendingBounds);
    }
  };

  return (
    <View style={styles.container}>
      <CourtlyMap
        ref={mapHandleRef}
        venues={markers}
        selectedVenueId={selectedVenueId}
        initialCenter={initialCenter}
        userLocation={userLocation}
        interactive
        showControls
        enableClustering
        onSelectVenue={(id) => {
          setSelectedVenueId(id);
          const found = markers.find((m) => m.id === id);
          if (found) {
            mapHandleRef.current?.flyTo(found.longitude, found.latitude, 14);
          }
        }}
        onMapBackgroundPress={() => setSelectedVenueId(null)}
        onRegionDidChangeBounds={handleBoundsChanged}
        onLocateMe={onLocateMe}
      />

      {/* Top Floating Search This Area + API Loading / Empty Banners */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        {hasMovedCamera && pendingBounds && (
          <Pressable
            onPress={handleSearchThisArea}
            style={styles.searchAreaBtn}
            accessibilityRole="button"
            accessibilityLabel="Search this area"
          >
            <RefreshCw size={14} color={colors.textInverse} />
            <Text style={styles.searchAreaText}>Search this area</Text>
          </Pressable>
        )}

        {isLoading && (
          <View style={styles.statusPill}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>Loading venues...</Text>
          </View>
        )}

        {!isLoading && markers.length === 0 && (
          <View style={styles.statusPill}>
            <Text style={styles.emptyText}>
              No venues mapped in this area yet.
            </Text>
          </View>
        )}

        {!isLoading && hasMore && (
          <View style={styles.statusPill}>
            <Text style={styles.emptyText}>
              Showing first 100 venues. Zoom in for more.
            </Text>
          </View>
        )}
      </View>

      {/* Selected Venue Preview Card (positioned above attribution bar so OSM credit stays visible) */}
      {selectedVenue && (
        <View style={styles.bottomCard}>
          <SelectedVenueCard
            venue={selectedVenue}
            onViewDetails={onSelectVenueDetails}
            onClose={() => setSelectedVenueId(null)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 6,
  },
  searchAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  searchAreaText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11, 17, 16, 0.92)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 34,
    zIndex: 7,
  },
});
