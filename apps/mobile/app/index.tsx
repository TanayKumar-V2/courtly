import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/use-auth';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={'/(tabs)' as any} />;
}
