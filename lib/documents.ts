import { API_BASE_URL } from "./config";
import { getAccessTokenFromCookie } from "./auth";
import { formatApiErrorResponse } from "./api-errors";

function authHeaders(): Record<string, string> {
	const token = getAccessTokenFromCookie();
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	return headers;
}

/** Headers for browser fetches to document routes (preview, download) that cannot send Bearer via plain URLs. */
export function getDocumentRequestHeaders(): Record<string, string> {
	return { ...authHeaders() };
}

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentListItem {
	job_id: string;
	status: string;
	filename?: string;
	created_at?: string;
	vendor?: string;
	total?: number;
	invoice_number?: string | null;
	currency?: string | null;
	approval_status?: string | null;
	has_exception?: boolean;
}

export interface ListDocumentsResponse {
	items: DocumentListItem[];
	total: number;
}

export interface DocumentUploadResponse {
	job_id: string;
	status: DocumentStatus;
	message: string;
}

export interface DocumentStatusResponse {
	job_id: string;
	status: DocumentStatus;
	progress?: string;
	/** Ordered progress lines for live UI (when supported by the API). */
	progress_history?: string[];
	error?: string;
}

/** Optional structured invoice analysis from the pipeline (LLM). */
export interface AgentAnalysisBlock {
	context?: string;
	model?: string;
	result?: string;
	execution_time?: number;
	/** If the model returned JSON text, these may be parsed client-side */
	summary?: string;
	flags?: string[];
	recommendations?: string[];
	supplier_guess?: string | null;
	buyer_guess?: string | null;
	/** Set when backend normalizes model output; false = use extracted fields only for facts. */
	parse_ok?: boolean;
	[key: string]: unknown;
}

export interface DocumentResultResponse {
	job_id: string;
	status: DocumentStatus;
	/** Shown while job is pending/processing (from status poll). */
	progress?: string;
	/** Backend step log; also echoed on GET /result when completed for timeline UIs. */
	progress_history?: string[];
	/** How fields were produced (e.g. Groq vision). */
	pipeline_meta?: {
		groq_vision?: boolean;
		groq_text_enrich?: boolean;
		[key: string]: unknown;
	};
	document_type?: string;
	extracted_data?: {
		supplier?: string;
		buyer?: string;
		bill_to?: string;
		invoice_number?: string;
		date?: string;
		currency?: string;
		subtotal?: number;
		tax?: number;
		total?: number;
		line_items?: Array<{
			description?: string;
			quantity?: number;
			unit_price?: number;
			amount?: number;
			item_code?: string;
			[key: string]: unknown;
		}>;
		[key: string]: unknown;
	};
	processing_time?: number;
	verification_compliance?: {
		duplicate_check?: { is_duplicate?: boolean };
		authenticity?: { warnings?: string[]; fraud_signals?: string[] };
		audit_event_ids?: string[];
	};
	matching_erp?: {
		match_result?: { match_status?: string; variances?: unknown[] };
		vendor_validation?: unknown;
	};
	operations_workflow?: {
		exception?: {
			exception_type?: string;
			queue_name?: string;
			suggested_actions?: string[];
			/** Why this exception type was chosen (backend classification). */
			reason?: string;
		};
		approval_summary?: { status?: string; due_at?: string };
	};
	agent_analysis?: AgentAnalysisBlock | null;
	error?: string;
}

/** List all documents (jobs) from the backend */
export async function listDocuments(): Promise<ListDocumentsResponse> {
	const res = await fetch(`${API_BASE_URL}/documents/`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok)
		throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

/** Upload a document for processing */
export async function uploadDocument(
	file: File,
): Promise<DocumentUploadResponse> {
	const form = new FormData();
	form.append("file", file);
	const res = await fetch(`${API_BASE_URL}/documents/`, {
		method: "POST",
		headers: { ...authHeaders() },
		body: form,
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

/** Get processing status for a job */
export async function getDocumentStatus(
	jobId: string,
): Promise<DocumentStatusResponse> {
	const res = await fetch(`${API_BASE_URL}/documents/${jobId}/status`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

/** Get full result for a job (when completed) */
export async function getDocumentResult(
	jobId: string,
): Promise<DocumentResultResponse> {
	const res = await fetch(`${API_BASE_URL}/documents/${jobId}/result`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

export interface VendorSummary {
	name: string;
	total: number;
	invoice_count: number;
}

export interface ListVendorsResponse {
	vendors: VendorSummary[];
	total: number;
}

/** List vendors (suppliers) aggregated from document results */
export async function listVendors(): Promise<ListVendorsResponse> {
	const res = await fetch(`${API_BASE_URL}/documents/vendors`, {
		method: "GET",
		headers: { ...authHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	return res.json();
}

/** Download original file with Authorization (plain `<a href>` cannot). */
export async function downloadDocumentFile(
	jobId: string,
	filename?: string,
): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/documents/${jobId}/file`, {
		method: "GET",
		headers: { ...getDocumentRequestHeaders() },
		credentials: "include",
	});
	if (!res.ok) throw new Error(await formatApiErrorResponse(res));
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename || `document-${jobId}`;
	a.rel = "noopener";
	a.click();
	URL.revokeObjectURL(url);
}
