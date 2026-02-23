export const AUTH = {
  REFRESH_TOKEN_DAYS: 7,
  REFRESH_TOKEN_BYTES: 40,
  BCRYPT_ROUNDS: 10,
  DEFAULT_DEVICE_ID: 'default',
} as const;

export const COOKIE = {
  REFRESH_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  ACCESS_MAX_AGE_MS: 15 * 60 * 1000,
  SAME_SITE: 'lax' as const,
} as const;

export const JWT = {
  DEFAULT_ACCESS_EXPIRES_IN: '15m',
} as const;

/** Frontend base URL for redirects (e.g. dashboard after Steam link). */
export const FRONTEND = {
  DEFAULT_DASHBOARD_PATH: '/dashboard',
} as const;
