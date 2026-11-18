import React, { useState } from 'react';
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
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../../../src/auth/use-auth';
import { useMyOwnerApplication } from '../../../src/hooks/useOwnerApplication';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { SecondaryButton } from '../../../src/components/common/SecondaryButton';
import { LoadingIndicator } from '../../../src/components/common/LoadingIndicator';
import { ErrorState } from '../../../src/components/common/ErrorState';
import { VenueStatusBadge } from '../../../src/components/owner/VenueStatusBadge';
import { colors, radius, spacing, typography } from '../../../src/theme';

export default function OwnerApplicationStatusScreen() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const { data, isLoading, error, refetch, isRefetching } =
    useMyOwnerApplication(true);
  const [refreshingRole, setRefreshingRole] = useState(false);

  const handleActivateOwnerAccess = async () => {
    setRefreshingRole(true);
    try {
      await refreshUser();
      router.replace('/owner' as any);
    } finally {
      setRefreshingRole(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading owner application status..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Could Not Load Application"
          message={(error as Error).message}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const latest = data?.latestApplication;
  const isVenueOwner =
    data?.isVenueOwner || user?.roles?.includes('VENUE_OWNER');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Owner Application</Text>
        <Pressable onPress={() => refetch()} style={styles.backBtn}>
          <RefreshCw size={18} color={colors.textSecondary} />
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
        {!latest ? (
          <View style={styles.statusCard}>
            <Building2 size={36} color={colors.primary} />
            <Text style={styles.statusTitle}>No Application Submitted Yet</Text>
            <Text style={styles.statusSubtitle}>
              Apply to become a verified Courtly Venue Owner to list your sports
              turfs, courts, amenities, and photos.
            </Text>
            <PrimaryButton
              title="Start Owner Application"
              onPress={() => router.push('/owner/application' as any)}
              style={styles.ctaButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.statusCard}>
              {latest.status === 'PENDING' && (
                <Clock size={36} color={colors.warning} />
              )}
              {latest.status === 'APPROVED' && (
                <CheckCircle2 size={36} color={colors.primary} />
              )}
              {latest.status === 'REJECTED' && (
                <AlertCircle size={36} color={colors.error} />
              )}

              <View style={styles.badgeSpacer}>
                <VenueStatusBadge status={latest.status} />
              </View>

              <Text style={styles.statusTitle}>{latest.businessName}</Text>
              <Text style={styles.statusSubtitle}>
                {latest.status === 'PENDING' &&
                  'Our administrator team is reviewing your facility application. You will be able to list venues once approved.'}
                {latest.status === 'APPROVED' &&
                  'Congratulations! Your venue owner account has been approved. Refresh your session to access the Owner Dashboard.'}
                {latest.status === 'REJECTED' &&
                  'Your previous application was not approved. Review the administrator feedback below and reapply when ready.'}
              </Text>

              {latest.status === 'REJECTED' && !!latest.rejectionReason && (
                <View style={styles.rejectionBox}>
                  <Text style={styles.rejectionHeading}>
                    Administrator Feedback
                  </Text>
                  <Text style={styles.rejectionBody}>
                    {latest.rejectionReason}
                  </Text>
                </View>
              )}

              {latest.status === 'APPROVED' && (
                <PrimaryButton
                  title={
                    isVenueOwner
                      ? 'Open Owner Dashboard'
                      : 'Refresh Session & Open Dashboard'
                  }
                  onPress={handleActivateOwnerAccess}
                  loading={refreshingRole}
                  style={styles.ctaButton}
                />
              )}

              {latest.status === 'REJECTED' && data?.canApply && (
                <PrimaryButton
                  title="Submit New Application"
                  onPress={() => router.push('/owner/application' as any)}
                  style={styles.ctaButton}
                />
              )}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>SUBMITTED DETAILS</Text>
              <DetailRow label="Business Type" value={latest.businessType} />
              <DetailRow label="Contact Person" value={latest.contactPerson} />
              <DetailRow label="Contact Phone" value={latest.contactPhone} />
              <DetailRow
                label="Location"
                value={`${latest.city}, ${latest.state}, ${latest.country}`}
              />
              {!!latest.additionalInformation && (
                <DetailRow
                  label="Notes"
                  value={latest.additionalInformation}
                />
              )}
            </View>

            {data?.history && data.history.length > 1 && (
              <View style={styles.detailsCard}>
                <Text style={styles.sectionLabel}>APPLICATION HISTORY</Text>
                {data.history.map((item) => (
                  <View key={item.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName}>
                        {item.businessName}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <VenueStatusBadge status={item.status} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <SecondaryButton
          title="Back to Profile"
          onPress={() => router.back()}
          style={styles.secondaryBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  badgeSpacer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statusTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statusSubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  rejectionBox: {
    width: '100%',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  rejectionHeading: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    marginBottom: 4,
  },
  rejectionBody: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
  },
  ctaButton: {
    width: '100%',
    marginTop: spacing.lg,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: spacing.sm,
  },
  historyName: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  historyDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
  },
});
