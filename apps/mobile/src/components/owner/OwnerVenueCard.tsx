import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Building2, Clock, Layers, MapPin } from 'lucide-react-native';
import { OwnerVenue } from '../../types/venue';
import { colors, radius, spacing, typography } from '../../theme';
import { VenueStatusBadge } from './VenueStatusBadge';

export interface OwnerVenueCardProps {
  venue: OwnerVenue;
  onPress: () => void;
}

export const OwnerVenueCard: React.FC<OwnerVenueCardProps> = ({
  venue,
  onPress,
}) => {
  const updatedLabel = new Date(venue.updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Manage ${venue.name}`}
    >
      <View style={styles.imageBox}>
        {venue.coverImage?.secureUrl ? (
          <Image
            source={{ uri: venue.coverImage.secureUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Building2 size={28} color={colors.textMuted} />
            <Text style={styles.placeholderText}>No cover photo yet</Text>
          </View>
        )}
        <View style={styles.statusOverlay}>
          <VenueStatusBadge status={venue.status} />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {venue.name}
        </Text>

        <View style={styles.metaRow}>
          <MapPin size={13} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {[venue.locality, venue.city].filter(Boolean).join(', ') ||
              'Location not set'}
          </Text>
        </View>

        <View style={styles.sportsRow}>
          {venue.sports.length > 0 ? (
            venue.sports.slice(0, 4).map((sport) => (
              <View key={sport} style={styles.sportPill}>
                <Text style={styles.sportText}>{sport}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noSportsText}>No active courts added yet</Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Layers size={13} color={colors.primary} />
            <Text style={styles.footerText}>
              {venue.courtCount} {venue.courtCount === 1 ? 'Court' : 'Courts'}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={styles.updatedText}>Updated {updatedLabel}</Text>
          </View>
        </View>

        {venue.status === 'REJECTED' && !!venue.rejectionReason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Rejection reason:</Text>
            <Text style={styles.rejectionText} numberOfLines={2}>
              {venue.rejectionReason}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  imageBox: {
    height: 148,
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(11, 17, 16, 0.78)',
    borderRadius: radius.full,
  },
  body: {
    padding: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  sportPill: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportText: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  noSportsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  updatedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  rejectionBox: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rejectionLabel: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    fontSize: 11,
  },
  rejectionText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
