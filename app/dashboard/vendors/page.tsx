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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Building2,
	Mail,
	Phone,
	MapPin,
	DollarSign,
	FileText,
	Star,
	Plus,
	Search,
	TrendingUp,
	Calendar,
	Loader2,
} from "lucide-react";
import { listVendors, type VendorSummary } from "@/lib/documents";

const mockVendorsFallback = [
	{
		id: "V-001",
		name: "Tata Consultancy Services",
		email: "billing@tcs.com",
		phone: "+91 22 6778 9595",
		address: "TCS House, Raveline Street, Fort, Mumbai 400001",
		status: "Active",
		rating: 4.8,
		totalSpent: 10487500.0,
		invoiceCount: 23,
		lastInvoice: "2024-01-15",
		paymentTerms: "Net 30",
		category: "Technology",
	},
	{
		id: "V-002",
		name: "Infosys Limited",
		email: "accounts@infosys.com",
		phone: "+91 80 2852 0261",
		address: "Electronics City, Hosur Road, Bangalore 560100",
		status: "Active",
		rating: 4.6,
		totalSpent: 3776000.0,
		invoiceCount: 67,
		lastInvoice: "2024-01-14",
		paymentTerms: "Net 15",
		category: "IT Services",
	},
	{
		id: "V-003",
		name: "Wipro Technologies",
		email: "finance@wipro.com",
		phone: "+91 80 2844 0011",
		address: "Doddakannelli, Sarjapur Road, Bangalore 560035",
		status: "Active",
		rating: 4.4,
		totalSpent: 7462500.0,
		invoiceCount: 12,
		lastInvoice: "2024-01-10",
		paymentTerms: "Net 45",
		category: "Software Development",
	},
	{
		id: "V-004",
		name: "HCL Technologies",
		email: "billing@hcltech.com",
		phone: "+91 120 4175000",
		address: "HCL Campus, Sector 126, Noida 201303",
		status: "Active",
		rating: 4.3,
		totalSpent: 5234000.0,
		invoiceCount: 18,
		lastInvoice: "2024-01-12",
		paymentTerms: "Net 30",
		category: "Technology",
	},
	{
		id: "V-005",
		name: "Tech Mahindra",
		email: "accounts@techmahindra.com",
		phone: "+91 40 3061 4000",
		address: "Rajiv Gandhi Salai, Sholinganallur, Chennai 600119",
		status: "Pending",
		rating: 4.2,
		totalSpent: 2987500.0,
		invoiceCount: 8,
		lastInvoice: "2024-01-08",
		paymentTerms: "Net 30",
		category: "Digital Services",
	},
];

