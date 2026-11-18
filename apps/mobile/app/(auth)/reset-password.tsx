import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, LockKeyhole } from 'lucide-react-native';
import { authService } from '../../src/auth/auth-service';
import { TextInputField } from '../../src/components/forms/TextInputField';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../src/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (params.token) {
      setToken(params.token);
    }
  }, [params.token]);

  const handleReset = async () => {
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage('Please provide the reset token from your email link');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({
        token: token.trim(),
        newPassword,
      });
      setSuccessMessage(res.message);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Password reset failed. The reset token may be expired or invalid.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              {isSuccess ? (
                <CheckCircle2 size={32} color={colors.primary} />
              ) : (
                <LockKeyhole size={32} color={colors.primary} />
              )}
            </View>
            <Text style={styles.title}>
              {isSuccess ? 'PASSWORD RESET' : 'NEW PASSWORD'}
            </Text>
            <Text style={styles.subtitle}>
              {isSuccess
                ? 'Your password has been changed. You can now log in.'
                : 'Create a new secure password for your Courtly account.'}
            </Text>
          </View>

          {/* Feedback Banners */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!!successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formCard}>
            {isSuccess ? (
              <PrimaryButton
                title="Proceed to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                size="lg"
              />
            ) : (
              <>
                <TextInputField
                  label="Reset Token"
                  placeholder="Paste token from email"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />

                <TextInputField
                  label="New Password (min 8 chars)"
                  placeholder="••••••••"
                  isPassword
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <TextInputField
                  label="Confirm New Password"
                  placeholder="••••••••"
                  isPassword
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <PrimaryButton
                  title="Update Password"
                  onPress={handleReset}
                  loading={loading}
                  size="lg"
                  style={styles.submitButton}
                />
              </>
            )}
          </View>

          {/* Back to Login Link */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.backLink}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.error,
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    ...typography.bodySecondary,
    color: colors.primary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  backLink: {
    ...typography.bodySecondary,
    color: colors.textMuted,
  },
});
