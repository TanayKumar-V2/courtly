import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../theme';

export interface FilterButtonProps {
  activeCount: number;
  onPress: () => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  activeCount,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open filters, ${activeCount} active`}
      style={[styles.button, activeCount > 0 && styles.buttonActive]}
    >
      <SlidersHorizontal
        size={15}
        color={activeCount > 0 ? colors.textInverse : colors.primary}
      />
      <Text style={[styles.label, activeCount > 0 && styles.labelActive]}>
        Filters
      </Text>
      {activeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.textInverse,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
  },
});
