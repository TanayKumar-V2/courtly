import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useOwnerVenues } from '../../../../src/hooks/useOwnerVenues';
import { VenueStatus } from '../../../../src/types/venue';
import { OwnerVenueCard } from '../../../../src/components/owner/OwnerVenueCard';
import { LoadingIndicator } from '../../../../src/components/common/LoadingIndicator';
import { EmptyState } from '../../../../src/components/common/EmptyState';
import { ErrorState } from '../../../../src/components/common/ErrorState';
import { colors, radius, spacing, typography } from '../../../../src/theme';

const STATUS_FILTERS: { label: string; value?: VenueStatus }[] = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Paused', value: 'PAUSED' },
];

export default function OwnerVenuesListScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<VenueStatus | undefined>(
    undefined,
  );
  const { data, isLoading, error, refetch, isRefetching } =
    useOwnerVenues(selectedStatus);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Venues</Text>
        <Pressable
          onPress={() => router.push('/owner/venues/create' as any)}
          style={styles.addBtn}
        >
          <Plus size={18} color={colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((f) => {
            const active = selectedStatus === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setSelectedStatus(f.value)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingIndicator message="Loading venues..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Venues"
          message={(error as Error).message}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={data?.venues || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <OwnerVenueCard
              venue={item}
              onPress={() =>
                router.push({
                  pathname: '/owner/venues/[venueId]',
                  params: { venueId: item.id },
                } as any)
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="🏟️"
              title="No Venues Match Filter"
              description="Create a new sports venue listing or switch status filters."
              actionTitle="Create New Venue"
              onActionPress={() => router.push('/owner/venues/create' as any)}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
});
