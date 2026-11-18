import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { SportCategory } from '../../types';

export interface SportCardProps {
  sport: SportCategory;
  isSelected?: boolean;
  onPress: (sport: SportCategory) => void;
}

export const SportCard: React.FC<SportCardProps> = ({
  sport,
  isSelected = false,
  onPress,
}) => {
  return (
    <Pressable
      onPress={() => onPress(sport)}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Select sport ${sport.name}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: `${sport.accentColor}20` }]}>
          <Text style={[styles.badgeText, { color: sport.accentColor }]}>{sport.badge}</Text>
        </View>
        <View style={[styles.indicator, { backgroundColor: sport.accentColor }]} />
      </View>

      <Text style={styles.sportName}>{sport.name}</Text>
      <Text style={styles.tagline} numberOfLines={2}>
        {sport.tagline}
      </Text>

      <View style={styles.actionRow}>
        <Text style={[styles.exploreText, { color: sport.accentColor }]}>Explore courts →</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.md,
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.overline,
    fontSize: 9,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sportName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  actionRow: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exploreText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
});
