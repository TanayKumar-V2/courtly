import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DEMO_SPORTS } from '../../constants';
import { colors, radius, spacing, typography } from '../../theme';
import { PrimaryButton } from '../common/PrimaryButton';
import { SportType } from '../../types';

export const QuickSearchCard: React.FC = () => {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<SportType>('football');

  const handleSearch = () => {
    // Navigate to discover tab
    router.push('/(tabs)/discover' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Quick Book & Search</Text>
        <Text style={styles.demoNotice}>[Phase 1 Demo Controls]</Text>
      </View>

      {/* Sport Selector Chips */}
      <Text style={styles.inputLabel}>SELECT SPORT</Text>
      <View style={styles.sportsGrid}>
        {DEMO_SPORTS.map((sport) => {
          const isSelected = selectedSport === sport.id;
          return (
            <Pressable
              key={sport.id}
              onPress={() => setSelectedSport(sport.id)}
              style={({ pressed }) => [
                styles.sportChip,
                isSelected && styles.sportChipSelected,
                pressed && styles.sportChipPressed,
              ]}
            >
              <Text style={[styles.sportChipText, isSelected && styles.sportChipTextSelected]}>
                {sport.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Location Input Placeholder */}
      <View style={styles.fieldBlock}>
        <Text style={styles.inputLabel}>LOCATION</Text>
        <Pressable
          style={styles.inputField}
          onPress={() => router.push('/(tabs)/discover' as never)}
        >
          <Text style={styles.fieldIcon}>📍</Text>
          <Text style={styles.fieldText}>Indiranagar, Bengaluru (Demo)</Text>
          <Text style={styles.fieldChange}>Change</Text>
        </Pressable>
      </View>

      {/* Date Selector Placeholder */}
      <View style={styles.fieldBlock}>
        <Text style={styles.inputLabel}>DATE & TIME</Text>
        <Pressable
          style={styles.inputField}
          onPress={() => router.push('/(tabs)/discover' as never)}
        >
          <Text style={styles.fieldIcon}>📅</Text>
          <Text style={styles.fieldText}>Today, Prime Evening Slots</Text>
          <Text style={styles.fieldChange}>Select</Text>
        </Pressable>
      </View>

      <PrimaryButton
        title="Find Available Venues"
        onPress={handleSearch}
        style={styles.searchButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  demoNotice: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  inputLabel: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sportChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportChipSelected: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderColor: colors.primary,
  },
  sportChipPressed: {
    opacity: 0.8,
  },
  sportChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sportChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  fieldIcon: {
    fontSize: 13,
    marginRight: spacing.sm,
  },
  fieldText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  fieldChange: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  searchButton: {
    marginTop: spacing.xs,
  },
});
