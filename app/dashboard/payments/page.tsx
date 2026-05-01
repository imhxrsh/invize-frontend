"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Clock,
	CheckCircle,
	AlertCircle,
	Upload,
	Loader2,
	Sparkles,
	Wallet,
	FileText,
} from "lucide-react";
import { listDocuments, type DocumentListItem } from "@/lib/documents";
import { getWorkflowStats } from "@/lib/workflow";
import {
	listPaymentBatches,
	createPaymentBatch,
	addPaymentLine,
	submitPaymentBatch,
	suggestPaymentAgent,
	type PaymentBatchDto,
} from "@/lib/payments";
import { parseApiErrorText } from "@/lib/api-errors";
import { formatDocumentCurrency } from "@/lib/format-currency";

function approvalBadgeVariant(
	status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
	const s = (status || "").toLowerCase();
	if (s === "approved") return "default";
	if (s === "rejected") return "destructive";
	if (s === "pending") return "secondary";
	return "outline";
}

function paymentReadiness(row: DocumentListItem): { label: string; variant: "secondary" | "default" | "destructive" | "outline" } {
	const st = (row.status || "").toLowerCase();
	if (st !== "completed") {
		return { label: "Not ready — processing", variant: "outline" };
	}
	if (row.has_exception) {
		return { label: "Blocked — exception", variant: "destructive" };
	}
	const ap = (row.approval_status || "").toLowerCase();
	if (ap === "rejected") {
		return { label: "Not payable — rejected", variant: "destructive" };
	}
	if (ap === "pending") {
		return { label: "Awaiting approval", variant: "secondary" };
	}
	const total = row.total;
	const hasAmount = total != null && Number(total) > 0;
	if (ap === "approved" && hasAmount) {
		return { label: "Ready — approved & amount OK", variant: "default" };
	}
	if (ap === "approved" && !hasAmount) {
		return { label: "Approved — missing amount", variant: "secondary" };
	}
	if (hasAmount) {
		return { label: "Amount OK — no approval record", variant: "outline" };
	}
	return { label: "Not ready — missing amount", variant: "outline" };
}

function displayApproval(status: string | null | undefined): string {
	if (!status || String(status).trim() === "") return "—";
	return String(status).replace(/_/g, " ");
}

