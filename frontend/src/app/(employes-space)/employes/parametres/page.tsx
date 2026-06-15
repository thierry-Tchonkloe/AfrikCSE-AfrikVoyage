"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { DateFormat, DATE_FORMATS, TIMEZONES } from "@/lib/date";
import { employeeService } from "@/services/employes/employee.service";

// ── Journal d'activité ──────────────────────────────────────────────────────
type ActivityLogEntry = {
    id: string;
    action: string;
    createdAt: string;
    ipAddress?: string | null;
};

const ACTION_META: Record<string, { label: string; icon: string }> = {
    USER_LOGIN: { label: "Connexion au compte", icon: "🔐" },
    USER_LOGOUT: { label: "Déconnexion", icon: "🚪" },
    USER_PASSWORD_CHANGED: { label: "Mot de passe modifié", icon: "🔑" },
    USER_PROFILE_UPDATED: { label: "Profil mis à jour", icon: "✏️" },
};

// ── Préférences de notification ──────────────────────────────────────────────
type NotificationPreferences = {
    email: boolean;
    travelAlerts: boolean;
    cseUpdates: boolean;
    systemUpdates: boolean;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    email: true,
    travelAlerts: true,
    cseUpdates: true,
    systemUpdates: true,
};

function formatRelativeTime(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `Il y a ${diffHour} h`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `Il y a ${diffDay} j`;
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 4) return `Il y a ${diffWeek} sem.`;
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `Il y a ${diffMonth} mois`;
    const diffYear = Math.floor(diffDay / 365);
    return `Il y a ${diffYear} an${diffYear > 1 ? "s" : ""}`;
}

