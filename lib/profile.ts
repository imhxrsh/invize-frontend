import { API_BASE_URL } from './config'
import { getAccessTokenFromCookie } from './auth'

function authHeaders() {
  const token = getAccessTokenFromCookie()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function getProfileContext() {
  const res = await fetch(`${API_BASE_URL}/profile/context`, {
    method: 'GET',
    headers: { ...authHeaders() },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getSecuritySummary() {
  const res = await fetch(`${API_BASE_URL}/users/me/security`, {
    method: 'GET',
    headers: { ...authHeaders() },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateMe(payload: {
  full_name?: string
  phone?: string
  locale?: string
  time_zone?: string
}) {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updatePreferences(payload: {
  theme?: 'light' | 'dark' | 'system'
  density?: 'comfortable' | 'compact'
  locale?: string
  time_zone?: string
  notifications?: { email?: boolean; push?: boolean }
}) {
  const res = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(normalizePreferences(payload)),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function normalizePreferences(payload: any) {
  const out: any = {}
  if (payload.theme) out.theme = payload.theme
  if (payload.density) out.density = payload.density
  if (payload.locale) out.locale = payload.locale
  if (payload.time_zone) out.time_zone = payload.time_zone
  if (payload.notifications) {
    if (typeof payload.notifications.email === 'boolean') out.notifications_email = payload.notifications.email
    if (typeof payload.notifications.push === 'boolean') out.notifications_push = payload.notifications.push
  }
  return out
}