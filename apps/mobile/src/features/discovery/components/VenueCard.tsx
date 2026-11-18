import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Building2, Layers, MapPin, Navigation } from 'lucide-react-native';
import { DiscoveryVenueItem } from '../types/discovery.types';
import { colors, radius, spacing, typography } from '../../../theme';

export interface DiscoveryVenueCardProps {
  venue: DiscoveryVenueItem;
  onPress: (venueId: string) => void;
}

export const VenueCard: React.FC<DiscoveryVenueCardProps> = memo(
  ({ venue, onPress }) => {
    const locationLabel = [venue.locality, venue.city]
      .filter(Boolean)
      .join(', ');

    return (
      <Pressable
        onPress={() => onPress(venue.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${venue.name}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.imageBox}>
          {venue.coverImage?.secureUrl ? (
            <Image
              source={{ uri: venue.coverImage.secureUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={250}
            />
          ) : (
            <View style={styles.placeholder}>
              <Building2 size={28} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Courtly Venue</Text>
            </View>
          )}

          {venue.distanceKm !== null && (
            <View style={styles.distanceBadge}>
              <Navigation size={11} color={colors.textInverse} />
              <Text style={styles.distanceText}>
                {venue.distanceKm < 1
                  ? `${Math.round(venue.distanceKm * 1000)} m`
                  : `${venue.distanceKm.toFixed(1)} km`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.sportsRow}>
            {venue.sports.slice(0, 4).map((sport) => (
              <View key={sport} style={styles.sportPill}>
                <Text style={styles.sportText}>{sport}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {venue.name}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel || venue.state || 'India'}
            </Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.priceValue}>
                {venue.startingPricePerHour
                  ? `${venue.currency === 'INR' ? '₹' : `${venue.currency} `}${Number(venue.startingPricePerHour).toFixed(0)}`
                  : 'See courts'}
                {venue.startingPricePerHour && (
                  <Text style={styles.priceUnit}> / hr</Text>
                )}
              </Text>
            </View>

            <View style={styles.courtsBadge}>
              <Layers size={13} color={colors.primary} />
              <Text style={styles.courtsText}>
                {venue.activeCourtCount}{' '}
                {venue.activeCourtCount === 1 ? 'Court' : 'Courts'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

VenueCard.displayName = 'DiscoveryVenueCard';

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
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  imageBox: {
    height: 172,
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  distanceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  distanceText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: 11,
  },
  body: {
    padding: spacing.md,
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  sportPill: {
    backgroundColor: 'rgba(198, 243, 107, 0.14)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  sportText: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  name: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
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
    fontWeight: '400',
  },
  courtsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courtsText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
