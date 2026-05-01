"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, Eye, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
	listDocuments,
	uploadDocument,
	type DocumentListItem,
} from "@/lib/documents";
import { formatDocumentCurrency } from "@/lib/format-currency";

function getStatusBadge(status: string) {
	switch (status) {
		case "pending":
			return (
				<Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
					Pending
				</Badge>
			);
		case "processing":
			return (
				<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
					<Loader2 className="mr-1 h-3 w-3 animate-spin" />
					Processing
				</Badge>
			);
		case "completed":
			return (
				<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
					Completed
				</Badge>
			);
		case "failed":
			return (
				<Badge className="bg-red-100 text-red-800 hover:bg-red-100">
					Failed
				</Badge>
			);
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

export default function InvoicesPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("all");
	const [items, setItems] = useState<DocumentListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploadSuccess, setUploadSuccess] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchList = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await listDocuments();
			setItems(res.items ?? []);
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Failed to load documents",
			);
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchList();
	}, []);

	const filteredItems = items.filter((doc) => {
		const vendor = (doc.vendor ?? "").toLowerCase();
		const jobId = (doc.job_id ?? "").toLowerCase();
		const filename = (doc.filename ?? "").toLowerCase();
		const matchesSearch =
			vendor.includes(searchQuery.toLowerCase()) ||
			jobId.includes(searchQuery.toLowerCase()) ||
			filename.includes(searchQuery.toLowerCase());
		const matchesTab = activeTab === "all" || doc.status === activeTab;
		return matchesSearch && matchesTab;
	});

	// Directly trigger the hidden file input — no dialog needed
	const handleUploadClick = () => {
		setUploadError(null);
		setUploadSuccess(false);
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		setUploadError(null);
		setUploadSuccess(false);
		try {
			const res = await uploadDocument(file);
			setUploadSuccess(true);
			await fetchList();
			// Use router.push instead of full page reload
			router.push(`/dashboard/invoices/${res.job_id}`);
		} catch (e: unknown) {
			setUploadError(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Invoices
					</h1>
					<p className="text-muted-foreground">
						Upload and manage documents (Document Intelligence
						pipeline)
					</p>
				</div>
				<div className="flex items-center gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.txt"
						className="hidden"
						onChange={handleFileChange}
					/>
					<Button
						className="bg-primary hover:bg-primary/90"
						onClick={handleUploadClick}
						disabled={uploading}
					>
						{uploading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Upload className="mr-2 h-4 w-4" />
						)}
						Upload Invoice
					</Button>
				</div>
			</div>

			{/* Inline upload feedback — no modal needed */}
			{uploading && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border px-4 py-2 bg-muted/40">
					<Loader2 className="h-4 w-4 animate-spin" />
					Uploading and starting AI processing…
				</div>
			)}
			{uploadSuccess && !uploading && (
				<div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 rounded-lg border border-green-200 px-4 py-2 bg-green-50 dark:bg-green-950/30">
					<CheckCircle className="h-4 w-4" />
					Upload successful — redirecting to invoice…
				</div>
			)}
			{uploadError && (
				<div className="text-sm text-destructive rounded-lg border border-destructive/30 px-4 py-2 bg-destructive/5">
					{uploadError}
				</div>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Document list</CardTitle>
						<div className="flex items-center gap-4">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search by vendor, job ID, filename..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="pl-10 w-64"
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<p className="text-sm text-destructive mb-4">{error}</p>
					)}
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="space-y-4"
						>
							<TabsList>
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="pending">
									Pending
								</TabsTrigger>
								<TabsTrigger value="processing">
									Processing
								</TabsTrigger>
								<TabsTrigger value="completed">
									Completed
								</TabsTrigger>
								<TabsTrigger value="failed">Failed</TabsTrigger>
							</TabsList>

							<TabsContent
								value={activeTab}
								className="space-y-4"
							>
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Vendor</TableHead>
												<TableHead>Job ID</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Date</TableHead>
												<TableHead className="w-12" />
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredItems.map((doc) => (
												<TableRow key={doc.job_id}>
													<TableCell className="font-medium">
														{doc.vendor ||
															doc.filename ||
															"—"}
													</TableCell>
													<TableCell
														className="font-mono text-sm truncate max-w-[140px]"
														title={doc.job_id}
													>
														{doc.job_id.slice(0, 8)}
														…
													</TableCell>
													<TableCell className="font-semibold">
														{formatDocumentCurrency(
															doc.total,
															doc.currency,
															{ maximumFractionDigits: 0 },
														)}
													</TableCell>
													<TableCell>
														{getStatusBadge(
															doc.status,
														)}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{doc.created_at
															? new Date(
																	doc.created_at,
																).toLocaleDateString()
															: "—"}
													</TableCell>
													<TableCell>
														<Link
															href={`/dashboard/invoices/${doc.job_id}`}
														>
															<Button
																variant="ghost"
																size="sm"
															>
																<Eye className="h-4 w-4" />
															</Button>
														</Link>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								{filteredItems.length === 0 && (
									<div className="text-center py-8">
										<p className="text-muted-foreground">
											{items.length === 0
												? "No documents yet. Upload an invoice to get started."
												: "No documents match your filters."}
										</p>
									</div>
								)}
							</TabsContent>
						</Tabs>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
