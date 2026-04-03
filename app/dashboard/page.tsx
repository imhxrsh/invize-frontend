"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileCheck, AlertCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getWorkflowStats } from "@/lib/workflow";

export default function DashboardPage() {
	const [stats, setStats] = useState<{
		queue_counts: Record<string, number>;
		avg_cycle_time_seconds?: number;
		pending_approvals: number;
		overdue_count: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		getWorkflowStats()
			.then((data) => {
				if (!cancelled) setStats(data);
			})
			.catch((e) => {
				if (!cancelled)
					setError(
						e instanceof Error ? e.message : "Failed to load stats",
					);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const totalPending = stats
		? Object.values(stats.queue_counts).reduce((a, b) => a + b, 0)
		: 0;
	const kpiData = [
		{
			title: "Items Needing Review",
			value: loading ? "—" : String(totalPending),
			description: "Across all queues",
			icon: AlertCircle,
			color: "text-amber-600",
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
		},
		{
			title: "Pending Approvals",
			value: loading ? "—" : String(stats?.pending_approvals ?? 0),
			description: "Awaiting approval",
			icon: FileCheck,
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
			description: "Per document",
			icon: Clock,
			color: "text-teal-600",
			bgColor: "bg-teal-50 dark:bg-teal-950/30",
		},
		{
			title: "Overdue",
			value: loading ? "—" : String(stats?.overdue_count ?? 0),
			description: "Past SLA",
			icon: XCircle,
			color: "text-red-600",
			bgColor: "bg-red-50 dark:bg-red-950/30",
		},
	];
	const queueBreakdown = stats?.queue_counts
		? Object.entries(stats.queue_counts).filter(([, c]) => c > 0)
		: [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					Dashboard
				</h1>
				<p className="text-muted-foreground">
					Operations overview from the workflow backend.
				</p>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			{loading && !stats && (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			)}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{kpiData.map((kpi) => (
					<Card key={kpi.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{kpi.title}
							</CardTitle>
							<div className={`rounded-full p-2 ${kpi.bgColor}`}>
								<kpi.icon className={`h-4 w-4 ${kpi.color}`} />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{kpi.value}
							</div>
							<p className="text-xs text-muted-foreground">
								{kpi.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Queue breakdown</CardTitle>
						<CardDescription>
							Pending by queue (Operations &amp; Workflow)
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{queueBreakdown.length === 0 && !loading && (
							<p className="text-sm text-muted-foreground">
								No pending items.
							</p>
						)}
						{queueBreakdown.map(([name, count]) => (
							<div
								key={name}
								className="flex items-center justify-between"
							>
								<span className="text-sm font-medium capitalize">
									{name.replace(/_/g, " ")}
								</span>
								<Badge variant="secondary">{count}</Badge>
							</div>
						))}
					</CardContent>
				</Card>
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Quick actions</CardTitle>
						<CardDescription>
							Invoices and Resolution Queue
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-3">
							<Link href="/dashboard/invoices">
								<span className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
									Invoices
								</span>
							</Link>
							<Link href="/dashboard/resolution-queue">
								<span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
									Resolution Queue
								</span>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
