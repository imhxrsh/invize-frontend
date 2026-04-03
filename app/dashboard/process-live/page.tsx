"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
	Activity,
	CheckCircle2,
	Circle,
	FileText,
	FileUp,
	Loader2,
	Shield,
	Sparkles,
	Wallet,
	XCircle,
	GitCompare,
	Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	getDocumentResult,
	getDocumentStatus,
	uploadDocument,
	type DocumentResultResponse,
} from "@/lib/documents";
import { parseApiErrorText } from "@/lib/api-errors";
import {
	LIVE_PIPELINE_STEPS,
	resolveLivePipelineStep,
} from "@/lib/pipeline-live";

const POLL_MS = 1200;

function tryParseAgentStructured(resultText: string | undefined): {
	summary?: string;
	flags?: string[];
	recommendations?: string[];
} {
	if (!resultText || typeof resultText !== "string") return {};
	const t = resultText.trim();
	if (!t.startsWith("{")) return {};
	try {
		const o = JSON.parse(t) as Record<string, unknown>;
		return {
			summary: typeof o.summary === "string" ? o.summary : undefined,
			flags: Array.isArray(o.flags) ? o.flags.map(String) : undefined,
			recommendations: Array.isArray(o.recommendations)
				? o.recommendations.map(String)
				: undefined,
		};
	} catch {
		return {};
	}
}

function StepRow({
	index,
	step,
	state,
	isLast,
}: {
	index: number;
	step: (typeof LIVE_PIPELINE_STEPS)[number];
	state: "done" | "active" | "pending" | "error";
	isLast: boolean;
}) {
	return (
		<div className="flex gap-4">
			<div className="flex flex-col items-center">
				<div
					className={
						state === "done"
							? "flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-sm"
							: state === "error"
								? "flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/10 text-red-600 shadow-sm"
								: state === "active"
									? "flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-sm"
									: "flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted bg-muted/50 text-muted-foreground"
					}
				>
					{state === "done" ? (
						<CheckCircle2 className="h-5 w-5" />
					) : state === "error" ? (
						<XCircle className="h-5 w-5" />
					) : state === "active" ? (
						<Loader2 className="h-5 w-5 animate-spin" />
					) : (
						<Circle className="h-4 w-4" />
					)}
				</div>
				{!isLast && (
					<div
						className={
							state === "done"
								? "my-1 min-h-[2rem] w-0.5 flex-1 bg-green-600/60"
								: "my-1 min-h-[2rem] w-0.5 flex-1 bg-border"
						}
						aria-hidden
					/>
				)}
			</div>
			<div className="min-w-0 flex-1 pb-8 last:pb-0">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground">
						Step {index + 1}
					</span>
					{state === "active" && (
						<Badge variant="secondary" className="text-xs">
							In progress
						</Badge>
					)}
					{state === "error" && (
						<Badge variant="destructive" className="text-xs">
							Stopped here
						</Badge>
					)}
				</div>
				<h3 className="text-base font-semibold text-foreground">{step.title}</h3>
				<p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
			</div>
		</div>
	);
}

function JsonScroll({ data }: { data: unknown }) {
	return (
		<ScrollArea className="h-48 w-full rounded-md border bg-muted/40">
			<pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
				{JSON.stringify(data, null, 2)}
			</pre>
		</ScrollArea>
	);
}

