import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Building2, Layers, MapPin, X } from 'lucide-react-native';
import { VenueMapMarkerItem } from '../../features/discovery/types/discovery.types';
import { PrimaryButton } from '../common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../theme';

export interface SelectedVenueCardProps {
  venue: VenueMapMarkerItem;
  onViewDetails: (venueId: string) => void;
  onClose: () => void;
}

export const SelectedVenueCard: React.FC<SelectedVenueCardProps> = ({
  venue,
  onViewDetails,
  onClose,
}) => {
  return (
    <View style={styles.card} testID="selected-venue-card">
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss selected venue card"
        style={styles.closeBtn}
      >
        <X size={16} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.row}>
        {venue.coverImage?.secureUrl ? (
          <Image
            source={{ uri: venue.coverImage.secureUrl }}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Building2 size={22} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.sports} numberOfLines={1}>
            {venue.sports.join(' • ')}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.locRow}>
            <MapPin size={12} color={colors.textMuted} />
            <Text style={styles.locText} numberOfLines={1}>
              {[venue.locality, venue.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.price}>
              {venue.startingPricePerHour
                ? `${venue.currency === 'INR' ? '₹' : `${venue.currency} `}${Number(venue.startingPricePerHour).toFixed(0)} / hr`
                : 'See courts'}
            </Text>
            <View style={styles.courtsChip}>
              <Layers size={11} color={colors.primary} />
              <Text style={styles.courtsText}>
                {venue.activeCourtCount}{' '}
                {venue.activeCourtCount === 1 ? 'Court' : 'Courts'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <PrimaryButton
        title="View Details"
        size="sm"
        onPress={() => onViewDetails(venue.id)}
        style={styles.cta}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderHighlight,
    padding: spacing.md,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  sports: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  name: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: 2,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    ...typography.bodySecondary,
    color: colors.primary,
    fontWeight: '800',
  },
  courtsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  courtsText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cta: {
    marginTop: spacing.md,
  },
});
