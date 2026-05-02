"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Check,
	X,
	CheckCircle,
	XCircle,
	Clock,
	Loader2,
	AlertCircle,
	Download,
	FileText,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	getDocumentStatus,
	getDocumentResult,
	downloadDocumentFile,
	getDocumentRequestHeaders,
	type DocumentResultResponse,
} from "@/lib/documents";
import { approveJob, rejectJob } from "@/lib/workflow";
import { API_BASE_URL } from "@/lib/config";
import { parseAgentAnalysisResultText } from "@/lib/agent-analysis";
import { parseApiErrorText, userFacingErrorMessage } from "@/lib/api-errors";
import { formatDocumentCurrency } from "@/lib/format-currency";

// ── Document Viewer (authorized fetch → blob; `/file` requires Bearer) ─────
function DocumentViewer({ jobId }: { jobId: string }) {
	const fileUrl = `${API_BASE_URL}/documents/${jobId}/file`;
	const [fileType, setFileType] = useState<"pdf" | "image" | "unknown" | null>(
		null,
	);
	const [fileError, setFileError] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setFileType(null);
		setFileError(false);
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
		setBlobUrl(null);

		(async () => {
			try {
				const res = await fetch(fileUrl, {
					method: "GET",
					headers: getDocumentRequestHeaders(),
					credentials: "include",
				});
				if (cancelled) return;
				if (!res.ok) {
					setFileError(true);
					setFileType("unknown");
					return;
				}
				const blob = await res.blob();
				if (cancelled) return;
				const ct = blob.type || res.headers.get("content-type") || "";
				let nextType: "pdf" | "image" | "unknown" = "unknown";
				if (ct.includes("pdf")) nextType = "pdf";
				else if (ct.startsWith("image/")) nextType = "image";
				const objectUrl = URL.createObjectURL(blob);
				if (cancelled) {
					URL.revokeObjectURL(objectUrl);
					return;
				}
				blobUrlRef.current = objectUrl;
				setFileType(nextType);
				setBlobUrl(objectUrl);
			} catch {
				if (!cancelled) {
					setFileError(true);
					setFileType("unknown");
				}
			}
		})();

		return () => {
			cancelled = true;
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current);
				blobUrlRef.current = null;
			}
		};
	}, [fileUrl]);

	if (fileType === null) {
		return (
			<div className="aspect-[3/4] flex items-center justify-center bg-muted rounded-b-lg">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}
	if (fileError || fileType === "unknown" || !blobUrl) {
		return (
			<div className="aspect-[3/4] bg-muted rounded-b-lg flex flex-col items-center justify-center gap-3">
				<FileText className="h-12 w-12 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Preview unavailable</p>
				<Button
					variant="outline"
					size="sm"
					onClick={() => downloadDocumentFile(jobId).catch(() => {})}
				>
					Try download
				</Button>
			</div>
		);
	}
	if (fileType === "pdf") {
		return (
			<iframe
				src={blobUrl}
				title="Invoice PDF"
				className="w-full rounded-b-lg border-0"
				style={{ height: "600px" }}
			/>
		);
	}
	return (
		<div className="bg-muted rounded-b-lg overflow-hidden">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={blobUrl}
				alt="Invoice document"
				className="w-full object-contain max-h-[600px]"
			/>
		</div>
	);
}

