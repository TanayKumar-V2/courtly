import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Award,
  Building2,
  CheckCircle,
  Clock,
  Edit3,
  KeyRound,
  LogOut,
  MapPin,
  Shield,
  Smartphone,
  X,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../../../src/auth/use-auth';
import { authService } from '../../../src/auth/auth-service';
import { useMyOwnerApplication } from '../../../src/hooks/useOwnerApplication';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { TextInputField } from '../../../src/components/forms/TextInputField';
import { VenueStatusBadge } from '../../../src/components/owner/VenueStatusBadge';
import { colors, radius, spacing, typography } from '../../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, logoutAll } = useAuth();
  const isVenueOwner = Boolean(user?.roles?.includes('VENUE_OWNER'));
  const { data: ownerAppData } = useMyOwnerApplication(Boolean(user && !isVenueOwner));

  // Change password modal state
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Compute initials
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PL';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Courtly on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert(
      'Sign Out From All Devices',
      'This will revoke your active session on all phones and tablets. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: async () => {
            await logoutAll();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setChangePasswordVisible(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Courtly Player'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            {user?.emailVerified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={12} color={colors.primary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}

            <View style={styles.roleBadge}>
              <Shield size={12} color={colors.textSecondary} />
              <Text style={styles.roleText}>
                {user?.roles?.join(', ') || 'PLAYER'}
              </Text>
            </View>

            {!!user?.profile?.city && (
              <View style={styles.locationBadge}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.locationText}>{user.profile.city}</Text>
              </View>
            )}
          </View>

          <View style={styles.memberSinceRow}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={styles.memberSinceText}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* Bio Section if present */}
        {!!user?.profile?.bio && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About Player</Text>
            <Text style={styles.bioText}>{user.profile.bio}</Text>
          </View>
        )}

        {/* Preferred Sports Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Preferred Sports</Text>
            <TouchableOpacity onPress={() => router.push('/profile/edit' as any)}>
              <Text style={styles.editActionText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {user?.profile?.preferredSports && user.profile.preferredSports.length > 0 ? (
            <View style={styles.chipsContainer}>
              {user.profile.preferredSports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <Zap size={14} color={colors.primary} />
                  <Text style={styles.sportChipText}>{sport}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No preferred sports configured yet.</Text>
          )}
        </View>

        {/* Skill Levels Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Skill Levels</Text>
            <TouchableOpacity onPress={() => router.push('/profile/edit' as any)}>
              <Text style={styles.editActionText}>Update</Text>
            </TouchableOpacity>
          </View>

          {user?.sportSkills && user.sportSkills.length > 0 ? (
            <View style={styles.skillsList}>
              {user.sportSkills.map((item) => (
                <View key={item.sport} style={styles.skillItem}>
                  <Text style={styles.skillSport}>{item.sport}</Text>
                  <View style={styles.skillLevelBadge}>
                    <Award size={12} color={colors.primary} />
                    <Text style={styles.skillLevelText}>{item.skillLevel}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Set your skill levels in onboarding or profile edit.
            </Text>
          )}
        </View>

        {/* Venue Owner Hub / Become a Venue Owner */}
        <View style={styles.ownerBannerCard}>
          <View style={styles.ownerBannerHeader}>
            <View style={styles.ownerIconBox}>
              <Building2 size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerBannerTitle}>
                {isVenueOwner ? 'My Venues' : 'Become a Venue Owner'}
              </Text>
              <Text style={styles.ownerBannerSub}>
                {isVenueOwner
                  ? 'Manage your sports venues, courts, amenities & photos'
                  : ownerAppData?.latestApplication
                    ? `Application for ${ownerAppData.latestApplication.businessName}`
                    : 'List your sports turf or courts on Courtly'}
              </Text>
            </View>
            {!isVenueOwner && ownerAppData?.latestApplication && (
              <VenueStatusBadge status={ownerAppData.latestApplication.status} />
            )}
          </View>

          <PrimaryButton
            title={
              isVenueOwner
                ? 'Open Owner Dashboard'
                : ownerAppData?.latestApplication
                  ? 'Track Application Status'
                  : 'Apply as Venue Owner'
            }
            size="sm"
            onPress={() => {
              if (isVenueOwner) {
                router.push('/owner' as any);
              } else if (ownerAppData?.latestApplication) {
                router.push('/owner/application-status' as any);
              } else {
                router.push('/owner/application' as any);
              }
            }}
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <View style={styles.actionLeft}>
              <Edit3 size={18} color={colors.primary} />
              <Text style={styles.actionTitle}>Edit Profile & Sports</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/onboarding' as any)}
          >
            <View style={styles.actionLeft}>
              <Smartphone size={18} color={colors.primary} />
              <Text style={styles.actionTitle}>Player Onboarding Wizard</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setChangePasswordVisible(true)}
          >
            <View style={styles.actionLeft}>
              <KeyRound size={18} color={colors.textSecondary} />
              <Text style={styles.actionTitle}>Change Password</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogoutAll}
          >
            <View style={styles.actionLeft}>
              <LogOut size={18} color={colors.error} />
              <Text style={[styles.actionTitle, { color: colors.error }]}>
                Logout from All Devices
              </Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.logoutRow]}
            onPress={handleLogout}
          >
            <View style={styles.actionLeft}>
              <LogOut size={18} color={colors.textMuted} />
              <Text style={[styles.actionTitle, { color: colors.textMuted }]}>
                Sign Out
              </Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setChangePasswordVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!!passwordError && (
              <View style={styles.modalErrorBanner}>
                <Text style={styles.modalErrorText}>{passwordError}</Text>
              </View>
            )}

            {!!passwordSuccess && (
              <View style={styles.modalSuccessBanner}>
                <Text style={styles.modalSuccessText}>{passwordSuccess}</Text>
              </View>
            )}

            <TextInputField
              label="Current Password"
              placeholder="••••••••"
              isPassword
              value={currentPassword}
              onChangeText={setCurrentPassword}
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
              onPress={handleChangePassword}
              loading={passwordLoading}
              size="md"
              style={styles.modalSubmitButton}
            />
          </View>
        </View>
      </Modal>
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
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: '800',
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  roleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  memberSinceText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  editActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  bioText: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  sportChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  skillsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  skillSport: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  skillLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillLevelText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  ownerBannerCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    marginBottom: spacing.md,
  },
  ownerBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ownerIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(198, 243, 107, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerBannerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  ownerBannerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionTitle: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionChevron: {
    color: colors.textMuted,
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  modalErrorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  modalSuccessBanner: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  modalSuccessText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
  },
  modalSubmitButton: {
    marginTop: spacing.sm,
  },
});