export default function PaymentsHubPage() {
	const [rows, setRows] = useState<DocumentListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [listError, setListError] = useState<string | null>(null);
	const [stats, setStats] = useState<{ pending_approvals: number } | null>(null);
	const [batches, setBatches] = useState<PaymentBatchDto[]>([]);
	const [batchesLoading, setBatchesLoading] = useState(false);
	const [batchAction, setBatchAction] = useState<string | null>(null);
	const [agentOut, setAgentOut] = useState<Record<string, unknown> | null>(null);
	const [agentLoading, setAgentLoading] = useState(false);

	const loadDocuments = useCallback(async () => {
		setListError(null);
		setLoading(true);
		try {
			const r = await listDocuments();
			setRows(r.items ?? []);
		} catch (e) {
			setListError(e instanceof Error ? e.message : "Failed to load documents");
			setRows([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadBatches = useCallback(async () => {
		setBatchesLoading(true);
		try {
			const r = await listPaymentBatches();
			setBatches(r.batches ?? []);
		} catch {
			setBatches([]);
		} finally {
			setBatchesLoading(false);
		}
	}, []);

	useEffect(() => {
		let c = false;
		getWorkflowStats()
			.then((s) => {
				if (!c) setStats(s);
			})
			.catch(() => {});
		return () => {
			c = true;
		};
	}, []);

	useEffect(() => {
		void loadDocuments();
	}, [loadDocuments]);

	useEffect(() => {
		void loadBatches();
	}, [loadBatches]);

	const metrics = useMemo(() => {
		const completed = rows.filter((r) => (r.status || "").toLowerCase() === "completed");
		const pending = completed.filter(
			(r) => (r.approval_status || "").toLowerCase() === "pending",
		);
		const approved = completed.filter(
			(r) => (r.approval_status || "").toLowerCase() === "approved",
		);
		const ready = completed.filter((r) => {
			const pr = paymentReadiness(r);
			return pr.label.startsWith("Ready");
		});
		const approvedTotal = approved.reduce((a, r) => a + (Number(r.total) || 0), 0);
		const approvedCurrencies = new Set(
			approved
				.map((r) => (r.currency || "").trim().toUpperCase())
				.filter((c) => /^[A-Z]{3}$/.test(c)),
		);
		const approvedCurrency =
			approvedCurrencies.size === 1 ? [...approvedCurrencies][0]! : null;
		return {
			pendingCount: pending.length,
			approvedCount: approved.length,
			readyCount: ready.length,
			approvedTotal,
			approvedCurrency,
		};
	}, [rows]);

	const onRunAgent = async () => {
		const items = rows
			.filter((r) => (r.status || "").toLowerCase() === "completed")
			.slice(0, 40)
			.map((r) => {
				const pr = paymentReadiness(r);
				return {
					job_id: r.job_id,
					vendor: r.vendor ?? "",
					total: r.total ?? null,
					approval_status: r.approval_status ?? null,
					payment_readiness: pr.label,
					has_exception: r.has_exception ?? false,
				};
			});
		setAgentLoading(true);
		setAgentOut(null);
		try {
			const out = await suggestPaymentAgent(items);
			setAgentOut(out);
		} catch (e) {
			setAgentOut({
				ok: false,
				error: e instanceof Error ? e.message : "Agent failed",
			});
		} finally {
			setAgentLoading(false);
		}
	};

	const onNewBatch = async () => {
		setBatchAction(null);
		try {
			await createPaymentBatch(`Batch ${new Date().toISOString().slice(0, 10)}`);
			await loadBatches();
		} catch (e) {
			setBatchAction(e instanceof Error ? e.message : "Failed");
		}
	};

	const onSubmitBatch = async (id: string) => {
		setBatchAction(null);
		try {
			await submitPaymentBatch(id);
			await loadBatches();
		} catch (e) {
			setBatchAction(e instanceof Error ? e.message : "Submit failed");
		}
	};

	const onAddFirstReadyToBatch = async (batchId: string) => {
		const ready = rows.find((r) => {
			const pr = paymentReadiness(r);
			return pr.label.startsWith("Ready");
		});
		if (!ready) {
			setBatchAction("No payment-ready invoice to add");
			return;
		}
		setBatchAction(null);
		try {
			await addPaymentLine(batchId, { job_id: ready.job_id });
			await loadBatches();
		} catch (e) {
			setBatchAction(e instanceof Error ? e.message : "Add line failed");
		}
	};

	const demoBatches = [
		{
			id: "PB-DEMO-001",
			name: "Illustrative — Weekly vendor run",
			status: "Ready for Approval",
			totalAmount: 1045625.0,
			invoiceCount: 23,
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">Payments Hub</h1>
					<p className="text-muted-foreground mt-1 max-w-2xl">
						Track <strong>approval</strong> and <strong>payment readiness</strong> per invoice.
						Use batches and the agent for the next step toward execution (treasury is still a stub).
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link href="/dashboard/resolution-queue">
						<Button variant="outline">Resolution queue</Button>
					</Link>
					<Link href="/dashboard/invoices">
						<Button className="bg-secondary hover:bg-secondary/90">
							<Upload className="h-4 w-4 mr-2" />
							Invoices
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending approval</CardTitle>
						<Clock className="h-4 w-4 text-amber-600" />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						) : (
							<>
								<div className="text-2xl font-bold">{stats?.pending_approvals ?? metrics.pendingCount}</div>
								<p className="text-xs text-muted-foreground">Workflow + completed docs pending</p>
							</>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Approved (completed)</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{loading ? "—" : metrics.approvedCount}</div>
						<p className="text-xs text-muted-foreground">Invoices with approved status</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Payment-ready</CardTitle>
						<Wallet className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{loading ? "—" : metrics.readyCount}</div>
						<p className="text-xs text-muted-foreground">Approved + amount + no exception</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Approved total</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tabular-nums">
							{loading
								? "—"
								: formatDocumentCurrency(metrics.approvedTotal, metrics.approvedCurrency, {
										maximumFractionDigits: 2,
									})}
						</div>
						<p className="text-xs text-muted-foreground">Sum of totals (completed)</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="invoices" className="w-full">
				<TabsList className="flex flex-wrap h-auto gap-1">
					<TabsTrigger value="invoices">Invoices & payments</TabsTrigger>
					<TabsTrigger value="batches">Payment batches</TabsTrigger>
					<TabsTrigger value="agent">Payment agent</TabsTrigger>
					<TabsTrigger value="demo">Demo scenarios</TabsTrigger>
				</TabsList>

				<TabsContent value="invoices" className="space-y-4 mt-4">
					{listError && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Could not load documents</AlertTitle>
							<AlertDescription>{parseApiErrorText(listError)}</AlertDescription>
						</Alert>
					)}
					{!loading && !listError && rows.length === 0 && (
						<Alert>
							<AlertTitle>No documents yet</AlertTitle>
							<AlertDescription>
								Upload invoices from{" "}
								<Link href="/dashboard/process-live" className="underline font-medium">
									Live pipeline
								</Link>{" "}
								or the invoice list. Approvals and payment status will show here.
							</AlertDescription>
						</Alert>
					)}
					{!loading && metrics.pendingCount > 0 && (
						<Alert>
							<Clock className="h-4 w-4" />
							<AlertTitle>Approvals waiting</AlertTitle>
							<AlertDescription>
								{metrics.pendingCount} completed invoice(s) are pending approval.{" "}
								<Link href="/dashboard/resolution-queue" className="underline font-medium">
									Open resolution queue
								</Link>
							</AlertDescription>
						</Alert>
					)}
					<Card>
						<CardHeader>
							<CardTitle>Invoice payment status</CardTitle>
							<CardDescription>
								Approval state from workflow; readiness combines approval, amount, and exceptions.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							<div className="rounded-md border overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Vendor</TableHead>
											<TableHead>Invoice #</TableHead>
											<TableHead className="text-right">Amount</TableHead>
											<TableHead>Doc status</TableHead>
											<TableHead>Approval</TableHead>
											<TableHead>Payment readiness</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loading ? (
											<TableRow>
												<TableCell colSpan={7} className="h-24 text-center">
													<Loader2 className="h-6 w-6 animate-spin inline text-muted-foreground" />
												</TableCell>
											</TableRow>
										) : rows.length === 0 ? (
											<TableRow>
												<TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
													No rows
												</TableCell>
											</TableRow>
										) : (
											rows.map((row) => {
												const pr = paymentReadiness(row);
												return (
													<TableRow key={row.job_id}>
														<TableCell className="font-medium max-w-[140px] truncate">
															{row.vendor ?? "—"}
														</TableCell>
														<TableCell className="tabular-nums">
															{row.invoice_number ?? "—"}
														</TableCell>
														<TableCell className="text-right font-medium tabular-nums">
															{formatDocumentCurrency(row.total ?? null, row.currency, {
																maximumFractionDigits: 2,
															})}
														</TableCell>
														<TableCell>
															<Badge variant="outline" className="capitalize">
																{row.status}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge variant={approvalBadgeVariant(row.approval_status)}>
																{displayApproval(row.approval_status)}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge variant={pr.variant}>{pr.label}</Badge>
														</TableCell>
														<TableCell className="text-right">
															<Button variant="ghost" size="sm" asChild>
																<Link href={`/dashboard/invoices/${row.job_id}`}>View</Link>
															</Button>
														</TableCell>
													</TableRow>
												);
											})
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="batches" className="space-y-4 mt-4">
					<Card>
						<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle>Batches</CardTitle>
								<CardDescription>
									Draft batches, add invoice lines, then submit (stub treasury reference).
								</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button variant="outline" size="sm" onClick={() => void loadBatches()}>
									Refresh
								</Button>
								<Button size="sm" onClick={() => void onNewBatch()}>
									New batch
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{batchAction && (
								<Alert variant={batchAction.includes("fail") || batchAction.includes("No ") ? "destructive" : "default"}>
									<AlertDescription>{batchAction}</AlertDescription>
								</Alert>
							)}
							{batchesLoading ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : batches.length === 0 ? (
								<p className="text-sm text-muted-foreground">No batches yet. Create one to group payables.</p>
							) : (
								<div className="space-y-4">
									{batches.map((b) => (
										<div key={b.id} className="rounded-lg border p-4 space-y-2">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div>
													<span className="font-medium">{b.name || "Untitled batch"}</span>
													<Badge variant="outline" className="ml-2">
														{b.status}
													</Badge>
												</div>
												<div className="flex flex-wrap gap-2">
													{b.status === "draft" && (
														<>
															<Button size="sm" variant="secondary" onClick={() => void onAddFirstReadyToBatch(b.id)}>
																Add first ready invoice
															</Button>
															<Button size="sm" onClick={() => void onSubmitBatch(b.id)}>
																Submit (stub)
															</Button>
														</>
													)}
												</div>
											</div>
											<ul className="text-sm text-muted-foreground list-disc pl-5">
												{b.lines.length === 0 ? (
													<li>No lines</li>
												) : (
													b.lines.map((ln) => (
														<li key={ln.id}>
															{ln.job_id} —{" "}
															{formatDocumentCurrency(ln.amount, ln.currency, {
																maximumFractionDigits: 2,
															})}
														</li>
													))
												)}
											</ul>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="agent" className="space-y-4 mt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="h-5 w-5 text-violet-600" />
								Payment suggestions
							</CardTitle>
							<CardDescription>
								Suggestions only — confirm actions in batches. Requires the AI assistant to be enabled on
								the server.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button onClick={() => void onRunAgent()} disabled={agentLoading || rows.length === 0}>
								{agentLoading ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Sparkles className="h-4 w-4 mr-2" />
								)}
								Suggest batching
							</Button>
							{agentOut && (
								<pre className="text-xs rounded-md border bg-muted/50 p-4 overflow-auto max-h-80 whitespace-pre-wrap">
									{JSON.stringify(agentOut, null, 2)}
								</pre>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="demo" className="space-y-4 mt-4">
					<Alert>
						<AlertTitle>Illustrative only</AlertTitle>
						<AlertDescription>
							The cards below are static examples — they are not connected to your ledger or bank.
						</AlertDescription>
					</Alert>
					{demoBatches.map((batch) => (
						<Card key={batch.id}>
							<CardHeader>
								<CardTitle className="text-base">{batch.name}</CardTitle>
								<CardDescription>{batch.id}</CardDescription>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								<p>
									{batch.invoiceCount} invoices ·{" "}
									{formatDocumentCurrency(batch.totalAmount, "INR", {
										maximumFractionDigits: 2,
									})}{" "}
									· {batch.status}
								</p>
							</CardContent>
						</Card>
					))}
				</TabsContent>
			</Tabs>

			<Accordion type="single" collapsible className="border rounded-lg px-4">
				<AccordionItem value="sched" className="border-0">
					<AccordionTrigger className="text-sm py-3 hover:no-underline">
						Legacy schedule / history placeholders
					</AccordionTrigger>
					<AccordionContent className="text-sm text-muted-foreground pb-4">
						Replace with real treasury data when a PSP adapter is connected. Use the Invoices & payments tab for live status today.
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
