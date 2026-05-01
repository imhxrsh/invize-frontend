import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";
import { formatApiErrorResponse } from "./api-errors";

function authHeaders(): Record<string, string> {
	const token = getAccessTokenFromCookie();
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	return headers;
}

export interface GmailStatus {
	connected: boolean;
	google_email: string | null;
	last_sync_at: string | null;
}

export interface GmailIngestLogEntry {
	at?: string;
	level?: string;
	message?: string;
}

export interface GmailScanRow {
	id: string;
	gmail_message_id: string;
	thread_id: string | null;
	subject: string | null;
	from_addr: string | null;
	snippet: string | null;
	category: string;
	confidence: number | null;
	reasons: string[] | null;
	attachment_meta?: Array<Record<string, unknown>> | null;
	document_job_id?: string | null;
	pipeline_status?: string | null;
	pipeline_error?: string | null;
	ingest_log?: Array<Record<string, unknown>> | null;
	classified_at: string;
}

export async function getGmailStatus(): Promise<GmailStatus> {
	const res = await fetch(`${API_BASE_URL}/gmail/status`, {
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function startGmailOAuth(): Promise<{ authorization_url: string }> {
	const res = await fetch(`${API_BASE_URL}/gmail/oauth/start`, {
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function disconnectGmail(): Promise<{ disconnected: boolean }> {
	const res = await fetch(`${API_BASE_URL}/gmail/disconnect`, {
		method: "POST",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function scanGmailInbox(): Promise<{ queued: boolean; message: string }> {
	const res = await fetch(`${API_BASE_URL}/gmail/scan`, {
		method: "POST",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function listGmailScanned(params?: {
	limit?: number;
	skip?: number;
	category?: string;
}): Promise<{
	items: GmailScanRow[];
	total: number;
	non_invoice_pipeline_skipped: number;
}> {
	const q = new URLSearchParams();
	if (params?.limit != null) q.set("limit", String(params.limit));
	if (params?.skip != null) q.set("skip", String(params.skip));
	if (params?.category) q.set("category", params.category);
	const qs = q.toString();
	const res = await fetch(
		`${API_BASE_URL}/gmail/scanned${qs ? `?${qs}` : ""}`,
		{
			headers: { ...authHeaders() },
			credentials: "include",
		},
	);
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function getGmailScannedOne(
	scanId: string,
): Promise<{ item: GmailScanRow }> {
	const res = await fetch(`${API_BASE_URL}/gmail/scanned/${scanId}`, {
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}
