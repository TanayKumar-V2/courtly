import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DiscoveryVenueItem } from '../types/discovery.types';
import { VenueCard } from './VenueCard';
import { VenueSkeleton } from './VenueSkeleton';
import { DiscoveryEmptyState } from './DiscoveryEmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { colors, spacing, typography } from '../../../theme';

export interface VenueListProps {
  venues: DiscoveryVenueItem[];
  isLoading: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  error?: Error | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onSelectVenue: (venueId: string) => void;
  onResetFilters: () => void;
  ListHeaderComponent?: React.ReactElement;
}

export const VenueList: React.FC<VenueListProps> = ({
  venues,
  isLoading,
  isRefetching,
  isFetchingNextPage,
  hasNextPage,
  error,
  onRefresh,
  onLoadMore,
  onSelectVenue,
  onResetFilters,
  ListHeaderComponent,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: DiscoveryVenueItem }) => (
      <View style={styles.cardWrap}>
        <VenueCard venue={item} onPress={onSelectVenue} />
      </View>
    ),
    [onSelectVenue],
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Loading more venues...</Text>
        </View>
      );
    }
    if (venues.length > 0 && !hasNextPage) {
      return (
        <View style={styles.footerBox}>
          <Text style={styles.endText}>You&apos;ve reached the end of results</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return <VenueSkeleton count={3} />;
    }
    if (error) {
      return (
        <View style={styles.errorWrap}>
          <ErrorState
            title="Could Not Load Venues"
            message={error.message || 'Please check your connection and retry.'}
            onRetry={onRefresh}
          />
        </View>
      );
    }
    return <DiscoveryEmptyState mode="list" onResetFilters={onResetFilters} />;
  };

  return (
    <FlatList
      data={venues}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
    />
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl + 32,
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
  },
  errorWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footerBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  endText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
