const FALLBACK_CURRENCY = "INR";

/** Normalize to a 3-letter ISO code for Intl; invalid or empty → INR. */
export function normalizeIsoCurrency(code: string | null | undefined): string {
	const c = (code ?? "").trim().toUpperCase();
	if (/^[A-Z]{3}$/.test(c)) return c;
	return FALLBACK_CURRENCY;
}

export function formatDocumentCurrency(
	amount: number | null | undefined,
	currencyCode?: string | null,
	options?: { maximumFractionDigits?: number },
): string {
	if (amount == null || Number.isNaN(Number(amount))) return "—";
	const cur = normalizeIsoCurrency(currencyCode);
	const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: cur,
			maximumFractionDigits,
		}).format(Number(amount));
	} catch {
		return `${cur} ${Number(amount).toLocaleString()}`;
	}
}
