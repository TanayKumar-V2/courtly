import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react-native';
import { Sport } from '../../../../src/auth/auth-types';
import {
  useAmenitiesCatalogue,
  useCreateCourt,
  useCreateOwnerVenue,
  useDeleteCourt,
  useDeleteVenueImage,
  useOwnerVenue,
  useReplaceVenueAmenities,
  useSetCoverVenueImage,
  useSubmitVenueForReview,
  useUpdateOwnerVenue,
  useUploadVenueImage,
} from '../../../../src/hooks/useOwnerVenues';
import { LocalImageFile } from '../../../../src/services/venue-image-service';
import { PrimaryButton } from '../../../../src/components/common/PrimaryButton';
import { SecondaryButton } from '../../../../src/components/common/SecondaryButton';
import { TextInputField } from '../../../../src/components/forms/TextInputField';
import { VenueStatusBadge } from '../../../../src/components/owner/VenueStatusBadge';
import { colors, radius, spacing, typography } from '../../../../src/theme';

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Courts' },
  { id: 4, label: 'Amenities' },
  { id: 5, label: 'Photos' },
  { id: 6, label: 'Preview' },
];

const SPORTS: Sport[] = [
  'FOOTBALL',
  'CRICKET',
  'BADMINTON',
  'TENNIS',
  'BASKETBALL',
  'PADEL',
  'OTHER',
];

const SURFACE_OPTIONS = [
  'Artificial Turf',
  'Wooden / Hardwood',
  'Synthetic Acrylic',
  'Clay / Natural Grass',
  'Concrete',
];

interface UploadQueueItem {
  id: string;
  file: LocalImageFile;
  progress: number;
  status: 'uploading' | 'error';
  error?: string;
}

