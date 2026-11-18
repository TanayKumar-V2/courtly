import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Sport } from '../../../auth/auth-types';
import { AmenityItem } from '../../../types/venue';
import {
  DEFAULT_DISCOVERY_FILTERS,
  DiscoveryFilters,
  VenueSortOption,
} from '../types/discovery.types';
import { PrimaryButton } from '../../../components/common/PrimaryButton';
import { SecondaryButton } from '../../../components/common/SecondaryButton';
import { SortSelector } from './SortSelector';
import { colors, radius, spacing, typography } from '../../../theme';

const SPORTS: Sport[] = [
  'FOOTBALL',
  'CRICKET',
  'BADMINTON',
  'TENNIS',
  'BASKETBALL',
  'PADEL',
];

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under ₹300', min: 0, max: 300 },
  { label: '₹300–₹600', min: 300, max: 600 },
  { label: '₹600–₹1,000', min: 600, max: 1000 },
  { label: '₹1,000+', min: 1000, max: undefined },
];

export interface FilterBottomSheetProps {
  visible: boolean;
  filters: DiscoveryFilters;
  amenities: AmenityItem[];
  onClose: () => void;
  onApply: (nextFilters: DiscoveryFilters) => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  filters,
  amenities,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<DiscoveryFilters>(filters);
  const [minPriceText, setMinPriceText] = useState(
    filters.minPrice !== undefined ? String(filters.minPrice) : '',
  );
  const [maxPriceText, setMaxPriceText] = useState(
    filters.maxPrice !== undefined ? String(filters.maxPrice) : '',
  );
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setMinPriceText(
        filters.minPrice !== undefined ? String(filters.minPrice) : '',
      );
      setMaxPriceText(
        filters.maxPrice !== undefined ? String(filters.maxPrice) : '',
      );
      setPriceError(null);
    }
  }, [visible, filters]);

  const hasLocation =
    draft.latitude !== undefined && draft.longitude !== undefined;

  const toggleAmenity = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter((x) => x !== id)
        : [...prev.amenityIds, id],
    }));
  };

  const applyPreset = (min?: number, max?: number) => {
    setPriceError(null);
    setMinPriceText(min !== undefined ? String(min) : '');
    setMaxPriceText(max !== undefined ? String(max) : '');
    setDraft((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  };

  const handleApply = () => {
    setPriceError(null);
    const parsedMin = minPriceText.trim()
      ? Number(minPriceText.trim())
      : undefined;
    const parsedMax = maxPriceText.trim()
      ? Number(maxPriceText.trim())
      : undefined;

    if (parsedMin !== undefined && (Number.isNaN(parsedMin) || parsedMin < 0)) {
      setPriceError('Minimum price must be a non-negative number.');
      return;
    }
    if (parsedMax !== undefined && (Number.isNaN(parsedMax) || parsedMax < 0)) {
      setPriceError('Maximum price must be a non-negative number.');
      return;
    }
    if (
      parsedMin !== undefined &&
      parsedMax !== undefined &&
      parsedMin > parsedMax
    ) {
      setPriceError('Maximum price must be greater than or equal to minimum.');
      return;
    }

    onApply({
      ...draft,
      minPrice: parsedMin,
      maxPrice: parsedMax,
    });
    onClose();
  };

  const handleClearAll = () => {
    const cleared: DiscoveryFilters = {
      ...DEFAULT_DISCOVERY_FILTERS,
      q: filters.q,
      city: filters.city,
      latitude: filters.latitude,
      longitude: filters.longitude,
      radiusKm: filters.radiusKm,
      sort: hasLocation ? 'DISTANCE' : 'NEWEST',
    };
    setDraft(cleared);
    setMinPriceText('');
    setMaxPriceText('');
    setPriceError(null);
    onApply(cleared);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort Venues</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
              style={styles.closeBtn}
            >
              <X size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* SPORT */}
            <Text style={styles.sectionHeading}>SPORT</Text>
            <View style={styles.chipWrap}>
              <Pressable
                onPress={() => setDraft((p) => ({ ...p, sport: null }))}
                style={[styles.chip, draft.sport === null && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.sport === null && styles.chipTextActive,
                  ]}
                >
                  All Sports
                </Text>
              </Pressable>
              {SPORTS.map((sp) => {
                const active = draft.sport === sp;
                return (
                  <Pressable
                    key={sp}
                    onPress={() =>
                      setDraft((p) => ({ ...p, sport: active ? null : sp }))
                    }
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {sp}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* PRICE RANGE */}
            <Text style={styles.sectionHeading}>HOURLY PRICE RANGE (INR)</Text>
            <View style={styles.chipWrap}>
              {PRICE_PRESETS.map((preset) => {
                const active =
                  draft.minPrice === preset.min &&
                  draft.maxPrice === preset.max;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => applyPreset(preset.min, preset.max)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.priceInputRow}>
              <View style={styles.priceField}>
                <Text style={styles.miniLabel}>Min ₹</Text>
                <TextInput
                  value={minPriceText}
                  onChangeText={setMinPriceText}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
              </View>
              <View style={styles.priceField}>
                <Text style={styles.miniLabel}>Max ₹</Text>
                <TextInput
                  value={maxPriceText}
                  onChangeText={setMaxPriceText}
                  placeholder="Any"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
              </View>
            </View>
            {!!priceError && <Text style={styles.errorText}>{priceError}</Text>}

            {/* INDOOR / OUTDOOR */}
            <Text style={styles.sectionHeading}>FACILITY TYPE</Text>
            <View style={styles.segmentRow}>
              {(
                [
                  { label: 'Any', val: undefined },
                  { label: 'Indoor', val: true },
                  { label: 'Outdoor', val: false },
                ] as const
              ).map((item) => {
                const active = draft.indoor === item.val;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setDraft((p) => ({ ...p, indoor: item.val }))}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* AMENITIES (AND SEMANTICS) */}
            <Text style={styles.sectionHeading}>
              AMENITIES (MATCHES ALL SELECTED)
            </Text>
            <View style={styles.chipWrap}>
              {amenities.map((am) => {
                const active = draft.amenityIds.includes(am.id);
                return (
                  <Pressable
                    key={am.id}
                    onPress={() => toggleAmenity(am.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    {active && <Check size={13} color={colors.textInverse} />}
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {am.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* SORT */}
            <Text style={styles.sectionHeading}>SORT BY</Text>
            <SortSelector
              value={draft.sort}
              hasLocation={hasLocation}
              onChange={(sort: VenueSortOption) =>
                setDraft((p) => ({ ...p, sort }))
              }
            />
            {!hasLocation && (
              <Text style={styles.hintText}>
                Enable your current location in Discover to sort by Nearest.
              </Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <SecondaryButton
              title="Clear All"
              onPress={handleClearAll}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title="Apply Filters"
              onPress={handleApply}
              style={{ flex: 1.4 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '86%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
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
  priceInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  priceField: {
    flex: 1,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    ...typography.bodySecondary,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.textInverse,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