export default function VendorsPage() {
	const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
	const [vendorsFromApi, setVendorsFromApi] = useState<VendorSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchVendor, setSearchVendor] = useState("");

	useEffect(() => {
		let cancelled = false;
		listVendors()
			.then((r) => {
				if (!cancelled) setVendorsFromApi(r.vendors ?? []);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const vendors =
		vendorsFromApi.length > 0
			? vendorsFromApi.map((v, i) => ({
					id: `V-${String(i + 1).padStart(3, "0")}`,
					name: v.name,
					email: "",
					phone: "",
					address: "",
					status: "Active" as const,
					rating: 0,
					totalSpent: v.total,
					invoiceCount: v.invoice_count,
					lastInvoice: "",
					paymentTerms: "",
					category: "",
				}))
			: mockVendorsFallback;

	const performanceData = [
		{
			vendor: "Tata Consultancy Services",
			onTimeDelivery: 96.5,
			qualityScore: 4.8,
			responseTime: "2.3 hours",
			invoicesProcessed: 156,
			avgProcessingTime: "1.2 days",
		},
		{
			vendor: "Infosys Limited",
			onTimeDelivery: 94.2,
			qualityScore: 4.6,
			responseTime: "3.1 hours",
			invoicesProcessed: 142,
			avgProcessingTime: "1.5 days",
		},
		{
			vendor: "Wipro Technologies",
			onTimeDelivery: 92.8,
			qualityScore: 4.4,
			responseTime: "2.8 hours",
			invoicesProcessed: 98,
			avgProcessingTime: "1.8 days",
		},
		{
			vendor: "HCL Technologies",
			onTimeDelivery: 91.5,
			qualityScore: 4.3,
			responseTime: "3.5 hours",
			invoicesProcessed: 87,
			avgProcessingTime: "2.1 days",
		},
	];

	const contractData = [
		{
			vendor: "Tata Consultancy Services",
			contractId: "TCS-2024-001",
			startDate: "2024-01-01",
			endDate: "2024-12-31",
			value: "₹1.2 Cr",
			status: "Active",
			renewalDate: "2024-10-01",
		},
		{
			vendor: "Infosys Limited",
			contractId: "INFY-2024-002",
			startDate: "2023-07-01",
			endDate: "2025-06-30",
			value: "₹85 L",
			status: "Active",
			renewalDate: "2025-04-01",
		},
		{
			vendor: "Wipro Technologies",
			contractId: "WIP-2024-003",
			startDate: "2024-03-01",
			endDate: "2025-02-28",
			value: "₹95 L",
			status: "Under Review",
			renewalDate: "2024-12-01",
		},
	];

	const onboardingData = [
		{
			vendor: "Mindtree Limited",
			stage: "Documentation Review",
			progress: 75,
			assignedTo: "Priya Sharma",
			expectedCompletion: "2024-01-20",
			status: "In Progress",
		},
		{
			vendor: "Mphasis Corporation",
			stage: "Compliance Check",
			progress: 45,
			assignedTo: "Rajesh Kumar",
			expectedCompletion: "2024-01-25",
			status: "In Progress",
		},
		{
			vendor: "L&T Infotech",
			stage: "Contract Negotiation",
			progress: 90,
			assignedTo: "Anita Patel",
			expectedCompletion: "2024-01-18",
			status: "Almost Complete",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Active":
				return "bg-secondary text-secondary-foreground";
			case "Pending":
				return "bg-warning text-warning-foreground";
			case "Inactive":
				return "bg-muted text-muted-foreground";
			case "Under Review":
				return "bg-blue-100 text-blue-800";
			case "In Progress":
				return "bg-amber-100 text-amber-800";
			case "Almost Complete":
				return "bg-green-100 text-green-800";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	const getRatingStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, i) => (
			<Star
				key={i}
				className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground"}`}
			/>
		));
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Vendor Management
					</h1>
					<p className="text-muted-foreground">
						{vendorsFromApi.length > 0
							? "Suppliers from processed documents (backend). Other tabs are placeholders."
							: "Manage vendor relationships and information"}
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Button variant="outline">
						<Search className="h-4 w-4 mr-2" />
						Advanced Search
					</Button>
					<Button className="bg-secondary hover:bg-secondary/90">
						<Plus className="h-4 w-4 mr-2" />
						Add Vendor
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Vendors
						</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{loading && !vendorsFromApi.length
								? "—"
								: vendors.length}
						</div>
						<p className="text-xs text-muted-foreground">
							{vendorsFromApi.length
								? "From documents"
								: "Sample data"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Invoices
						</CardTitle>
						<Building2 className="h-4 w-4 text-secondary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{loading && !vendorsFromApi.length
								? "—"
								: vendors.reduce(
										(a, v) => a + (v.invoiceCount ?? 0),
										0,
									)}
						</div>
						<p className="text-xs text-muted-foreground">
							Across vendors
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Spend
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{loading && !vendorsFromApi.length
								? "—"
								: `₹${(vendors.reduce((a, v) => a + (v.totalSpent ?? 0), 0) / 100000).toFixed(1)}L`}
						</div>
						<p className="text-xs text-muted-foreground">
							From documents
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Source
						</CardTitle>
						<Star className="h-4 w-4 text-warning" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{vendorsFromApi.length ? "Backend" : "Demo"}
						</div>
						<p className="text-xs text-muted-foreground">
							Vendor list
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="directory" className="w-full">
				<TabsList>
					<TabsTrigger value="directory">
						Vendor Directory
					</TabsTrigger>
					<TabsTrigger value="performance">Performance</TabsTrigger>
					<TabsTrigger value="contracts">Contracts</TabsTrigger>
					<TabsTrigger value="onboarding">Onboarding</TabsTrigger>
				</TabsList>

				<TabsContent value="directory" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Vendor Directory</CardTitle>
									<CardDescription>
										Browse and manage your vendor database
									</CardDescription>
								</div>
								<div className="flex items-center gap-4">
									<Select defaultValue="all">
										<SelectTrigger className="w-40">
											<SelectValue placeholder="Filter by status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All Vendors
											</SelectItem>
											<SelectItem value="active">
												Active
											</SelectItem>
											<SelectItem value="pending">
												Pending
											</SelectItem>
											<SelectItem value="inactive">
												Inactive
											</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="Search vendors..."
										className="w-64"
										value={searchVendor}
										onChange={(e) =>
											setSearchVendor(e.target.value)
										}
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{loading && vendorsFromApi.length === 0 ? (
								<div className="flex justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : (
								<div className="space-y-4">
									{vendors
										.filter(
											(v) =>
												!searchVendor ||
												v.name
													.toLowerCase()
													.includes(
														searchVendor.toLowerCase(),
													),
										)
										.map((vendor) => (
											<div
												key={vendor.id}
												className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
													selectedVendor === vendor.id
														? "border-primary bg-muted/30"
														: "border-border"
												}`}
												onClick={() =>
													setSelectedVendor(vendor.id)
												}
											>
												<div className="flex items-start justify-between">
													<div className="flex items-start gap-4">
														<Avatar className="h-12 w-12">
															<AvatarImage
																src={`/abstract-geometric-shapes.png?height=48&width=48&query=${vendor.name}`}
															/>
															<AvatarFallback>
																{vendor.name
																	.split(" ")
																	.map(
																		(n) =>
																			n[0],
																	)
																	.join("")}
															</AvatarFallback>
														</Avatar>
														<div className="space-y-2">
															<div className="flex items-center gap-2">
																<h3 className="font-medium text-foreground">
																	{
																		vendor.name
																	}
																</h3>
																<Badge
																	className={getStatusColor(
																		vendor.status,
																	)}
																>
																	{
																		vendor.status
																	}
																</Badge>
																<Badge variant="outline">
																	{
																		vendor.category
																	}
																</Badge>
															</div>
															<div className="flex items-center gap-1">
																{getRatingStars(
																	vendor.rating,
																)}
																<span className="text-sm text-muted-foreground ml-1">
																	{
																		vendor.rating
																	}
																</span>
															</div>
															<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
																<div className="flex items-center gap-1">
																	<Mail className="h-3 w-3" />
																	{
																		vendor.email
																	}
																</div>
																<div className="flex items-center gap-1">
																	<Phone className="h-3 w-3" />
																	{
																		vendor.phone
																	}
																</div>
																<div className="flex items-center gap-1">
																	<MapPin className="h-3 w-3" />
																	{
																		vendor.address
																	}
																</div>
																<div className="flex items-center gap-1">
																	<DollarSign className="h-3 w-3" />
																	₹
																	{(
																		vendor.totalSpent /
																		100000
																	).toFixed(
																		1,
																	)}
																	L total
																</div>
															</div>
															<div className="flex items-center gap-4 text-xs text-muted-foreground">
																<span>
																	{
																		vendor.invoiceCount
																	}{" "}
																	invoices
																</span>
																<span>
																	Last
																	invoice:{" "}
																	{new Date(
																		vendor.lastInvoice,
																	).toLocaleDateString()}
																</span>
																<span>
																	Terms:{" "}
																	{
																		vendor.paymentTerms
																	}
																</span>
															</div>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Button
															variant="outline"
															size="sm"
														>
															View Profile
														</Button>
														<Button
															size="sm"
															className="bg-secondary hover:bg-secondary/90"
														>
															Contact
														</Button>
													</div>
												</div>
											</div>
										))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Vendor Performance Analytics</CardTitle>
							<CardDescription>
								Track vendor performance metrics and KPIs
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Vendor</TableHead>
											<TableHead>
												On-Time Delivery
											</TableHead>
											<TableHead>Quality Score</TableHead>
											<TableHead>Response Time</TableHead>
											<TableHead>
												Invoices Processed
											</TableHead>
											<TableHead>
												Avg Processing Time
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{performanceData.map((vendor) => (
											<TableRow key={vendor.vendor}>
												<TableCell className="font-medium">
													{vendor.vendor}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<div className="w-16 bg-muted rounded-full h-2">
															<div
																className="bg-secondary h-2 rounded-full"
																style={{
																	width: `${vendor.onTimeDelivery}%`,
																}}
															/>
														</div>
														<span className="text-sm">
															{
																vendor.onTimeDelivery
															}
															%
														</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1">
														{getRatingStars(
															vendor.qualityScore,
														)}
														<span className="text-sm ml-1">
															{
																vendor.qualityScore
															}
														</span>
													</div>
												</TableCell>
												<TableCell>
													{vendor.responseTime}
												</TableCell>
												<TableCell className="font-semibold">
													{vendor.invoicesProcessed}
												</TableCell>
												<TableCell>
													{vendor.avgProcessingTime}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="contracts" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Contract Management</CardTitle>
							<CardDescription>
								Manage vendor contracts and agreements
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Vendor</TableHead>
											<TableHead>Contract ID</TableHead>
											<TableHead>Start Date</TableHead>
											<TableHead>End Date</TableHead>
											<TableHead>Value</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Renewal Date</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{contractData.map((contract) => (
											<TableRow key={contract.contractId}>
												<TableCell className="font-medium">
													{contract.vendor}
												</TableCell>
												<TableCell className="font-mono text-sm">
													{contract.contractId}
												</TableCell>
												<TableCell>
													{new Date(
														contract.startDate,
													).toLocaleDateString()}
												</TableCell>
												<TableCell>
													{new Date(
														contract.endDate,
													).toLocaleDateString()}
												</TableCell>
												<TableCell className="font-semibold">
													{contract.value}
												</TableCell>
												<TableCell>
													<Badge
														className={getStatusColor(
															contract.status,
														)}
													>
														{contract.status}
													</Badge>
												</TableCell>
												<TableCell>
													{new Date(
														contract.renewalDate,
													).toLocaleDateString()}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Button
															variant="outline"
															size="sm"
														>
															<FileText className="h-4 w-4 mr-1" />
															View
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="onboarding" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Vendor Onboarding Pipeline</CardTitle>
							<CardDescription>
								Track new vendor onboarding progress
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{onboardingData.map((item, index) => (
									<div
										key={index}
										className="p-4 border rounded-lg"
									>
										<div className="flex items-start justify-between mb-3">
											<div>
												<h3 className="font-medium text-foreground">
													{item.vendor}
												</h3>
												<p className="text-sm text-muted-foreground">
													Current Stage: {item.stage}
												</p>
											</div>
											<Badge
												className={getStatusColor(
													item.status,
												)}
											>
												{item.status}
											</Badge>
										</div>

										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span>Progress</span>
												<span>{item.progress}%</span>
											</div>
											<div className="w-full bg-muted rounded-full h-2">
												<div
													className="bg-secondary h-2 rounded-full transition-all duration-300"
													style={{
														width: `${item.progress}%`,
													}}
												/>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4 mt-3 text-sm text-muted-foreground">
											<div className="flex items-center gap-1">
												<span className="font-medium">
													Assigned to:
												</span>{" "}
												{item.assignedTo}
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												<span className="font-medium">
													Expected:
												</span>{" "}
												{new Date(
													item.expectedCompletion,
												).toLocaleDateString()}
											</div>
										</div>

										<div className="flex items-center gap-2 mt-3">
											<Button variant="outline" size="sm">
												<TrendingUp className="h-4 w-4 mr-1" />
												Update Progress
											</Button>
											<Button variant="outline" size="sm">
												View Details
											</Button>
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