export default function CreateVenueWizardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ venueId?: string }>();

  const [step, setStep] = useState(1);
  const [venueId, setVenueId] = useState<string | undefined>(params.venueId);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [submittedState, setSubmittedState] = useState(false);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Step 2: Location
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Step 3: Court Form
  const [courtName, setCourtName] = useState('');
  const [courtSport, setCourtSport] = useState<Sport>('FOOTBALL');
  const [courtSurface, setCourtSurface] = useState('Artificial Turf');
  const [courtIndoor, setCourtIndoor] = useState(false);
  const [courtMaxPlayers, setCourtMaxPlayers] = useState('10');
  const [courtPrice, setCourtPrice] = useState('');

  // Step 4: Amenities
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  // Step 5: Upload Queue
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Queries & Mutations
  const { data: venueData, refetch: refetchVenue } = useOwnerVenue(venueId);
  const { data: amenitiesData, isLoading: amenitiesLoading } =
    useAmenitiesCatalogue();
  const createVenueMutation = useCreateOwnerVenue();
  const updateVenueMutation = useUpdateOwnerVenue(venueId || '');
  const createCourtMutation = useCreateCourt(venueId || '');
  const deleteCourtMutation = useDeleteCourt(venueId || '');
  const replaceAmenitiesMutation = useReplaceVenueAmenities(venueId || '');
  const uploadImageMutation = useUploadVenueImage(venueId || '');
  const deleteImageMutation = useDeleteVenueImage(venueId || '');
  const setCoverMutation = useSetCoverVenueImage(venueId || '');
  const submitReviewMutation = useSubmitVenueForReview(venueId || '');

  const venue = venueData?.venue;

  // Hydrate fields when continuing an existing draft
  useEffect(() => {
    if (!venue) return;
    setName((prev) => prev || venue.name || '');
    setDescription((prev) => prev || venue.description || '');
    setContactPhone((prev) => prev || venue.businessContactPhone || '');
    setContactEmail((prev) => prev || venue.businessContactEmail || '');
    setAddressLine1((prev) => prev || venue.addressLine1 || '');
    setAddressLine2((prev) => prev || venue.addressLine2 || '');
    setLocality((prev) => prev || venue.locality || '');
    setCity((prev) => prev || venue.city || '');
    setStateName((prev) => prev || venue.state || '');
    setPostalCode((prev) => prev || venue.postalCode || '');
    setCountry((prev) => prev || venue.country || 'India');
    if (venue.latitude !== null && !latitude) setLatitude(String(venue.latitude));
    if (venue.longitude !== null && !longitude)
      setLongitude(String(venue.longitude));
    if (venue.amenities.length > 0 && selectedAmenityIds.length === 0) {
      setSelectedAmenityIds(venue.amenities.map((a) => a.id));
    }
  }, [venue?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handleSaveStep1 = async (stayDraft = false) => {
    setErrorMsg(null);
    if (name.trim().length < 2) {
      setErrorMsg('Venue name must be at least 2 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMsg('Please enter a short description (at least 10 characters).');
      return;
    }
    if (contactPhone.trim().length < 7) {
      setErrorMsg('Please enter a valid business contact phone number.');
      return;
    }
    if (!contactEmail.includes('@')) {
      setErrorMsg('Please enter a valid business contact email.');
      return;
    }

    try {
      if (!venueId) {
        const res = await createVenueMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          businessContactPhone: contactPhone.trim(),
          businessContactEmail: contactEmail.trim(),
          currency: 'INR',
        });
        setVenueId(res.venue.id);
        showToast('Draft created and saved to Courtly.');
      } else {
        await updateVenueMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          businessContactPhone: contactPhone.trim(),
          businessContactEmail: contactEmail.trim(),
        });
        showToast('Basic info saved.');
      }

      if (stayDraft) {
        router.replace('/owner' as any);
      } else {
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save venue draft.');
    }
  };

  const handleSaveStep2 = async (stayDraft = false) => {
    setErrorMsg(null);
    if (
      !addressLine1.trim() ||
      !locality.trim() ||
      !city.trim() ||
      !stateName.trim() ||
      !postalCode.trim() ||
      !country.trim()
    ) {
      setErrorMsg(
        'Please complete Address Line 1, Locality, City, State, Postal Code, and Country.',
      );
      return;
    }

    let parsedLat: number | undefined;
    let parsedLng: number | undefined;
    if (latitude.trim() || longitude.trim()) {
      parsedLat = Number(latitude.trim());
      parsedLng = Number(longitude.trim());
      if (
        Number.isNaN(parsedLat) ||
        Number.isNaN(parsedLng) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLng < -180 ||
        parsedLng > 180
      ) {
        setErrorMsg(
          'Enter valid coordinates (Latitude -90 to 90, Longitude -180 to 180).',
        );
        return;
      }
    }

    try {
      await updateVenueMutation.mutateAsync({
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        locality: locality.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
      });
      showToast('Location saved.');
      if (stayDraft) {
        router.replace('/owner' as any);
      } else {
        setStep(3);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update venue location.');
    }
  };

  const handleAddCourt = async () => {
    setErrorMsg(null);
    if (!venueId) return;
    const maxP = parseInt(courtMaxPlayers, 10);
    const price = Number(courtPrice);

    if (courtName.trim().length < 2) {
      setErrorMsg('Court name is required.');
      return;
    }
    if (!Number.isInteger(maxP) || maxP <= 0) {
      setErrorMsg('Maximum player capacity must be a positive whole number.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setErrorMsg('Base hourly price must be greater than zero.');
      return;
    }

    try {
      await createCourtMutation.mutateAsync({
        name: courtName.trim(),
        sport: courtSport,
        surfaceType: courtSurface,
        indoor: courtIndoor,
        maxPlayers: maxP,
        basePricePerHour: price,
        currency: venue?.currency || 'INR',
      });
      setCourtName('');
      setCourtPrice('');
      await refetchVenue();
      showToast('Court added.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add court.');
    }
  };

  const handleDeleteCourt = (courtId: string) => {
    Alert.alert('Remove Court', 'Remove this court from your venue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCourtMutation.mutateAsync(courtId);
            await refetchVenue();
          } catch (err: any) {
            setErrorMsg(err?.message || 'Failed to remove court.');
          }
        },
      },
    ]);
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSaveStep4 = async (stayDraft = false) => {
    setErrorMsg(null);
    if (selectedAmenityIds.length === 0) {
      setErrorMsg('Please select at least one amenity for your venue.');
      return;
    }

    try {
      await replaceAmenitiesMutation.mutateAsync(selectedAmenityIds);
      await refetchVenue();
      showToast('Amenities saved.');
      if (stayDraft) {
        router.replace('/owner' as any);
      } else {
        setStep(5);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save amenities.');
    }
  };

  const runSingleUpload = async (itemId: string, file: LocalImageFile) => {
    if (!venueId) return;
    setUploadQueue((prev) =>
      prev.map((q) =>
        q.id === itemId
          ? { ...q, status: 'uploading', progress: 5, error: undefined }
          : q,
      ),
    );

    try {
      await uploadImageMutation.mutateAsync({
        file,
        onProgress: (pct) => {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === itemId ? { ...q, progress: pct } : q)),
          );
        },
      });
      setUploadQueue((prev) => prev.filter((q) => q.id !== itemId));
      await refetchVenue();
      showToast('Photograph verified & uploaded.');
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? {
                ...q,
                status: 'error',
                error: err?.message || 'Upload failed',
              }
            : q,
        ),
      );
    }
  };

  const handlePickImages = async () => {
    setErrorMsg(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMsg(
        'Photo library permission is required to upload venue photographs.',
      );
      return;
    }

    const currentCount = (venue?.images?.length || 0) + uploadQueue.length;
    const remaining = Math.max(0, 10 - currentCount);
    if (remaining === 0) {
      setErrorMsg('Maximum of 10 photographs per venue reached.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) return;

    const newItems: UploadQueueItem[] = pickerResult.assets.map((asset, idx) => ({
      id: `upload_${Date.now()}_${idx}`,
      file: {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      },
      progress: 0,
      status: 'uploading',
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      await runSingleUpload(item.id, item.file);
    }
  };

  const handleSubmitForReview = async () => {
    setErrorMsg(null);
    if (!venueId) return;
    try {
      await submitReviewMutation.mutateAsync();
      await refetchVenue();
      setSubmittedState(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to submit venue for review.');
    }
  };

  if (submittedState && venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.submittedContainer}>
          <CheckCircle2 size={56} color={colors.primary} />
          <View style={{ marginVertical: spacing.md }}>
            <VenueStatusBadge status="PENDING_REVIEW" />
          </View>
          <Text style={styles.submittedTitle}>Submitted for Review</Text>
          <Text style={styles.submittedSubtitle}>
            {venue.name} has been submitted to Courtly administrators for
            verification. It will become publicly visible in Discover once
            approved.
          </Text>
          <PrimaryButton
            title="Go to Owner Dashboard"
            onPress={() => router.replace('/owner' as any)}
            style={styles.fullWidthBtn}
          />
          <SecondaryButton
            title="View Venue Status"
            onPress={() =>
              router.replace({
                pathname: '/owner/venues/[venueId]',
                params: { venueId: venue.id },
              } as any)
            }
            style={styles.fullWidthBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>
            {venueId ? 'Edit Venue Draft' : 'Create Venue'}
          </Text>
          <Text style={styles.stepSubtitle}>
            Step {step} of {STEPS.length}: {STEPS[step - 1].label}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressTrack}>
        {STEPS.map((s) => (
          <View
            key={s.id}
            style={[
              styles.progressSegment,
              s.id <= step && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      {!!toastMsg && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Text style={styles.sectionDesc}>
                Tell players about your sports venue and how to reach the front
                desk.
              </Text>

              <TextInputField
                label="Venue Name *"
                placeholder="e.g. Skyline Turf & Badminton Club"
                value={name}
                onChangeText={setName}
              />

              <TextInputField
                label="Description *"
                placeholder="Describe playing surfaces, lighting, parking, and atmosphere..."
                multiline
                numberOfLines={4}
                style={styles.multiline}
                value={description}
                onChangeText={setDescription}
              />

              <TextInputField
                label="Business Contact Phone *"
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />

              <TextInputField
                label="Business Contact Email *"
                placeholder="desk@yourvenue.in"
                keyboardType="email-address"
                autoCapitalize="none"
                value={contactEmail}
                onChangeText={setContactEmail}
              />

              <PrimaryButton
                title="Save & Continue to Location"
                onPress={() => handleSaveStep1(false)}
                loading={
                  createVenueMutation.isPending || updateVenueMutation.isPending
                }
                style={styles.btnGap}
              />
              <SecondaryButton
                title="Save as Draft & Exit"
                onPress={() => handleSaveStep1(true)}
                disabled={
                  createVenueMutation.isPending || updateVenueMutation.isPending
                }
              />
            </View>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Venue Location</Text>
              <Text style={styles.sectionDesc}>
                Provide the complete physical address so players can find your
                facility easily.
              </Text>

              <TextInputField
                label="Address Line 1 *"
                placeholder="Street address, building or plot number"
                value={addressLine1}
                onChangeText={setAddressLine1}
              />

              <TextInputField
                label="Address Line 2 (Optional)"
                placeholder="Landmark, floor, or complex wing"
                value={addressLine2}
                onChangeText={setAddressLine2}
              />

              <TextInputField
                label="Locality / Area *"
                placeholder="e.g. Indiranagar"
                value={locality}
                onChangeText={setLocality}
              />

              <View style={styles.rowTwo}>
                <View style={styles.flex}>
                  <TextInputField
                    label="City *"
                    placeholder="Bengaluru"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={styles.flex}>
                  <TextInputField
                    label="State *"
                    placeholder="Karnataka"
                    value={stateName}
                    onChangeText={setStateName}
                  />
                </View>
              </View>

              <View style={styles.rowTwo}>
                <View style={styles.flex}>
                  <TextInputField
                    label="Postal Code *"
                    placeholder="560038"
                    value={postalCode}
                    onChangeText={setPostalCode}
                  />
                </View>
                <View style={styles.flex}>
                  <TextInputField
                    label="Country *"
                    placeholder="India"
                    value={country}
                    onChangeText={setCountry}
                  />
                </View>
              </View>

              <View style={styles.rowTwo}>
                <View style={styles.flex}>
                  <TextInputField
                    label="Latitude (Optional)"
                    placeholder="e.g. 12.971599"
                    keyboardType="numeric"
                    value={latitude}
                    onChangeText={setLatitude}
                  />
                </View>
                <View style={styles.flex}>
                  <TextInputField
                    label="Longitude (Optional)"
                    placeholder="e.g. 77.594563"
                    keyboardType="numeric"
                    value={longitude}
                    onChangeText={setLongitude}
                  />
                </View>
              </View>

              <PrimaryButton
                title="Save & Continue to Courts"
                onPress={() => handleSaveStep2(false)}
                loading={updateVenueMutation.isPending}
                style={styles.btnGap}
              />
              <SecondaryButton
                title="Save Draft & Exit"
                onPress={() => handleSaveStep2(true)}
              />
            </View>
          )}

          {/* STEP 3: SPORTS AND COURTS */}
          {step === 3 && (
            <View>
              <Text style={styles.sectionTitle}>Sports & Courts</Text>
              <Text style={styles.sectionDesc}>
                Add each bookable court or turf with its sport category,
                capacity, and hourly rate ({venue?.currency || 'INR'}).
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardHeading}>Add a Court</Text>

                <TextInputField
                  label="Court Name *"
                  placeholder="e.g. 5v5 Turf Pitch A"
                  value={courtName}
                  onChangeText={setCourtName}
                />

                <Text style={styles.miniLabel}>Sport Category *</Text>
                <View style={styles.chipWrap}>
                  {SPORTS.map((sp) => (
                    <Pressable
                      key={sp}
                      onPress={() => setCourtSport(sp)}
                      style={[
                        styles.chip,
                        courtSport === sp && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          courtSport === sp && styles.chipTextActive,
                        ]}
                      >
                        {sp}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.miniLabel}>Surface Type</Text>
                <View style={styles.chipWrap}>
                  {SURFACE_OPTIONS.map((surf) => (
                    <Pressable
                      key={surf}
                      onPress={() => setCourtSurface(surf)}
                      style={[
                        styles.chip,
                        courtSurface === surf && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          courtSurface === surf && styles.chipTextActive,
                        ]}
                      >
                        {surf}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Indoor Facility</Text>
                  <Switch
                    value={courtIndoor}
                    onValueChange={setCourtIndoor}
                    trackColor={{
                      false: colors.surfaceSecondary,
                      true: colors.primary,
                    }}
                    thumbColor={colors.textPrimary}
                  />
                </View>

                <View style={styles.rowTwo}>
                  <View style={styles.flex}>
                    <TextInputField
                      label="Max Players *"
                      placeholder="10"
                      keyboardType="number-pad"
                      value={courtMaxPlayers}
                      onChangeText={setCourtMaxPlayers}
                    />
                  </View>
                  <View style={styles.flex}>
                    <TextInputField
                      label={`Hourly Price (${venue?.currency || 'INR'}) *`}
                      placeholder="1500"
                      keyboardType="decimal-pad"
                      value={courtPrice}
                      onChangeText={setCourtPrice}
                    />
                  </View>
                </View>

                <PrimaryButton
                  title="+ Add Court"
                  size="sm"
                  onPress={handleAddCourt}
                  loading={createCourtMutation.isPending}
                />
              </View>

              <Text style={styles.subHeading}>
                Configured Courts ({venue?.courts?.length || 0})
              </Text>

              {venue?.courts && venue.courts.length > 0 ? (
                venue.courts.map((c) => (
                  <View key={c.id} style={styles.courtRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courtTitle}>{c.name}</Text>
                      <Text style={styles.courtMeta}>
                        {c.sport} • {c.indoor ? 'Indoor' : 'Outdoor'} • Max{' '}
                        {c.maxPlayers} players
                      </Text>
                      <Text style={styles.courtPrice}>
                        {c.currency} {c.basePricePerHour} / hr
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteCourt(c.id)}
                      style={styles.iconDangerBtn}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.mutedNote}>
                  Add at least one active court before submitting your venue.
                </Text>
              )}

              <PrimaryButton
                title="Continue to Amenities"
                onPress={() => {
                  if (!venue?.courts?.length) {
                    setErrorMsg('Please add at least one court to continue.');
                    return;
                  }
                  setErrorMsg(null);
                  setStep(4);
                }}
                style={styles.btnGap}
              />
            </View>
          )}

          {/* STEP 4: AMENITIES */}
          {step === 4 && (
            <View>
              <Text style={styles.sectionTitle}>Facility Amenities</Text>
              <Text style={styles.sectionDesc}>
                Select all available facilities from the Courtly catalogue.
              </Text>

              {amenitiesLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.amenityGrid}>
                  {(amenitiesData?.amenities || []).map((am) => {
                    const selected = selectedAmenityIds.includes(am.id);
                    return (
                      <Pressable
                        key={am.id}
                        onPress={() => toggleAmenity(am.id)}
                        style={[
                          styles.amenityTile,
                          selected && styles.amenityTileSelected,
                        ]}
                      >
                        <View style={styles.amenityTileHeader}>
                          <Text
                            style={[
                              styles.amenityName,
                              selected && styles.amenityNameSelected,
                            ]}
                          >
                            {am.name}
                          </Text>
                          {selected && (
                            <Check size={15} color={colors.textInverse} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.amenityCategory,
                            selected && styles.amenityCategorySelected,
                          ]}
                        >
                          {am.category.replace('_', ' ')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <PrimaryButton
                title={`Save ${selectedAmenityIds.length} Amenities & Continue`}
                onPress={() => handleSaveStep4(false)}
                loading={replaceAmenitiesMutation.isPending}
                style={styles.btnGap}
              />
              <SecondaryButton
                title="Save Draft & Exit"
                onPress={() => handleSaveStep4(true)}
              />
            </View>
          )}

          {/* STEP 5: PHOTOGRAPHS */}
          {step === 5 && (
            <View>
              <Text style={styles.sectionTitle}>Venue Photographs</Text>
              <Text style={styles.sectionDesc}>
                Upload up to 10 high-resolution photos (JPEG, PNG, WebP, max 8
                MB each). Images are securely verified via Cloudinary.
              </Text>

              <Pressable
                onPress={handlePickImages}
                style={styles.uploadDropzone}
              >
                <Camera size={28} color={colors.primary} />
                <Text style={styles.uploadTitle}>Select Venue Photographs</Text>
                <Text style={styles.uploadSub}>
                  {venue?.images?.length || 0} / 10 uploaded • Tap to choose
                  from gallery
                </Text>
              </Pressable>

              {/* Active / Failed Upload Queue */}
              {uploadQueue.map((item) => (
                <View key={item.id} style={styles.queueCard}>
                  <Image
                    source={{ uri: item.file.uri }}
                    style={styles.queueThumb}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.queueTitle}>
                      {item.status === 'uploading'
                        ? `Uploading... ${item.progress}%`
                        : 'Upload Failed'}
                    </Text>
                    {item.status === 'uploading' ? (
                      <View style={styles.uploadBarBg}>
                        <View
                          style={[
                            styles.uploadBarFill,
                            { width: `${item.progress}%` },
                          ]}
                        />
                      </View>
                    ) : (
                      <Text style={styles.errorText}>{item.error}</Text>
                    )}
                  </View>
                  {item.status === 'error' && (
                    <Pressable
                      onPress={() => runSingleUpload(item.id, item.file)}
                      style={styles.retryBtn}
                    >
                      <RefreshCw size={15} color={colors.primary} />
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Saved Verified Photos */}
              {(venue?.images || []).map((img) => (
                <View key={img.id} style={styles.photoCard}>
                  <Image
                    source={{ uri: img.secureUrl }}
                    style={styles.photoPreview}
                    contentFit="cover"
                  />
                  <View style={styles.photoActions}>
                    <Pressable
                      onPress={async () => {
                        await setCoverMutation.mutateAsync(img.id);
                        await refetchVenue();
                      }}
                      style={[
                        styles.coverChip,
                        img.isCover && styles.coverChipActive,
                      ]}
                    >
                      <Star
                        size={13}
                        color={
                          img.isCover ? colors.textInverse : colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.coverChipText,
                          img.isCover && styles.coverChipTextActive,
                        ]}
                      >
                        {img.isCover ? 'Cover Photo' : 'Set as Cover'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        await deleteImageMutation.mutateAsync(img.id);
                        await refetchVenue();
                      }}
                      style={styles.iconDangerBtn}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}

              <PrimaryButton
                title="Continue to Preview & Submit"
                onPress={() => setStep(6)}
                style={styles.btnGap}
              />
            </View>
          )}

          {/* STEP 6: PREVIEW & SUBMISSION */}
          {step === 6 && venue && (
            <View>
              <Text style={styles.sectionTitle}>Preview & Submit</Text>
              <Text style={styles.sectionDesc}>
                Review your listing before sending it to Courtly administrators.
                Venues are only published after admin approval.
              </Text>

              <View style={styles.previewCard}>
                {venue.coverImage?.secureUrl ? (
                  <Image
                    source={{ uri: venue.coverImage.secureUrl }}
                    style={styles.previewCover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.previewNoCover}>
                    <Text style={styles.mutedNote}>No cover photo uploaded</Text>
                  </View>
                )}

                <View style={styles.previewBody}>
                  <VenueStatusBadge status={venue.status} />
                  <Text style={styles.previewName}>{venue.name}</Text>
                  <Text style={styles.previewAddr}>
                    {[
                      venue.addressLine1,
                      venue.locality,
                      venue.city,
                      venue.state,
                      venue.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                  <Text style={styles.previewDesc}>{venue.description}</Text>

                  <Text style={styles.miniLabel}>
                    COURTS ({venue.courts.length})
                  </Text>
                  {venue.courts.map((c) => (
                    <Text key={c.id} style={styles.previewListItem}>
                      • {c.name} ({c.sport}) — {c.currency} {c.basePricePerHour}
                      /hr
                    </Text>
                  ))}

                  <Text style={[styles.miniLabel, { marginTop: spacing.sm }]}>
                    AMENITIES ({venue.amenities.length})
                  </Text>
                  <Text style={styles.previewListItem}>
                    {venue.amenities.map((a) => a.name).join(' • ') || 'None'}
                  </Text>
                </View>
              </View>

              {/* Submission Checklist */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>
                  Submission Readiness ({venue.completion.completionPercent}%)
                </Text>
                {venue.completion.missingRequirements.length === 0 ? (
                  <Text style={styles.readyText}>
                    ✓ All required details complete. Ready for administrator
                    review!
                  </Text>
                ) : (
                  venue.completion.missingRequirements.map((req) => (
                    <Text key={req} style={styles.missingItem}>
                      • Missing: {req}
                    </Text>
                  ))
                )}
              </View>

              <PrimaryButton
                title="Submit Venue for Admin Review"
                onPress={handleSubmitForReview}
                loading={submitReviewMutation.isPending}
                disabled={!venue.completion.isReadyToSubmit}
                style={styles.btnGap}
              />

              <SecondaryButton
                title="Save as Draft for Later"
                onPress={() => router.replace('/owner' as any)}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
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
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  stepSubtitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 38,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceSecondary,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  toastBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(198, 243, 107, 0.16)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  toastText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 32,
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionDesc: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnGap: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardHeading: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subHeading: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  courtTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  courtMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  courtPrice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  iconDangerBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  mutedNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amenityTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityTileSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  amenityTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amenityName: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  amenityNameSelected: {
    color: colors.textInverse,
  },
  amenityCategory: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  amenityCategorySelected: {
    color: colors.primaryDark,
  },
  uploadDropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  uploadTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  uploadSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  queueThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  queueTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  uploadBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  photoPreview: {
    width: '100%',
    height: 170,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
  },
  coverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  coverChipActive: {
    backgroundColor: colors.primary,
  },
  coverChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  coverChipTextActive: {
    color: colors.textInverse,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  previewCover: {
    width: '100%',
    height: 180,
  },
  previewNoCover: {
    height: 120,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: {
    padding: spacing.lg,
  },
  previewName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  previewAddr: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewDesc: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    marginVertical: spacing.md,
    lineHeight: 20,
  },
  previewListItem: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  readyText: {
    ...typography.bodySecondary,
    color: colors.primary,
    fontWeight: '600',
  },
  missingItem: {
    ...typography.caption,
    color: colors.error,
    marginBottom: 4,
  },
  submittedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  submittedTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  submittedSubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  fullWidthBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
});
