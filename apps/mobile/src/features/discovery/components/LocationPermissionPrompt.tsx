import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  MapPin,
  Navigation,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react-native';
import {
  DeviceCoordinates,
  LocationErrorCode,
  locationService,
} from '../../../services/location-service';
import { PrimaryButton } from '../../../components/common/PrimaryButton';
import { SecondaryButton } from '../../../components/common/SecondaryButton';
import { colors, radius, spacing, typography } from '../../../theme';

const RADIUS_OPTIONS = [2, 5, 10, 20, 50];

export interface LocationPermissionPromptProps {
  visible: boolean;
  currentCity?: string;
  hasCoordinates: boolean;
  radiusKm: number;
  onClose: () => void;
  onSelectCity: (city: string) => void;
  onSelectCoordinates: (coords: DeviceCoordinates, radiusKm: number) => void;
  onChangeRadius: (radiusKm: number) => void;
  onClearLocation: () => void;
}

export const LocationPermissionPrompt: React.FC<
  LocationPermissionPromptProps
> = ({
  visible,
  currentCity = '',
  hasCoordinates,
  radiusKm,
  onClose,
  onSelectCity,
  onSelectCoordinates,
  onChangeRadius,
  onClearLocation,
}) => {
  const [cityInput, setCityInput] = useState(currentCity);
  const [selectedRadius, setSelectedRadius] = useState(radiusKm);
  const [loadingGps, setLoadingGps] = useState(false);
  const [locError, setLocError] = useState<{
    code?: LocationErrorCode;
    message: string;
  } | null>(null);

  const handleUseCurrentLocation = async () => {
    setLocError(null);
    setLoadingGps(true);
    try {
      const result = await locationService.requestCurrentLocation();
      if (result.ok && result.coordinates) {
        onSelectCoordinates(result.coordinates, selectedRadius);
        onClose();
      } else {
        setLocError({
          code: result.errorCode,
          message:
            result.message ||
            'Could not access device location. Use manual city search below.',
        });
      }
    } finally {
      setLoadingGps(false);
    }
  };

  const handleApplyCity = () => {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    onSelectCity(trimmed);
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
            <Text style={styles.title}>Select Discovery Location</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close location picker"
              style={styles.closeBtn}
            >
              <X size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* Option 1: Optional Foreground Device Location */}
            <View style={styles.gpsCard}>
              <View style={styles.gpsHeader}>
                <Navigation size={18} color={colors.primary} />
                <Text style={styles.gpsTitle}>Use My Current Location</Text>
              </View>
              <Text style={styles.gpsDesc}>
                Courtly only uses your foreground location while searching to
                calculate distance to nearby sports facilities. Coordinates stay
                in memory and are never tracked in the background.
              </Text>

              <View style={styles.privacyRow}>
                <ShieldCheck size={14} color={colors.primary} />
                <Text style={styles.privacyText}>
                  Foreground-only • Not stored on disk
                </Text>
              </View>

              <Text style={styles.miniLabel}>Search Radius</Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((km) => {
                  const active = selectedRadius === km;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => {
                        setSelectedRadius(km);
                        if (hasCoordinates) onChangeRadius(km);
                      }}
                      style={[
                        styles.radiusPill,
                        active && styles.radiusPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radiusText,
                          active && styles.radiusTextActive,
                        ]}
                      >
                        {km} km
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <PrimaryButton
                title="Use my current location"
                onPress={handleUseCurrentLocation}
                loading={loadingGps}
                size="md"
              />

              {locError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{locError.message}</Text>
                  {(locError.code === 'PERMISSION_DENIED' ||
                    locError.code === 'SERVICES_DISABLED') && (
                    <Pressable
                      onPress={() => locationService.openDeviceSettings()}
                      style={styles.settingsLink}
                    >
                      <Settings size={14} color={colors.primary} />
                      <Text style={styles.settingsLinkText}>
                        Open Device Settings
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            {/* Option 2: Manual City Search (Independent of GPS) */}
            <View style={styles.cityCard}>
              <View style={styles.gpsHeader}>
                <MapPin size={18} color={colors.primary} />
                <Text style={styles.gpsTitle}>Search by City</Text>
              </View>
              <TextInput
                value={cityInput}
                onChangeText={setCityInput}
                placeholder="e.g. Bengaluru, Gurugram, Mumbai..."
                placeholderTextColor={colors.textMuted}
                style={styles.cityInput}
                returnKeyType="done"
                onSubmitEditing={handleApplyCity}
              />
              <SecondaryButton
                title="Search This City"
                onPress={handleApplyCity}
                disabled={!cityInput.trim()}
              />
            </View>

            {/* Option 3: Clear Location */}
            {(hasCoordinates || Boolean(currentCity)) && (
              <Pressable
                onPress={() => {
                  setCityInput('');
                  onClearLocation();
                  onClose();
                }}
                style={styles.clearRow}
              >
                <Trash2 size={15} color={colors.error} />
                <Text style={styles.clearText}>Clear Location Filter</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '85%',
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
  title: { ...typography.h4, color: colors.textPrimary },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  gpsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  gpsTitle: { ...typography.h4, color: colors.textPrimary },
  gpsDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  privacyText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  radiusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  radiusTextActive: {
    color: colors.textInverse,
  },
  errorBox: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  errorText: { ...typography.caption, color: colors.error },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  settingsLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  cityInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    color: colors.textPrimary,
    ...typography.bodySecondary,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  clearText: {
    ...typography.bodySecondary,
    color: colors.error,
    fontWeight: '700',
  },
});
