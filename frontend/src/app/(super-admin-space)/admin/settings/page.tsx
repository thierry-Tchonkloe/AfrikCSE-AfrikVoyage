"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { applyTheme } from "@/lib/theme";
import { toast } from "sonner";

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

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [changed, setChanged]   = useState(false);

    useEffect(() => {
        adminService.getSettings()
        .then(setSettings)
        .catch(() => toast.error("Erreur chargement"))
        .finally(() => setLoading(false));
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
        toast.success("Paramètres enregistrés");
        setChanged(false);
        } catch {
        toast.error("Erreur sauvegarde");
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
            <h1 className="text-xl font-bold text-gray-900">Paramètres globaux</h1>
            <p className="text-sm text-gray-500">
                Configurez les règles globales de gestion des entreprises sur la plateforme
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => { adminService.getSettings().then(setSettings); setChanged(false); }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
                Annuler
            </button>
            <button
                onClick={save}
                disabled={!changed || saving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
            >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Enregistrer
            </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-5">
            {/* Apparence */}
            <SettingsSection title="Apparence" icon="🎨">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                    Couleur primaire
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
                    Couleur secondaire
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
                label="Mode sombre disponible"
                desc="Permettre aux utilisateurs de basculer en mode sombre"
                checked={settings.darkModeEnabled}
                onChange={(v) => update("darkModeEnabled", v)}
                />
            </SettingsSection>

            {/* Inscriptions */}
            <SettingsSection title="Gestion des inscriptions" icon="🏢">
                <Toggle
                label="Validation manuelle"
                desc="Exiger une validation manuelle pour chaque nouvelle inscription"
                checked={settings.manualValidation}
                onChange={(v) => update("manualValidation", v)}
                />
                <Toggle
                label="Inscription automatique"
                desc="Permettre l'inscription automatique avec vérification email"
                checked={settings.autoRegistration}
                onChange={(v) => update("autoRegistration", v)}
                />
            </SettingsSection>

            {/* Modules par défaut */}
            <SettingsSection title="Modules par défaut" icon="🧩">
                <p className="text-xs text-gray-500 mb-3">
                Définissez quels modules sont activés par défaut pour les nouvelles entreprises
                </p>
                <Toggle
                label="AfrikCSE"
                desc="Gestion des avantages salariés et CSE"
                checked={settings.defaultHasCSE}
                onChange={(v) => update("defaultHasCSE", v)}
                color="#0f766e"
                />
                <Toggle
                label="AfrikVoyage"
                desc="Gestion des voyages d'affaires"
                checked={settings.defaultHasVoyage}
                onChange={(v) => update("defaultHasVoyage", v)}
                color="#f59e0b"
                />
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection title="Notifications automatiques" icon="🔔">
                <Toggle
                label="Email de validation"
                desc="Envoyer un email automatique lors de la validation d'une entreprise"
                checked={settings.notifyOnValidation}
                onChange={(v) => update("notifyOnValidation", v)}
                />
                <Toggle
                label="Email de refus"
                desc="Envoyer un email automatique lors du refus d'une inscription"
                checked={settings.notifyOnRejection}
                onChange={(v) => update("notifyOnRejection", v)}
                />
                <Toggle
                label="Notifications de bienvenue"
                desc="Envoyer des emails de bienvenue et guides de démarrage"
                checked={settings.notifyWelcome}
                onChange={(v) => update("notifyWelcome", v)}
                />
            </SettingsSection>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-4">
            {/* Sécurité */}
            <SettingsSection title="Sécurité" icon="🔒">
                <div
                className="p-3 rounded-lg mb-3"
                style={{ background: "#fef2f2" }}
                >
                <p className="text-xs font-semibold text-red-700">Super Administrateurs</p>
                <p className="text-xs text-red-500 mt-0.5">
                    Gérez les accès Super Admin
                </p>
                </div>
                <button
                className="w-full py-2 rounded-lg text-white text-sm font-medium bg-red-500 hover:bg-red-600"
                onClick={() => router.push("/admin/access")}
                >
                Gérer les accès
                </button>
                <button
                className="w-full py-2 mt-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => router.push("/admin/logs")}
                >
                Voir les logs
                </button>
            </SettingsSection>

            {/* Plans tarifaires */}
            <SettingsSection title="Plans tarifaires" icon="💳">
                <p className="text-xs text-gray-500 mb-3">
                Gérez le catalogue de plans proposés aux entreprises
                </p>
                <button
                className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => router.push("/admin/plans")}
                >
                Gérer les plans
                </button>
            </SettingsSection>

            {/* Stats rapides */}
            <SettingsSection title="Statistiques" icon="📊">
                <div className="space-y-2">
                {[
                    { label: "Entreprises actives", value: "—", color: "#10b981" },
                    { label: "En attente de validation", value: "—", color: "#f59e0b" },
                    { label: "Utilisateurs totaux", value: "—", color: "#6b7280" },
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

function Toggle({ label, desc, checked, onChange, color }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    color?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{label}</p>
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