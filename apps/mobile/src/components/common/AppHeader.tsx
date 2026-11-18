import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { DEMO_USER } from '../../constants';
import { colors, radius, spacing, typography } from '../../theme';
import { ConnectionBanner } from './ConnectionBanner';

export interface AppHeaderProps {
  greeting?: string;
  location?: string;
  showLocationSelector?: boolean;
  onLocationPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  greeting = 'Hey, Player! 👋',
  location = 'Indiranagar, Bengaluru',
  showLocationSelector = true,
  onLocationPress,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandingBlock}>
          <View style={styles.logoRow}>
            <Text style={styles.logoPrefix}>COURT</Text>
            <Text style={styles.logoSuffix}>LY</Text>
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>

        <View style={styles.actionsBlock}>
          <ConnectionBanner compact />
          <Pressable
            onPress={() => router.push('/(tabs)/profile' as never)}
            hitSlop={8}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarPressed]}
            accessibilityLabel="Open user profile"
          >
            <Image
              source={{ uri: DEMO_USER.avatar }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.avatarStatusBadge} />
          </Pressable>
        </View>
      </View>

      {showLocationSelector && (
        <Pressable
          onPress={onLocationPress}
          style={({ pressed }) => [styles.locationRow, pressed && styles.locationPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Change location, current is ${location}`}
        >
          <Text style={styles.pinIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
          <Text style={styles.chevron}>▾</Text>
          <Text style={styles.locationHint}>[Demo City]</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingBlock: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPrefix: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  logoSuffix: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginLeft: 3,
    marginBottom: 4,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarButton: {
    position: 'relative',
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderHighlight,
    overflow: 'hidden',
  },
  avatarPressed: {
    opacity: 0.8,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  locationPressed: {
    backgroundColor: colors.surfaceHover,
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  locationHint: {
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 6,
  },
});
