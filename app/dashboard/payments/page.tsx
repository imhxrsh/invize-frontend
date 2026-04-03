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
import { Checkbox } from "@/components/ui/checkbox";
import {
	Calendar,
	DollarSign,
	Clock,
	CheckCircle,
	AlertCircle,
	Download,
	Upload,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { getWorkflowStats } from "@/lib/workflow";

export default function PaymentsHubPage() {
	const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
	const [stats, setStats] = useState<{ pending_approvals: number } | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		getWorkflowStats()
			.then((s) => {
				if (!cancelled) setStats(s);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const paymentBatches = [
		{
			id: "PB-2024-001",
			name: "Weekly Vendor Payments - Week 3",
			status: "Ready for Approval",
			totalAmount: 1045625.0,
			invoiceCount: 23,
			dueDate: "2024-01-18",
			createdBy: "System",
			createdAt: "2024-01-15T09:00:00Z",
			approver: "Finance Manager",
		},
		{
			id: "PB-2024-002",
			name: "Utilities & Services - January",
			status: "Approved",
			totalAmount: 376160.0,
			invoiceCount: 8,
			dueDate: "2024-01-20",
			createdBy: "Priya Sharma",
			createdAt: "2024-01-14T14:30:00Z",
			approver: "CFO",
		},
		{
			id: "PB-2024-003",
			name: "Office Supplies - Q1",
			status: "Processing",
			totalAmount: 74475.0,
			invoiceCount: 15,
			dueDate: "2024-01-22",
			createdBy: "Rajesh Kumar",
			createdAt: "2024-01-13T11:15:00Z",
			approver: "Department Head",
		},
	];

	const paymentSchedule = [
		{
			id: "PS-001",
			vendor: "Infosys Limited",
			amount: 1282005.0,
			dueDate: "2024-01-18",
			status: "Scheduled",
			paymentMethod: "NEFT Transfer",
			invoiceNumbers: ["INV-2024-001", "INV-2024-002"],
		},
		{
			id: "PS-002",
			vendor: "Wipro Technologies",
			amount: 728750.0,
			dueDate: "2024-01-20",
			status: "Pending Approval",
			paymentMethod: "RTGS Transfer",
			invoiceNumbers: ["INV-2024-003"],
		},
		{
			id: "PS-003",
			vendor: "Reliance Industries",
			amount: 194862.5,
			dueDate: "2024-01-22",
			status: "Scheduled",
			paymentMethod: "Cheque",
			invoiceNumbers: ["INV-2024-004", "INV-2024-005", "INV-2024-006"],
		},
		{
			id: "PS-004",
			vendor: "Tech Mahindra",
			amount: 1040000.0,
			dueDate: "2024-01-25",
			status: "Draft",
			paymentMethod: "NEFT Transfer",
			invoiceNumbers: ["INV-2024-007"],
		},
	];

	const paymentHistory = [
		{
			id: "PH-001",
			vendor: "HCL Technologies",
			amount: 2080000.0,
			paidDate: "2024-01-12",
			status: "Completed",
			paymentMethod: "RTGS Transfer",
			reference: "RTGS-2024-001",
			invoiceNumbers: ["INV-2023-089", "INV-2023-090"],
		},
		{
			id: "PH-002",
			vendor: "Bharti Airtel",
			amount: 707500.0,
			paidDate: "2024-01-10",
			status: "Completed",
			paymentMethod: "NEFT Transfer",
			reference: "NEFT-2024-015",
			invoiceNumbers: ["INV-2023-087"],
		},
		{
			id: "PH-003",
			vendor: "Mahindra Group",
			amount: 266400.0,
			paidDate: "2024-01-08",
			status: "Completed",
			paymentMethod: "Cheque",
			reference: "CHQ-2024-003",
			invoiceNumbers: ["INV-2023-085", "INV-2023-086"],
		},
		{
			id: "PH-004",
			vendor: "Larsen & Toubro",
			amount: 1311250.0,
			paidDate: "2024-01-05",
			status: "Completed",
			paymentMethod: "NEFT Transfer",
			reference: "NEFT-2024-012",
			invoiceNumbers: ["INV-2023-084"],
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Ready for Approval":
			case "Pending Approval":
				return "bg-warning text-warning-foreground";
			case "Approved":
			case "Completed":
				return "bg-secondary text-secondary-foreground";
			case "Processing":
			case "Scheduled":
				return "bg-primary text-primary-foreground";
			case "Draft":
				return "bg-muted text-muted-foreground";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	const handleBatchSelect = (batchId: string, checked: boolean) => {
		if (checked) {
			setSelectedBatches([...selectedBatches, batchId]);
		} else {
			setSelectedBatches(selectedBatches.filter((id) => id !== batchId));
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Payments Hub
					</h1>
					<p className="text-muted-foreground">
						Manage payment batches and processing workflows
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Link href="/dashboard/resolution-queue">
						<Button variant="outline">
							View Pending Approvals
						</Button>
					</Link>
					<Link href="/dashboard/invoices">
						<Button className="bg-secondary hover:bg-secondary/90">
							<Upload className="h-4 w-4 mr-2" />
							Invoices
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Approval
						</CardTitle>
						<Clock className="h-4 w-4 text-warning" />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						) : (
							<>
								<div className="text-2xl font-bold">
									{stats?.pending_approvals ?? 0}
								</div>
								<p className="text-xs text-muted-foreground">
									From workflow (approve in Resolution Queue
									or Invoice detail)
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Approved Today
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-secondary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">₹3,76,160</div>
						<p className="text-xs text-muted-foreground">
							8 invoices
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Processing
						</CardTitle>
						<AlertCircle className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">₹74,475</div>
						<p className="text-xs text-muted-foreground">
							15 invoices
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							This Month
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">₹17.5Cr</div>
						<p className="text-xs text-muted-foreground">
							+12% from last month
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="batches" className="w-full">
				<TabsList>
					<TabsTrigger value="batches">Payment Batches</TabsTrigger>
					<TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
					<TabsTrigger value="history">Payment History</TabsTrigger>
				</TabsList>

				<TabsContent value="batches" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Payment Batches</CardTitle>
									<CardDescription>
										Review and approve payment batches
									</CardDescription>
								</div>
								<div className="flex items-center gap-4">
									<Select defaultValue="all">
										<SelectTrigger className="w-40">
											<SelectValue placeholder="Filter by status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All Batches
											</SelectItem>
											<SelectItem value="pending">
												Pending Approval
											</SelectItem>
											<SelectItem value="approved">
												Approved
											</SelectItem>
											<SelectItem value="processing">
												Processing
											</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="Search batches..."
										className="w-64"
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{selectedBatches.length > 0 && (
									<div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
										<span className="text-sm font-medium">
											{selectedBatches.length} batch(es)
											selected
										</span>
										<Button
											size="sm"
											className="bg-secondary hover:bg-secondary/90"
										>
											Approve Selected
										</Button>
										<Button size="sm" variant="outline">
											Export Selected
										</Button>
									</div>
								)}

								{paymentBatches.map((batch) => (
									<div
										key={batch.id}
										className="p-4 border rounded-lg"
									>
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3">
												<Checkbox
													checked={selectedBatches.includes(
														batch.id,
													)}
													onCheckedChange={(
														checked,
													) =>
														handleBatchSelect(
															batch.id,
															checked as boolean,
														)
													}
													className="mt-1"
												/>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<span className="font-medium text-foreground">
															{batch.id}
														</span>
														<Badge
															className={getStatusColor(
																batch.status,
															)}
														>
															{batch.status}
														</Badge>
													</div>
													<h3 className="font-medium text-foreground">
														{batch.name}
													</h3>
													<div className="flex items-center gap-4 text-sm text-muted-foreground">
														<span className="flex items-center gap-1">
															<DollarSign className="h-3 w-3" />
															₹
															{batch.totalAmount.toLocaleString(
																"en-IN",
															)}
														</span>
														<span>
															{batch.invoiceCount}{" "}
															invoices
														</span>
														<span className="flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															Due:{" "}
															{new Date(
																batch.dueDate,
															).toLocaleDateString()}
														</span>
													</div>
													<div className="text-xs text-muted-foreground">
														Created by{" "}
														{batch.createdBy} •
														Approver:{" "}
														{batch.approver}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
												>
													View Details
												</Button>
												{batch.status ===
													"Ready for Approval" && (
													<Button
														size="sm"
														className="bg-secondary hover:bg-secondary/90"
													>
														Approve
													</Button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="schedule" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Payment Schedule</CardTitle>
									<CardDescription>
										Upcoming payment due dates and schedules
									</CardDescription>
								</div>
								<div className="flex items-center gap-4">
									<Select defaultValue="all">
										<SelectTrigger className="w-40">
											<SelectValue placeholder="Filter by status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All Payments
											</SelectItem>
											<SelectItem value="scheduled">
												Scheduled
											</SelectItem>
											<SelectItem value="pending">
												Pending Approval
											</SelectItem>
											<SelectItem value="draft">
												Draft
											</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="Search vendors..."
										className="w-64"
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{paymentSchedule.map((payment) => (
									<div
										key={payment.id}
										className="p-4 border rounded-lg"
									>
										<div className="flex items-start justify-between">
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<span className="font-medium text-foreground">
														{payment.vendor}
													</span>
													<Badge
														className={getStatusColor(
															payment.status,
														)}
													>
														{payment.status}
													</Badge>
												</div>
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													<span className="flex items-center gap-1">
														<DollarSign className="h-3 w-3" />
														₹
														{payment.amount.toLocaleString(
															"en-IN",
														)}
													</span>
													<span className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														Due:{" "}
														{new Date(
															payment.dueDate,
														).toLocaleDateString()}
													</span>
													<span>
														{payment.paymentMethod}
													</span>
												</div>
												<div className="text-xs text-muted-foreground">
													Invoices:{" "}
													{payment.invoiceNumbers.join(
														", ",
													)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
												>
													View Details
												</Button>
												{payment.status ===
													"Pending Approval" && (
													<Button
														size="sm"
														className="bg-secondary hover:bg-secondary/90"
													>
														Approve
													</Button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Payment History</CardTitle>
									<CardDescription>
										Historical payment records and
										transactions
									</CardDescription>
								</div>
								<div className="flex items-center gap-4">
									<Select defaultValue="all">
										<SelectTrigger className="w-40">
											<SelectValue placeholder="Filter by method" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All Methods
											</SelectItem>
											<SelectItem value="neft">
												NEFT Transfer
											</SelectItem>
											<SelectItem value="rtgs">
												RTGS Transfer
											</SelectItem>
											<SelectItem value="cheque">
												Cheque
											</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="Search payments..."
										className="w-64"
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{paymentHistory.map((payment) => (
									<div
										key={payment.id}
										className="p-4 border rounded-lg"
									>
										<div className="flex items-start justify-between">
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<span className="font-medium text-foreground">
														{payment.vendor}
													</span>
													<Badge
														className={getStatusColor(
															payment.status,
														)}
													>
														{payment.status}
													</Badge>
												</div>
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													<span className="flex items-center gap-1">
														<DollarSign className="h-3 w-3" />
														₹
														{payment.amount.toLocaleString(
															"en-IN",
														)}
													</span>
													<span className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														Paid:{" "}
														{new Date(
															payment.paidDate,
														).toLocaleDateString()}
													</span>
													<span>
														{payment.paymentMethod}
													</span>
													<span>
														Ref: {payment.reference}
													</span>
												</div>
												<div className="text-xs text-muted-foreground">
													Invoices:{" "}
													{payment.invoiceNumbers.join(
														", ",
													)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
												>
													View Receipt
												</Button>
												<Button
													variant="outline"
													size="sm"
												>
													Download
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
