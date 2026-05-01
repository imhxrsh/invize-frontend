/** Parse invoice `agent_analysis.result` (validated JSON from backend, possibly fenced). */

function stripJsonFence(s: string): string {
	let t = s.trim();
	if (!t.startsWith("```")) return t;
	const lines = t.split("\n");
	if (lines.length && lines[0].startsWith("```")) lines.shift();
	if (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
	return lines.join("\n").trim();
}

/** Try to parse a JSON object from text that may have trailing junk. */
function tryParseJsonObject(text: string): Record<string, unknown> | null {
	const raw = stripJsonFence(text.trim());
	if (!raw.startsWith("{")) return null;
	try {
		const o = JSON.parse(raw) as unknown;
		return o !== null && typeof o === "object" && !Array.isArray(o)
			? (o as Record<string, unknown>)
			: null;
	} catch {
		if (raw.length > 25_000) return null;
		const start = raw.indexOf("{");
		if (start < 0) return null;
		for (let end = raw.length; end > start; end--) {
			try {
				const slice = raw.slice(start, end);
				const o = JSON.parse(slice) as unknown;
				if (o !== null && typeof o === "object" && !Array.isArray(o)) {
					return o as Record<string, unknown>;
				}
			} catch {
				/* continue */
			}
		}
		return null;
	}
}

export function parseAgentAnalysisResultText(resultText: string | undefined): {
	summary?: string;
	flags?: string[];
	recommendations?: string[];
	supplier_guess?: string | null;
	buyer_guess?: string | null;
	/** False when backend could not trust model JSON (safe fallback copy). */
	parse_ok?: boolean;
	analysis_warnings?: string[];
} {
	if (!resultText || typeof resultText !== "string") return {};
	const o = tryParseJsonObject(resultText);
	if (!o) return {};

	const optionalString = (v: unknown): string | null | undefined => {
		if (v === undefined) return undefined;
		if (v === null) return null;
		if (typeof v !== "string") return undefined;
		const x = v.trim();
		return x.length ? x : null;
	};

	const meta = o._meta as Record<string, unknown> | undefined;
	const parse_ok =
		meta && typeof meta.parse_ok === "boolean" ? meta.parse_ok : undefined;
	const analysis_warnings = Array.isArray(meta?.warnings)
		? (meta.warnings as unknown[]).map(String)
		: undefined;

	const sg = optionalString(o.supplier_guess);
	const bg = optionalString(o.buyer_guess);

	return {
		summary: typeof o.summary === "string" ? o.summary : undefined,
		flags: Array.isArray(o.flags) ? o.flags.map(String) : undefined,
		recommendations: Array.isArray(o.recommendations)
			? o.recommendations.map(String)
			: undefined,
		...(sg !== undefined ? { supplier_guess: sg } : {}),
		...(bg !== undefined ? { buyer_guess: bg } : {}),
		...(parse_ok !== undefined ? { parse_ok } : {}),
		...(analysis_warnings !== undefined ? { analysis_warnings } : {}),
	};
}
