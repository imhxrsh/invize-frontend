import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";

function authHeaders(): Record<string, string> {
	const token = getAccessTokenFromCookie();
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	return headers;
}

export interface IntegrationItem {
	id: string;
	name: string;
	description: string;
	connected: boolean;
	type?: string;
}

export async function getIntegrations(): Promise<{
	integrations: IntegrationItem[];
}> {
	const res = await fetch(`${API_BASE_URL}/integrations`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok)
		throw new Error(
			await res.text().catch(() => "Failed to load integrations"),
		);
	return res.json();
}

export async function setERPType(
	type: string,
): Promise<{ type: string; message: string }> {
	const res = await fetch(`${API_BASE_URL}/integrations/erp`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		body: JSON.stringify({ type }),
		credentials: "include",
	});
	if (!res.ok)
		throw new Error(await res.text().catch(() => "Failed to set ERP"));
	return res.json();
}
