import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { VenueSortOption } from '../types/discovery.types';
import { colors, radius, spacing, typography } from '../../../theme';

export interface SortSelectorProps {
  value: VenueSortOption;
  hasLocation: boolean;
  onChange: (sort: VenueSortOption) => void;
}

const SORT_OPTIONS: { id: VenueSortOption; label: string; needsLoc?: boolean }[] = [
  { id: 'NEWEST', label: 'Newest' },
  { id: 'PRICE_LOW_TO_HIGH', label: 'Price: Low to High' },
  { id: 'PRICE_HIGH_TO_LOW', label: 'Price: High to Low' },
  { id: 'DISTANCE', label: 'Nearest', needsLoc: true },
];

export const SortSelector: React.FC<SortSelectorProps> = ({
  value,
  hasLocation,
  onChange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SORT_OPTIONS.map((opt) => {
        const disabled = Boolean(opt.needsLoc && !hasLocation);
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => !disabled && onChange(opt.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            style={[
              styles.pill,
              active && styles.pillActive,
              disabled && styles.pillDisabled,
            ]}
          >
            <Text
              style={[
                styles.text,
                active && styles.textActive,
                disabled && styles.textDisabled,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(198, 243, 107, 0.16)',
  },
  pillDisabled: {
    opacity: 0.4,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
