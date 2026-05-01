"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";

import {
	SidebarProvider,
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarInset,
	SidebarTrigger,
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	BarChart3,
	FileText,
	Settings,
	Home,
	User,
	CreditCard,
	Building2,
	Mail,
	Shield,
	HelpCircle,
	LogOut,
	ClipboardList,
	BookOpen,
	ChevronRight,
	LayoutGrid,
	Activity,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { getProfileContext } from "@/lib/profile";
import { HOW_IT_WORKS_HUB } from "@/components/how-it-works/chapters";

const workspaceItems = [
	{ name: "Dashboard", href: "/dashboard", icon: Home, match: "exact" as const },
	{ name: "Invoices", href: "/dashboard/invoices", icon: FileText, match: "prefix" as const },
	{
		name: "Live pipeline",
		href: "/dashboard/process-live",
		icon: Activity,
		match: "prefix" as const,
	},
	{
		name: "Gmail inbox",
		href: "/dashboard/gmail",
		icon: Mail,
		match: "prefix" as const,
	},
	{
		name: "Resolution Queue",
		href: "/dashboard/resolution-queue",
		icon: ClipboardList,
		match: "prefix" as const,
	},
	{ name: "Payments Hub", href: "/dashboard/payments", icon: CreditCard, match: "prefix" as const },
	{ name: "Vendors", href: "/dashboard/vendors", icon: Building2, match: "prefix" as const },
	{ name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, match: "prefix" as const },
];

const organizationItems = [
	{ name: "Settings", href: "/dashboard/settings", icon: Settings },
	{ name: "Administration", href: "/dashboard/administration", icon: Shield },
];

const bottomNavigation = [
	{ name: "Help Center", href: "/dashboard/help", icon: HelpCircle },
];

function pathActive(pathname: string, href: string, match: "exact" | "prefix") {
	const n = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	if (match === "exact") return n === href;
	return n === href || n.startsWith(`${href}/`);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();

	const [userName, setUserName] = useState<string>("");
	const [userEmail, setUserEmail] = useState<string>("");
	const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

	const howItWorksActive = pathname === HOW_IT_WORKS_HUB || pathname.startsWith(`${HOW_IT_WORKS_HUB}/`);

	const workspaceOpenDefault = useMemo(
		() =>
			workspaceItems.some((item) => pathActive(pathname, item.href, item.match)),
		[pathname],
	);

	const orgOpenDefault = useMemo(
		() =>
			organizationItems.some(
				(item) =>
					pathname === item.href || pathname.startsWith(`${item.href}/`),
			),
		[pathname],
	);

	const workspaceSectionActive = useMemo(
		() =>
			workspaceItems.some((item) => pathActive(pathname, item.href, item.match)),
		[pathname],
	);

	const orgSectionActive = useMemo(
		() =>
			organizationItems.some(
				(item) =>
					pathname === item.href || pathname.startsWith(`${item.href}/`),
			),
		[pathname],
	);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const ctx = await getProfileContext();
				if (!mounted) return;
				const user = ctx?.user ?? ctx?.profile?.user ?? null;
				if (user) {
					setUserName(user.full_name || user.email || "");
					setUserEmail(user.email || "");
					setAvatarUrl(user.avatar_url);
				}
			} catch (e) {
				// ignore hydration errors; UI will show placeholders
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const handleLogout = async () => {
		try {
			await logout();
		} catch (e) {
			// ignore errors; navigation continues
		}
		router.push("/");
	};

	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<Sidebar>
					<SidebarHeader className="border-b border-sidebar-border">
						<div className="flex items-center gap-3 px-3 py-2">
							<span className="text-lg font-semibold text-sidebar-foreground">
								Invize
							</span>
						</div>
					</SidebarHeader>

					<SidebarContent className="px-2 py-4">
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={howItWorksActive}
									tooltip="How it works"
								>
									<Link
										href={HOW_IT_WORKS_HUB}
										className="flex items-center gap-3"
									>
										<BookOpen className="h-4 w-4" />
										<span>How it works</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<Collapsible
								defaultOpen={workspaceOpenDefault}
								className="group/collapsible"
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton isActive={workspaceSectionActive}>
											<LayoutGrid className="h-4 w-4" />
											<span>Workspace</span>
											<ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{workspaceItems.map((item) => (
												<SidebarMenuSubItem key={item.href}>
													<SidebarMenuSubButton
														asChild
														isActive={pathActive(
															pathname,
															item.href,
															item.match,
														)}
													>
														<Link href={item.href}>
															<item.icon className="h-4 w-4" />
															<span>{item.name}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>

							<Collapsible
								defaultOpen={orgOpenDefault}
								className="group/collapsible"
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton isActive={orgSectionActive}>
											<Settings className="h-4 w-4" />
											<span>Organization</span>
											<ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{organizationItems.map((item) => (
												<SidebarMenuSubItem key={item.href}>
													<SidebarMenuSubButton
														asChild
														isActive={
															pathname === item.href ||
															pathname.startsWith(`${item.href}/`)
														}
													>
														<Link href={item.href}>
															<item.icon className="h-4 w-4" />
															<span>{item.name}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						</SidebarMenu>
					</SidebarContent>

					<SidebarFooter className="border-t border-sidebar-border">
						<div className="px-2 py-2">
							<SidebarMenu>
								{bottomNavigation.map((item) => {
									const isActive =
										pathname === item.href ||
										pathname.startsWith(`${item.href}/`);
									return (
										<SidebarMenuItem key={item.name}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
											>
												<Link
													href={item.href}
													className="flex items-center gap-3"
												>
													<item.icon className="h-4 w-4" />
													<span>{item.name}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</div>

						<div className="flex items-center gap-3 px-3 py-3 border-t border-sidebar-border">
							<Avatar className="h-8 w-8">
								{avatarUrl ? (
									<AvatarImage src={avatarUrl} alt="User" />
								) : (
									<AvatarImage src="" alt="User" />
								)}
								<AvatarFallback className="bg-primary text-primary-foreground">
									{userName ? (
										userName
											.split(" ")
											.map((n) => n[0])
											.join("")
											.slice(0, 2)
											.toUpperCase()
									) : (
										<User className="h-4 w-4" />
									)}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col flex-1">
								<span className="text-sm font-medium text-sidebar-foreground">
									{userName || "User"}
								</span>
								<span className="text-xs text-muted-foreground">
									{userEmail || ""}
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleLogout}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
							>
								<LogOut className="h-4 w-4" />
								<span className="sr-only">Logout</span>
							</Button>
						</div>
					</SidebarFooter>
				</Sidebar>

				<SidebarInset className="flex-1">
					<header className="flex h-16 items-center gap-4 border-b bg-background px-6">
						<SidebarTrigger />
						<div className="flex-1" />
						<ThemeToggle />
					</header>
					<main className="flex-1 p-6">{children}</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
