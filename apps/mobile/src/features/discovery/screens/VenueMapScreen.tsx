import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  DEFAULT_DISCOVERY_FILTERS,
  MapBounds,
} from '../types/discovery.types';
import { useVenueMap } from '../hooks/useVenueMap';
import { VenueMap } from '../components/VenueMap';
import { colors, radius, spacing, typography } from '../../../theme';

const INITIAL_BOUNDS: MapBounds = {
  north: 35.5,
  south: 6.5,
  east: 97.4,
  west: 68.1,
};

export const VenueMapScreen: React.FC = () => {
  const router = useRouter();
  const [bounds, setBounds] = useState<MapBounds>(INITIAL_BOUNDS);
  const { data, isFetching } = useVenueMap(
    bounds,
    DEFAULT_DISCOVERY_FILTERS,
    true,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Explore Venues on Map</Text>
        <View style={{ width: 38 }} />
      </View>

      <VenueMap
        markers={data?.markers || []}
        isLoading={isFetching}
        hasMore={data?.hasMore}
        onSearchArea={setBounds}
        onSelectVenueDetails={(venueId) =>
          router.push({
            pathname: '/venues/[venueId]',
            params: { venueId },
          } as any)
        }
        onSwitchToList={() => router.back()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h4, color: colors.textPrimary },
});
