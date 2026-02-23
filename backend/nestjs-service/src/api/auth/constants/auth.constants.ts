export const AUTH = {
  BCRYPT_ROUNDS: 10,
  REFRESH_TOKEN_BYTES: 32,
  REFRESH_TOKEN_DAYS: 7,
  DEFAULT_DEVICE_ID: 'default',
} as const;

export const JWT = {
  DEFAULT_ACCESS_EXPIRES_IN: '15m',
} as const;

export const COOKIE = {
  /** Refresh cookie max age (7 days in ms) */
  REFRESH_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  /** Access cookie max age (15 min in ms) */
  ACCESS_MAX_AGE_MS: 15 * 60 * 1000,
  SAME_SITE: 'lax' as const,
} as const;

export const FRONTEND = {
  DEFAULT_DASHBOARD_PATH: '/',
} as const;
