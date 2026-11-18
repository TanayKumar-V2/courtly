import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DEMO_GAMES } from '../../src/constants';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { colors, radius, spacing, typography } from '../../src/theme';

export default function GameDetailScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();

  const game = DEMO_GAMES.find((g) => g.id === gameId) || DEMO_GAMES[0];

  const handleJoin = () => {
    Alert.alert(
      'Join Game [Phase 2 Matchmaker]',
      `You requested to join ${game.title} hosted by ${game.hostName}. Player approvals and team rosters will be active in Phase 2.`,
      [{ text: 'Understood' }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <StatusBadge label="Demo Community Game" variant="demo" size="sm" />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          {/* Header Badges */}
          <View style={styles.badgesRow}>
            <StatusBadge
              label={game.sport.toUpperCase()}
              variant="primary"
              size="md"
            />
            <StatusBadge
              label={`${game.skillLevel.toUpperCase()} LEVEL`}
              variant="info"
              size="md"
            />
          </View>

          <Text style={styles.title}>{game.title}</Text>

          {/* Host Card */}
          <View style={styles.hostCard}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>{game.hostName.charAt(0)}</Text>
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>HOSTED BY</Text>
              <Text style={styles.hostName}>{game.hostName}</Text>
            </View>
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>Verified Host</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionHeading}>MATCH DETAILS</Text>
          <Text style={styles.description}>{game.description}</Text>

          {/* Schedule & Location */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>DATE & TIME</Text>
              <Text style={styles.infoValue}>
                {game.date} • {game.time}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🏟️</Text>
              <Text style={styles.infoLabel}>LOCATION & VENUE</Text>
              <Text style={styles.infoValue}>
                {game.venueName}
                {'\n'}
                <Text style={styles.infoSubtext}>{game.location}</Text>
              </Text>
            </View>
          </View>

          {/* Roster & Slot Progress */}
          <Text style={styles.sectionHeading}>ROSTER & OPEN SLOTS</Text>
          <View style={styles.rosterCard}>
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>
                {game.totalPlayers - game.playersNeeded} / {game.totalPlayers} Players Confirmed
              </Text>
              <Text style={styles.slotsRemaining}>
                {game.playersNeeded} slots open
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((game.totalPlayers - game.playersNeeded) / game.totalPlayers) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Price & Join CTA */}
          <View style={styles.pricingCard}>
            <View>
              <Text style={styles.priceLabel}>Entry per player</Text>
              <Text style={styles.priceAmount}>
                ₹{game.pricePerPerson}
                <Text style={styles.priceUnit}> / slot</Text>
              </Text>
            </View>
            <PrimaryButton
              title="Request to Join"
              onPress={handleJoin}
              style={styles.joinButton}
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.primary,
    fontSize: 18,
    marginRight: 4,
    fontWeight: '700',
  },
  backLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    padding: spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    ...typography.h4,
    color: colors.primary,
  },
  hostInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  hostLabel: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 9,
  },
  hostName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  hostBadge: {
    backgroundColor: 'rgba(198, 243, 107, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  hostBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  infoGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  infoLabel: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 9,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  infoSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  rosterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rosterTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  slotsRemaining: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  pricingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderHighlight,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  priceAmount: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  priceUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
  joinButton: {
    minWidth: 160,
  },
});
