import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Building2,
  Check,
  ExternalLink,
  Layers,
  Mail,
  MapPin,
  Phone,
  Users,
  X,
} from 'lucide-react-native';
import { useVenueDetails } from '../hooks/useVenueDetails';
import { CourtlyMap } from '../../../components/maps/CourtlyMap';
import { openExternalMapNavigation } from '../../../services/maps/map-provider';
import { MAP_CONFIG } from '../../../services/maps/map-config';
import { LoadingIndicator } from '../../../components/common/LoadingIndicator';
import { ErrorState } from '../../../components/common/ErrorState';
import { PrimaryButton } from '../../../components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface VenueDetailsScreenProps {
  venueId: string;
}

export const VenueDetailsScreen: React.FC<VenueDetailsScreenProps> = ({
  venueId,
}) => {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useVenueDetails(venueId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator label="Loading venue details..." />
      </SafeAreaView>
    );
  }

  if (error || !data?.venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ErrorState
          title="Venue Unavailable"
          message={
            (error as Error)?.message ||
            'This venue is not publicly available.'
          }
          onRetry={() => {
            void refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const venue = data.venue;
  const images = venue.images || [];
  const hasCoords =
    venue.location.latitude !== null && venue.location.longitude !== null;

  const formattedAddress =
    venue.address.formatted ||
    [
      venue.address.addressLine1,
      venue.address.addressLine2,
      venue.address.locality,
      venue.address.city,
      venue.address.state,
      venue.address.postalCode,
      venue.address.country,
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* A. IMAGE GALLERY */}
        <View style={styles.galleryWrapper}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                  );
                  setActiveImageIndex(idx);
                }}
              >
                {images.map((img, idx) => (
                  <Pressable
                    key={img.id}
                    onPress={() => {
                      setActiveImageIndex(idx);
                      setViewerVisible(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`View photograph ${idx + 1} full screen`}
                  >
                    <Image
                      source={{ uri: img.secureUrl }}
                      style={styles.galleryImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {activeImageIndex + 1} / {images.length}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noPhotoBox}>
              <Building2 size={36} color={colors.textMuted} />
              <Text style={styles.noPhotoText}>No venue photos uploaded</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* B. VENUE INFORMATION */}
          <View style={styles.sportsRow}>
            {venue.sports.map((sport) => (
              <View key={sport} style={styles.sportPill}>
                <Text style={styles.sportText}>{sport}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.venueName}>{venue.name}</Text>

          <View style={styles.addressRow}>
            <MapPin size={15} color={colors.primary} />
            <Text style={styles.addressText}>{formattedAddress}</Text>
          </View>

          <View style={styles.metaStatsRow}>
            <View style={styles.metaStatBox}>
              <Layers size={16} color={colors.primary} />
              <View>
                <Text style={styles.metaStatValue}>
                  {venue.activeCourtCount}{' '}
                  {venue.activeCourtCount === 1 ? 'Court' : 'Courts'}
                </Text>
                <Text style={styles.metaStatLabel}>Active Facilities</Text>
              </View>
            </View>
            <View style={styles.metaStatBox}>
              <View>
                <Text style={styles.metaStatValue}>
                  {venue.startingPricePerHour
                    ? `${venue.currency === 'INR' ? '₹' : `${venue.currency} `}${Number(venue.startingPricePerHour).toFixed(0)}/hr`
                    : 'See courts'}
                </Text>
                <Text style={styles.metaStatLabel}>Starting Rate</Text>
              </View>
            </View>
          </View>

          {/* C. ABOUT */}
          {!!venue.description && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>ABOUT THIS VENUE</Text>
              <Text style={styles.description}>{venue.description}</Text>
            </View>
          )}

          {/* D. SPORTS AND COURTS */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              SPORTS & COURTS ({venue.courts.length})
            </Text>
            {venue.courts.map((court) => (
              <View key={court.id} style={styles.courtCard}>
                <View style={styles.courtHeader}>
                  <Text style={styles.courtName}>{court.name}</Text>
                  <Text style={styles.courtPrice}>
                    {court.currency === 'INR' ? '₹' : `${court.currency} `}
                    {Number(court.basePricePerHour).toFixed(0)}/hr
                  </Text>
                </View>

                <View style={styles.courtTagsRow}>
                  <View style={styles.courtTag}>
                    <Text style={styles.courtTagText}>{court.sport}</Text>
                  </View>
                  <View style={styles.courtTag}>
                    <Text style={styles.courtTagText}>
                      {court.indoor ? 'Indoor' : 'Outdoor'}
                    </Text>
                  </View>
                  {!!court.surfaceType && (
                    <View style={styles.courtTag}>
                      <Text style={styles.courtTagText}>
                        {court.surfaceType}
                      </Text>
                    </View>
                  )}
                  <View style={styles.courtTag}>
                    <Users size={11} color={colors.textSecondary} />
                    <Text style={styles.courtTagText}>
                      Max {court.maxPlayers}
                    </Text>
                  </View>
                </View>

                {!!court.description && (
                  <Text style={styles.courtDesc}>{court.description}</Text>
                )}
              </View>
            ))}
          </View>

          {/* E. AMENITIES */}
          {venue.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>AMENITIES</Text>
              <View style={styles.amenitiesWrap}>
                {venue.amenities.map((am) => (
                  <View key={am.id} style={styles.amenityChip}>
                    <Check size={13} color={colors.primary} />
                    <Text style={styles.amenityText}>{am.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* F. LOCATION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>LOCATION</Text>
            <View style={styles.locationCard}>
              <Text style={styles.locationCardAddress}>{formattedAddress}</Text>

              {hasCoords && (
                <View style={styles.miniMapBox}>
                  <CourtlyMap
                    initialCenter={{
                      latitude: venue.location.latitude!,
                      longitude: venue.location.longitude!,
                    }}
                    initialZoom={MAP_CONFIG.venueDetailZoom}
                    pinCoordinate={{
                      latitude: venue.location.latitude!,
                      longitude: venue.location.longitude!,
                    }}
                    interactive={false}
                    showControls={false}
                  />
                </View>
              )}

              {hasCoords && (
                <Pressable
                  onPress={() =>
                    openExternalMapNavigation(
                      venue.location.latitude!,
                      venue.location.longitude!,
                      venue.name,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Open venue location in Maps"
                  style={styles.directionsBtn}
                >
                  <ExternalLink size={15} color={colors.primary} />
                  <Text style={styles.directionsText}>Open in Maps</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* G. PUBLIC CONTACT */}
          {(venue.contact.phone || venue.contact.email) && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>PUBLIC CONTACT</Text>
              <View style={styles.contactCard}>
                {!!venue.contact.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={15} color={colors.primary} />
                    <Text style={styles.contactText}>{venue.contact.phone}</Text>
                  </View>
                )}
                {!!venue.contact.email && (
                  <View style={styles.contactRow}>
                    <Mail size={15} color={colors.primary} />
                    <Text style={styles.contactText}>{venue.contact.email}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* H. BOTTOM ACTION AREA (Disabled Booking Coming Soon) */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Starting hourly rate</Text>
          <Text style={styles.bottomPrice}>
            {venue.startingPricePerHour
              ? `${venue.currency === 'INR' ? '₹' : `${venue.currency} `}${Number(venue.startingPricePerHour).toFixed(0)} / hr`
              : 'Rates in courts'}
          </Text>
        </View>
        <PrimaryButton
          title="Booking coming soon"
          onPress={() => {}}
          disabled
          size="sm"
          style={styles.comingSoonBtn}
        />
      </View>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable
            onPress={() => setViewerVisible(false)}
            style={styles.viewerClose}
            accessibilityLabel="Close full screen image viewer"
          >
            <X size={24} color={colors.textPrimary} />
          </Pressable>
          {images[activeImageIndex] && (
            <Image
              source={{ uri: images[activeImageIndex].secureUrl }}
              style={styles.viewerImage}
              contentFit="contain"
            />
          )}
          <Text style={styles.viewerCounter}>
            {activeImageIndex + 1} / {images.length}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  galleryWrapper: {
    position: 'relative',
    height: 250,
    backgroundColor: colors.surfaceSecondary,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 250,
  },
  imageCounter: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(11, 17, 16, 0.85)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageCounterText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  noPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  noPhotoText: { ...typography.caption, color: colors.textMuted },
  body: { padding: spacing.lg },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  sportPill: {
    backgroundColor: 'rgba(198, 243, 107, 0.14)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  sportText: {
    ...typography.overline,
    color: colors.primary,
    fontWeight: '700',
  },
  venueName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: spacing.lg,
  },
  addressText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  metaStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaStatBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaStatValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  metaStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  section: { marginBottom: spacing.lg },
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
  },
  description: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  courtCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  courtName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  courtPrice: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '800',
  },
  courtTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  courtTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  courtTagText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  courtDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  locationCardAddress: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  miniMapBox: {
    height: 170,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniMap: { flex: 1 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(198, 243, 107, 0.1)',
  },
  directionsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactText: { ...typography.bodySecondary, color: colors.textPrimary },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomPriceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  bottomPrice: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
  },
  comingSoonBtn: {
    minWidth: 165,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: '75%',
  },
  viewerCounter: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: spacing.md,
    fontWeight: '700',
  },
});