function InsightsPanel({ result }: { result: DocumentResultResponse }) {
	const aa = result.agent_analysis;
	const parsed = tryParseAgentStructured(
		typeof aa?.result === "string" ? aa.result : undefined,
	);
	const verification = result.verification_compliance;
	const matching = result.matching_erp;
	const workflow = result.operations_workflow;
	const ext = result.extracted_data;

	const dup = verification?.duplicate_check?.is_duplicate;
	const warnings = verification?.authenticity?.warnings ?? [];
	const matchStatus = matching?.match_result?.match_status;
	const variances = matching?.match_result?.variances;
	const vCount = Array.isArray(variances) ? variances.length : 0;
	const approval = workflow?.approval_summary?.status;
	const exception = workflow?.exception;

	const totalFmt =
		ext?.total != null
			? new Intl.NumberFormat("en-IN", {
					style: "currency",
					currency: "INR",
					maximumFractionDigits: 2,
				}).format(Number(ext.total))
			: "—";

	const paymentHint =
		approval === "approved" && ext?.total != null && Number(ext.total) > 0 && !exception
			? "Eligible for Payments Hub"
			: exception
				? "Blocked — review exception"
				: approval === "pending"
					? "Awaiting approval"
					: "See Payments Hub for status";

	return (
		<div className="space-y-4">
			<Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg">Overview</CardTitle>
					<CardDescription>Key fields and payment readiness</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Total
							</p>
							<p className="text-3xl font-bold tabular-nums text-foreground">{totalFmt}</p>
						</div>
						<div className="flex flex-wrap gap-2 items-start">
							{approval && (
								<Badge variant={approval === "approved" ? "default" : approval === "rejected" ? "destructive" : "secondary"}>
									Approval: {approval}
								</Badge>
							)}
							{matchStatus != null && (
								<Badge variant="outline">Match: {String(matchStatus)}</Badge>
							)}
							{dup != null && (
								<Badge variant={dup ? "destructive" : "outline"}>
									{dup ? "Duplicate suspected" : "Not duplicate"}
								</Badge>
							)}
						</div>
					</div>
					<dl className="grid gap-2 text-sm sm:grid-cols-2">
						<div className="flex justify-between gap-2 border-b border-border/60 py-1">
							<dt className="text-muted-foreground">Vendor</dt>
							<dd className="font-medium text-right truncate max-w-[60%]">
								{ext?.supplier != null ? String(ext.supplier) : "—"}
							</dd>
						</div>
						<div className="flex justify-between gap-2 border-b border-border/60 py-1">
							<dt className="text-muted-foreground">Invoice #</dt>
							<dd className="font-medium text-right">{ext?.invoice_number != null ? String(ext.invoice_number) : "—"}</dd>
						</div>
					</dl>
					<Alert>
						<Wallet className="h-4 w-4" />
						<AlertTitle>Payments</AlertTitle>
						<AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<span>{paymentHint}</span>
							<Button size="sm" variant="secondary" asChild>
								<Link href="/dashboard/payments">Open Payments Hub</Link>
							</Button>
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>

			<Tabs defaultValue="verification" className="w-full">
				<TabsList className="flex flex-wrap h-auto gap-1 justify-start">
					<TabsTrigger value="verification" className="gap-1">
						<Shield className="h-3.5 w-3.5" />
						Verification
					</TabsTrigger>
					<TabsTrigger value="matching" className="gap-1">
						<GitCompare className="h-3.5 w-3.5" />
						Matching
					</TabsTrigger>
					<TabsTrigger value="workflow" className="gap-1">
						<Settings2 className="h-3.5 w-3.5" />
						Workflow
					</TabsTrigger>
					<TabsTrigger value="extraction" className="gap-1">
						<FileText className="h-3.5 w-3.5" />
						Extraction
					</TabsTrigger>
					<TabsTrigger value="agent" className="gap-1">
						<Sparkles className="h-3.5 w-3.5" />
						Agent
					</TabsTrigger>
				</TabsList>

				<TabsContent value="verification" className="mt-4 space-y-3">
					{verification ? (
						<>
							<ul className="text-sm space-y-2 text-foreground">
								<li className="flex flex-wrap gap-2 items-center">
									<span className="text-muted-foreground">Duplicate check:</span>
									<Badge variant={dup ? "destructive" : "secondary"}>
										{dup ? "Possible duplicate" : "OK"}
									</Badge>
								</li>
								{warnings.length > 0 && (
									<li>
										<span className="text-muted-foreground">Warnings:</span>
										<ul className="list-disc pl-5 mt-1">
											{warnings.map((w, i) => (
												<li key={i}>{String(w)}</li>
											))}
										</ul>
									</li>
								)}
							</ul>
							<Accordion type="single" collapsible className="border rounded-lg px-3">
								<AccordionItem value="adv" className="border-0">
									<AccordionTrigger className="text-sm py-2">Advanced — raw JSON</AccordionTrigger>
									<AccordionContent>
										<JsonScroll data={verification} />
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<p className="text-sm text-muted-foreground">No verification data for this run.</p>
					)}
				</TabsContent>

				<TabsContent value="matching" className="mt-4 space-y-3">
					{matching ? (
						<>
							<div className="flex flex-wrap gap-2 items-center text-sm">
								<span className="text-muted-foreground">Status</span>
								<Badge variant="outline">{matchStatus != null ? String(matchStatus) : "unknown"}</Badge>
								{vCount > 0 && (
									<Badge variant="secondary">{vCount} variance(s)</Badge>
								)}
							</div>
							<Accordion type="single" collapsible className="border rounded-lg px-3">
								<AccordionItem value="madv" className="border-0">
									<AccordionTrigger className="text-sm py-2">Advanced — raw JSON</AccordionTrigger>
									<AccordionContent>
										<JsonScroll data={matching} />
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<p className="text-sm text-muted-foreground">No matching / ERP block.</p>
					)}
				</TabsContent>

				<TabsContent value="workflow" className="mt-4 space-y-3">
					{workflow ? (
						<>
							<ul className="text-sm space-y-2">
								{exception && (
									<li className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
										<p className="font-medium text-foreground">Exception</p>
										<p className="text-muted-foreground mt-1">
											{String(exception.exception_type ?? "")} — {String(exception.queue_name ?? "")}
										</p>
										{exception.reason && (
											<p className="text-xs mt-2 text-muted-foreground">{String(exception.reason)}</p>
										)}
									</li>
								)}
								{workflow.approval_summary && (
									<li className="flex flex-wrap gap-2">
										<span className="text-muted-foreground">Approval:</span>
										<Badge>{String(workflow.approval_summary.status ?? "—")}</Badge>
										{workflow.approval_summary.due_at && (
											<span className="text-xs text-muted-foreground">
												Due {String(workflow.approval_summary.due_at)}
											</span>
										)}
									</li>
								)}
							</ul>
							<Accordion type="single" collapsible className="border rounded-lg px-3">
								<AccordionItem value="wadv" className="border-0">
									<AccordionTrigger className="text-sm py-2">Advanced — raw JSON</AccordionTrigger>
									<AccordionContent>
										<JsonScroll data={workflow} />
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<p className="text-sm text-muted-foreground">No workflow block.</p>
					)}
				</TabsContent>

				<TabsContent value="extraction" className="mt-4 space-y-3">
					{ext ? (
						<>
							<ul className="space-y-2 text-sm text-foreground">
								{["supplier", "invoice_number", "date", "due_date", "currency", "total", "tax", "subtotal"].map((k) => {
									const v = (ext as Record<string, unknown>)[k];
									if (v == null || v === "") return null;
									return (
										<li key={k} className="flex justify-between gap-4 border-b border-border/50 py-1">
											<span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
											<span className="font-medium text-right break-all">{String(v)}</span>
										</li>
									);
								})}
							</ul>
							<Accordion type="single" collapsible className="border rounded-lg px-3">
								<AccordionItem value="eadv" className="border-0">
									<AccordionTrigger className="text-sm py-2">Advanced — full extracted JSON</AccordionTrigger>
									<AccordionContent>
										<JsonScroll data={ext} />
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<p className="text-sm text-muted-foreground">No extracted data.</p>
					)}
				</TabsContent>

				<TabsContent value="agent" className="mt-4 space-y-3">
					{aa ? (
						<>
							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
								{aa.model != null && (
									<span>
										Model: <span className="font-mono text-foreground">{String(aa.model)}</span>
									</span>
								)}
								{aa.execution_time != null && (
									<span>Runtime: {Number(aa.execution_time).toFixed(2)}s</span>
								)}
							</div>
							{(parsed.summary || parsed.flags?.length || parsed.recommendations?.length) && (
								<div className="rounded-md border bg-muted/40 p-4 space-y-2 text-sm">
									{parsed.summary && <p><span className="font-medium">Summary: </span>{parsed.summary}</p>}
									{parsed.flags && parsed.flags.length > 0 && (
										<p><span className="font-medium">Flags: </span>{parsed.flags.join(", ")}</p>
									)}
									{parsed.recommendations && parsed.recommendations.length > 0 && (
										<ul className="list-disc list-inside">
											{parsed.recommendations.map((r, i) => (
												<li key={i}>{r}</li>
											))}
										</ul>
									)}
								</div>
							)}
							{aa.result != null &&
								!(parsed.summary || parsed.flags?.length || parsed.recommendations?.length) && (
									<ScrollArea className="h-40 rounded-md border bg-muted/40">
										<pre className="p-3 text-xs whitespace-pre-wrap">{String(aa.result)}</pre>
									</ScrollArea>
								)}
							<Accordion type="single" collapsible className="border rounded-lg px-3">
								<AccordionItem value="araw" className="border-0">
									<AccordionTrigger className="text-sm py-2">Advanced — raw agent payload</AccordionTrigger>
									<AccordionContent>
										<JsonScroll data={aa} />
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							No agent analysis. Ensure <code className="text-xs">GROQ_API_KEY</code> is set on the backend.
						</p>
					)}
				</TabsContent>
			</Tabs>

			<div className="flex flex-wrap gap-2">
				<Button variant="outline" size="sm" asChild>
					<Link href={`/dashboard/invoices/${result.job_id}`}>Open invoice</Link>
				</Button>
				<Button variant="outline" size="sm" asChild>
					<Link href="/dashboard/invoices">All invoices</Link>
				</Button>
			</div>
		</div>
	);
}

