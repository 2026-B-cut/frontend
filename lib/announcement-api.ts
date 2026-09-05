import { API_BASE_URL } from '@/lib/api-config';
import { getLanguageHeaders } from '@/lib/language';

import { fetchWithAuth, readAuthResponse } from './auth/auth-client';

export type AnnouncementListItem = {
  id: number;
  title: string;
  summary: string;
  publishedAt: string;
  isRead: boolean;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
};

export type AnnouncementListResponse = {
  items: AnnouncementListItem[];
  page: number;
  limit: number;
  totalCount: number;
  hasNext: boolean;
};

export type AnnouncementDetail = {
  id: number;
  title: string;
  content: string;
  publishedAt: string;
  isRead: boolean;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
};

export type AnnouncementReadResponse = {
  announcementId: number;
  isRead: boolean;
  readAt: string;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getLanguageHeaders(),
      ...init?.headers,
    },
  });

  return readAuthResponse<T>(response);
}

export function normalizeAnnouncementAssetUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url}`;
}

export function getAnnouncements(page = 1, limit = 20, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), limit: String(Math.min(Math.max(limit, 1), 100)) });
  return request<AnnouncementListResponse>(`/announcements?${params.toString()}`, { signal });
}

export function getUnreadAnnouncementCount(signal?: AbortSignal) {
  return request<{ count: number }>('/announcements/unread-count', { signal });
}

export function getAnnouncement(id: number, signal?: AbortSignal) {
  return request<AnnouncementDetail>(`/announcements/${id}`, { signal });
}

export function markAnnouncementRead(id: number) {
  return request<AnnouncementReadResponse>(`/announcements/${id}/read`, { method: 'POST' });
}
