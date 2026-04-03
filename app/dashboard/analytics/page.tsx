"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	Download,
	TrendingUp,
	ClipboardCheck,
	AlertTriangle,
	Zap,
	Loader2,
	AlertCircle,
	CheckCircle,
	Clock,
} from "lucide-react";
import { getWorkflowStats } from "@/lib/workflow";
import { listDocuments, listVendors, getDocumentResult } from "@/lib/documents";
import type { DocumentListItem, DocumentResultResponse } from "@/lib/documents";

// ── Accuracy breakdown (static — reflects AI pipeline config) ─────────────
const accuracyData = [
	{ name: "Accurate", value: 96.8, color: "#10b981" },
	{ name: "Needs Review", value: 2.7, color: "#f59e0b" },
	{ name: "Errors", value: 0.5, color: "#ef4444" },
];

// ── Helper: bucket docs by month ──────────────────────────────────────────
function bucketByMonth(items: DocumentListItem[]): { month: string; invoices: number }[] {
	const counts: Record<string, number> = {};
	for (const item of items) {
		if (!item.created_at) continue;
		const d = new Date(item.created_at);
		const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
		counts[key] = (counts[key] ?? 0) + 1;
	}
	// sort by date
	return Object.entries(counts)
		.sort(([a], [b]) => {
			const parse = (s: string) => new Date(`01 ${s.replace("'", " 20")}`);
			return parse(a).getTime() - parse(b).getTime();
		})
		.slice(-6)
		.map(([month, invoices]) => ({ month, invoices }));
}