export default function ParametresPage() {
    const { logout } = useAuth();
    const { darkMode, setDarkMode } = useTheme();
    const [saving, setSaving] = useState(false);

    // Profil
    const [profileLoading, setProfileLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        department: "",
        timezone: "Africa/Lome",
        dateFormat: "DD/MM/YYYY" as DateFormat,
        notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await employeeService.getProfile();
                setProfile({
                    firstName: data.firstName ?? "",
                    lastName: data.lastName ?? "",
                    email: data.email ?? "",
                    phone: data.phone ?? "",
                    jobTitle: data.jobTitle ?? "",
                    department: data.department ?? "",
                    timezone: data.timezone ?? "Africa/Lome",
                    dateFormat: (data.dateFormat ?? "DD/MM/YYYY") as DateFormat,
                    notificationPreferences: {
                        ...DEFAULT_NOTIFICATION_PREFERENCES,
                        ...(data.notificationPreferences ?? {}),
                    },
                });
            } catch (err) {
                toast.error(getErrorMessage(err, "Erreur lors du chargement du profil"));
            } finally {
                setProfileLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await employeeService.updateProfile({
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                jobTitle: profile.jobTitle,
                department: profile.department,
                timezone: profile.timezone,
                dateFormat: profile.dateFormat,
                notificationPreferences: profile.notificationPreferences,
            });
            toast.success("Informations sauvegardées");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'enregistrement"));
        } finally {
            setSavingProfile(false);
        }
    };

    // Journal d'activité
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityLoadingMore, setActivityLoadingMore] = useState(false);
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotalPages, setActivityTotalPages] = useState(1);

    useEffect(() => {
        const loadActivity = async () => {
            try {
                const data = await employeeService.getActivityLog(1);
                setActivityLog(data.logs);
                setActivityPage(data.page);
                setActivityTotalPages(data.totalPages);
            } catch (err) {
                toast.error(getErrorMessage(err, "Erreur lors du chargement du journal d'activité"));
            } finally {
                setActivityLoading(false);
            }
        };
        loadActivity();
    }, []);

    const loadMoreActivity = async () => {
        setActivityLoadingMore(true);
        try {
            const data = await employeeService.getActivityLog(activityPage + 1);
            setActivityLog((prev) => [...prev, ...data.logs]);
            setActivityPage(data.page);
            setActivityTotalPages(data.totalPages);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors du chargement du journal d'activité"));
        } finally {
            setActivityLoadingMore(false);
        }
    };

    // Sécurité
    const [currentPwd, setCurrentPwd]   = useState("");
    const [newPwd, setNewPwd]           = useState("");
    const [confirmPwd, setConfirmPwd]   = useState("");
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd]   = useState(false);

    // 2FA
    const [twoFA, setTwoFA] = useState(true);

    // Sessions actives (mock)
    const sessions = [
        { device: "Chrome on Windows", location: "Lagos, Nigeria",   time: "Now",         active: true },
        { device: "Safari on iPhone",  location: "Lagos, Nigeria",   time: "1 hour ago",  active: false },
    ];

    const handleChangePassword = async () => {
        if (!currentPwd || !newPwd || !confirmPwd) {
        toast.error("Tous les champs sont requis");
        return;
        }
        if (newPwd !== confirmPwd) {
        toast.error("Les mots de passe ne correspondent pas");
        return;
        }
        if (newPwd.length < 8) {
        toast.error("Minimum 8 caractères");
        return;
        }
        setSaving(true);
        try {
        await api.patch("/auth/change-password", { currentPassword: currentPwd, newPassword: newPwd });
        toast.success("Mot de passe modifié !");
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setSaving(false);
        }
    };

    return (
        <div className="space-y-5 px-4">
        <div>
            <h1 className="text-xl font-bold text-gray-900">Account Information</h1>
            <p className="text-sm text-gray-500">Gérez votre compte, sécurité et préférences</p>
        </div>

        {/* Informations de base */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Profile Infos</h3>
            {profileLoading ? (
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                ))}
            </div>
            ) : (
            <>
            <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="block text-xs text-gray-500 mb-1">Firstname</label>
                <input
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">Lastname</label>
                <input
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Email address</label>
                <input
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 text-gray-500"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+229 …"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">Job Title</label>
                <input
                    value={profile.jobTitle}
                    onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Department</label>
                <input
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
            </div>
            <div className="flex justify-end">
                <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-70"
                style={{ background: "#0f766e" }}
                >
                {savingProfile && <Loader2 size={14} className="animate-spin" />}
                Save Changes
                </button>
            </div>
            </>
            )}
        </div>

        {/* Sécurité — Mot de passe */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
            <h3 className="font-semibold text-gray-900">Security Settings</h3>
            <h4 className="text-sm text-gray-600 mt-1">Password</h4>
            <p className="text-xs text-gray-400">Last changed 3 months ago</p>
            </div>
            <div className="space-y-3">
            <div>
                <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                <div className="relative">
                <input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none pr-9"
                    placeholder="••••••••"
                />
                <button type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrentPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">New Password</label>
                <div className="relative">
                <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none pr-9"
                    placeholder="Min. 8 caractères"
                />
                <button type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
                <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="••••••••"
                />
            </div>
            <button onClick={handleChangePassword} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                Change Password
            </button>
            </div>

            {/* 2FA */}
            <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-xs text-gray-400">Protect your account with 2FA</p>
                </div>
                <button onClick={() => setTwoFA(!twoFA)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: twoFA ? "#0f766e" : "#d1d5db" }}>
                <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: twoFA ? "translateX(0px)" : "translateX(-20px)" }} />
                </button>
            </div>
            {twoFA && (
                <a href="#" className="text-xs mt-1 hover:underline" style={{ color: "#0f766e" }}>
                Pre-2 authentication set up
                </a>
            )}
            </div>

            {/* Sessions actives */}
            <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-900 mb-3">Active Sessions</p>
            <div className="space-y-2">
                {sessions.map((s) => (
                <div key={s.device}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                    <span className="text-lg">{s.device.includes("iPhone") ? "📱" : "💻"}</span>
                    <div>
                        <p className="text-xs font-medium text-gray-900">{s.device}</p>
                        <p className="text-xs text-gray-400">{s.location} · {s.time}</p>
                    </div>
                    </div>
                    {s.active ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: "#0f766e", background: "#f0fdf4" }}>
                        NOW
                    </span>
                    ) : (
                    <button className="text-xs text-red-500 hover:underline">Revoke</button>
                    )}
                </div>
                ))}
            </div>
            <button onClick={logout}
                className="mt-2 w-full py-2 rounded-lg text-white text-xs font-medium bg-red-500">
                Logout from all devices
            </button>
            </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
            {[
            { key: "email",         label: "Email Notifications",  desc: "Receive updates via email" },
            { key: "systemUpdates", label: "Notifications système", desc: "Mises à jour de l'application" },
            { key: "travelAlerts",  label: "Travel Alerts",        desc: "Get alerts for your trip" },
            { key: "cseUpdates",    label: "CSE Updates",          desc: "Notifications on CSE benefits" },
            ].map((s) => (
            <div key={s.key} className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
                <button
                onClick={() => setProfile((prev) => ({
                    ...prev,
                    notificationPreferences: {
                        ...prev.notificationPreferences,
                        [s.key]: !prev.notificationPreferences[s.key as keyof NotificationPreferences],
                    },
                }))}
                className="relative w-9 h-5 rounded-full transition-colors"
                style={{
                    background: profile.notificationPreferences[s.key as keyof NotificationPreferences]
                    ? "#0f766e" : "#d1d5db",
                }}
                >
                <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{
                    transform: profile.notificationPreferences[s.key as keyof NotificationPreferences]
                        ? "translateX(0px)" : "translateX(-16px)",
                    }}
                />
                </button>
            </div>
            ))}
            <button onClick={handleSaveProfile} disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}>
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            Save Notification Preferences
            </button>
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Preferences</h3>
            <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs text-gray-500 mb-1">Fuseau horaire</label>
                <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">Format de date</label>
                <select
                value={profile.dateFormat}
                onChange={(e) => setProfile({ ...profile, dateFormat: e.target.value as DateFormat })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                >
                {DATE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>
            </div>
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                <p className="text-xs text-gray-400">Switch to dark theme</p>
            </div>
            <button
                onClick={() => setDarkMode(!darkMode)}
                className="relative w-9 h-5 rounded-full transition-colors"
                style={{ background: darkMode ? "#0f766e" : "#d1d5db" }}
            >
                <span
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: darkMode ? "translateX(0px)" : "translateX(-16px)" }}
                />
            </button>
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}>
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            Save Preferences
            </button>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Activity Log</h3>
            </div>
            {activityLoading ? (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
            ) : activityLog.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune activité récente</p>
            ) : (
            <div className="space-y-3">
                {activityLog.map((log) => {
                const meta = ACTION_META[log.action] ?? { label: log.action, icon: "📋" };
                return (
                    <div key={log.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                        {log.ipAddress && <p className="text-xs text-gray-500">IP : {log.ipAddress}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
            {activityPage < activityTotalPages && (
            <button onClick={loadMoreActivity} disabled={activityLoadingMore}
                className="mt-3 text-xs hover:underline disabled:opacity-50" style={{ color: "#0f766e" }}>
                {activityLoadingMore ? "Chargement…" : "Voir plus"}
            </button>
            )}
        </div>
        </div>
    );
}