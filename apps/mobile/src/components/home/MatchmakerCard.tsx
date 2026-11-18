import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../../theme';
import { PrimaryButton } from '../common/PrimaryButton';

export const MatchmakerCard: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topBadgeRow}>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeIcon}>✨</Text>
          <Text style={styles.aiBadgeText}>COURTLY MATCHMAKER</Text>
        </View>
        <Text style={styles.previewTag}>[Feature Preview]</Text>
      </View>

      <Text style={styles.headline}>
        Missing Players?{'\n'}
        <Text style={styles.headlineHighlight}>Find Your Team.</Text>
      </Text>

      <Text style={styles.description}>
        Find players near you and join games that match your skill level. Never let an empty slot
        cancel your weekly game again.
      </Text>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>500+</Text>
          <Text style={styles.metricLabel}>Active Players</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>95%</Text>
          <Text style={styles.metricLabel}>Game Fill Rate</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>6</Text>
          <Text style={styles.metricLabel}>Sports Supported</Text>
        </View>
      </View>

      <PrimaryButton
        title="Explore Games"
        onPress={() => router.push('/(tabs)/games' as never)}
        style={styles.ctaButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121F17',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(198, 243, 107, 0.3)',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(198, 243, 107, 0.4)',
  },
  aiBadgeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  aiBadgeText: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  previewTag: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  headline: {
    ...typography.h2,
    color: colors.textPrimary,
    lineHeight: 30,
  },
  headlineHighlight: {
    color: colors.primary,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  ctaButton: {
    marginTop: spacing.lg,
  },
});
