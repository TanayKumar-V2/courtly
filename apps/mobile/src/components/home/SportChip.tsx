import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export interface SportChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  count?: number;
}

export const SportChip: React.FC<SportChipProps> = ({
  label,
  isSelected,
  onPress,
  count,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isSelected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={[styles.text, isSelected && styles.textSelected]}>{label}</Text>
      {count !== undefined && (
        <Text style={[styles.count, isSelected && styles.countSelected]}>({count})</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipSelected: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.8,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  count: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: 4,
  },
  countSelected: {
    color: colors.primary,
  },
});
