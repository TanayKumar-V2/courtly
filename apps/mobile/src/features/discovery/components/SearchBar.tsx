import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  isLoading = false,
  placeholder = 'Find turfs, courts and sports venues...',
}) => {
  return (
    <View style={styles.container}>
      <Search size={18} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        maxLength={100}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Search sports venues"
      />
      {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
      {!isLoading && value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search query"
          style={styles.clearBtn}
        >
          <X size={15} color={colors.textPrimary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodySecondary,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
