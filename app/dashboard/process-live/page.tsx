"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
	Activity,
	CheckCircle2,
	Circle,
	FileUp,
	Loader2,
	Sparkles,
	XCircle,
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
import {
	getDocumentResult,
	getDocumentStatus,
	uploadDocument,
	type DocumentResultResponse,
} from "@/lib/documents";
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

function InsightsPanel({ result }: { result: DocumentResultResponse }) {
	const aa = result.agent_analysis;
	const parsed = tryParseAgentStructured(
		typeof aa?.result === "string" ? aa.result : undefined,
	);
	const verification = result.verification_compliance;
	const matching = result.matching_erp;
	const workflow = result.operations_workflow;
	const ext = result.extracted_data;

	return (
		<div className="space-y-4">
			<Card className="border-violet-500/30 bg-violet-500/5">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Sparkles className="h-5 w-5 text-violet-600" />
						Swarms / agent analysis
					</CardTitle>
					<CardDescription>
						In-depth model output when GROQ (or configured) keys are present and the
						step succeeds.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					{aa ? (
						<>
							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
								{aa.model != null && (
									<span>
										Model:{" "}
										<span className="font-mono text-foreground">
											{String(aa.model)}
										</span>
									</span>
								)}
								{aa.context != null && (
									<span>
										Context:{" "}
										<span className="text-foreground">{String(aa.context)}</span>
									</span>
								)}
								{aa.execution_time != null && (
									<span>
										Runtime:{" "}
										{Number(aa.execution_time).toFixed(2)}s
									</span>
								)}
							</div>
							{(parsed.summary ||
								parsed.flags?.length ||
								parsed.recommendations?.length) && (
								<div className="rounded-md border bg-background/80 p-3 space-y-2">
									{parsed.summary && (
										<p>
											<span className="font-medium text-foreground">Summary: </span>
											{parsed.summary}
										</p>
									)}
									{parsed.flags && parsed.flags.length > 0 && (
										<p>
											<span className="font-medium text-foreground">Flags: </span>
											{parsed.flags.join(", ")}
										</p>
									)}
									{parsed.recommendations &&
										parsed.recommendations.length > 0 && (
											<ul className="list-disc list-inside space-y-1">
												{parsed.recommendations.map((r, i) => (
													<li key={i}>{r}</li>
												))}
											</ul>
										)}
								</div>
							)}
							{aa.result != null &&
								!(
									parsed.summary ||
									parsed.flags?.length ||
									parsed.recommendations?.length
								) && (
									<pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
										{String(aa.result)}
									</pre>
								)}
							<Accordion type="single" collapsible className="w-full">
								<AccordionItem value="raw">
									<AccordionTrigger className="text-sm py-2">
										Raw agent payload (JSON)
									</AccordionTrigger>
									<AccordionContent>
										<pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
											{JSON.stringify(aa, null, 2)}
										</pre>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<p className="text-muted-foreground">
							No agent analysis for this run (keys missing, step skipped, or error).
							Check backend logs and <code className="text-xs">GROQ_API_KEY</code>.
						</p>
					)}
				</CardContent>
			</Card>

			<Accordion type="multiple" className="w-full space-y-2">
				<AccordionItem value="verify" className="border rounded-lg px-3">
					<AccordionTrigger className="text-sm font-medium hover:no-underline">
						Verification and compliance
					</AccordionTrigger>
					<AccordionContent className="text-sm text-muted-foreground space-y-2 pb-4">
						{verification ? (
							<pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
								{JSON.stringify(verification, null, 2)}
							</pre>
						) : (
							<p>Not available.</p>
						)}
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="match" className="border rounded-lg px-3">
					<AccordionTrigger className="text-sm font-medium hover:no-underline">
						Matching and ERP
					</AccordionTrigger>
					<AccordionContent className="text-sm text-muted-foreground space-y-2 pb-4">
						{matching ? (
							<pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
								{JSON.stringify(matching, null, 2)}
							</pre>
						) : (
							<p>Not available.</p>
						)}
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="workflow" className="border rounded-lg px-3">
					<AccordionTrigger className="text-sm font-medium hover:no-underline">
						Operations workflow
					</AccordionTrigger>
					<AccordionContent className="text-sm text-muted-foreground space-y-2 pb-4">
						{workflow ? (
							<pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
								{JSON.stringify(workflow, null, 2)}
							</pre>
						) : (
							<p>Not available.</p>
						)}
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="extracted" className="border rounded-lg px-3">
					<AccordionTrigger className="text-sm font-medium hover:no-underline">
						Extracted fields (summary)
					</AccordionTrigger>
					<AccordionContent className="text-sm text-muted-foreground space-y-2 pb-4">
						{ext ? (
							<ul className="space-y-1 text-foreground">
								{ext.supplier != null && (
									<li>
										<span className="font-medium">Vendor: </span>
										{String(ext.supplier)}
									</li>
								)}
								{ext.invoice_number != null && (
									<li>
										<span className="font-medium">Invoice #: </span>
										{String(ext.invoice_number)}
									</li>
								)}
								{ext.date != null && (
									<li>
										<span className="font-medium">Date: </span>
										{String(ext.date)}
									</li>
								)}
								{ext.total != null && (
									<li>
										<span className="font-medium">Total: </span>
										{String(ext.total)}
									</li>
								)}
							</ul>
						) : (
							<p>No extracted data.</p>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			<div className="flex flex-wrap gap-2">
				<Button variant="outline" size="sm" asChild>
					<Link href={`/dashboard/invoices/${result.job_id}`}>
						Open full invoice page
					</Link>
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

	const activeStep = resolveLivePipelineStep(progress, status);
	const failed = status === "failed";
	const completed = status === "completed";
	/** On failure, highlight the last known stage (no spinner). */
	const failedActiveStep = failed ? Math.max(0, activeStep) : activeStep;

	const pollOnce = useCallback(async (id: string) => {
		const st = await getDocumentStatus(id);
		setStatus(st.status);
		setProgress(st.progress);
		if (st.status === "failed") {
			setError(st.error ?? "Processing failed");
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
					setError(e instanceof Error ? e.message : "Poll failed");
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
			setProgress("Upload received, starting…");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Activity className="h-8 w-8 text-primary" />
						Live pipeline
					</h1>
					<p className="mt-2 text-muted-foreground max-w-xl">
						Upload one invoice and watch each backend stage advance in real time.
						When finished, Swarms output and full JSON insights appear below.
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
				<p className="text-sm text-destructive flex items-center gap-2">
					<XCircle className="h-4 w-4 shrink-0" />
					{error}
				</p>
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
				<>
					<h2 className="text-xl font-semibold text-foreground">
						Full insights
					</h2>
					<InsightsPanel result={result} />
				</>
			)}
		</div>
	);
}
