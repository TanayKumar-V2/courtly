import React, { useEffect, useRef, useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import {
  OWNER_VENUES_KEY,
  ownerVenueKey,
  useOwnerVenue,
} from '../../../../../src/hooks/useOwnerVenues';
import { updateVenueLocation } from '../../../../../src/features/discovery/services/discovery-service';
import {
  CourtlyMap,
  type CourtlyMapHandle,
} from '../../../../../src/components/maps/CourtlyMap';
import { locationService } from '../../../../../src/services/location-service';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { PrimaryButton } from '../../../../../src/components/common/PrimaryButton';
import { SecondaryButton } from '../../../../../src/components/common/SecondaryButton';
import { TextInputField } from '../../../../../src/components/forms/TextInputField';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

export default function OwnerVenueLocationPickerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const mapRef = useRef<CourtlyMapHandle>(null);

  const { data, isLoading } = useOwnerVenue(venueId);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const venue = data?.venue;

  useEffect(() => {
    if (venue && venue.latitude !== null && venue.longitude !== null) {
      setLatInput(String(venue.latitude));
      setLngInput(String(venue.longitude));
    }
  }, [venue?.id]);

  if (isLoading || !venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator label="Loading venue location..." />
      </SafeAreaView>
    );
  }

  const parsedLat = latInput.trim() ? Number(latInput.trim()) : null;
  const parsedLng = lngInput.trim() ? Number(lngInput.trim()) : null;
  const hasValidPin =
    parsedLat !== null &&
    parsedLng !== null &&
    !Number.isNaN(parsedLat) &&
    !Number.isNaN(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180;

  const handleUseCurrentGps = async () => {
    setErrorMsg(null);
    setLocating(true);
    try {
      const result = await locationService.requestCurrentLocation();
      if (result.ok && result.coordinates) {
        const lat = Number(result.coordinates.latitude.toFixed(6));
        const lng = Number(result.coordinates.longitude.toFixed(6));
        setLatInput(String(lat));
        setLngInput(String(lng));
        mapRef.current?.flyTo(lng, lat, 16);
      } else {
        setErrorMsg(
          result.message ||
            'Could not read device GPS. Tap the map or enter latitude/longitude manually.',
        );
      }
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!hasValidPin) {
      setErrorMsg(
        'Please tap the map to place a pin or enter valid coordinates (Lat -90..90, Lng -180..180).',
      );
      return;
    }

    setSaving(true);
    try {
      await updateVenueLocation(venue.id, parsedLat!, parsedLng!);
      await queryClient.invalidateQueries({ queryKey: ownerVenueKey(venue.id) });
      await queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
      Alert.alert(
        'Location Saved',
        'Your venue map coordinates have been updated.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save venue coordinates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Venue Map Pin</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.desc}>
          Tap anywhere on the OpenFreeMap view to place or move your venue pin,
          use your current device GPS voluntarily, or enter coordinates manually.
        </Text>

        <View style={styles.mapBox}>
          <CourtlyMap
            ref={mapRef}
            initialCenter={
              hasValidPin
                ? { latitude: parsedLat!, longitude: parsedLng! }
                : undefined
            }
            initialZoom={hasValidPin ? 15 : 5}
            pinCoordinate={
              hasValidPin
                ? { latitude: parsedLat!, longitude: parsedLng! }
                : null
            }
            interactive
            showControls
            isLocating={locating}
            onLocateMe={handleUseCurrentGps}
            onMapBackgroundPress={([lng, lat]) => {
              setLatInput(lat.toFixed(6));
              setLngInput(lng.toFixed(6));
              setErrorMsg(null);
            }}
          />
        </View>

        <SecondaryButton
          title="Use My Current Location"
          onPress={handleUseCurrentGps}
          loading={locating}
          style={styles.gpsBtn}
        />

        {!!errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.coordsRow}>
          <View style={{ flex: 1 }}>
            <TextInputField
              label="Latitude (-90 to 90)"
              placeholder="e.g. 28.459500"
              keyboardType="numeric"
              value={latInput}
              onChangeText={setLatInput}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInputField
              label="Longitude (-180 to 180)"
              placeholder="e.g. 77.026600"
              keyboardType="numeric"
              value={lngInput}
              onChangeText={setLngInput}
            />
          </View>
        </View>

        <PrimaryButton
          title="Confirm & Save Coordinates"
          onPress={handleSave}
          loading={saving}
          disabled={!hasValidPin}
          style={styles.saveBtn}
        />
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 24 },
  desc: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  mapBox: {
    height: 300,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  gpsBtn: { marginBottom: spacing.md },
  errorBox: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  coordsRow: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: { marginTop: spacing.sm },
});
