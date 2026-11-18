import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Minus, Navigation, Plus } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  hasUserLocation?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onLocateMe,
  isLocating = false,
  hasUserLocation = false,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.zoomGroup}>
        <Pressable
          onPress={onZoomIn}
          accessibilityRole="button"
          accessibilityLabel="Zoom in map"
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Plus size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          onPress={onZoomOut}
          accessibilityRole="button"
          accessibilityLabel="Zoom out map"
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Minus size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {onLocateMe && (
        <Pressable
          onPress={onLocateMe}
          disabled={isLocating}
          accessibilityRole="button"
          accessibilityLabel="Center map on my current location"
          style={({ pressed }) => [
            styles.locateBtn,
            hasUserLocation && styles.locateBtnActive,
            pressed && styles.pressed,
          ]}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Navigation
              size={18}
              color={hasUserLocation ? colors.textInverse : colors.primary}
            />
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  zoomGroup: {
    backgroundColor: 'rgba(21, 29, 26, 0.94)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  controlBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  locateBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(21, 29, 26, 0.94)',
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.78,
  },
});
