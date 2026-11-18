import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OwnerApplicationStatus, VenueStatus } from '../../types/venue';
import { colors, radius, spacing, typography } from '../../theme';

type BadgeStatus = VenueStatus | OwnerApplicationStatus;

const STATUS_META: Record<
  BadgeStatus,
  { label: string; bg: string; border: string; text: string }
> = {
  DRAFT: {
    label: 'Draft',
    bg: 'rgba(153, 165, 157, 0.14)',
    border: 'rgba(153, 165, 157, 0.35)',
    text: colors.textSecondary,
  },
  PENDING: {
    label: 'Pending Review',
    bg: 'rgba(250, 204, 21, 0.14)',
    border: 'rgba(250, 204, 21, 0.45)',
    text: colors.warning,
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    bg: 'rgba(250, 204, 21, 0.14)',
    border: 'rgba(250, 204, 21, 0.45)',
    text: colors.warning,
  },
  APPROVED: {
    label: 'Approved',
    bg: 'rgba(198, 243, 107, 0.16)',
    border: 'rgba(198, 243, 107, 0.5)',
    text: colors.primary,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'rgba(248, 113, 113, 0.14)',
    border: 'rgba(248, 113, 113, 0.45)',
    text: colors.error,
  },
  PAUSED: {
    label: 'Paused',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.45)',
    text: colors.info,
  },
};

export const VenueStatusBadge: React.FC<{ status: BadgeStatus }> = ({
  status,
}) => {
  const meta = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bg, borderColor: meta.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: meta.text }]} />
      <Text style={[styles.label, { color: meta.text }]}>{meta.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
});
