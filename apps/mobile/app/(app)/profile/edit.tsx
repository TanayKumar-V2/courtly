import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Save } from 'lucide-react-native';
import { useAuth } from '../../../src/auth/use-auth';
import { SkillLevel, Sport, SportSkill } from '../../../src/auth/auth-types';
import { TextInputField } from '../../../src/components/forms/TextInputField';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../../src/theme';

const ALL_SPORTS: { id: Sport; label: string }[] = [
  { id: 'FOOTBALL', label: 'Football' },
  { id: 'CRICKET', label: 'Cricket' },
  { id: 'BADMINTON', label: 'Badminton' },
  { id: 'TENNIS', label: 'Tennis' },
  { id: 'BASKETBALL', label: 'Basketball' },
  { id: 'PADEL', label: 'Padel' },
];

const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'BEGINNER', label: 'Beginner' },
  { id: 'INTERMEDIATE', label: 'Intermediate' },
  { id: 'ADVANCED', label: 'Advanced' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser, updatePlayerProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [state, setState] = useState(user?.profile?.state || '');
  const [country, setCountry] = useState(user?.profile?.country || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');

  const [selectedSports, setSelectedSports] = useState<Sport[]>(
    user?.profile?.preferredSports || [],
  );
  const [skillMap, setSkillMap] = useState<Record<string, SkillLevel>>(() => {
    const map: Record<string, SkillLevel> = {};
    if (user?.sportSkills) {
      for (const s of user.sportSkills) {
        map[s.sport] = s.skillLevel;
      }
    }
    return map;
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleSport = (sport: Sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
      if (!skillMap[sport]) {
        setSkillMap((prev) => ({ ...prev, [sport]: 'BEGINNER' }));
      }
    }
  };

  const setSportSkill = (sport: Sport, level: SkillLevel) => {
    setSkillMap((prev) => ({ ...prev, [sport]: level }));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);

      // Update user details
      await updateUser({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });

      // Update player profile and sport skills
      const sportSkills: SportSkill[] = selectedSports.map((sport) => ({
        sport,
        skillLevel: skillMap[sport] || 'BEGINNER',
      }));

      await updatePlayerProfile({
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        bio: bio.trim() || undefined,
        preferredSports: selectedSports,
        sportSkills,
      });

      setSuccessMessage('Profile successfully updated!');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile');
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
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Player Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
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

          {/* Account Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <TextInputField
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInputField
              label="Phone Number"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <TextInputField
              label="City"
              placeholder="Bengaluru"
              value={city}
              onChangeText={setCity}
            />

            <TextInputField
              label="State"
              placeholder="Karnataka"
              value={state}
              onChangeText={setState}
            />

            <TextInputField
              label="Bio"
              placeholder="Tell others about your playstyle..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>

          {/* Preferred Sports */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sports</Text>
            <View style={styles.chipsGrid}>
              {ALL_SPORTS.map((s) => {
                const isSelected = selectedSports.includes(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => toggleSport(s.id)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sport Skill Levels */}
          {selectedSports.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Skill Calibrations</Text>
              {selectedSports.map((sport) => (
                <View key={sport} style={styles.skillBlock}>
                  <Text style={styles.sportName}>{sport}</Text>
                  <View style={styles.skillTiers}>
                    {SKILL_LEVELS.map((lvl) => {
                      const isCurrent = (skillMap[sport] || 'BEGINNER') === lvl.id;
                      return (
                        <TouchableOpacity
                          key={lvl.id}
                          onPress={() => setSportSkill(sport, lvl.id)}
                          style={[
                            styles.skillTier,
                            isCurrent && styles.skillTierSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.skillTierText,
                              isCurrent && styles.skillTierTextSelected,
                            ]}
                          >
                            {lvl.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          <PrimaryButton
            title="Save Profile"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={styles.saveButton}
          />
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 30,
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  skillBlock: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sportName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  skillTiers: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  skillTier: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skillTierSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillTierText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  skillTierTextSelected: {
    color: colors.textInverse,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
