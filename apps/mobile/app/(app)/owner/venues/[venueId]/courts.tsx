import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Power, Trash2 } from 'lucide-react-native';
import { Sport } from '../../../../../src/auth/auth-types';
import {
  useCreateCourt,
  useDeleteCourt,
  useOwnerVenue,
  useUpdateCourt,
} from '../../../../../src/hooks/useOwnerVenues';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { PrimaryButton } from '../../../../../src/components/common/PrimaryButton';
import { TextInputField } from '../../../../../src/components/forms/TextInputField';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

const SPORTS: Sport[] = [
  'FOOTBALL',
  'CRICKET',
  'BADMINTON',
  'TENNIS',
  'BASKETBALL',
  'PADEL',
  'OTHER',
];

export default function ManageVenueCourtsScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  const { data, isLoading, refetch } = useOwnerVenue(venueId);
  const createCourt = useCreateCourt(venueId || '');
  const updateCourt = useUpdateCourt(venueId || '');
  const deleteCourt = useDeleteCourt(venueId || '');

  const [name, setName] = useState('');
  const [sport, setSport] = useState<Sport>('FOOTBALL');
  const [surfaceType, setSurfaceType] = useState('Artificial Turf');
  const [indoor, setIndoor] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isLoading || !data?.venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading courts..." />
      </SafeAreaView>
    );
  }

  const venue = data.venue;

  const handleAddCourt = async () => {
    setErrorMsg(null);
    const maxP = parseInt(maxPlayers, 10);
    const hourly = Number(price);

    if (name.trim().length < 2) {
      setErrorMsg('Court name must be at least 2 characters.');
      return;
    }
    if (!Number.isInteger(maxP) || maxP <= 0) {
      setErrorMsg('Maximum players must be a positive whole number.');
      return;
    }
    if (!Number.isFinite(hourly) || hourly <= 0) {
      setErrorMsg('Hourly price must be greater than zero.');
      return;
    }

    try {
      await createCourt.mutateAsync({
        name: name.trim(),
        sport,
        description: description.trim() || undefined,
        surfaceType: surfaceType.trim() || undefined,
        indoor,
        maxPlayers: maxP,
        basePricePerHour: hourly,
        currency: venue.currency,
      });
      setName('');
      setPrice('');
      setDescription('');
      await refetch();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to add court.');
    }
  };

  const handleToggleStatus = async (courtId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateCourt.mutateAsync({
        courtId,
        payload: { status: nextStatus },
      });
      await refetch();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Try again');
    }
  };

  const handleDelete = (courtId: string, courtName: string) => {
    Alert.alert(
      'Archive / Remove Court',
      `Remove "${courtName}" from active courts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourt.mutateAsync(courtId);
              await refetch();
            } catch (err: any) {
              Alert.alert('Failed', err?.message || 'Try again');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Courts</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add New Court</Text>

          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TextInputField
            label="Court Name *"
            placeholder="e.g. Court B - Synthetic Turf"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Sport *</Text>
          <View style={styles.chipWrap}>
            {SPORTS.map((sp) => (
              <Pressable
                key={sp}
                onPress={() => setSport(sp)}
                style={[styles.chip, sport === sp && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, sport === sp && styles.chipTextActive]}
                >
                  {sp}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInputField
            label="Surface Type"
            placeholder="Artificial Turf, Wooden, Synthetic..."
            value={surfaceType}
            onChangeText={setSurfaceType}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Indoor Court</Text>
            <Switch
              value={indoor}
              onValueChange={setIndoor}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
            />
          </View>

          <View style={styles.rowTwo}>
            <View style={{ flex: 1 }}>
              <TextInputField
                label="Max Players *"
                keyboardType="number-pad"
                value={maxPlayers}
                onChangeText={setMaxPlayers}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInputField
                label={`Price / Hour (${venue.currency}) *`}
                keyboardType="decimal-pad"
                placeholder="1200"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <TextInputField
            label="Court Notes (Optional)"
            placeholder="Dimensions, lighting, or special notes"
            value={description}
            onChangeText={setDescription}
          />

          <PrimaryButton
            title="+ Create Court"
            onPress={handleAddCourt}
            loading={createCourt.isPending}
          />
        </View>

        <Text style={styles.listHeading}>
          Existing Courts ({venue.courts.length})
        </Text>

        {venue.courts.map((c) => (
          <View key={c.id} style={styles.courtCard}>
            <View style={{ flex: 1 }}>
              <View style={styles.courtHeaderRow}>
                <Text style={styles.courtName}>{c.name}</Text>
                <View
                  style={[
                    styles.statusTag,
                    c.status === 'ACTIVE'
                      ? styles.statusActive
                      : styles.statusInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      c.status === 'ACTIVE'
                        ? { color: colors.primary }
                        : { color: colors.textMuted },
                    ]}
                  >
                    {c.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.courtMeta}>
                {c.sport} • {c.indoor ? 'Indoor' : 'Outdoor'}
                {c.surfaceType ? ` • ${c.surfaceType}` : ''} • Max {c.maxPlayers}{' '}
                players
              </Text>
              <Text style={styles.courtPrice}>
                {c.currency} {c.basePricePerHour} / hour
              </Text>
            </View>

            <View style={styles.actionsCol}>
              <Pressable
                onPress={() => handleToggleStatus(c.id, c.status)}
                style={styles.iconBtn}
                accessibilityLabel="Toggle court active status"
              >
                <Power
                  size={16}
                  color={
                    c.status === 'ACTIVE' ? colors.primary : colors.textMuted
                  }
                />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(c.id, c.name)}
                style={styles.dangerIconBtn}
                accessibilityLabel="Delete court"
              >
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            </View>
          </View>
        ))}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchText: { ...typography.bodySecondary, color: colors.textPrimary, fontWeight: '600' },
  rowTwo: { flexDirection: 'row', gap: spacing.sm },
  listHeading: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  courtCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  courtHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  courtName: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusActive: { borderColor: colors.primary, backgroundColor: 'rgba(198,243,107,0.12)' },
  statusInactive: { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  statusTagText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  courtMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  courtPrice: { ...typography.caption, color: colors.primary, fontWeight: '800', marginTop: 4 },
  actionsCol: { gap: spacing.xs, justifyContent: 'center' },
  iconBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  dangerIconBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
});
