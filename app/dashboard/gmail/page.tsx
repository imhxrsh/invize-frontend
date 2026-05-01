"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
	getGmailStatus,
	listGmailScanned,
	scanGmailInbox,
	disconnectGmail,
	startGmailOAuth,
	type GmailScanRow,
	type GmailStatus,
} from "@/lib/gmail";
import { getDocumentStatus } from "@/lib/documents";
import { parseApiErrorText } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ExternalLink, Mail, RefreshCw } from "lucide-react";

const PAGE_SIZE = 25;

function pipelineBadgeVariant(
	status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
	const s = (status || "").toLowerCase();
	if (s === "completed") return "default";
	if (s === "failed") return "destructive";
	if (s === "processing") return "secondary";
	return "outline";
}

export default function GmailInboxPage() {
	const [status, setStatus] = useState<GmailStatus | null>(null);
	const [items, setItems] = useState<GmailScanRow[]>([]);
	const [total, setTotal] = useState(0);
	const [skip, setSkip] = useState(0);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [openRows, setOpenRows] = useState<Set<string>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [st, scanned] = await Promise.all([
				getGmailStatus(),
				listGmailScanned({ limit: PAGE_SIZE, skip }),
			]);
			setStatus(st);
			setItems(scanned.items ?? []);
			setTotal(scanned.total ?? 0);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to load Gmail data");
		} finally {
			setLoading(false);
		}
	}, [skip]);

	useEffect(() => {
		void load();
	}, [load]);

	// Poll list while any row is mid-pipeline; optionally verify doc job still running
	useEffect(() => {
		const processing = items.filter(
			(r) => (r.pipeline_status || "").toLowerCase() === "processing",
		);
		if (processing.length === 0) return;

		const t = window.setInterval(() => {
			void (async () => {
				try {
					for (const r of processing) {
						if (!r.document_job_id) continue;
						const st = await getDocumentStatus(r.document_job_id);
						if (st.status === "failed" || st.status === "completed") {
							void load();
							return;
						}
					}
					void load();
				} catch {
					void load();
				}
			})();
		}, 4000);
		return () => window.clearInterval(t);
	}, [items, load]);

	const toggleRow = (id: string) => {
		setOpenRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleConnect = async () => {
		setBusy(true);
		setError(null);
		try {
			const { authorization_url } = await startGmailOAuth();
			window.location.href = authorization_url;
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "OAuth failed");
			setBusy(false);
		}
	};

	const handleScan = async () => {
		setBusy(true);
		setError(null);
		setSuccess(null);
		try {
			const r = await scanGmailInbox();
			setSuccess(r.message || "Scan queued.");
			window.setTimeout(() => void load(), 3000);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Scan failed");
		} finally {
			setBusy(false);
		}
	};

	const handleDisconnect = async () => {
		setBusy(true);
		setError(null);
		try {
			await disconnectGmail();
			setSuccess("Disconnected.");
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Disconnect failed");
		} finally {
			setBusy(false);
		}
	};

	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const pageIndex = Math.floor(skip / PAGE_SIZE) + 1;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
						<Mail className="h-8 w-8" />
						Gmail inbox
					</h1>
					<p className="text-muted-foreground">
						Classified messages, scores, ingest logs, and invoice pipeline
						from attachments
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={loading || busy}
						onClick={() => void load()}
					>
						<RefreshCw className="h-4 w-4 mr-1" />
						Refresh
					</Button>
					<Button size="sm" disabled={busy} onClick={() => void handleConnect()}>
						{status?.connected ? "Reconnect Google" : "Connect Google"}
					</Button>
					<Button
						size="sm"
						variant="secondary"
						disabled={busy || !status?.connected}
						onClick={() => void handleScan()}
					>
						Scan inbox
					</Button>
					<Button
						size="sm"
						variant="ghost"
						disabled={busy || !status?.connected}
						onClick={() => void handleDisconnect()}
					>
						Disconnect
					</Button>
				</div>
			</div>

			{error && (
				<div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
					{error}
				</div>
			)}
			{success && (
				<div className="rounded-md bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-2 text-sm">
					{success}
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Connection</CardTitle>
					<CardDescription>
						{status?.connected
							? `Signed in as ${status.google_email ?? "Gmail"}${
									status.last_sync_at
										? ` · Last scan ${new Date(status.last_sync_at).toLocaleString()}`
										: ""
								}`
							: "Connect Google to classify messages and run the document pipeline on invoice attachments."}
					</CardDescription>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div>
						<CardTitle>Classified mail</CardTitle>
						<CardDescription>
							{total} message{total !== 1 ? "s" : ""} total · AI-assigned category
							and confidence; pipeline runs for invoice/receipt when a PDF or image is attached
						</CardDescription>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Button
							variant="outline"
							size="sm"
							disabled={skip <= 0 || loading}
							onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
						>
							Previous
						</Button>
						<span>
							Page {pageIndex} / {pageCount}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={skip + PAGE_SIZE >= total || loading}
							onClick={() => setSkip((s) => s + PAGE_SIZE)}
						>
							Next
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-muted-foreground py-8 text-center">Loading…</p>
					) : (
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-8" />
										<TableHead>Score</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Pipeline</TableHead>
										<TableHead>Att</TableHead>
										<TableHead>Subject</TableHead>
										<TableHead>From</TableHead>
										<TableHead>Invoice</TableHead>
										<TableHead>Classified</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={9}
												className="text-center text-muted-foreground py-10"
											>
												No rows yet. Connect and run a scan.
											</TableCell>
										</TableRow>
									) : (
										items.flatMap((row) => {
											const expanded = openRows.has(row.id);
											const mainRow = (
												<TableRow key={row.id} className="align-top">
													<TableCell className="p-2">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															type="button"
															onClick={() => toggleRow(row.id)}
															aria-expanded={expanded}
															aria-label={
																expanded ? "Collapse details" : "Expand details"
															}
														>
															<ChevronDown
																className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
															/>
														</Button>
													</TableCell>
														<TableCell className="font-medium tabular-nums">
															{row.confidence != null
																? `${Math.round(row.confidence * 100)}%`
																: "—"}
														</TableCell>
														<TableCell>
															<Badge variant="secondary">{row.category}</Badge>
														</TableCell>
														<TableCell>
															<Badge
																variant={pipelineBadgeVariant(
																	row.pipeline_status,
																)}
															>
																{row.pipeline_status || "—"}
															</Badge>
															{row.pipeline_error && (
																<div
																	className="text-xs text-destructive mt-1 max-w-[140px] truncate"
																	title={row.pipeline_error}
																>
																	{row.pipeline_error}
																</div>
															)}
														</TableCell>
														<TableCell className="tabular-nums">
															{row.attachment_meta?.length ?? 0}
														</TableCell>
														<TableCell className="max-w-[200px] truncate text-sm">
															{row.subject ?? "—"}
														</TableCell>
														<TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
															{row.from_addr ?? "—"}
														</TableCell>
														<TableCell>
															{row.document_job_id &&
															(row.pipeline_status || "").toLowerCase() ===
																"completed" ? (
																<Link
																	href={`/dashboard/invoices/${row.document_job_id}`}
																	className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
																>
																	Open
																	<ExternalLink className="h-3 w-3" />
																</Link>
															) : row.document_job_id ? (
																<span className="text-xs text-muted-foreground font-mono">
																	{row.document_job_id.slice(0, 8)}…
																</span>
															) : (
																"—"
															)}
														</TableCell>
														<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
															{new Date(row.classified_at).toLocaleString()}
														</TableCell>
													</TableRow>
											);
											if (!expanded) return [mainRow];
											return [
												mainRow,
												<TableRow key={`${row.id}-detail`}>
													<TableCell colSpan={9} className="bg-muted/30 p-4">
														<div className="space-y-3 text-sm">
															{row.reasons && row.reasons.length > 0 && (
																<div>
																	<p className="font-medium mb-1">
																		Classification reasons
																	</p>
																	<ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
																		{row.reasons.map((r, i) => (
																			<li key={i}>{r}</li>
																		))}
																	</ul>
																</div>
															)}
															{row.snippet && (
																<div>
																	<p className="font-medium mb-1">Snippet</p>
																	<p className="text-muted-foreground">
																		{row.snippet}
																	</p>
																</div>
															)}
															<div>
																<p className="font-medium mb-1">Ingest log</p>
																{!row.ingest_log || row.ingest_log.length === 0 ? (
																	<p className="text-muted-foreground">—</p>
																) : (
																	<ul className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto border rounded p-2 bg-background">
																		{row.ingest_log.map((e, i) => (
																			<li key={i}>
																				<span className="text-muted-foreground">
																					{String(e.at ?? "")}{" "}
																				</span>
																				<span
																					className={
																						e.level === "error"
																							? "text-destructive"
																							: ""
																					}
																				>
																					[{String(e.level ?? "")}]
																				</span>{" "}
																				{parseApiErrorText(
																					String(e.message ?? ""),
																				)}
																			</li>
																		))}
																	</ul>
																)}
															</div>
														</div>
													</TableCell>
												</TableRow>,
											];
										})
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