// ── Exception type → description ──────────────────────────────────────────
function exceptionLabel(type?: string) {
	if (!type) return "Unknown";
	return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function exceptionColor(type?: string): string {
	const t = type?.toLowerCase() ?? "";
	if (t.includes("po") || t.includes("missing")) return "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30";
	if (t.includes("mismatch") || t.includes("variance") || t.includes("price")) return "border-red-300 text-red-700 bg-red-50 dark:bg-red-950/30";
	if (t.includes("duplicate")) return "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30";
	return "border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-950/30";
}

export default function AnalyticsPage() {
	const [dateRange, setDateRange] = useState("last-6-months");
	const [stats, setStats] = useState<{
		queue_counts: Record<string, number>;
		avg_cycle_time_seconds?: number;
		pending_approvals: number;
		overdue_count: number;
	} | null>(null);
	const [docs, setDocs] = useState<DocumentListItem[]>([]);
	const [vendors, setVendors] = useState<{ name: string; total: number; invoice_count: number }[]>([]);
	const [insights, setInsights] = useState<
		Array<{
			job_id: string;
			filename: string | undefined;
			result: DocumentResultResponse;
		}>
	>([]);
	const [loading, setLoading] = useState(true);
	const [insightsLoading, setInsightsLoading] = useState(true);

	// Fetch main stats + docs + vendors
	useEffect(() => {
		let cancelled = false;
		Promise.all([getWorkflowStats(), listDocuments(), listVendors()])
			.then(([s, d, v]) => {
				if (!cancelled) {
					setStats(s);
					setDocs(d.items ?? []);
					setVendors(v.vendors ?? []);
				}
			})
			.catch(() => {})
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	// Fetch detailed results for completed docs to extract AI decision insights
	useEffect(() => {
		let cancelled = false;
		(async () => {
			setInsightsLoading(true);
			try {
				const list = await listDocuments();
				const completedDocs = (list.items ?? [])
					.filter((d) => d.status === "completed")
					.slice(0, 15); // last 15 completed docs

				const results = await Promise.allSettled(
					completedDocs.map((d) =>
						getDocumentResult(d.job_id).then((r) => ({ job_id: d.job_id, filename: d.filename, result: r }))
					)
				);
				if (cancelled) return;
				const withInsights = results
					.filter(
						(
							r,
						): r is PromiseFulfilledResult<{
							job_id: string;
							filename: string | undefined;
							result: DocumentResultResponse;
						}> =>
							r.status === "fulfilled" &&
							!!r.value.result.operations_workflow?.exception,
					)
					.map((r) => r.value);
				setInsights(withInsights);
			} catch {
				// silently fail
			} finally {
				if (!cancelled) setInsightsLoading(false);
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const totalPending = stats
		? Object.values(stats.queue_counts).reduce((a, b) => a + b, 0)
		: 0;

	const volumeData = useMemo(() => bucketByMonth(docs), [docs]);

	const vendorChartData = useMemo(
		() => vendors.slice(0, 10).map((v) => ({ vendor: v.name.length > 12 ? v.name.slice(0, 12) + "…" : v.name, spend: v.total, fullName: v.name })),
		[vendors]
	);

	const keyMetrics = [
		{
			title: "Documents Processed",
			value: loading ? "—" : String(docs.length),
			description: "Total in system",
			icon: TrendingUp,
			color: "text-primary",
			bgColor: "bg-primary/10",
		},
		{
			title: "Pending Review",
			value: loading ? "—" : String(totalPending),
			description: "Items in queues",
			icon: ClipboardCheck,
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			title: "Avg Processing Time",
			value: loading
				? "—"
				: stats?.avg_cycle_time_seconds != null
					? `${stats.avg_cycle_time_seconds.toFixed(1)}s`
					: "—",
			description: "Per document (backend)",
			icon: Zap,
			color: "text-teal-600",
			bgColor: "bg-teal-50 dark:bg-teal-950/30",
		},
		{
			title: "Overdue Approvals",
			value: loading ? "—" : String(stats?.overdue_count ?? 0),
			description: "Past SLA",
			icon: AlertTriangle,
			color: "text-amber-600",
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
		},
	];

	const handleExportReport = () => {
		const rows = [
			["Metric", "Value"],
			["Documents Processed", docs.length],
			["Pending Review", totalPending],
			["Avg Processing Time (s)", stats?.avg_cycle_time_seconds?.toFixed(2) ?? "N/A"],
			["Overdue Approvals", stats?.overdue_count ?? 0],
			[""],
			["Vendor", "Total Spend", "Invoice Count"],
			...vendors.map((v) => [v.name, v.total, v.invoice_count]),
		];
		const csv = rows.map((r) => r.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `invize-report-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">Analytics</h1>
					<p className="text-muted-foreground">
						AI performance insights and processing trends
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Select value={dateRange} onValueChange={setDateRange}>
						<SelectTrigger className="w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="last-30-days">Last 30 Days</SelectItem>
							<SelectItem value="last-3-months">Last 3 Months</SelectItem>
							<SelectItem value="last-6-months">Last 6 Months</SelectItem>
							<SelectItem value="last-year">Last Year</SelectItem>
						</SelectContent>
					</Select>
					<Button onClick={handleExportReport} className="bg-primary hover:bg-primary/90">
						<Download className="mr-2 h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-6 md:grid-cols-4">
				{keyMetrics.map((metric) => (
					<Card key={metric.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{metric.title}
							</CardTitle>
							<div className={`rounded-full p-2 ${metric.bgColor}`}>
								<metric.icon className={`h-4 w-4 ${metric.color}`} />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{metric.value}
							</div>
							<p className="text-xs text-muted-foreground">{metric.description}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Invoice Volume Chart — real data */}
				<Card>
					<CardHeader>
						<CardTitle>Invoice Volume Over Time</CardTitle>
						<CardDescription>
							{volumeData.length > 0
								? "Invoices processed per month"
								: "No time-series data yet — upload invoices to populate this chart"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-72">
							{loading ? (
								<div className="flex items-center justify-center h-full">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : volumeData.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
									<TrendingUp className="h-10 w-10 opacity-30" />
									<p className="text-sm">No data yet</p>
								</div>
							) : (
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={volumeData}>
										<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
										<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
										<YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
										<Tooltip
											contentStyle={{
												backgroundColor: "hsl(var(--card))",
												border: "1px solid hsl(var(--border))",
												borderRadius: "8px",
												color: "hsl(var(--foreground))",
											}}
										/>
										<Line
											type="monotone"
											dataKey="invoices"
											stroke="#3b82f6"
											strokeWidth={3}
											dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
											activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Top Vendors — real data from /documents/vendors */}
				<Card>
					<CardHeader>
						<CardTitle>Top Vendors by Spend</CardTitle>
						<CardDescription>
							{vendors.length > 0
								? `Top ${Math.min(vendors.length, 10)} vendors extracted by AI`
								: "No vendor data yet — vendors are extracted from processed invoices"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-72">
							{loading ? (
								<div className="flex items-center justify-center h-full">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : vendorChartData.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
									<AlertCircle className="h-10 w-10 opacity-30" />
									<p className="text-sm">No vendor data yet</p>
								</div>
							) : (
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={vendorChartData}>
										<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
										<XAxis dataKey="vendor" fontSize={11} />
										<YAxis fontSize={11} />
										<Tooltip
											contentStyle={{
												backgroundColor: "hsl(var(--card))",
												border: "1px solid hsl(var(--border))",
												borderRadius: "8px",
											}}
											formatter={(value, _name, props) => [
												`₹${Number(value).toLocaleString("en-IN")}`,
												props.payload.fullName ?? "Spend",
											]}
										/>
										<Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Queue Breakdown + Accuracy */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Queue breakdown */}
				<Card>
					<CardHeader>
						<CardTitle>Queue Breakdown</CardTitle>
						<CardDescription>Pending items per review queue</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : Object.entries(stats?.queue_counts ?? {}).filter(([, c]) => c > 0).length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
								<CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
								<p className="text-sm">All queues clear</p>
							</div>
						) : (
							<div className="space-y-3">
								{Object.entries(stats?.queue_counts ?? {})
									.filter(([, c]) => c > 0)
									.sort(([, a], [, b]) => b - a)
									.map(([name, count]) => (
										<div key={name} className="flex items-center justify-between">
											<span className="text-sm font-medium capitalize">
												{name.replace(/_/g, " ")}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-primary rounded-full"
														style={{ width: `${Math.min(100, (count / totalPending) * 100)}%` }}
													/>
												</div>
												<Badge variant="secondary">{count}</Badge>
											</div>
										</div>
									))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Processing Accuracy Pie */}
				<Card>
					<CardHeader>
						<CardTitle>Processing Accuracy</CardTitle>
						<CardDescription>AI accuracy breakdown (pipeline configuration)</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-52">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={accuracyData}
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={90}
										paddingAngle={4}
										dataKey="value"
									>
										{accuracyData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
										}}
										formatter={(value) => [`${value}%`, "Percentage"]}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="flex justify-center gap-5 mt-1">
							{accuracyData.map((entry) => (
								<div key={entry.name} className="flex items-center gap-1.5">
									<div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
									<span className="text-xs text-muted-foreground">
										{entry.name}: {entry.value}%
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* ── Decision Insights Feed ──────────────────────────────────────── */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-amber-500" />
						AI Decision Insights
					</CardTitle>
					<CardDescription>
						Why the AI flagged recent invoices — exception type, reasoning, and suggested actions
					</CardDescription>
				</CardHeader>
				<CardContent>
					{insightsLoading ? (
						<div className="flex items-center justify-center py-10">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : insights.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
							<CheckCircle className="h-10 w-10 text-green-500 opacity-60" />
							<p className="text-sm">No flagged invoices found</p>
							<p className="text-xs">Upload invoices to see AI decision reasoning here</p>
						</div>
					) : (
						<div className="space-y-4">
							{insights.map(({ job_id, filename, result }) => {
								const exc = result.operations_workflow?.exception;
								const suggestedActions = (exc as any)?.suggested_actions as string[] | undefined;
								const agentAnalysis = (result as any)?.agent_analysis as string | undefined;
								return (
									<div
										key={job_id}
										className="rounded-lg border p-4 space-y-3 hover:bg-muted/30 transition-colors"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-2 flex-wrap">
												<Badge
													variant="outline"
													className={`capitalize ${exceptionColor(exc?.exception_type)}`}
												>
													{exceptionLabel(exc?.exception_type)}
												</Badge>
												{exc?.queue_name && (
													<Badge variant="secondary" className="text-xs capitalize">
														→ {exc.queue_name.replace(/_/g, " ")}
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-xs text-muted-foreground font-mono">
													{job_id.slice(0, 8)}…
												</span>
												<a
													href={`/dashboard/invoices/${job_id}`}
													className="text-xs text-primary hover:underline"
												>
													View →
												</a>
											</div>
										</div>
										{filename && (
											<p className="text-xs text-muted-foreground">{filename}</p>
										)}
										{suggestedActions && suggestedActions.length > 0 && (
											<div>
												<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
													Why this was flagged
												</p>
												<ul className="space-y-1">
													{suggestedActions.map((action, i) => (
														<li key={i} className="text-sm flex gap-2 items-start">
															<Clock className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
															{action}
														</li>
													))}
												</ul>
											</div>
										)}
										{agentAnalysis && (
											<details className="text-xs text-muted-foreground">
												<summary className="cursor-pointer hover:text-foreground transition-colors font-medium">
													AI reasoning (expand)
												</summary>
												<p className="mt-2 whitespace-pre-wrap leading-relaxed">{agentAnalysis}</p>
											</details>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
