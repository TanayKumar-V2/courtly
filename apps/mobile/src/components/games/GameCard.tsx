import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../../theme';
import { Game } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface GameCardProps {
  game: Game;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/games/[gameId]',
      params: { gameId: game.id },
    } as never);
  };

  const getSkillVariant = (skill: string) => {
    switch (skill) {
      case 'beginner':
        return 'info';
      case 'advanced':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`View game ${game.title}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgesLeft}>
          <StatusBadge
            label={game.sport.toUpperCase()}
            variant="primary"
            size="sm"
          />
          <StatusBadge
            label={`${game.skillLevel.toUpperCase()} LEVEL`}
            variant={getSkillVariant(game.skillLevel)}
            size="sm"
          />
        </View>
        <StatusBadge label="Demo Game" variant="demo" size="sm" />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {game.title}
      </Text>

      <View style={styles.venueRow}>
        <Text style={styles.venueIcon}>🏟️</Text>
        <Text style={styles.venueText} numberOfLines={1}>
          {game.venueName} • {game.location}
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <View>
            <Text style={styles.detailLabel}>Schedule</Text>
            <Text style={styles.detailValue}>{game.date}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>⏰</Text>
          <View>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{game.time}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>👥</Text>
          <View>
            <Text style={styles.detailLabel}>Open Slots</Text>
            <Text style={styles.detailHighlight}>
              {game.playersNeeded} needed ({game.totalPlayers - game.playersNeeded}/{game.totalPlayers})
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.priceLabel}>Entry per player</Text>
          <Text style={styles.priceValue}>
            ₹{game.pricePerPerson}
            <Text style={styles.priceNote}> / player</Text>
          </Text>
        </View>

        <View style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join Game →</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgesLeft: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  venueIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  venueText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  detailLabel: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 8,
  },
  detailValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 10,
  },
  detailHighlight: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  priceValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
  },
  priceNote: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
  },
  joinButton: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(198, 243, 107, 0.4)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  joinButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
});
