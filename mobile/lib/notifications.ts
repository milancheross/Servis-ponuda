import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function setupNotificationHandler(): void {
  // Push notifications not supported in Expo Go SDK 53+
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    // Dynamically import to avoid crash in Expo Go
    const Notifications = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}
