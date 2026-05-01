/**
 * Maps backend `progress` strings (see document_intelligence/processor.py) to a linear step index
 * for the live pipeline demo UI.
 */

export type LivePipelineStep = {
	id: string;
	title: string;
	subtitle: string;
	/** Substrings matched against progress (lowercased). */
	matchers: string[];
};

/** Order matches processor sequence; first match wins from the bottom (most specific last). */
export const LIVE_PIPELINE_STEPS: LivePipelineStep[] = [
	{
		id: "queued",
		title: "Queued",
		subtitle: "Your invoice is in line to be processed.",
		matchers: [],
	},
	{
		id: "start",
		title: "Starting",
		subtitle: "The pipeline is waking up for your file.",
		matchers: ["starting processing"],
	},
	{
		id: "ocr",
		title: "Reading the page",
		subtitle: "OCR turns pictures into text the computer can search.",
		matchers: ["performing ocr"],
	},
	{
		id: "extract",
		title: "Finding fields",
		subtitle: "Vendor, totals, dates, and line items are pulled out.",
		matchers: ["extracting fields"],
	},
	{
		id: "validate",
		title: "Double-checking",
		subtitle: "Normalizing and validating what was read.",
		matchers: ["validating results"],
	},
	{
		id: "enrich",
		title: "Enriching details",
		subtitle: "Optional pass to fill missing totals or invoice numbers using the extracted text.",
		matchers: ["enriching fields"],
	},
	{
		id: "swarms",
		title: "AI review",
		subtitle: "Structured summary, flags, and recommendations.",
		matchers: ["analyzing with agent"],
	},
	{
		id: "verify",
		title: "Verification",
		subtitle: "Duplicates, document quality, and audit trail.",
		matchers: ["verification and compliance"],
	},
	{
		id: "match",
		title: "Matching",
		subtitle: "Purchase orders, vendor records, and ERP-style checks.",
		matchers: ["matching to purchase", "vendor records"],
	},
	{
		id: "workflow",
		title: "Workflow",
		subtitle: "Queues, exceptions, and approval hooks.",
		matchers: ["operations workflow"],
	},
];

function bestStepIndexFromHaystack(haystack: string, statusLower: string): number {
	let best = 0;
	if (statusLower === "processing" || statusLower === "failed") {
		best = 1;
	}

	for (let i = 0; i < LIVE_PIPELINE_STEPS.length; i++) {
		const { matchers } = LIVE_PIPELINE_STEPS[i]!;
		if (matchers.length === 0) continue;
		if (matchers.some((m) => haystack.includes(m.toLowerCase()))) {
			best = Math.max(best, i);
		}
	}

	if (statusLower === "pending" && !haystack.trim()) best = 0;

	return best;
}

/**
 * Returns active step index in LIVE_PIPELINE_STEPS (0..length-1), or length when completed.
 * Returns -1 when failed.
 */
export function resolveLivePipelineStep(
	progress: string | undefined,
	status: string,
	progressHistory?: string[],
): number {
	const s = (status || "").toLowerCase();
	if (s === "completed") return LIVE_PIPELINE_STEPS.length;

	const lines = [...(progressHistory ?? []), ...(progress ? [progress] : [])];
	const haystack = lines.map((l) => l.toLowerCase()).join("\n");

	return bestStepIndexFromHaystack(haystack, s);
}