export default function InvoiceDetailPage() {
	const params = useParams();
	const jobId = typeof params.id === "string" ? params.id : "";
	const [result, setResult] = useState<DocumentResultResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState<
		"approve" | "reject" | null
	>(null);
	const [downloadError, setDownloadError] = useState<string | null>(null);

	useEffect(() => {
		if (!jobId) {
			setLoading(false);
			setError("Missing job ID");
			return;
		}
		let cancelled = false;
		let sleepTimer: ReturnType<typeof setTimeout> | undefined;

		const sleep = (ms: number) =>
			new Promise<void>((resolve) => {
				sleepTimer = setTimeout(resolve, ms);
			});

		(async () => {
			setLoading(true);
			setError(null);
			try {
				while (!cancelled) {
					const statusRes = await getDocumentStatus(jobId);
					if (cancelled) return;
					if (
						statusRes.status === "pending" ||
						statusRes.status === "processing"
					) {
						setResult({
							job_id: jobId,
							status: statusRes.status,
							error: statusRes.error,
							progress: statusRes.progress,
							progress_history: statusRes.progress_history,
						});
						setLoading(false);
						await sleep(2000);
						continue;
					}
					if (statusRes.status === "failed") {
						setResult({
							job_id: jobId,
							status: "failed",
							error: statusRes.error ?? "Processing failed",
							progress: statusRes.progress,
							progress_history: statusRes.progress_history,
						});
						setLoading(false);
						return;
					}
					const res = await getDocumentResult(jobId);
					if (cancelled) return;
					setResult(res);
					setLoading(false);
					return;
				}
			} catch (e: unknown) {
				if (!cancelled) {
					setError(
						e instanceof Error
							? e.message
							: "Failed to load document",
					);
					setResult(null);
					setLoading(false);
				}
			}
		})();

		return () => {
			cancelled = true;
			if (sleepTimer) clearTimeout(sleepTimer);
		};
	}, [jobId]);

	const handleApprove = async () => {
		if (!jobId) return;
		setActionLoading("approve");
		try {
			await approveJob(jobId);
			const res = await getDocumentResult(jobId);
			setResult(res);
		} catch (e: unknown) {
			setError(userFacingErrorMessage(e, "Approve failed."));
		} finally {
			setActionLoading(null);
		}
	};

	const handleReject = async () => {
		if (!jobId) return;
		setActionLoading("reject");
		try {
			await rejectJob(jobId);
			const res = await getDocumentResult(jobId);
			setResult(res);
		} catch (e: unknown) {
			setError(userFacingErrorMessage(e, "Reject failed."));
		} finally {
			setActionLoading(null);
		}
	};

	const ext = result?.extracted_data;
	const verification = result?.verification_compliance;
	const matching = result?.matching_erp;
	const workflow = result?.operations_workflow;
	const agentAnalysis = result?.agent_analysis;
	const parsedAgent = parseAgentAnalysisResultText(
		typeof agentAnalysis?.result === "string"
			? agentAnalysis.result
			: undefined,
	);
	const analysisParseUntrusted =
		agentAnalysis?.parse_ok === false || parsedAgent.parse_ok === false;

	const handleDownload = async () => {
		if (!jobId) return;
		setDownloadError(null);
		try {
			await downloadDocumentFile(jobId);
		} catch (e: unknown) {
			setDownloadError(userFacingErrorMessage(e, "Download failed."));
		}
	};
	const matchStatus = matching?.match_result?.match_status;
	const variances = (matching?.match_result?.variances ?? []) as Array<{
		field?: string;
		message?: string;
	}>;

	const getMatchIcon = (status: string) => {
		switch (status) {
			case "matched":
			case "match":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "variance":
			case "mismatch":
				return <XCircle className="h-4 w-4 text-red-600" />;
			case "no_po":
				return <AlertCircle className="h-4 w-4 text-amber-600" />;
			default:
				return <Clock className="h-4 w-4 text-amber-600" />;
		}
	};

	if (!jobId) {
		return (
			<div className="space-y-6">
				<Link href="/dashboard/invoices">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoices
					</Button>
				</Link>
				<p className="text-destructive">Invalid job ID.</p>
			</div>
		);
	}

	if (loading && !result) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error && !result) {
		return (
			<div className="space-y-6">
				<Link href="/dashboard/invoices">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoices
					</Button>
				</Link>
				<p className="text-destructive">{error}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/dashboard/invoices">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoices
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Invoice Review
					</h1>
					<p className="text-muted-foreground font-mono text-sm">
						{jobId}
					</p>
				</div>
			</div>

			{(result?.status === "pending" ||
				result?.status === "processing") && (
				<Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
					<CardContent className="pt-6 space-y-3">
						<div className="flex items-center gap-3">
							<Loader2 className="h-5 w-5 animate-spin text-amber-600" />
							<div className="min-w-0 flex-1">
								<p className="font-medium">Processing…</p>
								<p className="text-sm text-muted-foreground break-words">
									{result.progress?.trim()
										? result.progress
										: result.status === "pending"
											? "Queued"
											: "OCR, vision extraction, verification and matching in progress."}
								</p>
							</div>
						</div>
						{Array.isArray(result.progress_history) &&
							result.progress_history.length > 0 && (
								<div className="border-t border-amber-200/60 dark:border-amber-800/40 pt-3">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
										Recent steps
									</p>
									<ol className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto list-decimal list-inside">
										{result.progress_history
											.slice(-12)
											.map((line, i) => (
												<li key={`${i}-${line.slice(0, 24)}`} className="break-words">
													{line}
												</li>
											))}
									</ol>
								</div>
							)}
					</CardContent>
				</Card>
			)}

			{result?.status === "failed" && (
				<Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
					<CardContent className="pt-6">
						<p className="font-medium text-red-800 dark:text-red-200">
							Processing failed
						</p>
						<p className="text-sm text-muted-foreground">
							{result.error
								? parseApiErrorText(result.error)
								: "Unknown error"}
						</p>
					</CardContent>
				</Card>
			)}

			{error && <p className="text-sm text-destructive">{error}</p>}

			{result &&
				(result.status === "completed" ||
					result.status === "failed") && (
				<div className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-12">
						{/* Left: Document Preview */}
						<Card className="lg:col-span-4">
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle>Document</CardTitle>
								<Button
									variant="outline"
									size="sm"
									type="button"
									onClick={() => void handleDownload()}
								>
									<Download className="mr-2 h-4 w-4" />
									Download
								</Button>
							</CardHeader>
							{downloadError && (
								<p className="text-xs text-destructive px-6 pb-2">
									{downloadError}
								</p>
							)}
							<CardContent className="p-0">
								<DocumentViewer jobId={jobId} />
							</CardContent>
						</Card>

						{/* Center: Extracted data + Approve/Reject */}
						<Card className="lg:col-span-4">
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<div className="space-y-2">
									<CardTitle>Extracted data</CardTitle>
									{result.pipeline_meta && (
										<div className="flex flex-wrap gap-1.5">
											{result.pipeline_meta.groq_vision ? (
												<Badge
													variant="secondary"
													className="text-xs font-normal"
												>
													Vision parse
												</Badge>
											) : null}
											{result.pipeline_meta.groq_text_enrich ? (
												<Badge
													variant="outline"
													className="text-xs font-normal"
												>
													Text enrich
												</Badge>
											) : null}
										</div>
									)}
								</div>
								{result.status === "completed" &&
									workflow?.approval_summary?.status ===
										"pending" && (
										<div className="flex gap-2">
											<Button
												onClick={handleApprove}
												disabled={
													actionLoading !== null
												}
												className="bg-green-600 hover:bg-green-700"
											>
												{actionLoading === "approve" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Check className="mr-2 h-4 w-4" />
												)}
												Approve
											</Button>
											<Button
												onClick={handleReject}
												disabled={
													actionLoading !== null
												}
												variant="outline"
												className="border-red-200 text-red-600 hover:bg-red-50"
											>
												{actionLoading === "reject" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<X className="mr-2 h-4 w-4" />
												)}
												Reject
											</Button>
										</div>
									)}
							</CardHeader>
							<CardContent className="space-y-4">
								{ext ? (
									<>
										<div className="space-y-2">
											<Label>Vendor / Supplier</Label>
											<Input
												value={ext.supplier ?? ""}
												readOnly
												className="bg-muted"
											/>
										</div>
										{(ext.buyer != null && String(ext.buyer).trim() !== "") ||
										(ext.bill_to != null &&
											String(ext.bill_to).trim() !== "") ? (
											<div className="space-y-2">
												<Label>Buyer / Bill to</Label>
												<Input
													value={
														(typeof ext.buyer === "string" &&
															ext.buyer.trim()) ||
														(typeof ext.bill_to === "string" &&
															ext.bill_to.trim()) ||
														""
													}
													readOnly
													className="bg-muted"
												/>
											</div>
										) : null}
										<div className="space-y-2">
											<Label>Invoice number</Label>
											<Input
												value={ext.invoice_number ?? ""}
												readOnly
												className="bg-muted"
											/>
										</div>
										<div className="space-y-2">
											<Label>Date</Label>
											<Input
												value={ext.date ?? ""}
												readOnly
												className="bg-muted"
											/>
										</div>
										{(ext.subtotal != null &&
											!Number.isNaN(Number(ext.subtotal))) ||
										(ext.tax != null && !Number.isNaN(Number(ext.tax))) ? (
											<div className="grid grid-cols-2 gap-3">
												<div className="space-y-2">
													<Label>Subtotal (pre-tax)</Label>
													<Input
														value={
															ext.subtotal != null
																? formatDocumentCurrency(
																		Number(ext.subtotal),
																		typeof ext.currency === "string"
																			? ext.currency
																			: null,
																		{ maximumFractionDigits: 2 },
																	)
																: "—"
														}
														readOnly
														className="bg-muted"
													/>
												</div>
												<div className="space-y-2">
													<Label>Tax</Label>
													<Input
														value={
															ext.tax != null
																? formatDocumentCurrency(
																		Number(ext.tax),
																		typeof ext.currency === "string"
																			? ext.currency
																			: null,
																		{ maximumFractionDigits: 2 },
																	)
																: "—"
														}
														readOnly
														className="bg-muted"
													/>
												</div>
											</div>
										) : null}
										<div className="space-y-2">
											<Label>Total</Label>
											<Input
												value={
													ext.total != null
														? formatDocumentCurrency(
																Number(ext.total),
																typeof ext.currency === "string"
																	? ext.currency
																	: null,
																{ maximumFractionDigits: 2 },
															)
														: ""
												}
												readOnly
												className="bg-muted"
											/>
										</div>
										{Array.isArray(ext.line_items) &&
											ext.line_items.length > 0 && (
												<div className="space-y-2 pt-2">
													<Label>Line items</Label>
													<div className="rounded-md border max-h-56 overflow-auto text-xs">
														<table className="w-full border-collapse">
															<thead>
																<tr className="bg-muted/80 text-left border-b">
																	<th className="p-2 font-medium">Description</th>
																	<th className="p-2 font-medium w-12">Qty</th>
																	<th className="p-2 font-medium w-20">Rate</th>
																	<th className="p-2 font-medium w-20">Amount</th>
																</tr>
															</thead>
															<tbody>
																{ext.line_items.map((row, idx) => (
																	<tr
																		key={idx}
																		className="border-b border-muted last:border-0"
																	>
																		<td className="p-2 align-top break-words">
																			{row.description ?? "—"}
																			{row.item_code != null &&
																			String(row.item_code).trim() !== "" ? (
																				<span className="block text-muted-foreground">
																					HSN/SAC: {String(row.item_code)}
																				</span>
																			) : null}
																		</td>
																		<td className="p-2 align-top tabular-nums">
																			{row.quantity ?? "—"}
																		</td>
																		<td className="p-2 align-top tabular-nums">
																			{row.unit_price != null
																				? formatDocumentCurrency(
																						Number(row.unit_price),
																						typeof ext.currency === "string"
																							? ext.currency
																							: null,
																						{ maximumFractionDigits: 2 },
																					)
																				: "—"}
																		</td>
																		<td className="p-2 align-top tabular-nums">
																			{row.amount != null
																				? formatDocumentCurrency(
																						Number(row.amount),
																						typeof ext.currency === "string"
																							? ext.currency
																							: null,
																						{ maximumFractionDigits: 2 },
																					)
																				: "—"}
																		</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												</div>
											)}
										{result.processing_time != null && (
											<p className="text-xs text-muted-foreground">
												Processed in{" "}
												{result.processing_time.toFixed(
													1,
												)}
												s
											</p>
										)}
									</>
								) : (
									<p className="text-sm text-muted-foreground">
										No extracted data (job may have failed
										or not completed).
									</p>
								)}
							</CardContent>
						</Card>

						{/* Right: Verification, matching, workflow */}
						<Card className="lg:col-span-4">
							<CardHeader>
								<CardTitle>
									Verification &amp; matching
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{verification && (
									<div>
										<h3 className="font-semibold mb-2">
											Verification
										</h3>
										<div className="space-y-1 text-sm">
											<p>
												Duplicate:{" "}
												{verification.duplicate_check
													?.is_duplicate ? (
													<span className="text-amber-600">
														Yes
													</span>
												) : (
													<span className="text-green-600">
														No
													</span>
												)}
											</p>
											{verification.authenticity?.warnings
												?.length ? (
												<p className="text-amber-600">
													Warnings:{" "}
													{verification.authenticity.warnings.join(
														", ",
													)}
												</p>
											) : null}
											{verification.authenticity
												?.fraud_signals?.length ? (
												<p className="text-red-600">
													Signals:{" "}
													{verification.authenticity.fraud_signals.join(
														", ",
													)}
												</p>
											) : null}
										</div>
									</div>
								)}

								{matching?.match_result && (
									<>
										<Separator />
										<div>
											<h3 className="font-semibold mb-2">
												PO / Match
											</h3>
											<div className="flex items-center gap-2">
												{getMatchIcon(
													matchStatus ?? "",
												)}
												<span className="text-sm font-medium capitalize">
													{matchStatus ?? "—"}
												</span>
											</div>
											{variances.length > 0 && (
												<ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
													{variances
														.slice(0, 5)
														.map((v, i) => (
															<li key={i}>
																{v.field ??
																	v.message ??
																	"Variance"}
															</li>
														))}
												</ul>
											)}
										</div>
									</>
								)}

								{workflow?.exception && (
<>
<Separator />
<div className="space-y-3">
<h3 className="font-semibold flex items-center gap-2">
<AlertCircle className="h-4 w-4 text-amber-600" />
AI Decision
</h3>
<div className="flex flex-wrap gap-2">
<Badge variant="outline" className="capitalize border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30">
{(workflow.exception.exception_type ?? "exception").replace(/_/g, " ")}
</Badge>
{workflow.exception.queue_name && (
<Badge variant="secondary" className="capitalize text-xs">
→ {workflow.exception.queue_name.replace(/_/g, " ")}
</Badge>
)}
</div>
{workflow.exception.reason?.trim() && (
<p className="text-sm text-muted-foreground leading-relaxed">
	<span className="font-medium text-foreground">Classification: </span>
	{workflow.exception.reason}
</p>
)}
{workflow.exception.suggested_actions &&
workflow.exception.suggested_actions.length > 0 && (
<div>
<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
Suggested actions
</p>
<ul className="space-y-1.5">
{workflow.exception.suggested_actions.map(
(action: string, i: number) => (
<li key={i} className="text-sm flex gap-2 items-start">
<CheckCircle className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
{action}
</li>
),
)}
</ul>
</div>
)}
{workflow.approval_summary && (
<p className="text-xs text-muted-foreground border-t pt-2">
Approval:{" "}
<span className="font-medium capitalize">
{workflow.approval_summary.status}
</span>
{workflow.approval_summary.due_at &&
` · Due ${new Date(workflow.approval_summary.due_at).toLocaleString()}`}
</p>
)}
</div>
</>
)}

								{!verification &&
									!matching?.match_result &&
									!workflow?.exception && (
										<p className="text-sm text-muted-foreground">
											No verification or matching data for
											this job.
										</p>
									)}
							</CardContent>
						</Card>
					</div>

					{result.status === "completed" && (
						<Card>
							<CardHeader>
								<CardTitle>AI analysis</CardTitle>
								<p className="text-sm text-muted-foreground font-normal">
									Optional structured review from the pipeline when AI analysis is enabled.
								</p>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								{agentAnalysis ? (
									<>
										{(agentAnalysis.context != null ||
											agentAnalysis.execution_time != null) && (
											<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
												{agentAnalysis.context != null && (
													<span>
														Context:{" "}
														<span className="font-medium text-foreground">
															{String(agentAnalysis.context)}
														</span>
													</span>
												)}
												{agentAnalysis.execution_time != null && (
													<span>
														Runtime:{" "}
														{Number(agentAnalysis.execution_time).toFixed(2)}s
													</span>
												)}
											</div>
										)}
										{analysisParseUntrusted && (
											<p className="rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
												Structured AI analysis was not fully verified. Do not treat
												vendor names or amounts here as authoritative—use extracted
												fields and the original document.
											</p>
										)}
										{(parsedAgent.summary ||
											parsedAgent.flags?.length ||
											parsedAgent.recommendations?.length ||
											parsedAgent.supplier_guess !== undefined ||
											parsedAgent.buyer_guess !== undefined) && (
											<div className="space-y-2 rounded-md border bg-muted/40 p-3">
												{(parsedAgent.supplier_guess !== undefined ||
													parsedAgent.buyer_guess !== undefined) && (
													<div className="grid gap-1 text-sm sm:grid-cols-2">
														{parsedAgent.supplier_guess !== undefined && (
															<p>
																<span className="font-medium">Vendor (AI): </span>
																{parsedAgent.supplier_guess ?? "—"}
															</p>
														)}
														{parsedAgent.buyer_guess !== undefined && (
															<p>
																<span className="font-medium">Buyer (AI): </span>
																{parsedAgent.buyer_guess ?? "—"}
															</p>
														)}
													</div>
												)}
												{parsedAgent.summary && (
													<p>
														<span className="font-medium">Summary: </span>
														{parsedAgent.summary}
													</p>
												)}
												{parsedAgent.flags &&
													parsedAgent.flags.length > 0 && (
														<p>
															<span className="font-medium">Flags: </span>
															{parsedAgent.flags.join(", ")}
														</p>
													)}
												{parsedAgent.recommendations &&
													parsedAgent.recommendations.length > 0 && (
														<ul className="list-disc list-inside space-y-1">
															{parsedAgent.recommendations.map((r, i) => (
																<li key={i}>{r}</li>
															))}
														</ul>
													)}
											</div>
										)}
										{agentAnalysis.result != null &&
											!(
												parsedAgent.summary ||
												parsedAgent.flags?.length ||
												parsedAgent.recommendations?.length ||
												parsedAgent.supplier_guess !== undefined ||
												parsedAgent.buyer_guess !== undefined
											) && (
												<pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
													{String(agentAnalysis.result)}
												</pre>
											)}
									</>
								) : (
									<p className="text-muted-foreground">
										No model analysis for this job (agent step
										skipped, failed, or keys not configured).
									</p>
								)}
							</CardContent>
						</Card>
					)}
				</div>
				)}
		</div>
	);
}
