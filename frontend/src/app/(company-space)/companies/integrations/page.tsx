"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCw, Trash2, Eye, EyeOff, Loader2, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { integrationService } from "@/services/companies/integrations.service";
import { getErrorMessage } from "@/lib/errors";

interface SyncConfig {
    autoSync?: boolean;
    autoCreate?: boolean;
    autoDisable?: boolean;
    frequency?: string;
    fieldMappings?: Record<string, string>;
}

interface Integration {
    id: string;
    name: string;
    type: string;
    apiKey: string | null;
    webhookUrl: string | null;
    isActive: boolean;
    lastSyncAt: string | null;
    syncConfig: SyncConfig | null;
}

interface SyncLogItem {
    id: string;
    type: string;
    employeesCreated: number;
    employeesUpdated: number;
    errors: number;
    status: string;
    createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    SUCCESS: { label: "Succès", color: "#10b981", icon: "✓" },
    PARTIAL: { label: "Partiel", color: "#f59e0b", icon: "⚠" },
    FAILED:  { label: "Échec",  color: "#ef4444", icon: "✗" },
};

const TYPE_LABELS: Record<string, string> = {
    HR: "RH (SIRH)",
    ACCOUNTING: "Comptabilité",
};

const FIELD_MAPPING_OPTIONS = [
    { key: "email",      label: "Email → Identifiant unique", options: ["email", "username", "employee_id"] },
    { key: "department", label: "Département → Service",      options: ["department", "division", "team"] },
    { key: "job_title",  label: "Poste → Fonction",            options: ["job_title", "position", "role"] },
];

const DEFAULT_SYNC_CONFIG: SyncConfig = {
    autoSync: true,
    autoCreate: true,
    autoDisable: false,
    frequency: "Temps réel",
    fieldMappings: { email: "email", department: "department", job_title: "job_title" },
};

