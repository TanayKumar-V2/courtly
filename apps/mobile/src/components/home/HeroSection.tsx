import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const HeroSection: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>COURTLY MOBILE 1.0 • ANDROID</Text>
        </View>
      </View>

      <Text style={styles.headline}>
        Find Your <Text style={styles.headlineAccent}>Game.</Text>
        {'\n'}Find Your <Text style={styles.headlineAccent}>People.</Text>
      </Text>

      <Text style={styles.supportingText}>
        Discover sports venues, book your next game and connect with players around you.
      </Text>

      <View style={styles.featuresRow}>
        <View style={styles.featurePill}>
          <Text style={styles.featurePillIcon}>⚡</Text>
          <Text style={styles.featurePillText}>Instant Turf Booking</Text>
        </View>
        <View style={styles.featurePill}>
          <Text style={styles.featurePillIcon}>👥</Text>
          <Text style={styles.featurePillText}>Player Matchmaker</Text>
        </View>
        <View style={styles.featurePill}>
          <Text style={styles.featurePillIcon}>🛡️</Text>
          <Text style={styles.featurePillText}>Verified Venues</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderHighlight,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  badgeRow: {
    marginBottom: spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 243, 107, 0.1)',
    borderColor: 'rgba(198, 243, 107, 0.3)',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  liveText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  headline: {
    ...typography.h1,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  headlineAccent: {
    color: colors.primary,
  },
  supportingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  featurePillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  featurePillText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
});
