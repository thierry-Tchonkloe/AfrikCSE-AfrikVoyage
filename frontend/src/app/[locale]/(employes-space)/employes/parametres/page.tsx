"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { DateFormat, DATE_FORMATS, TIMEZONES } from "@/lib/date";
import { employeeService } from "@/services/employes/employee.service";
import { authService, UserSession } from "@/services/auth.service";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"employee.parametres">>;

// ── Journal d'activité ──────────────────────────────────────────────────────
type ActivityLogEntry = {
    id: string;
    action: string;
    createdAt: string;
    ipAddress?: string | null;
};

const getActionMeta = (t: Translator): Record<string, { label: string; icon: string }> => ({
    USER_LOGIN: { label: t("accountLogin"), icon: "🔐" },
    USER_LOGOUT: { label: t("logout"), icon: "🚪" },
    USER_PASSWORD_CHANGED: { label: t("passwordChanged"), icon: "🔑" },
    USER_PROFILE_UPDATED: { label: t("profileUpdated"), icon: "✏️" },
});

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

function formatRelativeTime(dateStr: string, t: Translator): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("justNow");
    if (diffMin < 60) return t("minutesAgo", { count: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t("hoursAgo", { count: diffHour });
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return t("daysAgo", { count: diffDay });
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 4) return t("weeksAgo", { count: diffWeek });
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return t("monthsAgo", { count: diffMonth });
    const diffYear = Math.floor(diffDay / 365);
    return t("yearsAgo", { count: diffYear });
}

