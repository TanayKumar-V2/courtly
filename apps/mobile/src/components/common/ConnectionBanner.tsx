import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { colors, radius, spacing, typography } from '../../theme';

export interface ConnectionBannerProps {
  compact?: boolean;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ compact = false }) => {
  const { connectionStatus, data, refetch } = useHealthCheck();

  if (compact) {
    return (
      <Pressable
        onPress={refetch}
        hitSlop={8}
        style={({ pressed }) => [
          styles.compactPill,
          connectionStatus === 'connected' && styles.compactConnected,
          connectionStatus === 'unavailable' && styles.compactUnavailable,
          connectionStatus === 'checking' && styles.compactChecking,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.dot,
            connectionStatus === 'connected' && styles.dotConnected,
            connectionStatus === 'unavailable' && styles.dotUnavailable,
            connectionStatus === 'checking' && styles.dotChecking,
          ]}
        />
        <Text style={styles.compactText}>
          {connectionStatus === 'connected'
            ? data?.status === 'degraded'
              ? 'API (Degraded)'
              : 'API Live'
            : connectionStatus === 'checking'
              ? 'Checking...'
              : 'API Offline'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        connectionStatus === 'connected' && styles.bannerConnected,
        connectionStatus === 'unavailable' && styles.bannerUnavailable,
        connectionStatus === 'checking' && styles.bannerChecking,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.statusRow}>
          {connectionStatus === 'checking' ? (
            <ActivityIndicator size="small" color={colors.warning} style={styles.spinner} />
          ) : (
            <View
              style={[
                styles.dot,
                connectionStatus === 'connected' && styles.dotConnected,
                connectionStatus === 'unavailable' && styles.dotUnavailable,
              ]}
            />
          )}
          <View>
            <Text style={styles.bannerTitle}>
              {connectionStatus === 'connected'
                ? `NestJS Backend Connected (${data?.service ?? 'courtly-api'})`
                : connectionStatus === 'checking'
                  ? 'Checking Backend Connectivity...'
                  : 'Backend API Unavailable'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {connectionStatus === 'connected'
                ? `Redis: ${data?.dependencies?.redis ?? 'unknown'} • Status: ${data?.status ?? 'ok'}`
                : connectionStatus === 'checking'
                  ? 'Pinging http://10.0.2.2:4000/api/health...'
                  : 'Verify NestJS is running on port 4000 (run `pnpm dev:api`).'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={refetch}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  compactConnected: {
    borderColor: 'rgba(198, 243, 107, 0.4)',
    backgroundColor: 'rgba(198, 243, 107, 0.08)',
  },
  compactUnavailable: {
    borderColor: 'rgba(248, 113, 113, 0.4)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  compactChecking: {
    borderColor: 'rgba(250, 204, 21, 0.4)',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  compactText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '600',
  },
  banner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  bannerConnected: {
    backgroundColor: 'rgba(198, 243, 107, 0.06)',
    borderColor: 'rgba(198, 243, 107, 0.25)',
  },
  bannerUnavailable: {
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  bannerChecking: {
    backgroundColor: 'rgba(250, 204, 21, 0.06)',
    borderColor: 'rgba(250, 204, 21, 0.25)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  spinner: {
    marginRight: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  dotConnected: {
    backgroundColor: colors.primary,
  },
  dotUnavailable: {
    backgroundColor: colors.error,
  },
  dotChecking: {
    backgroundColor: colors.warning,
  },
  bannerTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  bannerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  retryButton: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceHover,
    marginLeft: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  retryText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
