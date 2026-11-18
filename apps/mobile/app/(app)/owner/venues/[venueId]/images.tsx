import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react-native';
import {
  useDeleteVenueImage,
  useOwnerVenue,
  useReorderVenueImages,
  useSetCoverVenueImage,
  useUploadVenueImage,
} from '../../../../../src/hooks/useOwnerVenues';
import { LocalImageFile } from '../../../../../src/services/venue-image-service';
import { LoadingIndicator } from '../../../../../src/components/common/LoadingIndicator';
import { colors, radius, spacing, typography } from '../../../../../src/theme';

interface UploadTask {
  id: string;
  file: LocalImageFile;
  progress: number;
  status: 'uploading' | 'error';
  error?: string;
}

export default function ManageVenueImagesScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  const { data, isLoading, refetch } = useOwnerVenue(venueId);
  const uploadMutation = useUploadVenueImage(venueId || '');
  const deleteMutation = useDeleteVenueImage(venueId || '');
  const setCoverMutation = useSetCoverVenueImage(venueId || '');
  const reorderMutation = useReorderVenueImages(venueId || '');

  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  if (isLoading || !data?.venue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingIndicator message="Loading photographs..." />
      </SafeAreaView>
    );
  }

  const venue = data.venue;
  const images = venue.images || [];

  const uploadSingle = async (taskId: string, file: LocalImageFile) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'uploading', progress: 5, error: undefined } : t,
      ),
    );
    try {
      await uploadMutation.mutateAsync({
        file,
        onProgress: (pct) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, progress: pct } : t)),
          );
        },
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await refetch();
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'error', error: err?.message || 'Upload failed' }
            : t,
        ),
      );
    }
  };

  const handlePickPhotos = async () => {
    setErrorBanner(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErrorBanner('Photo library permission is required to upload photos.');
      return;
    }

    const remaining = Math.max(0, 10 - (images.length + tasks.length));
    if (remaining === 0) {
      setErrorBanner('Maximum limit of 10 photographs reached.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const queued: UploadTask[] = result.assets.map((a, i) => ({
      id: `img_${Date.now()}_${i}`,
      file: { uri: a.uri, fileName: a.fileName, mimeType: a.mimeType },
      progress: 0,
      status: 'uploading',
    }));
    setTasks((prev) => [...prev, ...queued]);

    for (const item of queued) {
      await uploadSingle(item.id, item.file);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    try {
      await reorderMutation.mutateAsync(reordered.map((i) => i.id));
      await refetch();
    } catch (err: any) {
      Alert.alert('Reorder Failed', err?.message || 'Try again');
    }
  };

  const handleDelete = (imageId: string) => {
    Alert.alert(
      'Delete Photograph',
      'Permanently delete this photograph from Cloudinary and your listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(imageId);
              await refetch();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Try again');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          Photographs ({images.length}/10)
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!!errorBanner && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorBanner}</Text>
          </View>
        )}

        <Pressable onPress={handlePickPhotos} style={styles.dropzone}>
          <Camera size={28} color={colors.primary} />
          <Text style={styles.dropTitle}>Upload Venue Photos</Text>
          <Text style={styles.dropSub}>
            JPEG, PNG or WebP • Max 8 MB each • Signed Cloudinary upload
          </Text>
        </Pressable>

        {tasks.map((t) => (
          <View key={t.id} style={styles.taskCard}>
            <Image source={{ uri: t.file.uri }} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.taskLabel}>
                {t.status === 'uploading' ? `Uploading ${t.progress}%` : 'Upload Error'}
              </Text>
              {t.status === 'uploading' ? (
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${t.progress}%` }]} />
                </View>
              ) : (
                <Text style={styles.errorText}>{t.error}</Text>
              )}
            </View>
            {t.status === 'error' && (
              <Pressable onPress={() => uploadSingle(t.id, t.file)} style={styles.retryBtn}>
                <RefreshCw size={15} color={colors.primary} />
              </Pressable>
            )}
          </View>
        ))}

        {images.map((img, idx) => (
          <View key={img.id} style={styles.photoCard}>
            <Image source={{ uri: img.secureUrl }} style={styles.photo} contentFit="cover" />
            <View style={styles.photoFooter}>
              <Pressable
                onPress={async () => {
                  await setCoverMutation.mutateAsync(img.id);
                  await refetch();
                }}
                style={[styles.coverBtn, img.isCover && styles.coverBtnActive]}
              >
                <Star
                  size={13}
                  color={img.isCover ? colors.textInverse : colors.primary}
                />
                <Text
                  style={[
                    styles.coverText,
                    img.isCover && styles.coverTextActive,
                  ]}
                >
                  {img.isCover ? 'Cover Image' : 'Set Cover'}
                </Text>
              </Pressable>

              <View style={styles.orderRow}>
                <Pressable
                  onPress={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  style={[styles.smallBtn, idx === 0 && { opacity: 0.3 }]}
                >
                  <ArrowUp size={15} color={colors.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={() => handleMove(idx, 1)}
                  disabled={idx === images.length - 1}
                  style={[
                    styles.smallBtn,
                    idx === images.length - 1 && { opacity: 0.3 },
                  ]}
                >
                  <ArrowDown size={15} color={colors.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(img.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={15} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
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
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 24 },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  dropTitle: { ...typography.h4, color: colors.textPrimary, marginTop: spacing.sm },
  dropSub: { ...typography.caption, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  thumb: { width: 52, height: 52, borderRadius: radius.md },
  taskLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '700', marginBottom: 4 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary },
  retryBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  photo: { width: '100%', height: 190 },
  photoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm + 2,
  },
  coverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  coverBtnActive: { backgroundColor: colors.primary },
  coverText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  coverTextActive: { color: colors.textInverse },
  orderRow: { flexDirection: 'row', gap: 6 },
  smallBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  deleteBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
  },
});
