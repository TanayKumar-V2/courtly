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
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react-native';
import {
  useOwnerVenue,
  useSubmitVenueForReview,
} from '../../../../../src/hooks/useOwnerVenues';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { PrimaryButton } from '../../../../../src/components/common/PrimaryButton';
import { VenueStatusBadge } from '../../../../../src/components/owner/VenueStatusBadge';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

export default function OwnerVenuePreviewScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { data, isLoading } = useOwnerVenue(venueId);
  const submitMutation = useSubmitVenueForReview(venueId || '');

  if (isLoading || !data?.venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Preparing preview..." />
      </SafeAreaView>
    );
  }

  const venue = data.venue;
  const canSubmit =
    (venue.status === 'DRAFT' || venue.status === 'REJECTED') &&
    venue.completion.isReadyToSubmit;

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      Alert.alert(
        'Submitted for Review',
        'Your venue listing has been submitted to administrators.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Cannot Submit', err?.message || 'Listing incomplete.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Listing Preview</Text>
        <VenueStatusBadge status={venue.status} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {venue.images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
          >
            {venue.images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: img.secureUrl }}
                style={styles.galleryImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.muted}>No photographs uploaded yet</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.sportsRow}>
            {venue.sports.map((sp) => (
              <View key={sp} style={styles.sportPill}>
                <Text style={styles.sportText}>{sp}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.name}>{venue.name}</Text>

          <View style={styles.infoRow}>
            <MapPin size={15} color={colors.primary} />
            <Text style={styles.infoText}>
              {[
                venue.addressLine1,
                venue.addressLine2,
                venue.locality,
                venue.city,
                venue.state,
                venue.postalCode,
                venue.country,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          <Text style={styles.description}>{venue.description}</Text>

          <Text style={styles.heading}>COURTS & HOURLY PRICING</Text>
          {venue.courts.map((c) => (
            <View key={c.id} style={styles.courtCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courtName}>{c.name}</Text>
                <Text style={styles.courtMeta}>
                  {c.sport} • {c.indoor ? 'Indoor' : 'Outdoor'}
                  {c.surfaceType ? ` • ${c.surfaceType}` : ''} • Up to{' '}
                  {c.maxPlayers} players
                </Text>
              </View>
              <Text style={styles.price}>
                {c.currency} {c.basePricePerHour}/hr
              </Text>
            </View>
          ))}

          <Text style={styles.heading}>AMENITIES</Text>
          <View style={styles.amenityWrap}>
            {venue.amenities.map((am) => (
              <View key={am.id} style={styles.amenityChip}>
                <Text style={styles.amenityText}>✓ {am.name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.heading}>VENUE CONTACT</Text>
          <View style={styles.contactCard}>
            <View style={styles.infoRow}>
              <Phone size={14} color={colors.primary} />
              <Text style={styles.infoText}>
                {venue.businessContactPhone || 'Not provided'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Mail size={14} color={colors.primary} />
              <Text style={styles.infoText}>
                {venue.businessContactEmail || 'Not provided'}
              </Text>
            </View>
          </View>

          {(venue.status === 'DRAFT' || venue.status === 'REJECTED') && (
            <PrimaryButton
              title="Submit Listing for Admin Review"
              onPress={handleSubmit}
              loading={submitMutation.isPending}
              disabled={!canSubmit}
              style={{ marginTop: spacing.lg }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  content: { paddingBottom: spacing.xxl + 24 },
  gallery: { height: 230 },
  galleryImage: { width: 380, height: 230 },
  noPhoto: {
    height: 160,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { ...typography.caption, color: colors.textMuted },
  body: { padding: spacing.lg },
  sportsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  sportPill: {
    backgroundColor: 'rgba(198,243,107,0.14)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  sportText: { ...typography.overline, color: colors.primary, fontWeight: '700' },
  name: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs },
  infoText: { ...typography.bodySecondary, color: colors.textSecondary, flex: 1 },
  description: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    lineHeight: 22,
    marginVertical: spacing.md,
  },
  heading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  courtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  courtName: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
  courtMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  price: { ...typography.bodyMedium, color: colors.primary, fontWeight: '800' },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  amenityChip: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
