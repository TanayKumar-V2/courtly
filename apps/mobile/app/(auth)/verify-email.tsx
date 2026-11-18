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
import { CheckCircle, MailCheck } from 'lucide-react-native';
import { authService } from '../../src/auth/auth-service';
import { TextInputField } from '../../src/components/forms/TextInputField';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../src/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [token, setToken] = useState(params.token || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-verify if deep-link opened with token
  useEffect(() => {
    if (params.token && !isSuccess) {
      setToken(params.token);
      verifyWithToken(params.token);
    }
  }, [params.token]);

  const verifyWithToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) {
      setErrorMessage('Please enter the verification code or token');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await authService.verifyEmail(tokenToVerify.trim());
      setStatusMessage(res.message);
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err?.message || 'Verification failed. The token may be expired or already used.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter your registered email address to resend');
      return;
    }

    try {
      setResending(true);
      setErrorMessage(null);
      const res = await authService.resendVerification(email.trim().toLowerCase());
      setStatusMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
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
          {/* Header Icon */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              {isSuccess ? (
                <CheckCircle size={32} color={colors.primary} />
              ) : (
                <MailCheck size={32} color={colors.primary} />
              )}
            </View>
            <Text style={styles.title}>
              {isSuccess ? 'EMAIL VERIFIED' : 'VERIFY EMAIL'}
            </Text>
            <Text style={styles.subtitle}>
              {isSuccess
                ? 'Your account is now active. You can log in to Courtly!'
                : `We sent a verification link to ${email || 'your email'}. Check your inbox or enter your token below.`}
            </Text>
          </View>

          {/* Feedback Banners */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!!statusMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{statusMessage}</Text>
            </View>
          )}

          {/* Form Card */}
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
                  label="Verification Token / Code"
                  placeholder="Paste token from email link"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />

                <PrimaryButton
                  title="Verify Account"
                  onPress={() => verifyWithToken(token)}
                  loading={loading}
                  size="lg"
                  style={styles.verifyButton}
                />

                <View style={styles.resendSection}>
                  <Text style={styles.resendNote}>
                    Didn't receive an email or link expired?
                  </Text>
                  <TextInputField
                    label="Email Address for Resend"
                    placeholder="player@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending}
                    style={styles.resendButton}
                  >
                    <Text style={styles.resendButtonText}>
                      {resending ? 'Sending...' : 'Resend Verification Email'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
    paddingHorizontal: spacing.sm,
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
  verifyButton: {
    marginTop: spacing.xs,
  },
  resendSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resendNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resendButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
