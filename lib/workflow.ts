import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";
import { formatApiErrorResponse } from "./api-errors";

function authHeaders(): Record<string, string> {
	const token = getAccessTokenFromCookie();
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	return headers;
}

export interface QueueCountsResponse {
	queue_counts: Record<string, number>;
	total_pending: number;
}

export interface QueueItem {
	id: string;
	job_id: string;
	exception_type: string;
	queue_name: string;
	priority?: number;
	status: string;
	created_at: string;
	resolution?: string;
}

export interface DashboardStatsResponse {
	queue_counts: Record<string, number>;
	avg_cycle_time_seconds?: number;
	pending_approvals: number;
	overdue_count: number;
}

export async function getWorkflowQueues(): Promise<QueueCountsResponse> {
	const res = await fetch(`${API_BASE_URL}/workflow/queues`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok)
		throw new Error(await res.text().catch(() => "Failed to get queues"));
	return res.json();
}

export async function getQueueItems(
	queueName: string,
	params?: { status?: string; limit?: number; offset?: number },
): Promise<QueueItem[]> {
	const sp = new URLSearchParams();
	if (params?.status) sp.set("status", params.status);
	if (params?.limit != null) sp.set("limit", String(params.limit));
	if (params?.offset != null) sp.set("offset", String(params.offset));
	const qs = sp.toString();
	const url = `${API_BASE_URL}/workflow/queues/${encodeURIComponent(queueName)}/items${qs ? `?${qs}` : ""}`;
	const res = await fetch(url, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function updateReviewItem(
	itemId: string,
	body: {
		status?: string;
		resolution?: string;
		assigned_to_user_id?: string;
	},
): Promise<{ id: string; status?: string; resolution?: string }> {
	const res = await fetch(`${API_BASE_URL}/workflow/items/${itemId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		body: JSON.stringify(body),
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function getWorkflowStats(): Promise<DashboardStatsResponse> {
	const res = await fetch(`${API_BASE_URL}/workflow/stats`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function approveJob(
	jobId: string,
	comment?: string,
): Promise<{ job_id: string; status: string }> {
	const res = await fetch(`${API_BASE_URL}/workflow/jobs/${jobId}/approve`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		body: JSON.stringify(comment != null ? { comment } : {}),
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function rejectJob(
	jobId: string,
	comment?: string,
): Promise<{ job_id: string; status: string }> {
	const res = await fetch(`${API_BASE_URL}/workflow/jobs/${jobId}/reject`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		body: JSON.stringify(comment != null ? { comment } : {}),
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function getPendingApprovals(params?: {
	limit?: number;
	offset?: number;
}): Promise<
	Array<{
		id: string;
		job_id: string;
		current_level: number;
		due_at: string | null;
		created_at: string;
	}>
> {
	const sp = new URLSearchParams();
	if (params?.limit != null) sp.set("limit", String(params.limit));
	if (params?.offset != null) sp.set("offset", String(params.offset));
	const qs = sp.toString();
	const url = `${API_BASE_URL}/workflow/approvals/pending${qs ? `?${qs}` : ""}`;
	const res = await fetch(url, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}
