/**
 * Turn FastAPI / JSON error bodies into readable text for users.
 */

function formatValidationItem(item: unknown): string | null {
	if (typeof item !== "object" || item === null) return null;
	const o = item as Record<string, unknown>;
	const msg = typeof o.msg === "string" ? o.msg : null;
	if (!msg) return null;
	const loc = o.loc;
	if (Array.isArray(loc) && loc.length > 0) {
		const path = loc
			.filter((x) => typeof x === "string" || typeof x === "number")
			.map(String)
			.join(".");
		if (path) return `${path}: ${msg}`;
	}
	return msg;
}

function stringifyDetail(detail: unknown): string {
	if (detail == null) return "Something went wrong.";
	if (typeof detail === "string") return humanizeErrorPhrase(detail.trim());
	if (Array.isArray(detail)) {
		const parts = detail
			.map((item) => {
				const v = formatValidationItem(item);
				if (v) return v;
				if (typeof item === "object" && item !== null && "msg" in item) {
					return String((item as { msg?: string }).msg ?? item);
				}
				return String(item);
			})
			.filter(Boolean);
		if (parts.length) return parts.join(" ");
		return "Please check your input and try again.";
	}
	if (typeof detail === "object") {
		const o = detail as Record<string, unknown>;
		if (typeof o.message === "string" && o.message.trim())
			return humanizeErrorPhrase(o.message.trim());
		const v = formatValidationItem(detail);
		if (v) return humanizeErrorPhrase(v);
		try {
			return humanizeErrorPhrase(JSON.stringify(detail));
		} catch {
			return "Something went wrong.";
		}
	}
	return "Something went wrong.";
}

/** Map common API / env errors to short, human copy. Order: more specific first. */
function humanizeErrorPhrase(message: string): string {
	const m = message.trim();
	if (!m) return "Something went wrong.";

	const rules: Array<{ match: RegExp; say: string }> = [
		{
			match: /Gmail OAuth is not configured/i,
			say: "Gmail isn’t set up on the server yet. Add GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET to the API’s environment, then restart the backend.",
		},
		{
			match: /Gmail not connected/i,
			say: "Connect Gmail in Settings → Integrations first.",
		},
		{
			match: /GROQ_API_KEY/i,
			say: "The AI assistant isn’t configured on the server. Ask your administrator to review the API environment.",
		},
		{
			match: /Swarms AI unavailable/i,
			say: "The analysis service isn’t available right now. Try again later or check server logs.",
		},
		{
			match: /Authentication failed|could not validate credentials|not authenticated/i,
			say: "Your session expired or isn’t valid. Sign in again.",
		},
		{
			match: /incorrect password|invalid password|wrong password/i,
			say: "That email or password doesn’t match our records.",
		},
		{
			match: /user already exists|email.*already/i,
			say: "An account with this email already exists. Try signing in instead.",
		},
		{
			match: /Scan result not found/i,
			say: "That Gmail scan record wasn’t found. It may have been removed.",
		},
	];

	for (const { match, say } of rules) {
		if (match.test(m)) return say;
	}
	return m.length > 500 ? `${m.slice(0, 497)}…` : m;
}

/** Parse a response body string (already read) into a user-facing message. */
export function parseApiErrorText(text: string): string {
	const t = text.trim();
	if (!t) return "Something went wrong.";
	if (!t.startsWith("{") && !t.startsWith("[")) {
		return humanizeErrorPhrase(t.length > 500 ? `${t.slice(0, 497)}…` : t);
	}
	try {
		const o = JSON.parse(t) as {
			detail?: unknown;
			message?: string;
			error?: unknown;
		};
		if (o.detail !== undefined) return stringifyDetail(o.detail);
		if (typeof o.message === "string" && o.message.trim())
			return humanizeErrorPhrase(o.message.trim());
		if (typeof o.error === "string" && o.error.trim())
			return humanizeErrorPhrase(o.error.trim());
	} catch {
		/* fall through */
	}
	return humanizeErrorPhrase(t.length > 500 ? `${t.slice(0, 497)}…` : t);
}

/** Read `Response` body and return a user-facing error string. */
export async function formatApiErrorResponse(res: Response): Promise<string> {
	const text = await res.text().catch(() => "");
	return parseApiErrorText(text);
}

/** Use in `catch` when the error may be `Error` with a JSON body in `.message`. */
export function userFacingErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) {
		return parseApiErrorText(error.message);
	}
	if (typeof error === "string") return parseApiErrorText(error);
	return fallback;
}