export default function ProcessLivePage() {
	const fileRef = useRef<HTMLInputElement>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [status, setStatus] = useState<string>("idle");
	const [progress, setProgress] = useState<string | undefined>(undefined);
	const [result, setResult] = useState<DocumentResultResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progressLog, setProgressLog] = useState<string[]>([]);

	const activeStep = resolveLivePipelineStep(progress, status);
	const failed = status === "failed";
	const completed = status === "completed";
	/** On failure, highlight the last known stage (no spinner). */
	const failedActiveStep = failed ? Math.max(0, activeStep) : activeStep;

	const pollOnce = useCallback(async (id: string) => {
		const st = await getDocumentStatus(id);
		setStatus(st.status);
		setProgress(st.progress);
		if (st.progress) {
			const line = st.progress;
			setProgressLog((prev) =>
				prev[prev.length - 1] === line ? prev : [...prev, line],
			);
		}
		if (st.status === "failed") {
			setError(parseApiErrorText(st.error ?? "Processing failed"));
			return "failed" as const;
		}
		if (st.status === "completed") {
			const res = await getDocumentResult(id);
			setResult(res);
			setProgress(undefined);
			return "done" as const;
		}
		return "continue" as const;
	}, []);

	useEffect(() => {
		if (!jobId) return;
		let cancelled = false;
		let timer: ReturnType<typeof setInterval> | undefined;

		const tick = async () => {
			if (cancelled) return;
			try {
				const out = await pollOnce(jobId);
				if (out !== "continue" && timer) {
					clearInterval(timer);
					timer = undefined;
				}
			} catch (e) {
				if (!cancelled) {
					const msg = e instanceof Error ? e.message : "Poll failed";
					setError(parseApiErrorText(msg));
					setStatus("failed");
					if (timer) clearInterval(timer);
				}
			}
		};

		void tick();
		timer = setInterval(tick, POLL_MS);

		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
		};
	}, [jobId, pollOnce]);

	const reset = () => {
		setJobId(null);
		setStatus("idle");
		setProgress(undefined);
		setResult(null);
		setError(null);
		setProgressLog([]);
		if (fileRef.current) fileRef.current.value = "";
	};

	const onPickFile = () => {
		setError(null);
		fileRef.current?.click();
	};

	const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		reset();
		setUploading(true);
		try {
			const res = await uploadDocument(file);
			setJobId(res.job_id);
			setStatus(res.status);
			const first = "Upload received, starting…";
			setProgress(first);
			setProgressLog([first]);
		} catch (err) {
			setError(parseApiErrorText(err instanceof Error ? err.message : "Upload failed"));
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	return (
		<div className="mx-auto max-w-6xl space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Activity className="h-8 w-8 text-primary" />
						Live pipeline
					</h1>
					<p className="mt-2 text-muted-foreground max-w-2xl">
						Upload one invoice and watch stages advance. When finished, use the overview and tabs
						for verification, matching, workflow, and extraction — raw JSON stays under Advanced.
					</p>
				</div>
				<div className="flex flex-wrap gap-2 shrink-0">
					<input
						ref={fileRef}
						type="file"
						accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.txt"
						className="hidden"
						onChange={onFileChange}
					/>
					<Button
						onClick={onPickFile}
						disabled={uploading || (!!jobId && !completed && !failed)}
					>
						{uploading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<FileUp className="mr-2 h-4 w-4" />
						)}
						Upload invoice
					</Button>
					{(jobId || error) && (
						<Button variant="outline" onClick={reset}>
							Reset
						</Button>
					)}
				</div>
			</div>

			{error && !jobId && (
				<Alert variant="destructive">
					<XCircle className="h-4 w-4" />
					<AlertTitle>Upload failed</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{jobId && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Processing status</CardTitle>
						<CardDescription>
							Job ID:{" "}
							<code className="text-xs bg-muted px-1 py-0.5 rounded">{jobId}</code>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{failed ? (
							<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
								<XCircle className="h-5 w-5 shrink-0 mt-0.5" />
								<div>
									<p className="font-medium">Processing failed</p>
									<p className="mt-1 opacity-90">{error}</p>
								</div>
							</div>
						) : (
							<>
								<div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
									<div className="flex items-center gap-2 font-medium text-foreground">
										{completed ? (
											<CheckCircle2 className="h-4 w-4 text-green-600" />
										) : (
											<Loader2 className="h-4 w-4 animate-spin text-primary" />
										)}
										{completed
											? "Completed"
											: status === "pending"
												? "Pending"
												: "Processing"}
									</div>
									{progress && (
										<p className="mt-2 text-muted-foreground">{progress}</p>
									)}
								</div>

								<Separator />

								{progressLog.length > 0 && (
									<>
										<Separator />
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-2">
												Activity log
											</p>
											<ScrollArea className="h-36 rounded-md border bg-muted/30">
												<ol className="p-3 space-y-2 text-xs text-muted-foreground list-decimal pl-4">
													{progressLog.map((line, i) => (
														<li key={`${i}-${line.slice(0, 24)}`} className="pl-1">
															{line}
														</li>
													))}
												</ol>
											</ScrollArea>
										</div>
									</>
								)}

								<Separator />

								<div className="space-y-0">
									{LIVE_PIPELINE_STEPS.map((step, i) => {
										const lastIndex = LIVE_PIPELINE_STEPS.length - 1;
										let rowState: "done" | "active" | "pending" | "error" =
											"pending";
										if (completed) {
											rowState = "done";
										} else if (failed) {
											if (i < failedActiveStep) rowState = "done";
											else if (i === failedActiveStep) rowState = "error";
											else rowState = "pending";
										} else if (i < activeStep) {
											rowState = "done";
										} else if (i === activeStep) {
											rowState = "active";
										}
										return (
											<StepRow
												key={step.id}
												index={i}
												step={step}
												state={rowState}
												isLast={i === lastIndex}
											/>
										);
									})}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}

			{completed && result && (
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-foreground">Pipeline insights</h2>
					<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)]">
						<InsightsPanel result={result} />
					</div>
				</div>
			)}
		</div>
	);
}
