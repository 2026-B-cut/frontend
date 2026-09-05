import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/lib/api-config';
import { deletePersistentAuthItem, getAuthItem, setPersistentAuthItem } from '@/lib/auth-storage';
import { getLanguageHeaders } from '@/lib/language';

import { fetchWithAuth, readAuthResponse } from './auth/auth-client';

const PUSH_TOKEN_STORAGE_KEY = 'registered_push_token';
const PUSH_CHANNEL_ID = 'mission-invitations';

type PushTokenRegistration = {
  token: string;
  platform: 'android' | 'ios' | 'web';
  provider: 'expo';
  device_id?: string | null;
  app_version?: string | null;
};

export type PushTokenResponse = {
  id: number;
  token: string;
  platform: string;
  provider: string;
  active: boolean;
  last_registered_at: string;
  device_id: string | null;
  app_version: string | null;
  token_type: string;
  last_used_at: string;
};

async function getNotificationsModule() {
  if (Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  return import('expo-notifications').catch(() => null);
}

async function getExpoPushToken() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.HIGH,
      name: '미션 알림',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return null;
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function registerNotificationDevice(input: PushTokenRegistration) {
  const response = await fetchWithAuth(`${API_BASE_URL}/notification-devices`, {
    body: JSON.stringify(input),
    headers: {
      'Content-Type': 'application/json',
      ...getLanguageHeaders(),
    },
    method: 'POST',
  });

  return readAuthResponse<PushTokenResponse>(response);
}

export async function removeNotificationDevice(token: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/notification-devices/${encodeURIComponent(token)}`, {
    headers: getLanguageHeaders(),
    method: 'DELETE',
  });

  await readAuthResponse<Record<string, never>>(response);
}

export async function registerCurrentNotificationDevice() {
  if (!getAuthItem('access_token')) {
    return null;
  }

  const platform = Platform.OS;
  if (platform !== 'android' && platform !== 'ios' && platform !== 'web') {
    return null;
  }

  const token = await getExpoPushToken();
  if (!token) {
    return null;
  }

  const device = await registerNotificationDevice({
    app_version: Constants.expoConfig?.version ?? null,
    device_id: Constants.deviceId ?? null,
    platform,
    provider: 'expo',
    token,
  });

  await setPersistentAuthItem(PUSH_TOKEN_STORAGE_KEY, token);
  return device;
}

export async function removeCurrentNotificationDevice() {
  const token = getAuthItem(PUSH_TOKEN_STORAGE_KEY);
  if (!token) {
    return;
  }

  try {
    await removeNotificationDevice(token);
  } finally {
    await deletePersistentAuthItem(PUSH_TOKEN_STORAGE_KEY);
  }
}