// ── Sessions actives (appareils connectés) ───────────────────────────────────
function describeSession(userAgent: string | null, t: Translator): { label: string; icon: string } {
    if (!userAgent) return { label: t("unknownDevice"), icon: "💻" };
    const ua = userAgent.toLowerCase();
    const isMobile = /iphone|ipad|android|mobile/.test(ua);

    let browser = t("browser");
    if (ua.includes("edg/")) browser = "Edge";
    else if (ua.includes("chrome")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari")) browser = "Safari";

    let os = "";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac os")) os = "macOS";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
    else if (ua.includes("linux")) os = "Linux";

    return { label: os ? `${browser} · ${os}` : browser, icon: isMobile ? "📱" : "💻" };
}

export default function ParametresPage() {
    const t = useTranslations("employee.parametres");
    const ACTION_META = useMemo(() => getActionMeta(t), [t]);
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
                toast.error(getErrorMessage(err, t("errorLoadingProfile")));
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
            toast.success(t("informationSaved"));
        } catch (err) {
            toast.error(getErrorMessage(err, t("errorWhileSaving")));
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
                toast.error(getErrorMessage(err, t("errorLoadingActivityLog")));
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
            toast.error(getErrorMessage(err, t("errorLoadingActivityLog")));
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

    // Sessions actives (appareils connectés)
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [revokingOthers, setRevokingOthers] = useState(false);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const data = await authService.getSessions();
                setSessions(data.sessions);
            } catch (err) {
                toast.error(getErrorMessage(err, t("errorLoadingSessions")));
            } finally {
                setSessionsLoading(false);
            }
        };
        loadSessions();
    }, []);

    const handleRevokeSession = async (id: string) => {
        setRevokingId(id);
        try {
            await authService.revokeSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            toast.success(t("sessionRevoked"));
        } catch (err) {
            toast.error(getErrorMessage(err, t("errorWhileRevokingSession")));
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeOtherSessions = async () => {
        setRevokingOthers(true);
        try {
            await authService.revokeOtherSessions();
            setSessions((prev) => prev.filter((s) => s.isCurrent));
            toast.success(t("signedOutAllOther"));
        } catch (err) {
            toast.error(getErrorMessage(err, t("errorWhileSigningOut")));
        } finally {
            setRevokingOthers(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPwd || !newPwd || !confirmPwd) {
        toast.error(t("allFieldsRequired"));
        return;
        }
        if (newPwd !== confirmPwd) {
        toast.error(t("passwordsDoNotMatch"));
        return;
        }
        if (newPwd.length < 8) {
        toast.error(t("minimum8Characters"));
        return;
        }
        setSaving(true);
        try {
        await api.patch("/auth/change-password", { currentPassword: currentPwd, newPassword: newPwd });
        toast.success(t("passwordChanged2"));
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (err) {
        toast.error(getErrorMessage(err, t("error")));
        } finally {
        setSaving(false);
        }
    };

    return (
        <div className="space-y-5 px-4">
        <div>
            <h1 className="text-xl font-bold text-gray-900">{t("accountInformation")}</h1>
            <p className="text-sm text-gray-500">{t("manageAccountSecurity")}</p>
        </div>

        {/* Informations de base */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">{t("profileInfos")}</h3>
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
                <label className="block text-xs text-gray-500 mb-1">{t("firstname")}</label>
                <input
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">{t("lastname")}</label>
                <input
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">{t("emailAddress")}</label>
                <input
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 text-gray-500"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">{t("phoneNumber")}</label>
                <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+229 …"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">{t("jobTitle")}</label>
                <input
                    value={profile.jobTitle}
                    onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
                </div>
                <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">{t("department")}</label>
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
                {t("saveChanges")}
                </button>
            </div>
            </>
            )}
        </div>

        {/* Sécurité — Mot de passe */}
        <div id="security" className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
            <h3 className="font-semibold text-gray-900">{t("securitySettings")}</h3>
            <h4 className="text-sm text-gray-600 mt-1">{t("password")}</h4>
            <p className="text-xs text-gray-400">{t("lastChanged3Months")}</p>
            </div>
            <div className="space-y-3">
            <div>
                <label className="block text-xs text-gray-500 mb-1">{t("currentPassword")}</label>
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
                <label className="block text-xs text-gray-500 mb-1">{t("newPassword")}</label>
                <div className="relative">
                <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none pr-9"
                    placeholder={t("min8Characters")}
                />
                <button type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">{t("confirmPassword")}</label>
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
                {t("changePassword")}
            </button>
            </div>

            {/* 2FA */}
            <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-900">{t("twoFactorAuthentication")}</p>
                <p className="text-xs text-gray-400">{t("protectAccount2fa")}</p>
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
                {t("pre2AuthenticationSet")}
                </a>
            )}
            </div>

            {/* Sessions actives */}
            <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-900 mb-3">{t("connectedDevices")}</p>
            {sessionsLoading ? (
                <div className="space-y-2">
                {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
                </div>
            ) : sessions.length === 0 ? (
                <p className="text-xs text-gray-400">{t("noActiveSession")}</p>
            ) : (
                <div className="space-y-2">
                {sessions.map((s) => {
                    const { label, icon } = describeSession(s.userAgent, t);
                    return (
                    <div key={s.id}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                            <p className="text-xs font-medium text-gray-900">{label}</p>
                            <p className="text-xs text-gray-400">
                            {s.ipAddress ? `${s.ipAddress} · ` : ""}{formatRelativeTime(s.lastUsedAt, t)}
                            </p>
                        </div>
                        </div>
                        {s.isCurrent ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ color: "#0f766e", background: "#f0fdf4" }}>
                            {t("device")}
                        </span>
                        ) : (
                        <button
                            onClick={() => handleRevokeSession(s.id)}
                            disabled={revokingId === s.id}
                            className="text-xs text-red-500 hover:underline disabled:opacity-50">
                            {revokingId === s.id ? "…" : t("revoke")}
                        </button>
                        )}
                    </div>
                    );
                })}
                </div>
            )}
            {sessions.some((s) => !s.isCurrent) && (
                <button onClick={handleRevokeOtherSessions} disabled={revokingOthers}
                className="mt-2 w-full py-2 rounded-lg text-white text-xs font-medium bg-red-500 disabled:opacity-50">
                {revokingOthers ? t("signingOut") : t("signOutOtherDevices")}
                </button>
            )}
            <button onClick={logout}
                className="mt-2 w-full py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                {t("signOutDevice")}
            </button>
            </div>
        </div>

        {/* Notifications */}
        <div id="notifications" className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">{t("notificationPreferences")}</h3>
            {[
            { key: "email",         label: t("emailNotifications"),  desc: t("receiveUpdatesViaEmail") },
            { key: "systemUpdates", label: t("systemNotifications"), desc: t("applicationUpdates") },
            { key: "travelAlerts",  label: t("travelAlerts"),        desc: t("getAlertsTrip") },
            { key: "cseUpdates",    label: t("cseUpdates"),          desc: t("notificationsCseBenefits") },
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
            {t("saveNotificationPreferences")}
            </button>
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">{t("preferences")}</h3>
            <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs text-gray-500 mb-1">{t("timeZone")}</label>
                <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">{t("dateFormat")}</label>
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
                <p className="text-sm font-medium text-gray-900">{t("darkMode")}</p>
                <p className="text-xs text-gray-400">{t("switchDarkTheme")}</p>
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
            {t("savePreferences")}
            </button>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">{t("activityLog")}</h3>
            </div>
            {activityLoading ? (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
            ) : activityLog.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noRecentActivity")}</p>
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
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(log.createdAt, t)}</p>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
            {activityPage < activityTotalPages && (
            <button onClick={loadMoreActivity} disabled={activityLoadingMore}
                className="mt-3 text-xs hover:underline disabled:opacity-50" style={{ color: "#0f766e" }}>
                {activityLoadingMore ? t("loading") : t("seeMore")}
            </button>
            )}
        </div>
        </div>
    );
}