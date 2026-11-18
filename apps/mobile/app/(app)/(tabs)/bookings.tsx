import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../../src/components/common/AppHeader';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../../src/theme';

export default function BookingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader greeting="My Bookings" location="Bengaluru, Karnataka" />

        <View style={styles.content}>
          {/* Empty state presentation */}
          <View style={styles.emptyCard}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.illustrationIcon}>🎟️</Text>
            </View>

            <Text style={styles.headline}>Your next game starts here.</Text>

            <Text style={styles.subtext}>
              Book a turf, court, or join an open community game. Once reserved, your live slot
              passes and directions will appear here.
            </Text>

            <View style={styles.highlightsContainer}>
              <View style={styles.highlightRow}>
                <Text style={styles.highlightCheck}>✓</Text>
                <Text style={styles.highlightText}>Instant slot confirmation</Text>
              </View>
              <View style={styles.highlightRow}>
                <Text style={styles.highlightCheck}>✓</Text>
                <Text style={styles.highlightText}>Split payments with teammates (Future)</Text>
              </View>
              <View style={styles.highlightRow}>
                <Text style={styles.highlightCheck}>✓</Text>
                <Text style={styles.highlightText}>Calendar sync & matchday reminders</Text>
              </View>
            </View>

            <PrimaryButton
              title="Discover Venues"
              onPress={() => router.push('/(tabs)/discover' as never)}
              style={styles.ctaButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.section,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.borderHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  illustrationIcon: {
    fontSize: 36,
  },
  headline: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtext: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  highlightsContainer: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  highlightCheck: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
    marginRight: spacing.sm,
  },
  highlightText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  ctaButton: {
    width: '100%',
  },
});
