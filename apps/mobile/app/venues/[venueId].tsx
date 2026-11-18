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
import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { DEMO_VENUES } from '../../src/constants';
import { VenueDetailsScreen } from '../../src/features/discovery/screens/VenueDetailsScreen';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { colors, radius, spacing, typography } from '../../src/theme';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function VenueDetailRoute() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  // All real PostgreSQL venues use UUIDs and render the full Phase 4 VenueDetailsScreen
  if (venueId && UUID_REGEX.test(venueId)) {
    return <VenueDetailsScreen venueId={venueId} />;
  }

  // Fallback for Phase 1 sample showcase cards on Home
  const demoVenue = DEMO_VENUES.find((v) => v.id === venueId) || DEMO_VENUES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <StatusBadge label="Sample Preview" variant="demo" size="sm" />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: demoVenue.image }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
        <View style={styles.body}>
          <View style={styles.sportsRow}>
            {demoVenue.sports.map((sport) => (
              <StatusBadge
                key={sport}
                label={sport.toUpperCase()}
                variant="primary"
                size="sm"
              />
            ))}
          </View>
          <Text style={styles.venueName}>{demoVenue.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.primary} />
            <Text style={styles.locationText}>
              {demoVenue.address}, {demoVenue.city}
            </Text>
          </View>
          <Text style={styles.sectionHeading}>FACILITY AMENITIES</Text>
          <View style={styles.amenitiesGrid}>
            {demoVenue.amenities.map((amenity, idx) => (
              <View key={idx} style={styles.amenityChip}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
          <View style={styles.pricingCard}>
            <View>
              <Text style={styles.priceLabel}>Starting Slot Rate</Text>
              <Text style={styles.priceAmount}>
                ₹{demoVenue.startingPrice}
                <Text style={styles.priceUnit}> / hour</Text>
              </Text>
            </View>
            <PrimaryButton
              title="Booking coming soon"
              disabled
              onPress={() =>
                Alert.alert(
                  'Booking Coming Soon',
                  'Court availability and payments arrive in Phase 5.',
                )
              }
              style={styles.bookButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  contentContainer: { paddingBottom: spacing.section },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backIcon: {
    color: colors.primary,
    fontSize: 18,
    marginRight: 4,
    fontWeight: '700',
  },
  backLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  imageContainer: { height: 220, backgroundColor: colors.surfaceSecondary },
  image: { width: '100%', height: '100%' },
  body: { padding: spacing.lg },
  sportsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  venueName: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  locationText: { ...typography.bodySecondary, color: colors.textSecondary, flex: 1 },
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkIcon: { color: colors.primary, fontSize: 12, fontWeight: '800', marginRight: spacing.xs },
  amenityText: { ...typography.caption, color: colors.textPrimary, fontWeight: '500' },
  pricingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderHighlight,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  priceLabel: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  priceAmount: { ...typography.h3, color: colors.primary, fontWeight: '800' },
  priceUnit: { ...typography.caption, color: colors.textSecondary, fontSize: 12, fontWeight: '400' },
  bookButton: { minWidth: 155 },
});
