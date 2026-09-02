/**
 * Backward-compatible auth API entry point.
 *
 * Keep existing imports stable while the implementation is organized by responsibility
 * under lib/auth.
 */
export { API_BASE_URL } from '@/lib/api-config';

export { AuthApiError, fetchWithAuth, isAuthSessionInvalidError } from './auth/auth-client';
export {
  completeOnboarding,
  fetchAuthBootstrap,
  fetchLegalDocuments,
  getAuthenticatedRoute,
  getCachedLegalDocument,
  resolveAuthenticatedRoute,
  saveTermsConsent,
} from './auth/auth-bootstrap-api';
export {
  confirmPasswordReset,
  deleteCurrentAccount,
  loginWithEmail,
  refreshAuthToken,
  registerWithEmail,
  requestPasswordReset,
  updateMe,
  verifyEmail,
} from './auth/auth-account-api';
export { loginWithKakaoAccessToken } from './auth/auth-social-api';
export { clearAuthSession, saveAuthTokens, saveWebKakaoAuthToken } from './auth/auth-session';
export {
  fetchMe,
  getProfileImageUrl,
  updateProfileEmoji,
  uploadProfileImage,
} from './auth/auth-profile-api';
export type { AuthTokens, AuthUser } from './auth/auth-types';
export type {
  AuthBootstrap,
  LegalDocument,
  LegalDocumentType,
  LegalDocumentsResponse,
  OnboardingCompleteResponse,
  TermsConsentResponse,
} from './auth/auth-bootstrap-api';
