import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Sport } from '../../../auth/auth-types';
import { colors, radius, spacing, typography } from '../../../theme';

const SPORT_CATEGORIES: { id: Sport | null; label: string }[] = [
  { id: null, label: 'All' },
  { id: 'FOOTBALL', label: 'Football' },
  { id: 'CRICKET', label: 'Cricket' },
  { id: 'BADMINTON', label: 'Badminton' },
  { id: 'TENNIS', label: 'Tennis' },
  { id: 'BASKETBALL', label: 'Basketball' },
  { id: 'PADEL', label: 'Padel' },
];

export interface SportFilterChipsProps {
  selectedSport: Sport | null;
  onSelectSport: (sport: Sport | null) => void;
}

export const SportFilterChips: React.FC<SportFilterChipsProps> = ({
  selectedSport,
  onSelectSport,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {SPORT_CATEGORIES.map((item) => {
        const isActive = selectedSport === item.id;
        return (
          <Pressable
            key={item.label}
            onPress={() => onSelectSport(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.textInverse,
  },
});
