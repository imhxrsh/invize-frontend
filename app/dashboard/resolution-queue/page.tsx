"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	AlertTriangle,
	Clock,
	CheckCircle,
	Eye,
	FileText,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import {
	getWorkflowQueues,
	getQueueItems,
	updateReviewItem,
	getWorkflowStats,
	type QueueItem,
} from "@/lib/workflow";

const QUEUE_ORDER = [
	"failed_review",
	"no_po_review",
	"variance_review",
	"duplicate_review",
	"authenticity_review",
	"clean",
];

function getPriorityLabel(priority: number | undefined) {
	if (priority == null) return "—";
	if (priority >= 80) return "High";
	if (priority >= 50) return "Medium";
	return "Low";
}

function getPriorityColor(priority: number | undefined) {
	if (priority == null) return "bg-muted";
	if (priority >= 80) return "bg-destructive/90 text-destructive-foreground";
	if (priority >= 50)
		return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
	return "bg-muted text-muted-foreground";
}

function getStatusColor(status: string) {
	switch (status) {
		case "pending":
			return "bg-amber-100 text-amber-800 dark:bg-amber-900/50";
		case "in_review":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900/50";
		case "resolved":
			return "bg-green-100 text-green-800 dark:bg-green-900/50";
		default:
			return "bg-muted";
	}
}

