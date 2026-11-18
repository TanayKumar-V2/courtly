import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  useOwnerVenue,
  useUpdateOwnerVenue,
} from '../../../../../src/hooks/useOwnerVenues';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { PrimaryButton } from '../../../../../src/components/common/PrimaryButton';
import { TextInputField } from '../../../../../src/components/forms/TextInputField';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

export default function EditOwnerVenueScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { data, isLoading } = useOwnerVenue(venueId);
  const updateMutation = useUpdateOwnerVenue(venueId || '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const venue = data?.venue;

  useEffect(() => {
    if (!venue) return;
    setName(venue.name || '');
    setDescription(venue.description || '');
    setPhone(venue.businessContactPhone || '');
    setEmail(venue.businessContactEmail || '');
    setAddressLine1(venue.addressLine1 || '');
    setAddressLine2(venue.addressLine2 || '');
    setLocality(venue.locality || '');
    setCity(venue.city || '');
    setStateName(venue.state || '');
    setPostalCode(venue.postalCode || '');
    setCountry(venue.country || 'India');
    setLatitude(venue.latitude !== null ? String(venue.latitude) : '');
    setLongitude(venue.longitude !== null ? String(venue.longitude) : '');
  }, [venue?.id]);

  if (isLoading || !venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading venue details..." />
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setErrorMsg(null);
    if (name.trim().length < 2) {
      setErrorMsg('Venue name must be at least 2 characters.');
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;
    if (latitude.trim() || longitude.trim()) {
      lat = Number(latitude.trim());
      lng = Number(longitude.trim());
      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        setErrorMsg('Invalid latitude or longitude coordinates.');
        return;
      }
    }

    try {
      const res = await updateMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        businessContactPhone: phone.trim(),
        businessContactEmail: email.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        locality: locality.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        latitude: lat,
        longitude: lng,
      });

      Alert.alert(
        res.reReviewTriggered ? 'Re-Review Required' : 'Changes Saved',
        res.message,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update venue.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Venue</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {venue.status === 'APPROVED' && (
            <View style={styles.noticeBanner}>
              <Text style={styles.noticeText}>
                Updating description or contact details keeps your venue live.
                Changing the venue name or physical address requires
                administrator re-review.
              </Text>
            </View>
          )}

          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TextInputField label="Venue Name *" value={name} onChangeText={setName} />
          <TextInputField
            label="Description *"
            multiline
            numberOfLines={4}
            style={styles.multiline}
            value={description}
            onChangeText={setDescription}
          />
          <TextInputField
            label="Business Contact Phone *"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInputField
            label="Business Contact Email *"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInputField
            label="Address Line 1 *"
            value={addressLine1}
            onChangeText={setAddressLine1}
          />
          <TextInputField
            label="Address Line 2"
            value={addressLine2}
            onChangeText={setAddressLine2}
          />
          <TextInputField
            label="Locality *"
            value={locality}
            onChangeText={setLocality}
          />
          <View style={styles.rowTwo}>
            <View style={styles.flex}>
              <TextInputField label="City *" value={city} onChangeText={setCity} />
            </View>
            <View style={styles.flex}>
              <TextInputField
                label="State *"
                value={stateName}
                onChangeText={setStateName}
              />
            </View>
          </View>
          <View style={styles.rowTwo}>
            <View style={styles.flex}>
              <TextInputField
                label="Postal Code *"
                value={postalCode}
                onChangeText={setPostalCode}
              />
            </View>
            <View style={styles.flex}>
              <TextInputField
                label="Country *"
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>
          <View style={styles.rowTwo}>
            <View style={styles.flex}>
              <TextInputField
                label="Latitude"
                keyboardType="numeric"
                value={latitude}
                onChangeText={setLatitude}
              />
            </View>
            <View style={styles.flex}>
              <TextInputField
                label="Longitude"
                keyboardType="numeric"
                value={longitude}
                onChangeText={setLongitude}
              />
            </View>
          </View>

          <PrimaryButton
            title="Save Changes"
            onPress={handleSave}
            loading={updateMutation.isPending}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  noticeBanner: {
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { ...typography.caption, color: colors.warning, lineHeight: 18 },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.sm },
  rowTwo: { flexDirection: 'row', gap: spacing.sm },
});
