import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { useAuth } from '../../../src/auth/use-auth';
import { useOwnerVenues } from '../../../src/hooks/useOwnerVenues';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { LoadingIndicator } from '../../../src/components/common/LoadingIndicator';
import { ErrorState } from '../../../src/components/common/ErrorState';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { OwnerVenueCard } from '../../../src/components/owner/OwnerVenueCard';
import { colors, radius, spacing, typography } from '../../../src/theme';

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isVenueOwner = Boolean(user?.roles?.includes('VENUE_OWNER'));

  const { data, isLoading, error, refetch, isRefetching } = useOwnerVenues(
    undefined,
    isVenueOwner,
  );

  if (!isVenueOwner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Venue Owner Hub</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerBox}>
          <EmptyState
            icon="🏟️"
            title="Venue Owner Verification Required"
            description="Apply to become a verified Venue Owner to create and manage sports venues on Courtly."
            actionTitle="View Application Status"
            onActionPress={() =>
              router.replace('/owner/application-status' as any)
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading your venues..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Could Not Load Owner Dashboard"
          message={(error as Error).message}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const summary = data?.summary || {
    total: 0,
    draft: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    paused: 0,
  };
  const venues = data?.venues || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Owner Dashboard</Text>
        <Pressable
          onPress={() => router.push('/owner/venues/create' as any)}
          style={styles.addBtn}
          accessibilityLabel="Create new venue"
        >
          <Plus size={18} color={colors.textInverse} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>VENUE MANAGEMENT</Text>
            <Text style={styles.title}>My Facilities</Text>
          </View>
          <PrimaryButton
            title="+ New Venue"
            size="sm"
            onPress={() => router.push('/owner/venues/create' as any)}
          />
        </View>

        {/* Real Venue Management Metrics Only (No fake bookings/revenue) */}
        <View style={styles.metricsGrid}>
          <MetricTile label="Total Venues" value={summary.total} highlight />
          <MetricTile label="Approved" value={summary.approved} tone="primary" />
          <MetricTile
            label="Pending Review"
            value={summary.pendingReview}
            tone="warning"
          />
          <MetricTile label="Drafts" value={summary.draft} />
          <MetricTile
            label="Paused / Rejected"
            value={summary.paused + summary.rejected}
            tone="error"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Venues ({venues.length})</Text>
          {venues.length > 0 && (
            <Pressable
              onPress={() => router.push('/owner/venues' as any)}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Manage All</Text>
              <ChevronRight size={15} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {venues.length === 0 ? (
          <View style={styles.emptyCard}>
            <Building2 size={34} color={colors.primary} />
            <Text style={styles.emptyTitle}>List Your First Venue</Text>
            <Text style={styles.emptyDesc}>
              Add your sports venue details, configure individual courts and
              hourly pricing, upload photos, and submit for administrator
              approval.
            </Text>
            <PrimaryButton
              title="Create Venue Listing"
              onPress={() => router.push('/owner/venues/create' as any)}
              style={styles.emptyCta}
            />
          </View>
        ) : (
          venues.map((venue) => (
            <OwnerVenueCard
              key={venue.id}
              venue={venue}
              onPress={() =>
                router.push({
                  pathname: '/owner/venues/[venueId]',
                  params: { venueId: venue.id },
                } as any)
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  tone?: 'primary' | 'warning' | 'error';
}) {
  const valueColor =
    tone === 'primary'
      ? colors.primary
      : tone === 'warning'
        ? colors.warning
        : tone === 'error'
          ? colors.error
          : colors.textPrimary;

  return (
    <View style={[styles.metricTile, highlight && styles.metricTileHighlight]}>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  headerSpacer: {
    width: 38,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  overline: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: 2,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricTile: {
    minWidth: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricTileHighlight: {
    borderColor: colors.borderHighlight,
    backgroundColor: colors.surfaceSecondary,
  },
  metricValue: {
    ...typography.h2,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyDesc: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  emptyCta: {
    width: '100%',
    marginTop: spacing.lg,
  },
});
