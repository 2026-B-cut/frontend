import { API_BASE_URL } from '@/lib/api-config';
import { getLanguageHeaders } from '@/lib/language';

import { fetchWithAuth, readAuthResponse } from './auth/auth-client';

export type NotificationPreferences = {
  masterEnabled: boolean;
  missionEnabled: boolean;
  magazineEnabled: boolean;
  nightEnabled: boolean;
  announcementEnabled: boolean;
  marketingEnabled: boolean;
  marketingConsentAt: string | null;
  marketingWithdrawnAt: string | null;
  marketingConsentVersion: string | null;
  marketingConsentSource: string | null;
  nightConsentAt: string | null;
  nightWithdrawnAt: string | null;
  updatedAt: string;
  requiredMarketingConsentVersion: string;
};

type NotificationPreferencesResponse = {
  master_enabled: boolean;
  mission_enabled: boolean;
  magazine_enabled: boolean;
  night_enabled: boolean;
  announcement_enabled: boolean;
  marketing_enabled: boolean;
  marketing_consent_at: string | null;
  marketing_withdrawn_at: string | null;
  marketing_consent_version: string | null;
  marketing_consent_source: string | null;
  night_consent_at: string | null;
  night_withdrawn_at: string | null;
  updated_at: string;
  required_marketing_consent_version: string;
};

export type NotificationPreferencesUpdate = Partial<{
  masterEnabled: boolean;
  missionEnabled: boolean;
  magazineEnabled: boolean;
  nightEnabled: boolean;
  announcementEnabled: boolean;
  marketingEnabled: boolean;
  marketingConsentVersion: string;
}>;

function toNotificationPreferences(response: NotificationPreferencesResponse): NotificationPreferences {
  return {
    announcementEnabled: response.announcement_enabled,
    magazineEnabled: response.magazine_enabled,
    marketingConsentAt: response.marketing_consent_at,
    marketingConsentSource: response.marketing_consent_source,
    marketingConsentVersion: response.marketing_consent_version,
    marketingEnabled: response.marketing_enabled,
    marketingWithdrawnAt: response.marketing_withdrawn_at,
    masterEnabled: response.master_enabled,
    missionEnabled: response.mission_enabled,
    nightConsentAt: response.night_consent_at,
    nightEnabled: response.night_enabled,
    nightWithdrawnAt: response.night_withdrawn_at,
    requiredMarketingConsentVersion: response.required_marketing_consent_version,
    updatedAt: response.updated_at,
  };
}

async function requestNotificationPreferences(
  method: 'GET' | 'PATCH',
  body?: NotificationPreferencesUpdate,
) {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/me/notification-preferences`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...getLanguageHeaders(),
    },
    method,
  });

  return toNotificationPreferences(await readAuthResponse<NotificationPreferencesResponse>(response));
}

export function getNotificationPreferences() {
  return requestNotificationPreferences('GET');
}

export function updateNotificationPreferences(body: NotificationPreferencesUpdate) {
  return requestNotificationPreferences('PATCH', body);
}
