import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Check } from 'lucide-react-native';
import {
  useAmenitiesCatalogue,
  useOwnerVenue,
  useReplaceVenueAmenities,
} from '../../../../../src/hooks/useOwnerVenues';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { PrimaryButton } from '../../../../../src/components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

export default function ManageVenueAmenitiesScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  const { data: venueData, isLoading: venueLoading } = useOwnerVenue(venueId);
  const { data: catalogueData, isLoading: catLoading } = useAmenitiesCatalogue();
  const saveAmenities = useReplaceVenueAmenities(venueId || '');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (venueData?.venue?.amenities) {
      setSelectedIds(venueData.venue.amenities.map((a) => a.id));
    }
  }, [venueData?.venue?.id]);

  if (venueLoading || catLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading amenities..." />
      </SafeAreaView>
    );
  }

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    try {
      await saveAmenities.mutateAsync(selectedIds);
      Alert.alert('Saved', 'Venue amenities updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Unable to save amenities.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Amenities</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Select all verified facilities available at your venue (
          {selectedIds.length} selected).
        </Text>

        <View style={styles.grid}>
          {(catalogueData?.amenities || []).map((am) => {
            const active = selectedIds.includes(am.id);
            return (
              <Pressable
                key={am.id}
                onPress={() => toggle(am.id)}
                style={[styles.tile, active && styles.tileActive]}
              >
                <View style={styles.tileHeader}>
                  <Text style={[styles.tileName, active && styles.tileNameActive]}>
                    {am.name}
                  </Text>
                  {active && <Check size={15} color={colors.textInverse} />}
                </View>
                <Text
                  style={[styles.tileCat, active && styles.tileCatActive]}
                >
                  {am.category.replace('_', ' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          title="Save Amenities"
          onPress={handleSave}
          loading={saveAmenities.isPending}
          style={{ marginTop: spacing.lg }}
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
  subtitle: { ...typography.bodySecondary, color: colors.textSecondary, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileName: { ...typography.bodySecondary, color: colors.textPrimary, fontWeight: '700', flex: 1 },
  tileNameActive: { color: colors.textInverse },
  tileCat: { ...typography.overline, color: colors.textMuted, fontSize: 9, marginTop: 4 },
  tileCatActive: { color: colors.primaryDark },
});
