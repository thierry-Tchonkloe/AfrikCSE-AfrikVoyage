"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Save } from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { applyTheme } from "@/lib/theme";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Settings {
    primaryColor: string;
    secondaryColor: string;
    darkModeEnabled: boolean;
    manualValidation: boolean;
    autoRegistration: boolean;
    defaultHasCSE: boolean;
    defaultHasVoyage: boolean;
    notifyOnValidation: boolean;
    notifyOnRejection: boolean;
    notifyWelcome: boolean;
}

interface DashboardStats {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    totalUsers: number;
}

// Ces 4 réglages sont exposés dans l'UI mais n'ont aucun effet sur le backend
// à ce jour (comportements standardisés en dur dans le code) — cf. audit
// Vague 2/3. Affichés avec un badge pour ne pas induire l'admin en erreur.
const FIXED_SETTINGS = new Set<keyof Settings>([
    "manualValidation", "autoRegistration", "defaultHasCSE", "defaultHasVoyage",
]);

export default function SettingsPage() {
    const tr = useTranslations("admin.settings");
    const t = useTranslations("admin.settings");
    const router = useRouter();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [changed, setChanged]   = useState(false);
    const [stats, setStats]       = useState<DashboardStats | null>(null);

    useEffect(() => {
        adminService.getSettings()
        .then(setSettings)
        .catch(() => toast.error(t("loadingError")))
        .finally(() => setLoading(false));
        adminService.getDashboard()
        .then((data) => setStats(data.stats))
        .catch(() => {});
    }, []);

    const update = (key: keyof Settings, value: unknown) => {
        setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
        setChanged(true);
        // Aperçu couleur en temps réel
        if (key === "primaryColor" || key === "secondaryColor") {
        applyTheme({
            primaryColor: key === "primaryColor" ? value as string : settings?.primaryColor,
            secondaryColor: key === "secondaryColor" ? value as string : settings?.secondaryColor,
        });
        }
    };

    const save = async () => {
        if (!settings) return;
        setSaving(true);
        try {
        // await adminService.updateSettings(settings as Record<string, unknown>);
        await adminService.updateSettings(settings as unknown as Record<string, unknown>);
        toast.success(t("settingsSaved"));
        setChanged(false);
        } catch {
        toast.error(t("saveError"));
        } finally {
        setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" />
        </div>
    );

    if (!settings) return null;

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-start justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{t("globalSettings")}</h1>
            <p className="text-sm text-gray-500">
                {t("configureGlobalCompany")}
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => { adminService.getSettings().then(setSettings); setChanged(false); }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
                {t("cancel")}
            </button>
            <button
                onClick={save}
                disabled={!changed || saving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
            >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {t("save")}
            </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-5">
            {/* Apparence */}
            <SettingsSection title={t("appearance")} icon="🎨">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                    {t("primaryColor")}
                    </label>
                    <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                    />
                    <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none"
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                    {t("secondaryColor")}
                    </label>
                    <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => update("secondaryColor", e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                    />
                    <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => update("secondaryColor", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none"
                    />
                    </div>
                </div>
                </div>
                <Toggle
                label={t("darkModeAvailable")}
                desc={tr("allowUsersSwitchDark")}
                checked={settings.darkModeEnabled}
                onChange={(v) => update("darkModeEnabled", v)}
                />
            </SettingsSection>

            {/* Inscriptions */}
            <SettingsSection title={t("registrationManagement")} icon="🏢">
                <Toggle
                label={t("manualValidation")}
                desc={tr("requireManualValidationEach")}
                checked={settings.manualValidation}
                onChange={(v) => update("manualValidation", v)}
                fixed={FIXED_SETTINGS.has("manualValidation")}
                />
                <Toggle
                label={t("automaticRegistration")}
                desc={tr("allowAutomaticRegistration")}
                checked={settings.autoRegistration}
                onChange={(v) => update("autoRegistration", v)}
                fixed={FIXED_SETTINGS.has("autoRegistration")}
                />
            </SettingsSection>

            {/* Modules par défaut */}
            <SettingsSection title={t("defaultModules")} icon="🧩">
                <p className="text-xs text-gray-500 mb-3">
                {t("defineWhichModulesActivated")}
                </p>
                <Toggle
                label={t("afrikcse")}
                desc={tr("employeeCseBenefits")}
                checked={settings.defaultHasCSE}
                onChange={(v) => update("defaultHasCSE", v)}
                color="#0f766e"
                fixed={FIXED_SETTINGS.has("defaultHasCSE")}
                />
                <Toggle
                label={t("afrikvoyage")}
                desc={tr("businessTravelManagement")}
                checked={settings.defaultHasVoyage}
                onChange={(v) => update("defaultHasVoyage", v)}
                color="#f59e0b"
                fixed={FIXED_SETTINGS.has("defaultHasVoyage")}
                />
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection title={t("automaticNotifications")} icon="🔔">
                <Toggle
                label={t("validationEmail")}
                desc={tr("sendAutomaticEmailWhen")}
                checked={settings.notifyOnValidation}
                onChange={(v) => update("notifyOnValidation", v)}
                />
                <Toggle
                label={t("rejectionEmail")}
                desc={tr("sendAutomaticEmailWhen2")}
                checked={settings.notifyOnRejection}
                onChange={(v) => update("notifyOnRejection", v)}
                />
                <Toggle
                label={t("welcomeNotifications")}
                desc={tr("sendWelcomeEmailsGetting")}
                checked={settings.notifyWelcome}
                onChange={(v) => update("notifyWelcome", v)}
                />
            </SettingsSection>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-4">
            {/* Sécurité */}
            <SettingsSection title={t("security")} icon="🔒">
                <div
                className="p-3 rounded-lg mb-3"
                style={{ background: "#fef2f2" }}
                >
                <p className="text-xs font-semibold text-red-700">{t("superAdministrators")}</p>
                <p className="text-xs text-red-500 mt-0.5">
                    {t("manageSuperAdminAccess")}
                </p>
                </div>
                <button
                className="w-full py-2 rounded-lg text-white text-sm font-medium bg-red-500 hover:bg-red-600"
                onClick={() => router.push("/admin/access")}
                >
                {t("manageAccess")}
                </button>
                <button
                className="w-full py-2 mt-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => router.push("/admin/logs")}
                >
                {t("viewLogs")}
                </button>
            </SettingsSection>

            {/* Plans tarifaires */}
            <SettingsSection title={t("pricingPlans")} icon="💳">
                <p className="text-xs text-gray-500 mb-3">
                {t("manageCatalogPlansOffered")}
                </p>
                <button
                className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => router.push("/admin/plans")}
                >
                {t("managePlans")}
                </button>
            </SettingsSection>

            {/* Stats rapides */}
            <SettingsSection title={t("statistics")} icon="📊">
                <div className="space-y-2">
                {[
                    { label: t("activeCompanies"), value: stats ? String(stats.active) : "—", color: "#10b981" },
                    { label: t("awaitingValidation"), value: stats ? String(stats.pending) : "—", color: "#f59e0b" },
                    { label: t("totalUsers"), value: stats ? String(stats.totalUsers) : "—", color: "#6b7280" },
                ].map((s) => (
                    <div key={s.label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                ))}
                </div>
            </SettingsSection>
            </div>
        </div>
        </div>
    );
}

// ── Composants utilitaires ──

function SettingsSection({ title, icon, children }: {
    title: string;
    icon: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-lg">{icon}</span>
                <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Toggle({ label, desc, checked, onChange, color, fixed }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    color?: string;
    fixed?: boolean;
}) {
    const t = useTranslations("admin.settings");
    return (
        <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            {fixed && (
                <span
                title={t("behaviorCurrently")}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: "#f3f4f6", color: "#6b7280" }}
                >
                {t("systemFixed")}
                </span>
            )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="relative w-11 h-6 rounded-full transition-colors shrink-0"
            style={{ background: checked ? (color || "var(--color-primary)") : "#d1d5db" }}
        >
            <span
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
            style={{ transform: checked ? "translateX(20px)" : "translateX(0px)" }}
            />
        </button>
        </div>
    );
}