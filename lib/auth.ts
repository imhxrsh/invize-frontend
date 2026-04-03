import { API_BASE_URL, ACCESS_COOKIE_NAME, ACCESS_TOKEN_MAX_AGE_SEC, REFRESH_TOKEN_HEADER, REFRESH_TOKEN_STORAGE_KEY } from './config';

function isClient() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getAccessTokenFromCookie(): string | null {
  if (!isClient()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ACCESS_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAccessTokenCookie(token: string) {
  if (!isClient()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ACCESS_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${ACCESS_TOKEN_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearAccessTokenCookie() {
  if (!isClient()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ACCESS_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function storeRefreshTokenFromHeader(res: Response) {
  const refreshHeader = res.headers.get(REFRESH_TOKEN_HEADER);
  if (refreshHeader && isClient()) {
    try {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshHeader);
    } catch (e) {
      // ignore storage failures
    }
  }
}

function getRefreshToken(): string | null {
  if (!isClient()) return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function register(email: string, password: string, full_name?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await safeErrorMessage(res, 'Registration failed');
    throw new Error(msg);
  }
  // MeResponse returned; no tokens yet
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await safeErrorMessage(res, 'Login failed');
    throw new Error(msg);
  }
  const data = await res.json();
  const access = data?.access_token;
  if (!access) throw new Error('Login response missing access_token');
  setAccessTokenCookie(access);
  storeRefreshTokenFromHeader(res);
  return data;
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const body = refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined;
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers,
    body,
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await safeErrorMessage(res, 'Token refresh failed');
    throw new Error(msg);
  }
  const data = await res.json();
  const access = data?.access_token;
  if (!access) throw new Error('Refresh response missing access_token');
  setAccessTokenCookie(access);
  storeRefreshTokenFromHeader(res);
  return data;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const body = refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined;
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers,
    body,
    credentials: 'include',
  });
  // regardless of server response, clear client-side tokens
  clearAccessTokenCookie();
  if (isClient()) {
    try { localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY); } catch {}
  }
  if (!res.ok) {
    const msg = await safeErrorMessage(res, 'Logout failed');
    // Throwing is optional; we cleared client tokens already. Surface message for UX.
    throw new Error(msg);
  }
}

export async function me() {
  const access = getAccessTokenFromCookie();
  const headers: Record<string, string> = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await safeErrorMessage(res, 'Failed to fetch user');
    throw new Error(msg);
  }
  return res.json();
}

async function safeErrorMessage(res: Response, fallback: string) {
  try {
    const text = await res.text();
    if (text) return text;
  } catch {}
  return fallback;
}