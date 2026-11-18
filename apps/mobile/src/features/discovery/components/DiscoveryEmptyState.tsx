import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPinOff, SearchX } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../../theme';

export interface DiscoveryEmptyStateProps {
  mode?: 'list' | 'map';
  onResetFilters?: () => void;
}

export const DiscoveryEmptyState: React.FC<DiscoveryEmptyStateProps> = ({
  mode = 'list',
  onResetFilters,
}) => {
  const isMap = mode === 'map';
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        {isMap ? (
          <MapPinOff size={28} color={colors.primary} />
        ) : (
          <SearchX size={28} color={colors.primary} />
        )}
      </View>
      <Text style={styles.title}>
        {isMap ? 'No venues mapped in this area yet.' : 'No venues found'}
      </Text>
      <Text style={styles.subtitle}>
        {isMap
          ? 'Pan or zoom the map to another area, or adjust your active filters.'
          : 'Try a different sport or location.'}
      </Text>
      {onResetFilters && (
        <PrimaryButton
          title="Reset Filters"
          size="sm"
          onPress={onResetFilters}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(198, 243, 107, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
});
