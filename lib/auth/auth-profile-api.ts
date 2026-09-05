import { API_BASE_URL } from '@/lib/api-config';
import { getLanguageHeaders } from '@/lib/language';
import { getAuthItem } from '@/lib/auth-storage';

import { fetchWithAuth, patchJson, postMultipart, readAuthResponse } from './auth-client';
import type { CurrentUserResponse, ProfileImageUploadInput, UserResponse } from './auth-types';

export function getProfileImageUrl(profileImageUrl: string | null | undefined) {
  if (!profileImageUrl) {
    return null;
  }

  if (profileImageUrl.startsWith('http://') || profileImageUrl.startsWith('https://')) {
    return profileImageUrl;
  }

  return `${API_BASE_URL}${profileImageUrl}`;
}

export function updateProfileEmoji(profileEmoji: string) {
  return patchJson<UserResponse>('/auth/me/profile-emoji', { profile_emoji: profileEmoji });
}

export function uploadProfileImage(image: ProfileImageUploadInput) {
  const formData = new FormData();
  formData.append('image', image.file ?? (image as unknown as Blob));

  return postMultipart<UserResponse>('/auth/me/profile-image', formData);
}

export async function fetchMe(): Promise<CurrentUserResponse> {
  const token = getAuthItem('access_token');

  if (!token) {
    throw new Error('access_token이 없습니다.');
  }

  const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
    headers: {
      ...getLanguageHeaders(),
    },
  });

  return readAuthResponse<CurrentUserResponse>(res);
}
