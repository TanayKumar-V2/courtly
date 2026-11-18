import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/use-auth';
import { colors } from '../../src/theme';

export default function ProtectedAppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Keep splash screen visible while restoring session
  if (isLoading) {
    return null;
  }

  // Redirect unauthenticated visitors to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding/index"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen name="owner/index" options={{ headerShown: false }} />
      <Stack.Screen name="owner/application" options={{ headerShown: false }} />
      <Stack.Screen
        name="owner/application-status"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="owner/venues/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="owner/venues/create"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/edit"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/location"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/courts"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/amenities"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/images"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="owner/venues/[venueId]/preview"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