export default function ResolutionQueuePage() {
	const [queueNames, setQueueNames] = useState<string[]>([]);
	const [selectedQueue, setSelectedQueue] = useState<string>("");
	const [items, setItems] = useState<QueueItem[]>([]);
	const [stats, setStats] = useState<{
		queue_counts: Record<string, number>;
		total_pending: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
	const [resolutionNotes, setResolutionNotes] = useState("");
	const [resolveLoading, setResolveLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchQueues = async () => {
		try {
			const data = await getWorkflowQueues();
			setStats(data);
			const names = Object.keys(data.queue_counts).sort(
				(a, b) =>
					QUEUE_ORDER.indexOf(a) - QUEUE_ORDER.indexOf(b) ||
					a.localeCompare(b),
			);
			const list = names.length
				? names
				: [
						"duplicate_review",
						"variance_review",
						"no_po_review",
						"failed_review",
					];
			setQueueNames(list);
			if (!selectedQueue && list[0]) setSelectedQueue(list[0]);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to load queues");
		}
	};

	const fetchItems = async () => {
		if (!selectedQueue) return;
		setLoading(true);
		setError(null);
		try {
			const list = await getQueueItems(selectedQueue, { limit: 100 });
			setItems(list);
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Failed to load queue items",
			);
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchQueues();
	}, []);

	useEffect(() => {
		if (selectedQueue) fetchItems();
		else setItems([]);
	}, [selectedQueue]);

	const handleResolve = async () => {
		if (!selectedItem) return;
		setResolveLoading(true);
		try {
			await updateReviewItem(selectedItem.id, {
				status: "resolved",
				resolution: resolutionNotes || undefined,
			});
			setResolutionNotes("");
			setSelectedItem(null);
			await fetchItems();
			await fetchQueues();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to resolve");
		} finally {
			setResolveLoading(false);
		}
	};

	const filteredItems = items.filter((item) => {
		const q = searchQuery.toLowerCase();
		return (
			item.job_id.toLowerCase().includes(q) ||
			item.exception_type.toLowerCase().includes(q) ||
			(item.resolution ?? "").toLowerCase().includes(q)
		);
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Resolution Queue
					</h1>
					<p className="text-muted-foreground">
						Review and resolve items from the Operations &amp;
						Workflow backend
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Select
						value={selectedQueue || undefined}
						onValueChange={setSelectedQueue}
					>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Select queue" />
						</SelectTrigger>
						<SelectContent>
							{queueNames.map((name) => (
								<SelectItem key={name} value={name}>
									{name.replace(/_/g, " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input
						placeholder="Search by job ID or type..."
						className="w-56"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Pending
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-amber-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats?.total_pending ?? "—"}
						</div>
						<p className="text-xs text-muted-foreground">
							Across all queues
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Current queue
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{items.length}</div>
						<p className="text-xs text-muted-foreground truncate">
							{selectedQueue?.replace(/_/g, " ") ?? "—"}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Queue items</CardTitle>
							<CardDescription>
								Click an item to view details and resolve
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="flex justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : (
								<div className="space-y-4">
									{filteredItems.map((item) => (
										<div
											key={item.id}
											className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
												selectedItem?.id === item.id
													? "border-primary bg-muted/30"
													: "border-border"
											}`}
											onClick={() =>
												setSelectedItem(item)
											}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="space-y-1 min-w-0">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="font-mono text-sm truncate">
															{item.job_id.slice(
																0,
																8,
															)}
															…
														</span>
														<Badge
															className={getPriorityColor(
																item.priority,
															)}
														>
															{getPriorityLabel(
																item.priority,
															)}
														</Badge>
														<Badge
															className={getStatusColor(
																item.status,
															)}
														>
															{item.status.replace(
																/_/g,
																" ",
															)}
														</Badge>
													</div>
													<p className="text-sm font-medium capitalize">
														{item.exception_type.replace(
															/_/g,
															" ",
														)}
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(
															item.created_at,
														).toLocaleString()}
													</p>
												</div>
												<Link
													href={`/dashboard/invoices/${item.job_id}`}
													onClick={(e) =>
														e.stopPropagation()
													}
												>
													<Button
														variant="ghost"
														size="sm"
													>
														<Eye className="h-4 w-4" />
													</Button>
												</Link>
											</div>
										</div>
									))}
									{filteredItems.length === 0 && !loading && (
										<p className="text-center py-8 text-muted-foreground">
											No items in this queue.
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Item details</CardTitle>
						<CardDescription>
							{selectedItem
								? "Resolve or open the document"
								: "Select an item"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{selectedItem ? (
							<Tabs defaultValue="details" className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="details">
										Details
									</TabsTrigger>
									<TabsTrigger value="actions">
										Actions
									</TabsTrigger>
								</TabsList>
								<TabsContent
									value="details"
									className="space-y-4"
								>
									<div className="space-y-2 text-sm">
										<p>
											<span className="font-medium">
												Job ID
											</span>
										</p>
										<p className="font-mono text-xs break-all">
											{selectedItem.job_id}
										</p>
										<p>
											<span className="font-medium">
												Exception type
											</span>{" "}
											{selectedItem.exception_type.replace(
												/_/g,
												" ",
											)}
										</p>
										<p>
											<span className="font-medium">
												Queue
											</span>{" "}
											{selectedItem.queue_name.replace(
												/_/g,
												" ",
											)}
										</p>
										<p>
											<span className="font-medium">
												Status
											</span>{" "}
											{selectedItem.status}
										</p>
										<p>
											<span className="font-medium">
												Created
											</span>{" "}
											{new Date(
												selectedItem.created_at,
											).toLocaleString()}
										</p>
									</div>
									<Link
										href={`/dashboard/invoices/${selectedItem.job_id}`}
									>
										<Button
											variant="outline"
											size="sm"
											className="w-full"
										>
											<Eye className="h-4 w-4 mr-2" />
											Open document
										</Button>
									</Link>
								</TabsContent>
								<TabsContent
									value="actions"
									className="space-y-4"
								>
									<div>
										<label className="text-sm font-medium">
											Resolution notes
										</label>
										<Textarea
											placeholder="Optional notes..."
											className="mt-1"
											value={resolutionNotes}
											onChange={(e) =>
												setResolutionNotes(
													e.target.value,
												)
											}
										/>
									</div>
									<Button
										className="w-full"
										disabled={resolveLoading}
										onClick={handleResolve}
									>
										{resolveLoading ? (
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										) : (
											<CheckCircle className="h-4 w-4 mr-2" />
										)}
										Mark resolved
									</Button>
								</TabsContent>
							</Tabs>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Select an item from the queue</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
