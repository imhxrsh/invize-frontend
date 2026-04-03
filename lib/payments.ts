import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";
import { formatApiErrorResponse } from "./api-errors";

function authHeaders(): Record<string, string> {
	const token = getAccessTokenFromCookie();
	const h: Record<string, string> = {};
	if (token) h["Authorization"] = `Bearer ${token}`;
	return h;
}

export interface PaymentLineDto {
	id: string;
	job_id: string;
	amount: number;
	currency: string;
}

export interface PaymentBatchDto {
	id: string;
	name: string | null;
	status: string;
	created_at: string | null;
	lines: PaymentLineDto[];
}

export async function listPaymentBatches(): Promise<{ batches: PaymentBatchDto[] }> {
	const res = await fetch(`${API_BASE_URL}/payments/batches`, {
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function createPaymentBatch(name?: string): Promise<{ id: string }> {
	const res = await fetch(`${API_BASE_URL}/payments/batches`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		credentials: "include",
		body: JSON.stringify({ name: name ?? null }),
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function addPaymentLine(
	batchId: string,
	body: { job_id: string; amount?: number; currency?: string },
): Promise<unknown> {
	const res = await fetch(`${API_BASE_URL}/payments/batches/${batchId}/lines`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		credentials: "include",
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function submitPaymentBatch(batchId: string): Promise<unknown> {
	const res = await fetch(`${API_BASE_URL}/payments/batches/${batchId}/submit`, {
		method: "POST",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export async function suggestPaymentAgent(
	items: Record<string, unknown>[],
): Promise<Record<string, unknown>> {
	const res = await fetch(`${API_BASE_URL}/payments/agent/suggest`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders() },
		credentials: "include",
		body: JSON.stringify({ items }),
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}
