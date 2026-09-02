import { API_BASE_URL } from '@/lib/api-config';
import { getLanguageHeaders } from '@/lib/language';

import { fetchWithAuth, postJsonWithAuth, readAuthResponse } from './auth-client';

export type LegalDocumentType = 'service' | 'privacy' | 'location';

export type LegalDocument = {
  type: LegalDocumentType;
  title: string;
  version: string;
  required: boolean;
  content: string;
};

export type LegalDocumentsResponse = {
  required_version: string;
  documents: LegalDocument[];
};

export type AuthBootstrap = {
  user_id: number;
  terms: {
    required_version: string;
    accepted_version: string | null;
    accepted_at: string | null;
    is_accepted: boolean;
  };
  onboarding: {
    required_version: number;
    completed_version: number | null;
    completed_at: string | null;
    is_completed: boolean;
  };
};

export type TermsConsentResponse = {
  accepted: boolean;
  version: string;
  accepted_at: string;
};

export type OnboardingCompleteResponse = {
  completed: boolean;
  version: number;
  completed_at: string;
};

let legalDocumentsCache: LegalDocumentsResponse | null = null;

export async function fetchLegalDocuments(force = false) {
  if (!force && legalDocumentsCache) {
    return legalDocumentsCache;
  }

  const res = await fetch(`${API_BASE_URL}/auth/legal-documents`, {
    headers: getLanguageHeaders(),
    method: 'GET',
  });
  const data = await readAuthResponse<LegalDocumentsResponse>(res);
  legalDocumentsCache = data;
  return data;
}

export function getCachedLegalDocument(type: LegalDocumentType) {
  return legalDocumentsCache?.documents.find((document) => document.type === type) ?? null;
}

export async function fetchAuthBootstrap() {
  const res = await fetchWithAuth(`${API_BASE_URL}/auth/bootstrap`, {
    headers: getLanguageHeaders(),
    method: 'GET',
  });

  return readAuthResponse<AuthBootstrap>(res);
}

export function getAuthenticatedRoute(bootstrap: AuthBootstrap) {
  if (!bootstrap.terms.is_accepted) {
    return '/terms' as const;
  }

  if (!bootstrap.onboarding.is_completed) {
    return '/welcome' as const;
  }

  return '/main' as const;
}

export async function resolveAuthenticatedRoute() {
  return getAuthenticatedRoute(await fetchAuthBootstrap());
}

export function saveTermsConsent(
  version: string,
  agreements: Record<LegalDocumentType, boolean>,
) {
  return postJsonWithAuth<TermsConsentResponse>('/auth/terms-consent', { agreements, version });
}

export function completeOnboarding(version: number) {
  return postJsonWithAuth<OnboardingCompleteResponse>('/auth/onboarding-complete', { version });
}
