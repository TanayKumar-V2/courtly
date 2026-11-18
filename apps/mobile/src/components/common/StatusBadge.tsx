import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type StatusBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'demo';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'primary',
  size = 'sm',
  style,
  textStyle,
  icon,
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      {icon}
      <Text
        style={[
          styles.text,
          styles[`${variant}Text` as keyof typeof styles],
          size === 'sm' && styles.textSm,
          icon ? styles.textWithIcon : undefined,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  primary: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderColor: 'rgba(198, 243, 107, 0.35)',
    borderWidth: 1,
  },
  primaryText: {
    color: colors.primary,
  },
  success: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderColor: 'rgba(198, 243, 107, 0.35)',
    borderWidth: 1,
  },
  successText: {
    color: colors.primary,
  },
  warning: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: 'rgba(250, 204, 21, 0.35)',
    borderWidth: 1,
  },
  warningText: {
    color: colors.warning,
  },
  error: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderWidth: 1,
  },
  errorText: {
    color: colors.error,
  },
  info: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
  },
  infoText: {
    color: colors.info,
  },
  muted: {
    backgroundColor: colors.surfaceHover,
    borderColor: colors.border,
    borderWidth: 1,
  },
  mutedText: {
    color: colors.textSecondary,
  },
  demo: {
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    borderColor: 'rgba(251, 146, 60, 0.4)',
    borderWidth: 1,
  },
  demoText: {
    color: '#FB923C',
    fontWeight: '700',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
    lineHeight: 13,
  },
  textWithIcon: {
    marginLeft: 4,
  },
});
