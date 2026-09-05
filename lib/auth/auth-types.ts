export type ProfileImageUploadInput = {
  name: string;
  type: string;
  uri: string;
  file?: Blob;
};

export type AuthTokens = {
  access_token?: string;
  refresh_token?: string;
  token?: string;
  user_id?: number | string;
};

export type UserResponse = {
  id: number;
  provider: string;
  provider_user_id: string;
  email: string | null;
  nickname: string | null;
  profile_image_url: string | null;
  profile_emoji: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type CurrentUserResponse = UserResponse & {
  completed_mission_count: number;
  created_magazine_count: number;
};

/** The authenticated user's complete response from GET /auth/me. */
export type AuthUser = CurrentUserResponse;
