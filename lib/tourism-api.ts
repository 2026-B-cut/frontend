import { API_BASE_URL, fetchWithAuth } from '@/lib/auth-api';
import { getCurrentLanguage, getLanguageHeaders } from '@/lib/language';

export type TourismPlaceSearchItem = {
  content_id: string;
  content_type_id?: string | null;
  title: string;
  address?: string | null;
  detail_address?: string | null;
  phone?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area_code?: string | null;
  district_code?: string | null;
  copyright_division_code?: string | null;
};

export type TourismSearchResponse = {
  keyword: string;
  page: number;
  page_size: number;
  total_count: number;
  items: TourismPlaceSearchItem[];
};

export type TourismContentType = '12' | '14' | '15' | '25' | '28' | '32' | '38';

export type TourismRecentSearchItem = {
  keyword: string;
  content_type: TourismContentType;
  search_count: number;
  searched_at: string;
};

export type TourismRecentSearchResponse = {
  items: TourismRecentSearchItem[];
};

export type TourismRecommendedKeywordResponse = {
  keywords: string[];
};

export type TourismPetInformation = {
  accompaniment_type?: string | null;
  allowed_companions?: string | null;
  required_items?: string | null;
  precautions?: string | null;
  accident_risk_notes?: string | null;
  related_facilities?: string | null;
  provided_items?: string | null;
  purchasable_items?: string | null;
  rental_items?: string | null;
};

export type TourismMissionRecommendation = {
  mission_id: number;
  code: string;
  title: string;
  description: string;
  theme: 'MOUNTAIN' | 'SEA' | 'CITY' | 'DEMO';
  type: 'BASIC' | 'RARE' | 'SIDE';
  place_label?: string | null;
  address?: string | null;
  target_photo_url?: string | null;
  distance_m?: number | null;
  match_reasons: string[];
};

export type TourismPlaceDetail = TourismPlaceSearchItem & {
  homepage_url?: string | null;
  overview?: string | null;
  pet?: TourismPetInformation | null;
  nearby_events?: TourismPlaceSearchItem[] | null;
  recommended_missions: TourismMissionRecommendation[];
};

export class TourismSearchApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'TourismSearchApiError';
  }
}

const SEARCH_CACHE_TTL_MS = 60_000;
const DETAIL_CACHE_TTL_MS = 5 * 60_000;
const searchCache = new Map<string, { expiresAt: number; response: TourismSearchResponse }>();
const detailCache = new Map<string, { expiresAt: number; response: TourismPlaceDetail }>();
const pendingDetailRequests = new Map<string, Promise<TourismPlaceDetail>>();

function readCache<T>(cache: Map<string, { expiresAt: number; response: T }>, key: string) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

function getErrorMessage(data: unknown) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const detail = (data as { detail?: unknown }).detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail.map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : String(item))).join('\n');
    }
  }

  return '관광지 검색에 실패했어요.';
}

async function readTourismResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new TourismSearchApiError(getErrorMessage(data), response.status);
  }

  return data as T;
}

export function normalizeTourismImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
}

export async function searchTourismPlaces(
  keyword: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal,
  contentType: TourismContentType = '12',
) {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    throw new TourismSearchApiError('검색어를 입력해주세요.', 422);
  }

  if (trimmedKeyword.length > 100) {
    throw new TourismSearchApiError('검색어는 100자 이내로 입력해주세요.', 422);
  }

  const params = new URLSearchParams({
    content_type: contentType,
    keyword: trimmedKeyword,
    page: String(page),
    page_size: String(Math.min(Math.max(pageSize, 1), 50)),
  });
  const cacheKey = `${getCurrentLanguage()}:${params.toString()}`;
  const cachedResponse = readCache(searchCache, cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/tourism/search?${params.toString()}`, {
    headers: getLanguageHeaders(),
    signal,
  });

  const result = await readTourismResponse<TourismSearchResponse>(response);
  searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, response: result });
  return result;
}

export async function getRecentTourismSearches(signal?: AbortSignal) {
  const response = await fetchWithAuth(`${API_BASE_URL}/tourism/recent-searches`, {
    headers: getLanguageHeaders(),
    signal,
  });

  return readTourismResponse<TourismRecentSearchResponse>(response);
}

export async function getRecommendedTourismKeywords(signal?: AbortSignal) {
  const response = await fetchWithAuth(`${API_BASE_URL}/tourism/recommended-keywords`, {
    headers: getLanguageHeaders(),
    signal,
  });

  return readTourismResponse<TourismRecommendedKeywordResponse>(response);
}

export async function getTourismPlaceDetail(contentId: string, signal?: AbortSignal) {
  const cacheKey = `${getCurrentLanguage()}:${contentId}`;
  const cachedResponse = readCache(detailCache, cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const pendingRequest = pendingDetailRequests.get(cacheKey);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = fetchWithAuth(`${API_BASE_URL}/tourism/places/${encodeURIComponent(contentId)}`, {
    headers: getLanguageHeaders(),
    signal,
  })
    .then((response) => readTourismResponse<TourismPlaceDetail>(response))
    .then((result) => {
      detailCache.set(cacheKey, { expiresAt: Date.now() + DETAIL_CACHE_TTL_MS, response: result });
      return result;
    });

  pendingDetailRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    if (pendingDetailRequests.get(cacheKey) === request) {
      pendingDetailRequests.delete(cacheKey);
    }
  }
}

export async function prefetchTourismPlaceDetails(contentIds: string[]) {
  const uniqueContentIds = [...new Set(contentIds.filter(Boolean))].slice(0, 3);

  await Promise.allSettled(uniqueContentIds.map((contentId) => getTourismPlaceDetail(contentId)));
}
