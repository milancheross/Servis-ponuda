import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/auth';
import { setupNotificationHandler } from '../lib/notifications';

setupNotificationHandler();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="quote/new" options={{ headerShown: true, title: 'Nova ponuda', headerBackTitle: 'Nazad' }} />
      <Stack.Screen name="quote/[id]" options={{ headerShown: true, title: 'Ponuda', headerBackTitle: 'Nazad' }} />
      <Stack.Screen name="client/new" options={{ headerShown: true, title: 'Novi klijent', headerBackTitle: 'Nazad' }} />
      <Stack.Screen name="client/[id]" options={{ headerShown: true, title: 'Klijent', headerBackTitle: 'Nazad' }} />
      <Stack.Screen name="invoice/[id]" options={{ headerShown: true, title: 'Faktura', headerBackTitle: 'Nazad' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
