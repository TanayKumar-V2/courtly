import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';

export const VenueSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.card} testID="venue-skeleton">
          <View style={styles.imageBlock} />
          <View style={styles.body}>
            <View style={styles.pillRow}>
              <View style={styles.pill} />
              <View style={styles.pill} />
            </View>
            <View style={styles.titleLine} />
            <View style={styles.subLine} />
            <View style={styles.footerLine} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageBlock: {
    height: 165,
    backgroundColor: colors.surfaceSecondary,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    width: 64,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  titleLine: {
    width: '72%',
    height: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  subLine: {
    width: '50%',
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  footerLine: {
    width: '100%',
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.xs,
  },
});
