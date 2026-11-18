import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../../src/auth/use-auth';
import { useSubmitOwnerApplication } from '../../../src/hooks/useOwnerApplication';
import { PrimaryButton } from '../../../src/components/common/PrimaryButton';
import { TextInputField } from '../../../src/components/forms/TextInputField';
import { colors, radius, spacing, typography } from '../../../src/theme';

const BUSINESS_TYPES = [
  'Sports Turf',
  'Indoor Badminton Academy',
  'Multi-Sport Complex',
  'Tennis / Padel Club',
  'Cricket Nets & Ground',
  'Other Sports Facility',
];

export default function OwnerApplicationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const submitMutation = useSubmitOwnerApplication();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [contactPerson, setContactPerson] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [stateName, setStateName] = useState(user?.profile?.state || '');
  const [country, setCountry] = useState(user?.profile?.country || 'India');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (businessName.trim().length < 2) {
      setErrorMessage('Please enter your business or facility name.');
      return;
    }
    if (contactPerson.trim().length < 2) {
      setErrorMessage('Please enter the primary contact person name.');
      return;
    }
    if (contactPhone.trim().length < 7) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }
    if (!city.trim() || !stateName.trim() || !country.trim()) {
      setErrorMessage('City, state, and country are required.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        businessName: businessName.trim(),
        businessType,
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        city: city.trim(),
        state: stateName.trim(),
        country: country.trim(),
        additionalInformation: additionalInformation.trim() || undefined,
      });
      router.replace('/owner/application-status' as any);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Unable to submit application. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Become a Venue Owner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Building2 size={24} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Partner with Courtly</Text>
            <Text style={styles.heroSubtitle}>
              Submit your facility details for administrator verification. Once
              approved, you can list venues, courts, amenities, and photographs.
            </Text>
          </View>

          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TextInputField
            label="Business / Facility Name *"
            placeholder="e.g. Emerald Sports Turf Arena"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={styles.fieldLabel}>Business Type *</Text>
          <View style={styles.chipGrid}>
            {BUSINESS_TYPES.map((type) => {
              const active = businessType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setBusinessType(type)}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                >
                  {active && (
                    <CheckCircle2 size={13} color={colors.textInverse} />
                  )}
                  <Text
                    style={[
                      styles.typeChipText,
                      active && styles.typeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInputField
            label="Contact Person *"
            placeholder="Full name of manager or owner"
            value={contactPerson}
            onChangeText={setContactPerson}
          />

          <TextInputField
            label="Contact Phone *"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />

          <View style={styles.rowTwo}>
            <View style={styles.flex}>
              <TextInputField
                label="City *"
                placeholder="Bengaluru"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={styles.flex}>
              <TextInputField
                label="State *"
                placeholder="Karnataka"
                value={stateName}
                onChangeText={setStateName}
              />
            </View>
          </View>

          <TextInputField
            label="Country *"
            placeholder="India"
            value={country}
            onChangeText={setCountry}
          />

          <TextInputField
            label="Additional Information"
            placeholder="Describe your courts, sports offered, or operating experience"
            multiline
            numberOfLines={4}
            style={styles.multilineInput}
            value={additionalInformation}
            onChangeText={setAdditionalInformation}
          />

          <PrimaryButton
            title="Submit Owner Application"
            onPress={handleSubmit}
            loading={submitMutation.isPending}
            size="lg"
            style={styles.submitBtn}
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(198, 243, 107, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
