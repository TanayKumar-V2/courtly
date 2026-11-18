import React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Eye,
  Layers,
  ListChecks,
  MapPin,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react-native';
import {
  useDeleteOwnerVenue,
  useOwnerVenue,
  useSubmitVenueForReview,
  useWithdrawVenueSubmission,
} from '../../../../../src/hooks/useOwnerVenues';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { ErrorState } from '../../../../../src/components/common/ErrorState';
import { PrimaryButton } from '../../../../../src/components/common/PrimaryButton';
import { SecondaryButton } from '../../../../../src/components/common/SecondaryButton';
import { VenueStatusBadge } from '../../../../../src/components/owner/VenueStatusBadge';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

export default function OwnerVenueDetailScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  const { data, isLoading, error, refetch, isRefetching } =
    useOwnerVenue(venueId);
  const submitMutation = useSubmitVenueForReview(venueId || '');
  const withdrawMutation = useWithdrawVenueSubmission(venueId || '');
  const deleteMutation = useDeleteOwnerVenue();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading venue details..." />
      </SafeAreaView>
    );
  }

  if (error || !data?.venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Could Not Load Venue"
          message={(error as Error)?.message || 'Venue not found'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const venue = data.venue;
  const isPending = venue.status === 'PENDING_REVIEW';
  const canSubmit =
    (venue.status === 'DRAFT' || venue.status === 'REJECTED') &&
    venue.completion.isReadyToSubmit;

  const handleSubmit = () => {
    Alert.alert(
      'Submit Venue for Review',
      'Your venue will be locked for editing while Courtly administrators review the listing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await submitMutation.mutateAsync();
              Alert.alert(
                'Submitted',
                'Your venue is now pending administrator review.',
              );
            } catch (err: any) {
              Alert.alert('Submission Failed', err?.message || 'Try again');
            }
          },
        },
      ],
    );
  };

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Submission',
      'Move this venue back to Draft so you can edit details, courts, or photos?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              await withdrawMutation.mutateAsync();
            } catch (err: any) {
              Alert.alert('Failed', err?.message || 'Unable to withdraw');
            }
          },
        },
      ],
    );
  };

  const handleDeleteOrArchive = () => {
    const isDraftOnly = venue.status === 'DRAFT' && !venue.publishedAt;
    Alert.alert(
      isDraftOnly ? 'Delete Draft Venue' : 'Archive Venue Listing',
      isDraftOnly
        ? 'This permanently removes your unpublished draft venue. Continue?'
        : 'This archives your venue and removes it from public discovery while preserving historical records. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDraftOnly ? 'Delete Draft' : 'Archive Venue',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(venue.id);
              router.replace('/owner' as any);
            } catch (err: any) {
              Alert.alert('Failed', err?.message || 'Action failed');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {venue.name}
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/owner/venues/[venueId]/preview',
              params: { venueId: venue.id },
            } as any)
          }
          style={styles.backBtn}
        >
          <Eye size={18} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
        {venue.coverImage?.secureUrl && (
          <Image
            source={{ uri: venue.coverImage.secureUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
        )}

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <VenueStatusBadge status={venue.status} />
            <Text style={styles.completionText}>
              {venue.completion.completionPercent}% Complete
            </Text>
          </View>

          <Text style={styles.venueTitle}>{venue.name}</Text>
          <Text style={styles.venueLocation}>
            {[venue.locality, venue.city, venue.state]
              .filter(Boolean)
              .join(', ') || 'Location incomplete'}
          </Text>

          {venue.status === 'PENDING_REVIEW' && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Submitted for administrator verification. Fields are read-only
                unless you withdraw the submission.
              </Text>
            </View>
          )}

          {venue.status === 'REJECTED' && !!venue.rejectionReason && (
            <View style={styles.errorBanner}>
              <View style={styles.bannerTitleRow}>
                <AlertTriangle size={15} color={colors.error} />
                <Text style={styles.errorBannerTitle}>Rejection Reason</Text>
              </View>
              <Text style={styles.errorBannerText}>
                {venue.rejectionReason}
              </Text>
            </View>
          )}

          {venue.status === 'PAUSED' && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                This listing is currently paused and hidden from public players.
                {venue.rejectionReason ? ` Reason: ${venue.rejectionReason}` : ''}
              </Text>
            </View>
          )}

          {venue.status === 'APPROVED' && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={15} color={colors.primary} />
              <Text style={styles.successBannerText}>
                Live & publicly visible to Courtly players.
              </Text>
            </View>
          )}
        </View>

        {/* Missing Requirements */}
        {venue.completion.missingRequirements.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>REQUIRED BEFORE SUBMISSION</Text>
            {venue.completion.missingRequirements.map((req) => (
              <Text key={req} style={styles.missingText}>
                • {req}
              </Text>
            ))}
          </View>
        )}

        {/* Management Menu */}
        <View style={styles.menuCard}>
          <MenuRow
            icon={<Edit3 size={18} color={colors.primary} />}
            title="Edit Venue Details & Location"
            subtitle={isPending ? 'Withdraw submission to edit' : 'Name, description, address, contact'}
            disabled={isPending}
            onPress={() =>
              router.push({
                pathname: '/owner/venues/[venueId]/edit',
                params: { venueId: venue.id },
              } as any)
            }
          />
          <MenuRow
            icon={<MapPin size={18} color={colors.primary} />}
            title="Set Map Location Pin"
            subtitle={
              venue.latitude !== null && venue.longitude !== null
                ? `${venue.latitude.toFixed(4)}, ${venue.longitude.toFixed(4)}`
                : 'No GPS coordinates set yet'
            }
            disabled={isPending}
            onPress={() =>
              router.push({
                pathname: '/owner/venues/[venueId]/location',
                params: { venueId: venue.id },
              } as any)
            }
          />
          <MenuRow
            icon={<Layers size={18} color={colors.primary} />}
            title={`Manage Courts (${venue.courtCount})`}
            subtitle={venue.sports.join(', ') || 'Add sports & hourly pricing'}
            disabled={isPending}
            onPress={() =>
              router.push({
                pathname: '/owner/venues/[venueId]/courts',
                params: { venueId: venue.id },
              } as any)
            }
          />
          <MenuRow
            icon={<ListChecks size={18} color={colors.primary} />}
            title={`Manage Amenities (${venue.amenities.length})`}
            subtitle="Select facilities from Courtly catalogue"
            disabled={isPending}
            onPress={() =>
              router.push({
                pathname: '/owner/venues/[venueId]/amenities',
                params: { venueId: venue.id },
              } as any)
            }
          />
          <MenuRow
            icon={<Camera size={18} color={colors.primary} />}
            title={`Manage Photographs (${venue.images.length}/10)`}
            subtitle="Upload, reorder & choose cover image"
            disabled={isPending}
            onPress={() =>
              router.push({
                pathname: '/owner/venues/[venueId]/images',
                params: { venueId: venue.id },
              } as any)
            }
          />
          <MenuRow
            icon={<Eye size={18} color={colors.textSecondary} />}
            title="Preview Player Listing"
            subtitle="See how players will view this venue"
            isLast
            onPress={() =>
              router.push({
                pathname: '/owner/venues/[venueId]/preview',
                params: { venueId: venue.id },
              } as any)
            }
          />
        </View>

        {/* Status Actions */}
        {(venue.status === 'DRAFT' || venue.status === 'REJECTED') && (
          <PrimaryButton
            title="Submit for Admin Review"
            onPress={handleSubmit}
            loading={submitMutation.isPending}
            disabled={!canSubmit}
            style={styles.actionBtn}
          />
        )}

        {venue.status === 'PENDING_REVIEW' && (
          <SecondaryButton
            title="Withdraw Submission to Edit"
            onPress={handleWithdraw}
            loading={withdrawMutation.isPending}
            style={styles.actionBtn}
          />
        )}

        <Pressable
          onPress={handleDeleteOrArchive}
          style={styles.dangerBtn}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={16} color={colors.error} />
          <Text style={styles.dangerBtnText}>
            {venue.status === 'DRAFT' && !venue.publishedAt
              ? 'Delete Draft Venue'
              : 'Archive Venue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  isLast,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.menuRow,
        isLast && styles.menuRowLast,
        disabled && { opacity: 0.45 },
      ]}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
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
    gap: spacing.sm,
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
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  venueTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  venueLocation: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoBanner: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  infoBannerText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  errorBanner: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorBannerTitle: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  successBanner: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(198, 243, 107, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(198, 243, 107, 0.4)',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  successBannerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  missingText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: 4,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  menuSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    marginBottom: spacing.sm,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    marginTop: spacing.xs,
  },
  dangerBtnText: {
    ...typography.bodySecondary,
    color: colors.error,
    fontWeight: '700',
  },
});
