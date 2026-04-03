/**
 * Turn FastAPI / JSON error bodies into a single readable line for users.
 */

function stringifyDetail(detail: unknown): string {
	if (detail == null) return "Request failed";
	if (typeof detail === "string") return detail;
	if (Array.isArray(detail)) {
		return detail
			.map((item) => {
				if (typeof item === "object" && item !== null && "msg" in item) {
					return String((item as { msg?: string }).msg ?? item);
				}
				return String(item);
			})
			.join("; ");
	}
	if (typeof detail === "object" && "message" in detail) {
		return String((detail as { message?: string }).message ?? JSON.stringify(detail));
	}
	try {
		return JSON.stringify(detail);
	} catch {
		return "Request failed";
	}
}

/** Parse a response body string (already read) into a user-facing message. */
export function parseApiErrorText(text: string): string {
	const t = text.trim();
	if (!t) return "Request failed";
	if (!t.startsWith("{") && !t.startsWith("[")) {
		return t.length > 280 ? `${t.slice(0, 277)}…` : t;
	}
	try {
		const o = JSON.parse(t) as { detail?: unknown; message?: string };
		if (o.detail !== undefined) return stringifyDetail(o.detail);
		if (typeof o.message === "string") return o.message;
	} catch {
		/* fall through */
	}
	return t.length > 280 ? `${t.slice(0, 277)}…` : t;
}

/** Read `Response` body and return a user-facing error string. */
export async function formatApiErrorResponse(res: Response): Promise<string> {
	const text = await res.text().catch(() => "");
	return parseApiErrorText(text);
}
