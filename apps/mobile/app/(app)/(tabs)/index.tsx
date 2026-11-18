import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DEMO_SPORTS, DEMO_VENUES, DEMO_GAMES } from '../../../src/constants';
import { AppHeader } from '../../../src/components/common/AppHeader';
import { SectionHeader } from '../../../src/components/common/SectionHeader';
import { HeroSection } from '../../../src/components/home/HeroSection';
import { QuickSearchCard } from '../../../src/components/home/QuickSearchCard';
import { MatchmakerCard } from '../../../src/components/home/MatchmakerCard';
import { SportCard } from '../../../src/components/home/SportCard';
import { VenueCard } from '../../../src/components/venues/VenueCard';
import { GameCard } from '../../../src/components/games/GameCard';
import { colors, spacing } from '../../../src/theme';
import { SportCategory, SportType } from '../../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);

  const handleSportPress = (sport: SportCategory) => {
    setSelectedSport(sport.id);
    router.push('/(tabs)/discover' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION A: HEADER */}
        <AppHeader />

        {/* SECTION B: HERO */}
        <HeroSection />

        {/* SECTION C: QUICK SEARCH */}
        <QuickSearchCard />

        {/* SECTION D: SPORTS CATEGORIES */}
        <View style={styles.sectionPadding}>
          <SectionHeader
            title="Sports Categories"
            subtitle="Explore available venues across sports"
            actionText="View All"
            onActionPress={() => router.push('/(tabs)/discover' as never)}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportsScrollContent}
          >
            {DEMO_SPORTS.map((sport) => (
              <SportCard
                key={sport.id}
                sport={sport}
                isSelected={selectedSport === sport.id}
                onPress={handleSportPress}
              />
            ))}
          </ScrollView>
        </View>

        {/* SECTION E: COURTLY MATCHMAKER */}
        <MatchmakerCard />

        {/* SECTION F: FEATURED VENUES */}
        <View style={styles.sectionPadding}>
          <SectionHeader
            title="Featured Venues"
            subtitle="Top rated turf & court facilities in Bengaluru"
            actionText="Browse All"
            onActionPress={() => router.push('/(tabs)/discover' as never)}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.venuesScrollContent}
          >
            {DEMO_VENUES.map((venue) => (
              <VenueCard key={venue.id} venue={venue} compact />
            ))}
          </ScrollView>
        </View>

        {/* SECTION G: NEARBY GAMES */}
        <View style={styles.sectionPadding}>
          <SectionHeader
            title="Nearby Open Games"
            subtitle="Join a community match looking for extra players"
            actionText="Find More"
            onActionPress={() => router.push('/(tabs)/games' as never)}
          />
          {DEMO_GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
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
  sectionPadding: {
    paddingHorizontal: spacing.lg,
  },
  sportsScrollContent: {
    paddingRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
  venuesScrollContent: {
    paddingRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
});
