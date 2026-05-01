import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";
import { formatApiErrorResponse } from "./api-errors";

function authHeaders(): Record<string, string> {
  const token = getAccessTokenFromCookie();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  last_login_at?: string;
  avatar_url?: string;
  org_id?: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  total_security_events: number;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: string;
  job_id?: string;
  stage?: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface SecurityEventEntry {
  id: string;
  user_id: string;
  type: string;
  message?: string;
  created_at: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}

export async function updateAdminUser(
  userId: string,
  payload: {
    full_name?: string;
    roles?: string[];
    permissions?: string[];
    is_active?: boolean;
  }
): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}

export async function deactivateAdminUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
}

export async function inviteAdminUser(payload: {
  email: string;
  full_name?: string;
  roles?: string[];
}): Promise<{ id: string; email: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/users/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSystemSettings(): Promise<SystemSetting[]> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  const data = await res.json();
  return data.settings ?? [];
}

export async function updateSystemSetting(
  key: string,
  value: string
): Promise<SystemSetting> {
  const res = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ value }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}

export async function bulkUpdateSettings(
  settings: Record<string, string>
): Promise<SystemSetting[]> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ settings }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  const data = await res.json();
  return data.settings ?? [];
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function getAuditLog(params?: {
  limit?: number;
  skip?: number;
  job_id?: string;
}): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.job_id) query.set("job_id", params.job_id);

  const res = await fetch(`${API_BASE_URL}/admin/audit-log?${query}`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}

// ─── Security Events ──────────────────────────────────────────────────────────

export async function getAllSecurityEvents(params?: {
  limit?: number;
  skip?: number;
}): Promise<{ events: SecurityEventEntry[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));

  const res = await fetch(`${API_BASE_URL}/admin/security-events?${query}`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await formatApiErrorResponse(res));
  return res.json();
}
