import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface LoadingIndicatorProps {
  label?: string;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  label,
  message,
  size = 'small',
  color = colors.primary,
  style,
}) => {
  const displayText = label || message;
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {displayText && <Text style={styles.label}>{displayText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
