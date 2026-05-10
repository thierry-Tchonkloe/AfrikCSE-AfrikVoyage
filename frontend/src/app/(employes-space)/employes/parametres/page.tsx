"use client";

import { useState } from "react";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

// Mock activité
const ACTIVITY_LOG = [
    { action: "Login from Chrome on Windows", detail: "192.168.1.1 · Chrome 120", time: "2 hours ago", icon: "🔐" },
    { action: "Password changed",              detail: "Security update",           time: "3 days ago",  icon: "🔑" },
    { action: "Profile information updated",   detail: "Name and phone updated",    time: "1 week ago",  icon: "✏️" },
    { action: "Login from Safari on iPhone",   detail: "192.168.1.2 · Safari",     time: "2 weeks ago", icon: "📱" },
];

export default function ParametresPage() {
    const { user, logout } = useAuth();
    const [saving, setSaving] = useState(false);

    // Sécurité
    const [currentPwd, setCurrentPwd]   = useState("");
    const [newPwd, setNewPwd]           = useState("");
    const [confirmPwd, setConfirmPwd]   = useState("");
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd]   = useState(false);

    // Notifications
    const [notifSettings, setNotifSettings] = useState({
        emailNotifs:  true,
        pushNotifs:   false,
        travelAlerts: true,
        cseUpdates:   true,
    });

    // Préférences
    const [prefs, setPrefs] = useState({
        language: "English",
        currency: "USD - US Dollar",
        timezone: "EST - Eastern Standard Time",
        dateFormat: "MM/DD/YY",
        darkMode: false,
    });

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
        } catch (err: any) {
        toast.error(err.response?.data?.message ?? "Erreur");
        } finally {
        setSaving(false);
        }
    };

    const handleSavePrefs = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        toast.success("Préférences enregistrées");
    };

    return (
        <div className="max-w-3xl space-y-5">
        <div>
            <h1 className="text-xl font-bold text-gray-900">Account Information</h1>
            <p className="text-sm text-gray-500">Gérez votre compte, sécurité et préférences</p>
        </div>

        {/* Informations de base */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Profile Infos</h3>
            <div className="grid grid-cols-2 gap-3">
            {[
                { label: "Firstname",     value: user?.firstName ?? "" },
                { label: "Lastname",      value: user?.lastName  ?? "" },
                { label: "Email address", value: user?.email     ?? "", colSpan: true },
                { label: "Phone Number",  value: "+1 (555) 123-4587" },
                { label: "Job Title",     value: "HR Manager" },
                { label: "Department",    value: "Human Resources", colSpan: true },
            ].map((f) => (
                <div key={f.label} className={f.colSpan ? "col-span-2" : ""}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input defaultValue={f.value}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
            ))}
            </div>
            <div className="flex justify-end">
            <button
                onClick={() => toast.success("Informations sauvegardées")}
                className="px-5 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                Save Changes
            </button>
            </div>
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
                    style={{ transform: twoFA ? "translateX(20px)" : "translateX(2px)" }} />
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
            { key: "emailNotifs",  label: "Email Notifications",  desc: "Receive updates via email" },
            { key: "pushNotifs",   label: "Push Notifications",   desc: "Browser push notifications" },
            { key: "travelAlerts", label: "Travel Alerts",        desc: "Get alerts for your trip" },
            { key: "cseUpdates",   label: "CSE Updates",          desc: "Notifications on CSE benefits" },
            ].map((s) => (
            <div key={s.key} className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
                <button
                onClick={() => setNotifSettings((prev) => ({
                    ...prev,
                    [s.key]: !prev[s.key as keyof typeof prev],
                }))}
                className="relative w-9 h-5 rounded-full transition-colors"
                style={{
                    background: notifSettings[s.key as keyof typeof notifSettings]
                    ? "#0f766e" : "#d1d5db",
                }}
                >
                <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{
                    transform: notifSettings[s.key as keyof typeof notifSettings]
                        ? "translateX(16px)" : "translateX(2px)",
                    }}
                />
                </button>
            </div>
            ))}
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Preferences</h3>
            <div className="grid grid-cols-2 gap-3">
            {[
                { key: "language",   label: "Language", opts: ["English", "Français", "Português"] },
                { key: "currency",   label: "Currency", opts: ["USD - US Dollar", "EUR - Euro", "XOF - Franc CFA"] },
                { key: "timezone",   label: "Timezone", opts: ["EST - Eastern Standard Time", "WAT - West Africa Time", "CET - Central European Time"] },
                { key: "dateFormat", label: "Date Format", opts: ["MM/DD/YY", "DD/MM/YY", "YYYY-MM-DD"] },
            ].map((f) => (
                <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <select
                    value={prefs[f.key as keyof typeof prefs] as string}
                    onChange={(e) => setPrefs({ ...prefs, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                >
                    {f.opts.map((o) => <option key={o}>{o}</option>)}
                </select>
                </div>
            ))}
            </div>
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                <p className="text-xs text-gray-400">Switch to dark theme</p>
            </div>
            <button
                onClick={() => setPrefs({ ...prefs, darkMode: !prefs.darkMode })}
                className="relative w-9 h-5 rounded-full transition-colors"
                style={{ background: prefs.darkMode ? "#0f766e" : "#d1d5db" }}
            >
                <span
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: prefs.darkMode ? "translateX(16px)" : "translateX(2px)" }}
                />
            </button>
            </div>
            <button onClick={handleSavePrefs} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Preferences
            </button>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Activity Log</h3>
            </div>
            <div className="space-y-3">
            {ACTIVITY_LOG.map((log) => (
                <div key={log.action}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-lg shrink-0">{log.icon}</span>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">{log.detail}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{log.time}</p>
                </div>
                </div>
            ))}
            </div>
            <button className="mt-3 text-xs hover:underline" style={{ color: "#0f766e" }}>
            View Full Activity Log
            </button>
        </div>
        </div>
    );
}