function formatDate(value: string | null) {
    if (!value) return "Jamais";
    return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function generateApiKey() {
    const bytes = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    return `ak_live_${bytes.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function Skeleton() {
    return (
        <div className="space-y-5">
        <div className="flex items-start justify-between">
            <div className="space-y-2">
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-80 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            </div>
        ))}
        </div>
    );
}

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [logs, setLogs] = useState<SyncLogItem[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const [showKey, setShowKey] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [testing, setTesting] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [keyActionLoading, setKeyActionLoading] = useState(false);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", type: "HR", apiKey: "", webhookUrl: "" });

    const [syncConfig, setSyncConfig] = useState<SyncConfig>(DEFAULT_SYNC_CONFIG);
    const [webhookUrl, setWebhookUrl] = useState("");

    const selected = integrations.find((i) => i.id === selectedId) ?? null;

    const loadIntegrations = async () => {
        try {
            const data = await integrationService.getAll();
            setIntegrations(data ?? []);
            setSelectedId((prev) => prev ?? data?.[0]?.id ?? null);
        } catch {
            toast.error("Erreur lors du chargement des intégrations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIntegrations();
    }, []);

    useEffect(() => {
        if (!selected) {
            setLogs([]);
            return;
        }
        setSyncConfig({ ...DEFAULT_SYNC_CONFIG, ...(selected.syncConfig ?? {}) });
        setWebhookUrl(selected.webhookUrl ?? "");
        setShowKey(false);

        const loadLogs = async () => {
            setLogsLoading(true);
            try {
                const data = await integrationService.getSyncLogs(selected.id);
                setLogs(data ?? []);
            } catch {
                toast.error("Erreur lors du chargement de l'historique");
            } finally {
                setLogsLoading(false);
            }
        };
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const updateSelected = (updated: Integration) => {
        setIntegrations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    };

    const handleCreate = async () => {
        if (!form.name.trim()) {
            toast.error("Le nom de l'outil est requis");
            return;
        }
        setCreating(true);
        try {
            const created = await integrationService.create({
                name: form.name.trim(),
                type: form.type,
                apiKey: form.apiKey.trim() || undefined,
                webhookUrl: form.webhookUrl.trim() || undefined,
                isActive: true,
                syncConfig: DEFAULT_SYNC_CONFIG,
            });
            setIntegrations((prev) => [created, ...prev]);
            setSelectedId(created.id);
            setShowCreateForm(false);
            setForm({ name: "", type: "HR", apiKey: "", webhookUrl: "" });
            toast.success("Intégration créée");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la création"));
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async () => {
        if (!selected) return;
        try {
            const updated = await integrationService.update(selected.id, { isActive: !selected.isActive });
            updateSelected(updated);
            toast.success(updated.isActive ? "Intégration activée" : "Intégration désactivée");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la mise à jour"));
        }
    };

    const handleTestConnection = async () => {
        if (!selected) return;
        setTesting(true);
        try {
            await integrationService.testConnection(selected.id);
            toast.success(`Connexion réussie — ${selected.name} opérationnel`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Connexion échouée"));
        } finally {
            setTesting(false);
        }
    };

    const handleSync = async () => {
        if (!selected) return;
        setSyncing(true);
        try {
            const log: SyncLogItem = await integrationService.sync(selected.id, "MANUAL");
            setLogs((prev) => [log, ...prev]);
            if (log.status === "SUCCESS") {
                const updated = await integrationService.getById(selected.id);
                updateSelected(updated);
                toast.success("Synchronisation terminée avec succès");
            } else {
                toast.error("Synchronisation échouée — vérifiez la configuration de l'intégration");
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la synchronisation"));
        } finally {
            setSyncing(false);
        }
    };

    const handleCopyKey = async () => {
        if (!selected?.apiKey) return;
        await navigator.clipboard.writeText(selected.apiKey);
        toast.success("Clé API copiée !");
    };

    const handleGenerateKey = async () => {
        if (!selected) return;
        setKeyActionLoading(true);
        try {
            const updated = await integrationService.update(selected.id, { apiKey: generateApiKey() });
            updateSelected(updated);
            setShowKey(true);
            toast.success("Nouvelle clé API générée");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la génération de la clé"));
        } finally {
            setKeyActionLoading(false);
        }
    };

    const handleRevokeKey = async () => {
        if (!selected) return;
        setKeyActionLoading(true);
        try {
            const updated = await integrationService.update(selected.id, { apiKey: "" });
            updateSelected(updated);
            toast.success("Clé API révoquée — toutes les connexions sont interrompues");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la révocation"));
        } finally {
            setKeyActionLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!selected) return;
        setSavingConfig(true);
        try {
            const updated = await integrationService.update(selected.id, {
                webhookUrl: webhookUrl.trim(),
                syncConfig,
            });
            updateSelected(updated);
            toast.success("Configuration enregistrée");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'enregistrement"));
        } finally {
            setSavingConfig(false);
        }
    };

    if (loading) return <Skeleton />;

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-start justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Intégrations & API RH / Compta</h1>
            <p className="text-sm text-gray-500">
                Connectez vos outils RH pour synchroniser automatiquement vos employés
            </p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "#f0fdf4", color: "#0f766e" }}>
            AfrikCSE & AfrikVoyage
            </span>
        </div>

        {/* Sélecteur d'intégrations */}
        {integrations.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
            {integrations.map((integ) => (
                <button
                key={integ.id}
                onClick={() => setSelectedId(integ.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={integ.id === selectedId
                    ? { background: "#0f766e", color: "#fff", borderColor: "#0f766e" }
                    : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                >
                {integ.name}
                <span className="ml-2 text-xs opacity-75">{TYPE_LABELS[integ.type] ?? integ.type}</span>
                </button>
            ))}
            <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500"
            >
                <Plus size={14} /> Ajouter
            </button>
            </div>
        )}

        {/* Formulaire de création */}
        {(showCreateForm || integrations.length === 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">
                {integrations.length === 0 ? "🔌 Connecter votre premier outil" : "🔌 Nouvelle intégration"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                <label className="block text-xs text-gray-500 mb-1">Nom de l&apos;outil</label>
                <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="SAP SuccessFactors, Workday, Sage…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                >
                    <option value="HR">RH (SIRH)</option>
                    <option value="ACCOUNTING">Comptabilité</option>
                </select>
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">Clé API (optionnel)</label>
                <input
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder="ak_live_…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none font-mono"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">URL Webhook (optionnel)</label>
                <input
                    value={form.webhookUrl}
                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                    placeholder="https://…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                />
                </div>
            </div>
            <div className="flex gap-2">
                <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-70"
                style={{ background: "#0f766e" }}
                >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Connecter
                </button>
                {integrations.length > 0 && (
                <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600"
                >
                    Annuler
                </button>
                )}
            </div>
            </div>
        )}

        {selected && (
            <>
            {/* Statut connexion */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                🔌 Statut de connexion
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Outil connecté</p>
                    <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                    <p className="text-xs text-gray-400">{TYPE_LABELS[selected.type] ?? selected.type}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Dernière synchronisation</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selected.lastSyncAt)}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Statut</p>
                    <span className="text-sm font-semibold flex items-center gap-1"
                    style={{ color: selected.isActive ? "#10b981" : "#9ca3af" }}>
                    <span className="w-2 h-2 rounded-full"
                        style={{ background: selected.isActive ? "#10b981" : "#9ca3af" }} />
                    {selected.isActive ? "Connecté" : "Inactif"}
                    </span>
                </div>
                </div>
                <div className="flex gap-2">
                <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-70"
                    style={{ background: "#0f766e" }}
                >
                    {testing
                    ? <Loader2 size={14} className="animate-spin" />
                    : <RefreshCw size={14} />}
                    Tester la connexion
                </button>
                <button
                    onClick={handleToggleActive}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700"
                >
                    <Power size={14} />
                    {selected.isActive ? "Désactiver" : "Activer"}
                </button>
                </div>
            </div>

            {/* Clés API */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                🔑 Clé API
                </h3>
                <div>
                <p className="text-xs text-gray-500 mb-2">Clé API actuelle</p>
                {selected.apiKey ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
                    <span className="flex-1 text-sm font-mono text-gray-700">
                        {showKey ? selected.apiKey : selected.apiKey.slice(0, 8) + "•".repeat(20)}
                    </span>
                    <button onClick={() => setShowKey(!showKey)} className="text-gray-400">
                        {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={handleCopyKey} className="text-gray-400 hover:text-gray-600">
                        <Copy size={15} />
                    </button>
                    </div>
                ) : (
                    <div className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-400">
                    Aucune clé API configurée
                    </div>
                )}
                </div>
                <div className="flex gap-2">
                <button
                    onClick={handleGenerateKey}
                    disabled={keyActionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-70"
                    style={{ background: "#0f766e" }}
                >
                    {keyActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Générer une nouvelle clé
                </button>
                {selected.apiKey && (
                    <button
                    onClick={handleRevokeKey}
                    disabled={keyActionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium bg-red-500 disabled:opacity-70"
                    >
                    <Trash2 size={14} /> Révoquer la clé
                    </button>
                )}
                </div>
                <div className="p-3 rounded-xl text-xs"
                style={{ background: "#fffbeb", color: "#92400e" }}>
                ⚠️ <strong>Attention sécurité</strong> — Gardez vos clés API secrètes.
                Ne les partagez jamais publiquement ou dans votre code frontend.
                </div>
            </div>

            {/* Configuration synchronisation */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                ⚙️ Configuration de la synchronisation
                </h3>
                <div>
                <label className="block text-xs text-gray-500 mb-1">URL Webhook</label>
                <input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Mapping champs */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-700">Mapping des champs</p>
                    {FIELD_MAPPING_OPTIONS.map((fm) => (
                    <div key={fm.key}>
                        <label className="block text-xs text-gray-500 mb-1">{fm.label}</label>
                        <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                        value={syncConfig.fieldMappings?.[fm.key] ?? fm.options[0]}
                        onChange={(e) => setSyncConfig((prev) => ({
                            ...prev,
                            fieldMappings: { ...prev.fieldMappings, [fm.key]: e.target.value },
                        }))}
                        >
                        {fm.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    ))}
                </div>

                {/* Options sync */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-700">Options de synchronisation</p>
                    {[
                    { key: "autoSync",    label: "Synchronisation automatique", desc: "Synchronise automatiquement les données" },
                    { key: "autoCreate",  label: "Création automatique",        desc: "Crée automatiquement les nouveaux employés" },
                    { key: "autoDisable", label: "Désactivation automatique",   desc: "Désactive les employés partis" },
                    ].map((opt) => (
                    <div key={opt.key}
                        className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                        <p className="text-xs font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                        <button
                        onClick={() => setSyncConfig((prev) => ({
                            ...prev,
                            [opt.key]: !prev[opt.key as keyof SyncConfig],
                        }))}
                        className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                        style={{
                            background: syncConfig[opt.key as keyof SyncConfig]
                            ? "#0f766e" : "#d1d5db",
                        }}
                        >
                        <span
                            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                            style={{
                            transform: syncConfig[opt.key as keyof SyncConfig]
                                ? "translateX(18px)" : "translateX(2px)",
                            }}
                        />
                        </button>
                    </div>
                    ))}
                    <div>
                    <p className="text-xs font-medium text-gray-900 mb-1">Fréquence de synchronisation</p>
                    <select
                        value={syncConfig.frequency}
                        onChange={(e) => setSyncConfig({ ...syncConfig, frequency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    >
                        {["Temps réel", "Toutes les heures", "Quotidien", "Hebdomadaire"].map((f) => (
                        <option key={f}>{f}</option>
                        ))}
                    </select>
                    </div>
                </div>
                </div>
                <div className="flex justify-end">
                <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-70"
                    style={{ background: "#0f766e" }}
                >
                    {savingConfig ? <Loader2 size={14} className="animate-spin" /> : null}
                    Enregistrer la configuration
                </button>
                </div>
            </div>

            {/* Synchronisation manuelle */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    🔄 Synchronisation manuelle
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Lancez une synchronisation immédiate de vos données RH
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    Dernière synchronisation : {formatDate(selected.lastSyncAt)}
                </p>
                </div>
                <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-70"
                style={{ background: "#0f766e" }}
                >
                {syncing
                    ? <Loader2 size={15} className="animate-spin" />
                    : <RefreshCw size={15} />}
                Synchroniser maintenant
                </button>
            </div>

            {/* Historique & logs */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">📋 Historique & logs</h3>
                </div>
                <div className="overflow-x-auto">
                {logsLoading ? (
                    <div className="p-5 text-sm text-gray-400">Chargement…</div>
                ) : logs.length === 0 ? (
                    <div className="p-5 text-sm text-gray-400">Aucune synchronisation pour le moment</div>
                ) : (
                    <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                        {["Date", "Type", "Employés créés", "Mis à jour", "Erreurs", "Statut"].map((h) => (
                            <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => {
                        const st = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.SUCCESS;
                        return (
                            <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3 text-xs text-gray-600">{formatDate(log.createdAt)}</td>
                            <td className="px-5 py-3 text-xs text-gray-600">
                                {log.type === "AUTOMATIC" ? "Automatique" : "Manuelle"}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-900 font-medium">{log.employeesCreated}</td>
                            <td className="px-5 py-3 text-xs text-gray-900 font-medium">{log.employeesUpdated}</td>
                            <td className="px-5 py-3 text-xs"
                                style={{ color: log.errors > 0 ? "#ef4444" : "#9ca3af" }}>
                                {log.errors}
                            </td>
                            <td className="px-5 py-3">
                                <span className="text-xs font-medium flex items-center gap-1"
                                style={{ color: st.color }}>
                                {st.icon} {st.label}
                                </span>
                            </td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                )}
                </div>
            </div>
            </>
        )}
        </div>
    );
}
