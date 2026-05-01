"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getProfileContext, updateMe, updatePreferences } from "@/lib/profile";
import { getTeam, inviteUser, type TeamMember } from "@/lib/users";
import { firstZodMessage, inviteEmailSchema } from "@/lib/validation";
import {
	getIntegrations,
	setERPType,
	type IntegrationItem,
} from "@/lib/integrations";
import {
	disconnectGmail,
	getGmailStatus,
	scanGmailInbox,
	startGmailOAuth,
	type GmailStatus,
} from "@/lib/gmail";
import { Database, Mail } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState("profile");
	const [profileData, setProfileData] = useState({
		name: "",
		email: "",
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [preferences, setPreferences] = useState({
		theme: "system" as "light" | "dark" | "system",
		density: "comfortable" as "comfortable" | "compact",
		locale: "",
		time_zone: "",
		notifications_email: true,
		notifications_push: true,
	});
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPreferences, setSavingPreferences] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [teamLoading, setTeamLoading] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteName, setInviteName] = useState("");
	const [inviting, setInviting] = useState(false);
	const [integrationsList, setIntegrationsList] = useState<IntegrationItem[]>(
		[],
	);
	const [integrationsLoading, setIntegrationsLoading] = useState(false);
	const [settingERP, setSettingERP] = useState<string | null>(null);
	const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
	const [gmailBusy, setGmailBusy] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		if (params.get("tab") === "integrations") setActiveTab("integrations");
		if (params.get("gmail") === "connected")
			setSuccess(
				"Gmail connected. Open Gmail inbox under the dashboard to scan and view results.",
			);
		if (params.get("gmail") === "error")
			setError(
				decodeURIComponent(params.get("message") || "") ||
					"Gmail connection failed.",
			);
	}, []);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setError(null);
				const ctx = await getProfileContext();
				if (!mounted) return;
				const user = ctx?.user ?? (ctx as any)?.profile?.user;
				const prefs =
					ctx?.preferences ?? (ctx as any)?.profile?.preferences;
				if (user) {
					setProfileData((prev) => ({
						...prev,
						name: user.full_name ?? "",
						email: user.email ?? "",
					}));
				}
				if (prefs) {
					setPreferences({
						theme: (prefs.theme ?? "system") as
							| "light"
							| "dark"
							| "system",
						density: (prefs.density ?? "comfortable") as
							| "comfortable"
							| "compact",
						locale: prefs.locale ?? "",
						time_zone: prefs.time_zone ?? "",
						notifications_email: Boolean(prefs.notifications_email),
						notifications_push: Boolean(prefs.notifications_push),
					});
				}
			} catch (e: any) {
				setError(
					e?.message ??
						"Failed to load profile. Sign in to manage settings.",
				);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const handleProfileUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setSavingProfile(true);
		setError(null);
		setSuccess(null);
		try {
			await updateMe({
				full_name: profileData.name,
				locale: preferences.locale || undefined,
				time_zone: preferences.time_zone || undefined,
			});
			setSuccess("Profile updated.");
		} catch (e: any) {
			setError(e?.message ?? "Failed to update profile");
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePreferencesUpdate = async () => {
		setSavingPreferences(true);
		setError(null);
		setSuccess(null);
		try {
			await updatePreferences({
				theme: preferences.theme,
				density: preferences.density,
				locale: preferences.locale || undefined,
				time_zone: preferences.time_zone || undefined,
				notifications: {
					email: preferences.notifications_email,
					push: preferences.notifications_push,
				},
			});
			setSuccess("Preferences saved.");
		} catch (e: any) {
			setError(e?.message ?? "Failed to update preferences");
		} finally {
			setSavingPreferences(false);
		}
	};

	const fetchTeam = async () => {
		setTeamLoading(true);
		try {
			const list = await getTeam();
			setTeamMembers(list);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to load team");
		} finally {
			setTeamLoading(false);
		}
	};

	const fetchIntegrations = async () => {
		setIntegrationsLoading(true);
		try {
			const res = await getIntegrations();
			setIntegrationsList(res.integrations ?? []);
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Failed to load integrations",
			);
		} finally {
			setIntegrationsLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === "users") fetchTeam();
	}, [activeTab]);

	const fetchGmail = async () => {
		setGmailBusy(true);
		try {
			const st = await getGmailStatus();
			setGmailStatus(st);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Gmail load failed");
		} finally {
			setGmailBusy(false);
		}
	};

	useEffect(() => {
		if (activeTab === "integrations") {
			fetchIntegrations();
			fetchGmail();
		}
	}, [activeTab]);

	const handleInviteUser = async () => {
		const checked = inviteEmailSchema.safeParse({ email: inviteEmail });
		if (!checked.success) {
			setError(firstZodMessage(checked.error));
			return;
		}
		setInviting(true);
		setError(null);
		setSuccess(null);
		try {
			await inviteUser({
				email: checked.data.email,
				full_name: inviteName.trim() || undefined,
			});
			setSuccess(
				"User invited. They can sign in once they set a password.",
			);
			setInviteEmail("");
			setInviteName("");
			fetchTeam();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Invite failed");
		} finally {
			setInviting(false);
		}
	};

	const handleGmailConnect = async () => {
		setGmailBusy(true);
		setError(null);
		setSuccess(null);
		try {
			const { authorization_url } = await startGmailOAuth();
			window.location.href = authorization_url;
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Gmail OAuth start failed");
			setGmailBusy(false);
		}
	};

	const handleGmailDisconnect = async () => {
		setGmailBusy(true);
		setError(null);
		setSuccess(null);
		try {
			await disconnectGmail();
			setSuccess("Gmail disconnected.");
			await fetchGmail();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Disconnect failed");
		} finally {
			setGmailBusy(false);
		}
	};

	const handleGmailScan = async () => {
		setGmailBusy(true);
		setError(null);
		setSuccess(null);
		try {
			const r = await scanGmailInbox();
			setSuccess(
				`${r.message || "Scan queued."} Results appear on the Gmail inbox page.`,
			);
			window.setTimeout(() => {
				void fetchGmail();
			}, 4000);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Scan failed");
		} finally {
			setGmailBusy(false);
		}
	};

	const handleConnectIntegration = async (integration: IntegrationItem) => {
		if (!integration.type) return;
		setSettingERP(integration.id);
		setError(null);
		setSuccess(null);
		try {
			await setERPType(integration.type);
			setSuccess(
				`ERP set to ${integration.name}. Matching agent will use this on next run.`,
			);
			fetchIntegrations();
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Failed to set integration",
			);
		} finally {
			setSettingERP(null);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">Settings</h1>
				<p className="text-muted-foreground">
					Manage your account and application preferences
				</p>
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

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-6"
			>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="integrations">Integrations</TabsTrigger>
				</TabsList>

				{/* Profile Tab */}
				<TabsContent value="profile" className="space-y-6">
					{loading ? (
						<Card>
							<CardContent className="py-8 text-center text-muted-foreground">
								Loading profile…
							</CardContent>
						</Card>
					) : (
						<>
							<Card>
								<CardHeader>
									<CardTitle>Profile Information</CardTitle>
									<CardDescription>
										Update your personal information and
										account settings
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form
										onSubmit={handleProfileUpdate}
										className="space-y-4"
									>
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="name">
													Full Name
												</Label>
												<Input
													id="name"
													value={profileData.name}
													onChange={(e) =>
														setProfileData({
															...profileData,
															name: e.target
																.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="email">
													Email Address
												</Label>
												<Input
													id="email"
													type="email"
													value={profileData.email}
													disabled
												/>
											</div>
										</div>

										<Separator />

										<div className="space-y-4">
											<h3 className="text-lg font-medium">
												Change Password
											</h3>
											<div className="grid gap-4 md:grid-cols-3">
												<div className="space-y-2">
													<Label htmlFor="currentPassword">
														Current Password
													</Label>
													<Input
														id="currentPassword"
														type="password"
														value={
															profileData.currentPassword
														}
														onChange={(e) =>
															setProfileData({
																...profileData,
																currentPassword:
																	e.target
																		.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="newPassword">
														New Password
													</Label>
													<Input
														id="newPassword"
														type="password"
														value={
															profileData.newPassword
														}
														onChange={(e) =>
															setProfileData({
																...profileData,
																newPassword:
																	e.target
																		.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="confirmPassword">
														Confirm Password
													</Label>
													<Input
														id="confirmPassword"
														type="password"
														value={
															profileData.confirmPassword
														}
														onChange={(e) =>
															setProfileData({
																...profileData,
																confirmPassword:
																	e.target
																		.value,
															})
														}
													/>
												</div>
											</div>
										</div>

										<div className="flex items-center justify-end">
											<Button
												type="submit"
												className="bg-primary hover:bg-primary/90"
												disabled={savingProfile}
											>
												{savingProfile
													? "Saving..."
													: "Save Changes"}
											</Button>
										</div>
									</form>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Preferences</CardTitle>
									<CardDescription>
										Theme, density, locale, and
										notifications
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="theme">Theme</Label>
											<Select
												value={preferences.theme}
												onValueChange={(v) =>
													setPreferences((p) => ({
														...p,
														theme: v as any,
													}))
												}
											>
												<SelectTrigger
													id="theme"
													className="w-full"
												>
													<SelectValue placeholder="Select theme" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="system">
														System
													</SelectItem>
													<SelectItem value="light">
														Light
													</SelectItem>
													<SelectItem value="dark">
														Dark
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="density">
												Density
											</Label>
											<Select
												value={preferences.density}
												onValueChange={(v) =>
													setPreferences((p) => ({
														...p,
														density: v as any,
													}))
												}
											>
												<SelectTrigger
													id="density"
													className="w-full"
												>
													<SelectValue placeholder="Select density" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="comfortable">
														Comfortable
													</SelectItem>
													<SelectItem value="compact">
														Compact
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="locale">
												Locale
											</Label>
											<Input
												id="locale"
												value={preferences.locale}
												onChange={(e) =>
													setPreferences((p) => ({
														...p,
														locale: e.target.value,
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="time_zone">
												Time Zone
											</Label>
											<Input
												id="time_zone"
												value={preferences.time_zone}
												onChange={(e) =>
													setPreferences((p) => ({
														...p,
														time_zone:
															e.target.value,
													}))
												}
											/>
										</div>
									</div>

									<Separator />

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="space-y-0.5">
												<Label className="text-base">
													Email notifications
												</Label>
												<div className="text-sm text-muted-foreground">
													Send email alerts for
													important events
												</div>
											</div>
											<Switch
												checked={
													preferences.notifications_email
												}
												onCheckedChange={(v) =>
													setPreferences((p) => ({
														...p,
														notifications_email: v,
													}))
												}
											/>
										</div>

										<div className="flex items-center justify-between">
											<div className="space-y-0.5">
												<Label className="text-base">
													Push notifications
												</Label>
												<div className="text-sm text-muted-foreground">
													Enable push notifications
												</div>
											</div>
											<Switch
												checked={
													preferences.notifications_push
												}
												onCheckedChange={(v) =>
													setPreferences((p) => ({
														...p,
														notifications_push: v,
													}))
												}
											/>
										</div>
									</div>

									<div className="flex items-center justify-end">
										<Button
											onClick={handlePreferencesUpdate}
											className="bg-primary hover:bg-primary/90"
											disabled={savingPreferences}
										>
											{savingPreferences
												? "Saving..."
												: "Save Preferences"}
										</Button>
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</TabsContent>

				{/* Users Tab */}
				<TabsContent value="users" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Team Members</CardTitle>
							<CardDescription>
								Manage user access and permissions
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex flex-wrap items-end gap-4">
								<div className="space-y-2">
									<Label htmlFor="invite-email">Email</Label>
									<Input
										id="invite-email"
										type="email"
										placeholder="colleague@example.com"
										value={inviteEmail}
										onChange={(e) =>
											setInviteEmail(e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="invite-name">
										Name (optional)
									</Label>
									<Input
										id="invite-name"
										placeholder="Full name"
										value={inviteName}
										onChange={(e) =>
											setInviteName(e.target.value)
										}
									/>
								</div>
								<Button
									onClick={handleInviteUser}
									className="bg-primary hover:bg-primary/90"
									disabled={inviting}
								>
									{inviting ? "Inviting..." : "Invite"}
								</Button>
							</div>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Roles</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{teamLoading ? (
											<TableRow>
												<TableCell
													colSpan={3}
													className="text-muted-foreground text-center py-8"
												>
													Loading...
												</TableCell>
											</TableRow>
										) : (
											teamMembers.map((member) => (
												<TableRow key={member.id}>
													<TableCell className="font-medium">
														{member.full_name ||
															"—"}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{member.email}
													</TableCell>
													<TableCell>
														{member.roles?.length
															? member.roles.map(
																	(r) => (
																		<Badge
																			key={
																				r
																			}
																			variant="outline"
																			className="mr-1"
																		>
																			{r}
																		</Badge>
																	),
																)
															: "—"}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Integrations Tab */}
				<TabsContent value="integrations" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>ERP Integrations</CardTitle>
							<CardDescription>
								Choose your ERP (SAP, Tally, Demo, or Stub) for
								invoice matching
							</CardDescription>
						</CardHeader>
						<CardContent>
							{integrationsLoading ? (
								<p className="text-muted-foreground text-center py-8">
									Loading...
								</p>
							) : (
								<div className="grid gap-6 md:grid-cols-2">
									{integrationsList.map((integration) => (
										<Card
											key={integration.id}
											className="relative"
										>
											<CardHeader className="flex flex-row items-center space-y-0 pb-2">
												<div className="flex items-center gap-3">
													<div className="rounded-lg bg-muted p-2">
														<Database className="h-5 w-5" />
													</div>
													<div>
														<CardTitle className="text-base">
															{integration.name}
														</CardTitle>
														<CardDescription className="text-sm">
															{
																integration.description
															}
														</CardDescription>
													</div>
												</div>
												{integration.connected && (
													<div className="absolute top-4 right-4">
														<div className="h-2 w-2 rounded-full bg-green-500" />
													</div>
												)}
											</CardHeader>
											<CardContent className="pt-2">
												<div className="flex items-center justify-between">
													<Badge
														variant={
															integration.connected
																? "default"
																: "secondary"
														}
													>
														{integration.connected
															? "Connected"
															: "Not Connected"}
													</Badge>
													<Button
														variant={
															integration.connected
																? "outline"
																: "default"
														}
														size="sm"
														disabled={
															settingERP !== null
														}
														onClick={() =>
															handleConnectIntegration(
																integration,
															)
														}
														className={
															integration.connected
																? ""
																: "bg-primary hover:bg-primary/90"
														}
													>
														{settingERP ===
														integration.id
															? "Setting..."
															: integration.connected
																? "Manage"
																: "Connect"}
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Gmail inbox</CardTitle>
							<CardDescription>
								Classify mail with Swarms, ingest logs, and run the
								document pipeline on invoice attachments. Manage
								everything on the Gmail inbox page.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap items-center gap-3">
								<div className="rounded-lg bg-muted p-2">
									<Mail className="h-5 w-5" />
								</div>
								<div className="flex-1 min-w-[200px]">
									<p className="text-sm font-medium">
										{gmailStatus?.connected
											? `Connected: ${gmailStatus.google_email ?? "Gmail"}`
											: "Not connected"}
									</p>
									{gmailStatus?.last_sync_at && (
										<p className="text-xs text-muted-foreground">
											Last scan:{" "}
											{new Date(
												gmailStatus.last_sync_at,
											).toLocaleString()}
										</p>
									)}
								</div>
								<div className="flex flex-wrap gap-2">
									<Button asChild variant="default" size="sm">
										<Link href="/dashboard/gmail">
											Open Gmail inbox
										</Link>
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled={gmailBusy}
										onClick={() => void handleGmailConnect()}
									>
										{gmailStatus?.connected
											? "Reconnect"
											: "Connect Google"}
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled={
											gmailBusy || !gmailStatus?.connected
										}
										onClick={() => void handleGmailScan()}
									>
										Scan now
									</Button>
									<Button
										size="sm"
										variant="ghost"
										disabled={
											gmailBusy || !gmailStatus?.connected
										}
										onClick={() => void handleGmailDisconnect()}
									>
										Disconnect
									</Button>
								</div>
							</div>

							{gmailBusy && (
								<p className="text-sm text-muted-foreground">
									Working…
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
