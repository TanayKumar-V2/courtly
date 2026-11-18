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
import { Award, Check, Sparkles, User, Zap } from 'lucide-react-native';
import { useAuth } from '../../../src/auth/use-auth';
import { SkillLevel, Sport, SportSkill } from '../../../src/auth/auth-types';
import { TextInputField } from '../../../src/components/forms/TextInputField';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { colors, radius, spacing, typography } from '../../../src/theme';

const ALL_SPORTS: { id: Sport; label: string; icon: string }[] = [
  { id: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { id: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { id: 'BADMINTON', label: 'Badminton', icon: '🏸' },
  { id: 'TENNIS', label: 'Tennis', icon: '🎾' },
  { id: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { id: 'PADEL', label: 'Padel', icon: '🎾' },
];

const SKILL_LEVELS: { id: SkillLevel; label: string; desc: string }[] = [
  { id: 'BEGINNER', label: 'Beginner', desc: 'Learning fundamentals & casual games' },
  { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'Comfortable with fast rallies and tactics' },
  { id: 'ADVANCED', label: 'Advanced', desc: 'Competitive, tournament, or club-level play' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateUser, updatePlayerProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [state, setState] = useState(user?.profile?.state || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [selectedSports, setSelectedSports] = useState<Sport[]>(
    user?.profile?.preferredSports || ['FOOTBALL', 'BADMINTON'],
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

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (fullName.trim() && fullName !== user?.fullName) {
        await updateUser({ fullName: fullName.trim() });
      }

      const sportSkills: SportSkill[] = selectedSports.map((sport) => ({
        sport,
        skillLevel: skillMap[sport] || 'BEGINNER',
      }));

      await updatePlayerProfile({
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        bio: bio.trim() || undefined,
        preferredSports: selectedSports,
        sportSkills,
      });

      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save onboarding details');
      setLoading(false);
    }
  };

  const nextStep = () => {
    setErrorMessage(null);
    if (step < 4) setStep(step + 1);
    else handleFinishOnboarding();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress Indicator */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.stepIndicatorText}>Step {step} of 4</Text>
              <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(step / 4) * 100}%` }]} />
            </View>
          </View>

          {/* Error Banner */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <User size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>PLAYER IDENTITY</Text>
              <Text style={styles.stepSubtitle}>
                Tell the Courtly community who you are.
              </Text>

              <TextInputField
                label="Full Name"
                placeholder="Arjun Kumar"
                value={fullName}
                onChangeText={setFullName}
              />

              <TextInputField
                label="City"
                placeholder="e.g. Bengaluru"
                value={city}
                onChangeText={setCity}
              />

              <TextInputField
                label="State / Region"
                placeholder="e.g. Karnataka"
                value={state}
                onChangeText={setState}
              />

              <TextInputField
                label="Short Bio (Optional)"
                placeholder="Striker looking for weekend turf matches..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            </View>
          )}

          {/* STEP 2: Sports Interests */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Zap size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>YOUR SPORTS</Text>
              <Text style={styles.stepSubtitle}>
                Select the sports you love to play.
              </Text>

              <View style={styles.sportsGrid}>
                {ALL_SPORTS.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id);
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      onPress={() => toggleSport(sport.id)}
                      style={[
                        styles.sportCardItem,
                        isSelected && styles.sportCardItemSelected,
                      ]}
                    >
                      <Text style={styles.sportEmoji}>{sport.icon}</Text>
                      <Text
                        style={[
                          styles.sportCardLabel,
                          isSelected && styles.sportCardLabelSelected,
                        ]}
                      >
                        {sport.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.sportCheckBadge}>
                          <Check size={12} color={colors.textInverse} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Skill Levels */}
          {step === 3 && (
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Award size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>SKILL TIERS</Text>
              <Text style={styles.stepSubtitle}>
                Calibrate your skill level so Courtly can match you with balanced games.
              </Text>

              {selectedSports.length === 0 ? (
                <Text style={styles.emptyNote}>
                  Please go back to Step 2 and pick at least one sport.
                </Text>
              ) : (
                selectedSports.map((sport) => (
                  <View key={sport} style={styles.sportSkillBlock}>
                    <Text style={styles.sportSkillName}>{sport}</Text>
                    <View style={styles.skillRow}>
                      {SKILL_LEVELS.map((lvl) => {
                        const isCurrent =
                          (skillMap[sport] || 'BEGINNER') === lvl.id;
                        return (
                          <TouchableOpacity
                            key={lvl.id}
                            onPress={() => setSportSkill(sport, lvl.id)}
                            style={[
                              styles.skillPill,
                              isCurrent && styles.skillPillSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.skillPillText,
                                isCurrent && styles.skillPillTextSelected,
                              ]}
                            >
                              {lvl.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* STEP 4: Profile Summary */}
          {step === 4 && (
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Sparkles size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>PROFILE SUMMARY</Text>
              <Text style={styles.stepSubtitle}>
                Review your profile before jumping onto the courts!
              </Text>

              <View style={styles.summaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Player Name:</Text>
                  <Text style={styles.summaryValue}>{fullName || 'Not specified'}</Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Location:</Text>
                  <Text style={styles.summaryValue}>
                    {city ? `${city}${state ? `, ${state}` : ''}` : 'Not specified'}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sports:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSports.join(', ') || 'None selected'}
                  </Text>
                </View>

                {selectedSports.map((sport) => (
                  <View key={sport} style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{sport} Level:</Text>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>
                      {skillMap[sport] || 'BEGINNER'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Navigation Controls */}
          <View style={styles.buttonRow}>
            {step > 1 && (
              <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <PrimaryButton
              title={step === 4 ? 'Save & Start Playing' : 'Continue'}
              onPress={nextStep}
              loading={loading}
              size="lg"
              style={styles.nextButton}
            />
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
    padding: spacing.lg,
  },
  progressBarContainer: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepIndicatorText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  skipButtonText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  track: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
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
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  stepSubtitle: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  sportCardItem: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  sportCardItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(198, 243, 107, 0.08)',
  },
  sportEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  sportCardLabel: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sportCardLabelSelected: {
    color: colors.textPrimary,
  },
  sportCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNote: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  sportSkillBlock: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sportSkillName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  skillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  skillPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skillPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  skillPillTextSelected: {
    color: colors.textInverse,
  },
  summaryBox: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  summaryValue: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 1,
  },
});
