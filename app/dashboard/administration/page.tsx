"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
	Users, Settings, Brain, Shield, Plus, Edit, Trash2,
	RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
	Save, Search, Filter, ChevronLeft, ChevronRight, FileText,
	Activity, UserCheck, UserX, Lock
} from "lucide-react"
import { firstZodMessage, inviteEmailSchema } from "@/lib/validation"
import {
	getAdminStats,
	getAdminUsers,
	updateAdminUser,
	deactivateAdminUser,
	inviteAdminUser,
	getSystemSettings,
	bulkUpdateSettings,
	getAuditLog,
	getAllSecurityEvents,
	type AdminUser,
	type AdminStats,
	type SystemSetting,
	type AuditLogEntry,
	type SecurityEventEntry,
} from "@/lib/admin"

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = { type: "success" | "error"; message: string } | null

function useToast() {
	const [toast, setToast] = useState<ToastType>(null)
	const show = useCallback((type: "success" | "error", message: string) => {
		setToast({ type, message })
		setTimeout(() => setToast(null), 4000)
	}, [])
	return { toast, show }
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({ toast }: { toast: ToastType }) {
	if (!toast) return null
	return (
		<div
			className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 ${toast.type === "success"
					? "bg-emerald-600 text-white"
					: "bg-red-600 text-white"
				}`}
		>
			{toast.type === "success" ? (
				<CheckCircle2 className="h-4 w-4 shrink-0" />
			) : (
				<XCircle className="h-4 w-4 shrink-0" />
			)}
			{toast.message}
		</div>
	)
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
	title,
	value,
	sub,
	icon: Icon,
	color = "text-muted-foreground",
	loading,
}: {
	title: string
	value: string | number
	sub?: string
	icon: React.ElementType
	color?: string
	loading?: boolean
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className={`h-4 w-4 ${color}`} />
			</CardHeader>
			<CardContent>
				{loading ? (
					<>
						<Skeleton className="h-8 w-16 mb-1" />
						<Skeleton className="h-3 w-24" />
					</>
				) : (
					<>
						<div className="text-2xl font-bold">{value}</div>
						{sub && <p className="text-xs text-muted-foreground">{sub}</p>}
					</>
				)}
			</CardContent>
		</Card>
	)
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteUserModal({
	open,
	onClose,
	onInvited,
}: {
	open: boolean
	onClose: () => void
	onInvited: () => void
}) {
	const { toast, show } = useToast()
	const [email, setEmail] = useState("")
	const [fullName, setFullName] = useState("")
	const [role, setRole] = useState("viewer")
	const [loading, setLoading] = useState(false)

	const ROLES = ["admin", "finance_manager", "ap_specialist", "accountant", "viewer"]

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const checked = inviteEmailSchema.safeParse({ email })
		if (!checked.success) {
			show("error", firstZodMessage(checked.error))
			return
		}
		setLoading(true)
		try {
			await inviteAdminUser({
				email: checked.data.email,
				full_name: fullName.trim() || undefined,
				roles: [role],
			})
			show("success", `Invitation sent to ${email}`)
			setEmail("")
			setFullName("")
			setRole("viewer")
			onInvited()
			onClose()
		} catch (err: any) {
			show("error", err.message || "Invite failed")
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<Toast toast={toast} />
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Invite Team Member</DialogTitle>
						<DialogDescription>
							They will receive an email to set up their account.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="invite-email">Email address *</Label>
							<Input
								id="invite-email"
								type="email"
								placeholder="user@company.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="invite-name">Full name</Label>
							<Input
								id="invite-name"
								placeholder="Jane Smith"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="invite-role">Role</Label>
							<Select value={role} onValueChange={setRole}>
								<SelectTrigger id="invite-role">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ROLES.map((r) => (
										<SelectItem key={r} value={r}>
											{r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || !email}>
								{loading ? (
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Plus className="h-4 w-4 mr-2" />
								)}
								Send Invite
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({
	user,
	open,
	onClose,
	onSaved,
}: {
	user: AdminUser | null
	open: boolean
	onClose: () => void
	onSaved: () => void
}) {
	const { toast, show } = useToast()
	const [fullName, setFullName] = useState("")
	const [roles, setRoles] = useState("")
	const [permissions, setPermissions] = useState("")
	const [isActive, setIsActive] = useState(true)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (user) {
			setFullName(user.full_name || "")
			setRoles(user.roles.join(", "))
			setPermissions(user.permissions.join(", "))
			setIsActive(user.is_active)
		}
	}, [user])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		setLoading(true)
		try {
			await updateAdminUser(user.id, {
				full_name: fullName || undefined,
				roles: roles.split(",").map((r) => r.trim()).filter(Boolean),
				permissions: permissions.split(",").map((p) => p.trim()).filter(Boolean),
				is_active: isActive,
			})
			show("success", "User updated successfully")
			onSaved()
			onClose()
		} catch (err: any) {
			show("error", err.message || "Update failed")
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<Toast toast={toast} />
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
						<DialogDescription>
							{user?.email}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Full name</Label>
							<Input
								id="edit-name"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								placeholder="Full name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-roles">Roles (comma-separated)</Label>
							<Input
								id="edit-roles"
								value={roles}
								onChange={(e) => setRoles(e.target.value)}
								placeholder="admin, finance_manager"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-perms">Permissions (comma-separated)</Label>
							<Input
								id="edit-perms"
								value={permissions}
								onChange={(e) => setPermissions(e.target.value)}
								placeholder="Invoice Processing, Payment Approval"
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Account Active</Label>
								<p className="text-xs text-muted-foreground">
									Inactive users cannot log in
								</p>
							</div>
							<Switch
								checked={isActive}
								onCheckedChange={setIsActive}
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? (
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Save className="h-4 w-4 mr-2" />
								)}
								Save Changes
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}

// ─── User Management Tab ──────────────────────────────────────────────────────

function UserManagementTab({
	stats,
	statsLoading,
}: {
	stats: AdminStats | null
	statsLoading: boolean
}) {
	const { toast, show } = useToast()
	const [users, setUsers] = useState<AdminUser[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState("")
	const [roleFilter, setRoleFilter] = useState("all")
	const [inviteOpen, setInviteOpen] = useState(false)
	const [editUser, setEditUser] = useState<AdminUser | null>(null)
	const [editOpen, setEditOpen] = useState(false)
	const [deactivating, setDeactivating] = useState<string | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const data = await getAdminUsers()
			setUsers(data)
		} catch (err: any) {
			show("error", err.message || "Failed to load users")
		} finally {
			setLoading(false)
		}
	}, [show])

	useEffect(() => { load() }, [load])

	const handleDeactivate = async (user: AdminUser) => {
		if (!confirm(`Deactivate ${user.email}? They will no longer be able to log in.`)) return
		setDeactivating(user.id)
		try {
			await deactivateAdminUser(user.id)
			show("success", `${user.email} has been deactivated`)
			load()
		} catch (err: any) {
			show("error", err.message || "Deactivation failed")
		} finally {
			setDeactivating(null)
		}
	}

	const filtered = users.filter((u) => {
		const matchSearch =
			!search ||
			u.email.toLowerCase().includes(search.toLowerCase()) ||
			(u.full_name || "").toLowerCase().includes(search.toLowerCase())
		const matchRole =
			roleFilter === "all" || u.roles.some((r) => r.toLowerCase().includes(roleFilter.toLowerCase()))
		return matchSearch && matchRole
	})

	const getStatusBadge = (user: AdminUser) => {
		if (!user.is_active) return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Inactive</Badge>
		if (!user.is_verified) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
		return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
	}

	const initials = (user: AdminUser) =>
		(user.full_name || user.email)
			.split(" ")
			.map((n) => n[0])
			.join("")
			.slice(0, 2)
			.toUpperCase()

	return (
		<>
			<Toast toast={toast} />
			<InviteUserModal
				open={inviteOpen}
				onClose={() => setInviteOpen(false)}
				onInvited={load}
			/>
			<EditUserModal
				user={editUser}
				open={editOpen}
				onClose={() => setEditOpen(false)}
				onSaved={load}
			/>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<StatCard title="Total Users" value={stats?.total_users ?? "—"} sub={`${stats?.verified_users ?? "—"} verified`} icon={Users} loading={statsLoading} />
				<StatCard title="Active Users" value={stats?.active_users ?? "—"} sub="Currently active" icon={UserCheck} color="text-emerald-500" loading={statsLoading} />
				<StatCard title="Inactive Users" value={stats?.inactive_users ?? "—"} sub="Deactivated accounts" icon={UserX} color="text-red-400" loading={statsLoading} />
				<StatCard title="Security Events" value={stats?.total_security_events ?? "—"} sub="Total recorded" icon={Shield} color="text-amber-500" loading={statsLoading} />
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<CardTitle>Team Members</CardTitle>
							<CardDescription>Manage user accounts, roles, and permissions</CardDescription>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									placeholder="Search users..."
									className="pl-9 w-52 h-9"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
							<Select value={roleFilter} onValueChange={setRoleFilter}>
								<SelectTrigger className="w-36 h-9">
									<Filter className="h-3.5 w-3.5 mr-2" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="manager">Manager</SelectItem>
									<SelectItem value="specialist">Specialist</SelectItem>
									<SelectItem value="viewer">Viewer</SelectItem>
								</SelectContent>
							</Select>
							<Button onClick={load} variant="outline" size="sm" className="h-9 w-9 p-0">
								<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							</Button>
							<Button
								onClick={() => setInviteOpen(true)}
								size="sm"
								className="h-9 bg-primary hover:bg-primary/90"
							>
								<Plus className="h-4 w-4 mr-2" />
								Invite User
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
									<Skeleton className="h-12 w-12 rounded-full" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-64" />
									</div>
								</div>
							))}
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">
							<Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
							<p className="font-medium">No users found</p>
							<p className="text-sm mt-1">Try adjusting your search or filter</p>
						</div>
					) : (
						<div className="space-y-3">
							{filtered.map((user) => (
								<div
									key={user.id}
									className={`p-4 border rounded-xl transition-colors hover:bg-muted/30 ${!user.is_active ? "opacity-60" : ""}`}
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-start gap-4 min-w-0">
											<Avatar className="h-11 w-11 shrink-0">
												{user.avatar_url && <AvatarImage src={user.avatar_url} />}
												<AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
													{initials(user)}
												</AvatarFallback>
											</Avatar>
											<div className="space-y-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<h3 className="font-semibold text-foreground leading-none">
														{user.full_name || "—"}
													</h3>
													{getStatusBadge(user)}
													{user.is_verified && (
														<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
													)}
												</div>
												<p className="text-sm text-muted-foreground">{user.email}</p>
												<div className="flex flex-wrap gap-1 mt-2">
													{user.roles.map((r) => (
														<Badge key={r} variant="outline" className="text-xs h-5">
															{r.replace(/_/g, " ")}
														</Badge>
													))}
													{user.permissions.slice(0, 3).map((p) => (
														<Badge key={p} variant="secondary" className="text-xs h-5">
															{p}
														</Badge>
													))}
													{user.permissions.length > 3 && (
														<Badge variant="secondary" className="text-xs h-5">
															+{user.permissions.length - 3}
														</Badge>
													)}
												</div>
												{user.last_login_at && (
													<p className="text-xs text-muted-foreground">
														Last login: {new Date(user.last_login_at).toLocaleString()}
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<Button
												variant="outline"
												size="sm"
												onClick={() => { setEditUser(user); setEditOpen(true) }}
											>
												<Edit className="h-3.5 w-3.5 mr-1" />
												Edit
											</Button>
											{user.is_active && (
												<Button
													variant="outline"
													size="sm"
													className="text-red-600 hover:text-red-700 hover:border-red-300"
													onClick={() => handleDeactivate(user)}
													disabled={deactivating === user.id}
												>
													{deactivating === user.id ? (
														<RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
													) : (
														<Trash2 className="h-3.5 w-3.5 mr-1" />
													)}
													Deactivate
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</>
	)
}

// ─── System Settings Tab ──────────────────────────────────────────────────────

const SETTING_META: Record<string, { label: string; description: string; type: "toggle" | "select" | "number"; options?: string[] }> = {
	auto_approve_threshold: { label: "Auto-approve threshold ($)", description: "Automatically approve invoices below this amount", type: "number" },
	email_notifications: { label: "Email notifications", description: "Send email alerts for important events", type: "toggle" },
	dual_approval_threshold: { label: "Dual approval threshold ($)", description: "Require two approvers for payments above this amount", type: "number" },
	ai_confidence_threshold: { label: "AI confidence threshold (%)", description: "Minimum confidence score for auto-processing", type: "select", options: ["70", "75", "80", "85", "90", "95"] },
	ip_whitelist_enabled: { label: "IP whitelist", description: "Restrict access to approved IP addresses", type: "toggle" },
	audit_logging: { label: "Audit logging", description: "Log all user actions and system events", type: "toggle" },
	max_invoice_upload_size_mb: { label: "Max upload size (MB)", description: "Maximum allowed invoice file size", type: "number" },
	invoice_retention_days: { label: "Invoice retention (days)", description: "How long to keep processed invoice data", type: "number" },
}

function SystemSettingsTab() {
	const { toast, show } = useToast()
	const [settings, setSettings] = useState<Record<string, string>>({})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const data = await getSystemSettings()
			const map: Record<string, string> = {}
			data.forEach((s) => { map[s.key] = s.value })
			setSettings(map)
		} catch (err: any) {
			show("error", err.message || "Failed to load settings")
		} finally {
			setLoading(false)
		}
	}, [show])

	useEffect(() => { load() }, [load])

	const handleSave = async () => {
		setSaving(true)
		try {
			await bulkUpdateSettings(settings)
			show("success", "Settings saved successfully")
		} catch (err: any) {
			show("error", err.message || "Save failed")
		} finally {
			setSaving(false)
		}
	}

	const update = (key: string, value: string) => {
		setSettings((prev) => ({ ...prev, [key]: value }))
	}

	return (
		<>
			<Toast toast={toast} />
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>System Configuration</CardTitle>
							<CardDescription>Configure system-wide settings and workflow preferences</CardDescription>
						</div>
						<Button onClick={handleSave} disabled={saving || loading}>
							{saving ? (
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Save className="h-4 w-4 mr-2" />
							)}
							Save All Settings
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="space-y-4">
							{[...Array(6)].map((_, i) => (
								<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
									<div className="space-y-1">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-72" />
									</div>
									<Skeleton className="h-8 w-24" />
								</div>
							))}
						</div>
					) : (
						<div className="space-y-3">
							{Object.entries(SETTING_META).map(([key, meta]) => {
								const value = settings[key] ?? ""
								return (
									<div key={key} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/20 transition-colors">
										<div className="space-y-0.5">
											<Label className="text-sm font-medium">{meta.label}</Label>
											<p className="text-xs text-muted-foreground">{meta.description}</p>
										</div>
										{meta.type === "toggle" ? (
											<Switch
												checked={value === "true"}
												onCheckedChange={(v) => update(key, v ? "true" : "false")}
											/>
										) : meta.type === "select" ? (
											<Select value={value} onValueChange={(v) => update(key, v)}>
												<SelectTrigger className="w-24">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{meta.options?.map((o) => (
														<SelectItem key={o} value={o}>{o}%</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<Input
												type="number"
												className="w-28 text-right"
												value={value}
												onChange={(e) => update(key, e.target.value)}
											/>
										)}
									</div>
								)
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</>
	)
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
	const { toast, show } = useToast()
	const [events, setEvents] = useState<SecurityEventEntry[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(0)
	const PAGE_SIZE = 20

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const data = await getAllSecurityEvents({ limit: PAGE_SIZE, skip: page * PAGE_SIZE })
			setEvents(data.events)
			setTotal(data.total)
		} catch (err: any) {
			show("error", err.message || "Failed to load security events")
		} finally {
			setLoading(false)
		}
	}, [page, show])

	useEffect(() => { load() }, [load])

	const eventColor = (type: string) => {
		if (type.includes("success") || type.includes("login")) return "bg-emerald-500"
		if (type.includes("reuse") || type.includes("detect")) return "bg-amber-500"
		if (type.includes("fail") || type.includes("invalid")) return "bg-red-500"
		return "bg-muted-foreground"
	}

	const eventIcon = (type: string) => {
		if (type.includes("success")) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
		if (type.includes("reuse") || type.includes("detect")) return <AlertTriangle className="h-4 w-4 text-amber-500" />
		if (type.includes("fail")) return <XCircle className="h-4 w-4 text-red-500" />
		return <Activity className="h-4 w-4 text-muted-foreground" />
	}

	const totalPages = Math.ceil(total / PAGE_SIZE)

	return (
		<>
			<Toast toast={toast} />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Events</CardTitle>
						<Activity className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{loading ? "—" : total}</div>
						<p className="text-xs text-muted-foreground">Security events recorded</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">IP Whitelist</CardTitle>
						<Lock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Off</div>
						<p className="text-xs text-muted-foreground">All IPs allowed</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Audit Logging</CardTitle>
						<Shield className="h-4 w-4 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Enabled</div>
						<p className="text-xs text-muted-foreground">All events tracked</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Security Events</CardTitle>
							<CardDescription>Authentication and security activity log</CardDescription>
						</div>
						<Button variant="outline" size="sm" onClick={load} disabled={loading}>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="flex gap-4 p-3 border rounded-lg">
									<Skeleton className="h-4 w-4 rounded-full mt-1 shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-32" />
									</div>
								</div>
							))}
						</div>
					) : events.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">
							<Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
							<p>No security events recorded</p>
						</div>
					) : (
						<>
							<div className="space-y-2">
								{events.map((evt) => (
									<div key={evt.id} className="flex items-start gap-4 p-3 border rounded-xl hover:bg-muted/20 transition-colors">
										<div className="shrink-0 mt-0.5">{eventIcon(evt.type)}</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<p className="font-medium text-sm capitalize">
													{evt.type.replace(/_/g, " ")}
												</p>
												<span className="text-xs text-muted-foreground shrink-0">
													{new Date(evt.created_at).toLocaleString()}
												</span>
											</div>
											{evt.message && (
												<p className="text-xs text-muted-foreground mt-0.5">{evt.message}</p>
											)}
											<p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
												uid: {evt.user_id.slice(0, 12)}…
											</p>
										</div>
									</div>
								))}
							</div>

							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-4 pt-4 border-t">
									<span className="text-sm text-muted-foreground">
										Page {page + 1} of {totalPages}
									</span>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(0, p - 1))}
											disabled={page === 0}
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
											disabled={page >= totalPages - 1}
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</>
	)
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditLogTab() {
	const { toast, show } = useToast()
	const [entries, setEntries] = useState<AuditLogEntry[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(0)
	const [jobFilter, setJobFilter] = useState("")
	const PAGE_SIZE = 30

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const data = await getAuditLog({
				limit: PAGE_SIZE,
				skip: page * PAGE_SIZE,
				job_id: jobFilter || undefined,
			})
			setEntries(data.entries)
			setTotal(data.total)
		} catch (err: any) {
			show("error", err.message || "Failed to load audit log")
		} finally {
			setLoading(false)
		}
	}, [page, jobFilter, show])

	useEffect(() => { load() }, [load])

	const totalPages = Math.ceil(total / PAGE_SIZE)

	const stageColor = (stage?: string) => {
		if (!stage) return "bg-muted text-muted-foreground"
		const s = stage.toLowerCase()
		if (s.includes("extract")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
		if (s.includes("match") || s.includes("po")) return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
		if (s.includes("approv")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
		if (s.includes("error") || s.includes("fail")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
		return "bg-muted text-muted-foreground"
	}

	return (
		<>
			<Toast toast={toast} />
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<CardTitle>Audit Log</CardTitle>
							<CardDescription>System event trail for compliance and debugging</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									placeholder="Filter by Job ID..."
									className="pl-9 w-48 h-9"
									value={jobFilter}
									onChange={(e) => { setJobFilter(e.target.value); setPage(0) }}
								/>
							</div>
							<Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load} disabled={loading}>
								<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-lg border overflow-hidden">
						<div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2.5 border-b">
							<span className="mr-6">Timestamp</span>
							<span>Action</span>
							<span className="mr-6">Stage</span>
							<span>Job ID</span>
						</div>
						{loading ? (
							<div className="divide-y">
								{[...Array(6)].map((_, i) => (
									<div key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-0 px-4 py-3">
										<Skeleton className="h-3 w-32 mr-6" />
										<Skeleton className="h-3 w-48" />
										<Skeleton className="h-5 w-20 mr-6" />
										<Skeleton className="h-3 w-24" />
									</div>
								))}
							</div>
						) : entries.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
								<p>No audit events found</p>
								{jobFilter && <p className="text-sm mt-1">Try clearing the Job ID filter</p>}
							</div>
						) : (
							<div className="divide-y">
								{entries.map((entry) => (
									<div key={entry.id} className="grid grid-cols-[180px_1fr_auto_auto] gap-0 items-center px-4 py-2.5 hover:bg-muted/20 text-sm">
										<span className="text-xs text-muted-foreground font-mono mr-4">
											{new Date(entry.created_at).toLocaleString()}
										</span>
										<span className="font-medium truncate">{entry.action}</span>
										<span className="mr-4">
											{entry.stage && (
												<Badge className={`text-xs h-5 ${stageColor(entry.stage)}`}>
													{entry.stage}
												</Badge>
											)}
										</span>
										<span className="text-xs text-muted-foreground font-mono">
											{entry.job_id ? entry.job_id.slice(0, 12) + "…" : "—"}
										</span>
									</div>
								))}
							</div>
						)}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-4">
							<span className="text-sm text-muted-foreground">
								{total} events total · Page {page + 1} of {totalPages}
							</span>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	)
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdministrationPage() {
	const [stats, setStats] = useState<AdminStats | null>(null)
	const [statsLoading, setStatsLoading] = useState(true)

	useEffect(() => {
		let mounted = true
			; (async () => {
				try {
					const s = await getAdminStats()
					if (mounted) setStats(s)
				} catch {
					// silently ignore — tab-level errors are handled separately
				} finally {
					if (mounted) setStatsLoading(false)
				}
			})()
		return () => { mounted = false }
	}, [])

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Administration</h1>
					<p className="text-muted-foreground mt-1">
						Manage users, permissions, system settings, and security
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
						System Online
					</Badge>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="users" className="w-full">
				<TabsList className="h-10">
					<TabsTrigger value="users" className="gap-2">
						<Users className="h-4 w-4" />
						Users
					</TabsTrigger>
					<TabsTrigger value="system" className="gap-2">
						<Settings className="h-4 w-4" />
						Settings
					</TabsTrigger>
					<TabsTrigger value="security" className="gap-2">
						<Shield className="h-4 w-4" />
						Security
					</TabsTrigger>
					<TabsTrigger value="audit" className="gap-2">
						<FileText className="h-4 w-4" />
						Audit Log
					</TabsTrigger>
				</TabsList>

				<TabsContent value="users" className="space-y-4 mt-6">
					<UserManagementTab stats={stats} statsLoading={statsLoading} />
				</TabsContent>

				<TabsContent value="system" className="space-y-4 mt-6">
					<SystemSettingsTab />
				</TabsContent>

				<TabsContent value="security" className="space-y-4 mt-6">
					<SecurityTab />
				</TabsContent>

				<TabsContent value="audit" className="space-y-4 mt-6">
					<AuditLogTab />
				</TabsContent>
			</Tabs>
		</div>
	)
}
