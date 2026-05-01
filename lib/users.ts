import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";
import { formatApiErrorResponse } from "./api-errors";

function authHeaders(): Record<string, string> {
	const token = getAccessTokenFromCookie();
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	return headers;
}

export interface TeamMember {
	id: string;
	email: string;
	full_name?: string;
	roles: string[];
}

export async function getTeam(): Promise<TeamMember[]> {
	const res = await fetch(`${API_BASE_URL}/users/team`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export interface InviteUserPayload {
	email: string;
	full_name?: string;
	roles?: string[];
}

export async function inviteUser(
	payload: InviteUserPayload,
): Promise<{ id: string; email: string; message: string }> {
	const res = await fetch(`${API_BASE_URL}/users/invite`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		body: JSON.stringify(payload),
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}
