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
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Building2, DollarSign, FileText, Loader2, Search } from "lucide-react";
import { listVendors, type VendorSummary } from "@/lib/documents";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDocumentCurrency } from "@/lib/format-currency";

export default function VendorsPage() {
	const [vendors, setVendors] = useState<VendorSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	useEffect(() => {
		let cancelled = false;
		setError(null);
		listVendors()
			.then((r) => {
				if (!cancelled) setVendors(r.vendors ?? []);
			})
			.catch((e) => {
				if (!cancelled)
					setError(e instanceof Error ? e.message : "Failed to load vendors");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return vendors;
		return vendors.filter((v) => v.name.toLowerCase().includes(q));
	}, [vendors, search]);

	const totalInvoices = vendors.reduce((a, v) => a + v.invoice_count, 0);
	const totalSpend = vendors.reduce((a, v) => a + v.total, 0);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">Vendors</h1>
					<p className="text-muted-foreground mt-1 max-w-xl">
						Suppliers aggregated from processed invoice results only — name, invoice count, and
						total from extracted data.
					</p>
				</div>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertTitle>Could not load vendors</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Vendors</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{loading ? "—" : vendors.length}
						</div>
						<p className="text-xs text-muted-foreground">Unique supplier names</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Invoices</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{loading ? "—" : totalInvoices}
						</div>
						<p className="text-xs text-muted-foreground">Count from documents</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total (extracted)</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tabular-nums">
							{loading
								? "—"
								: formatDocumentCurrency(totalSpend, null, { maximumFractionDigits: 0 })}
						</div>
						<p className="text-xs text-muted-foreground">Sum of totals field</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Vendor list</CardTitle>
					<CardDescription>Data from GET /documents/vendors</CardDescription>
					<div className="pt-2 max-w-sm">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Filter by name…"
								className="pl-9"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : vendors.length === 0 && !error ? (
						<Alert>
							<AlertTitle>No vendors yet</AlertTitle>
							<AlertDescription>
								Process invoices with a supplier name in extracted data. Nothing here is mocked.
							</AlertDescription>
						</Alert>
					) : (
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead className="text-right">Invoices</TableHead>
										<TableHead className="text-right">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell colSpan={3} className="text-center text-muted-foreground h-24">
												No matches
											</TableCell>
										</TableRow>
									) : (
										filtered.map((v) => (
											<TableRow key={v.name}>
												<TableCell className="font-medium">{v.name}</TableCell>
												<TableCell className="text-right tabular-nums">
													{v.invoice_count}
												</TableCell>
												<TableCell className="text-right font-medium tabular-nums">
													{formatDocumentCurrency(v.total, null, { maximumFractionDigits: 2 })}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="text-base">More vendor insights</CardTitle>
					<CardDescription>
						Performance scores, contracts, and onboarding pipelines need dedicated APIs — not shown
						with fabricated data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" size="sm" disabled>
						Coming when ERP integrations ship
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
