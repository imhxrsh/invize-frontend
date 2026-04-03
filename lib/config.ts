// Same-origin /api → server route proxies to BACKEND_URL at request time (see app/api/[[...path]]/route.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';
export const ACCESS_COOKIE_NAME = 'invize_access_token';
export const ACCESS_TOKEN_MAX_AGE_SEC = 30 * 60; // 30 minutes default
export const REFRESH_TOKEN_HEADER = 'X-Refresh-Token';
export const REFRESH_TOKEN_STORAGE_KEY = 'invize_refresh_token';