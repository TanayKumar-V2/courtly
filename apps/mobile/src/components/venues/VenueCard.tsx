import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../../theme';
import { Venue } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, compact = false }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/venues/[venueId]',
      params: { venueId: venue.id },
    } as never);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : styles.fullCard,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${venue.name}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: venue.image }}
          style={compact ? styles.compactImage : styles.image}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.badgeOverlay}>
          <StatusBadge label="Sample Data" variant="demo" size="sm" />
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.ratingText}>{venue.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCountText}>({venue.reviewCount})</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sportsRow}>
          {venue.sports.map((sport) => (
            <Text key={sport} style={styles.sportBadge}>
              {sport.toUpperCase()}
            </Text>
          ))}
        </View>

        <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
          {venue.name}
        </Text>

        <View style={styles.locationRow}>
          <Text style={styles.pinIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {venue.address}, {venue.city}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>
              ₹{venue.startingPrice}
              <Text style={styles.priceUnit}> / hr</Text>
            </Text>
          </View>

          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>View Details →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fullCard: {
    marginBottom: spacing.lg,
  },
  compactCard: {
    width: 260,
    marginRight: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: 160,
  },
  compactImage: {
    width: '100%',
    height: 130,
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(11, 17, 16, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starIcon: {
    color: '#FACC15',
    fontSize: 12,
    marginRight: 3,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  reviewCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 2,
  },
  content: {
    padding: spacing.md,
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  sportBadge: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  name: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pinIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  priceValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
  },
  priceUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
  },
  ctaButton: {
    paddingVertical: spacing.xs,
  },
  ctaText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
