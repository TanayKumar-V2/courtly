import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_SPORTS } from '../../../src/constants';
import { AppHeader } from '../../../src/components/common/AppHeader';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { SearchInput } from '../../../src/components/common/SearchInput';
import { SportChip } from '../../../src/components/home/SportChip';
import { GameCard } from '../../../src/components/games/GameCard';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { useGames } from '../../../src/hooks/useGames';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { SkillLevel, SportType } from '../../../src/types';

const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export default function GamesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillLevel>('all');

  const { games } = useGames(selectedSport, selectedSkill, searchQuery);

  const handleCreateGame = () => {
    Alert.alert(
      'Create Game [Phase 1 Preview]',
      'Game hosting and player matchmaking will be enabled in Phase 2. Explore existing demo games below!',
      [{ text: 'Got It' }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <GameCard game={item} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <AppHeader
              greeting="Player Matchmaker"
              location="Bengaluru, Karnataka"
            />

            <View style={styles.contentHeader}>
              {/* Matchmaker Banner */}
              <View style={styles.matchmakerBanner}>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>⚡ COMMUNITY GAMES</Text>
                </View>
                <Text style={styles.bannerTitle}>Join an Open Game</Text>
                <Text style={styles.bannerText}>
                  Find teams short on players, join matches that fit your level, or host your own.
                </Text>
                <PrimaryButton
                  title="+ Host a Game"
                  size="sm"
                  onPress={handleCreateGame}
                  style={styles.hostButton}
                />
              </View>

              {/* Search */}
              <SearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search games, venues, locations..."
                style={styles.searchBar}
              />

              {/* Sports Filter */}
              <Text style={styles.filterLabel}>FILTER BY SPORT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                <SportChip
                  label="All Sports"
                  isSelected={selectedSport === null}
                  onPress={() => setSelectedSport(null)}
                />
                {DEMO_SPORTS.map((sport) => (
                  <SportChip
                    key={sport.id}
                    label={sport.name}
                    isSelected={selectedSport === sport.id}
                    onPress={() =>
                      setSelectedSport(selectedSport === sport.id ? null : sport.id)
                    }
                  />
                ))}
              </ScrollView>

              {/* Skill Filter */}
              <Text style={styles.filterLabel}>FILTER BY SKILL LEVEL</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {SKILL_LEVELS.map((skill) => (
                  <SportChip
                    key={skill.id}
                    label={skill.label}
                    isSelected={selectedSkill === skill.id}
                    onPress={() => setSelectedSkill(skill.id)}
                  />
                ))}
              </ScrollView>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {games.length} open community match{games.length === 1 ? '' : 'es'} available
                </Text>
                <Text style={styles.demoTag}>[Demo Callouts]</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.cardWrapper}>
            <EmptyState
              icon="⚽"
              title="No Games Found"
              description="No open games match your filter criteria. Try resetting your sport or skill level filter."
              actionTitle="Reset Filters"
              onActionPress={() => {
                setSelectedSport(null);
                setSelectedSkill('all');
                setSearchQuery('');
              }}
            />
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.section,
  },
  contentHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  matchmakerBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(198, 243, 107, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bannerBadge: {
    backgroundColor: 'rgba(198, 243, 107, 0.1)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  bannerBadgeText: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 9,
  },
  bannerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  bannerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  hostButton: {
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    paddingVertical: 2,
    paddingRight: spacing.lg,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  demoTag: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
  },
});
