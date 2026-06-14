"use client";

import { useState } from "react";
import { Copy, RefreshCw, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SyncLog {
    date: string;
    type: string;
    created: number;
    updated: number;
    errors: number;
    status: string;
}

const MOCK_LOGS: SyncLog[] = [
    { date: "15 Jan 2024, 14:30", type: "Automatique", created: 3,  updated: 47, errors: 0, status: "Succès" },
    { date: "15 Jan 2024, 12:30", type: "Manuelle",    created: 0,  updated: 12, errors: 1, status: "Partiel" },
    { date: "14 Jan 2024, 14:30", type: "Automatique", created: 1,  updated: 38, errors: 0, status: "Succès" },
    { date: "13 Jan 2024, 14:30", type: "Automatique", created: 0,  updated: 0,  errors: 5, status: "Échec" },
];

const STATUS_CONFIG: Record<string, { color: string; icon: string }> = {
    "Succès":  { color: "#10b981", icon: "✓" },
    "Partiel": { color: "#f59e0b", icon: "⚠" },
    "Échec":   { color: "#ef4444", icon: "✗" },
};

const FIELD_MAPPINGS = [
    { label: "Email → Identifiant unique", options: ["email", "username", "employee_id"] },
    { label: "Département → Service",      options: ["department", "division", "team"] },
    { label: "Poste → Fonction",           options: ["job_title", "position", "role"] },
];

export default function IntegrationsPage() {
    const [connected]    = useState(true);
    const [apiKey]       = useState("ak_live_987654321Oabcdef");
    const [showKey, setShowKey] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [testing, setTesting] = useState(false);

    const [syncConfig, setSyncConfig] = useState({
        autoSync:    true,
        autoCreate:  true,
        autoDisable: false,
        frequency:   "Temps réel",
    });

    const [fieldMappings, setFieldMappings] = useState({
        email:      "email",
        department: "department",
        job_title:  "job_title",
    });

    const handleCopyKey = async () => {
        await navigator.clipboard.writeText(apiKey);
        toast.success("Clé API copiée !");
    };

    const handleTestConnection = async () => {
        setTesting(true);
        await new Promise((r) => setTimeout(r, 1500));
        setTesting(false);
        toast.success("Connexion réussie — SAP SuccessFactors opérationnel");
    };

    const handleSync = async () => {
        setSyncing(true);
        await new Promise((r) => setTimeout(r, 2000));
        setSyncing(false);
        toast.success("Synchronisation terminée — 47 employés mis à jour");
    };

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

        {/* Statut connexion */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            🔌 Statut de connexion
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Outil connecté</p>
                <p className="text-sm font-semibold text-gray-900">SAP SuccessFactors</p>
            </div>
            <div className="p-3 border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Dernière synchronisation</p>
                <p className="text-sm font-semibold text-gray-900">Il y a 2h</p>
            </div>
            <div className="p-3 border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Statut</p>
                <span className="text-sm font-semibold flex items-center gap-1"
                style={{ color: "#10b981" }}>
                <span className="w-2 h-2 rounded-full bg-green-500" /> Connecté
                </span>
            </div>
            </div>
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
        </div>

        {/* Clés API */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            🔑 Clés API
            </h3>
            <div>
            <p className="text-xs text-gray-500 mb-2">Clé API actuelle</p>
            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
                <span className="flex-1 text-sm font-mono text-gray-700">
                {showKey ? apiKey : apiKey.slice(0, 8) + "•".repeat(20)}
                </span>
                <button onClick={() => setShowKey(!showKey)} className="text-gray-400">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={handleCopyKey} className="text-gray-400 hover:text-gray-600">
                <Copy size={15} />
                </button>
            </div>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => toast.info("Génération d'une nouvelle clé — confirmation requise")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                + Générer une nouvelle clé
            </button>
            <button
                onClick={() => toast.error("Clé révoquée — toutes les connexions seront interrompues")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium bg-red-500"
            >
                <Trash2 size={14} /> Révoquer la clé
            </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Mapping champs */}
            <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Mapping des champs</p>
                {FIELD_MAPPINGS.map((fm) => (
                <div key={fm.label}>
                    <label className="block text-xs text-gray-500 mb-1">{fm.label}</label>
                    <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    value={Object.values(fieldMappings).find((v) =>
                        fm.options.includes(v)
                    ) ?? fm.options[0]}
                    onChange={() => {}}
                    >
                    {fm.options.map((o) => <option key={o}>{o}</option>)}
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
                        [opt.key]: !prev[opt.key as keyof typeof prev],
                    }))}
                    className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                    style={{
                        background: syncConfig[opt.key as keyof typeof syncConfig]
                        ? "#0f766e" : "#d1d5db",
                    }}
                    >
                    <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                        style={{
                        transform: syncConfig[opt.key as keyof typeof syncConfig]
                            ? "translateX(0px)" : "translateX(-16px)",
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
            <p className="text-xs text-gray-400 mt-0.5">Dernière synchronisation : il y a 2 heures</p>
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
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Date", "Type", "Employés créés", "Mis à jour", "Erreurs", "Statut"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {MOCK_LOGS.map((log, i) => {
                    const st = STATUS_CONFIG[log.status] ?? STATUS_CONFIG["Succès"];
                    return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-600">{log.date}</td>
                        <td className="px-5 py-3 text-xs text-gray-600">{log.type}</td>
                        <td className="px-5 py-3 text-xs text-gray-900 font-medium">{log.created}</td>
                        <td className="px-5 py-3 text-xs text-gray-900 font-medium">{log.updated}</td>
                        <td className="px-5 py-3 text-xs"
                        style={{ color: log.errors > 0 ? "#ef4444" : "#9ca3af" }}>
                        {log.errors}
                        </td>
                        <td className="px-5 py-3">
                        <span className="text-xs font-medium flex items-center gap-1"
                            style={{ color: st.color }}>
                            {st.icon} {log.status}
                        </span>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    );
}