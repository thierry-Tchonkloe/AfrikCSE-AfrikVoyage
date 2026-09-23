"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, CheckCircle, XCircle, Clock, FlaskConical } from "lucide-react";
import { partnersService } from "@/services/admin/partners.service";
import { Partner, PartnerSyncLog } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

const STATUS_LOG_ICON = {
    SUCCESS: <CheckCircle size={14} className="text-green-500" />,
    PARTIAL: <Clock size={14} className="text-yellow-500" />,
    FAILED:  <XCircle size={14} className="text-red-500" />,
};

export default function PartnerDetailPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("admin.partnersDetail");
    const { id } = useParams<{ id: string }>();
    const router  = useRouter();

    const [partner, setPartner] = useState<Partner | null>(null);
    const [logs, setLogs]       = useState<PartnerSyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [form, setForm] = useState({
        name:           "",
        sector:         "",
        logoUrl:        "",
        contactEmail:   "",
        websiteUrl:     "",
        notes:          "",
        status:         "DRAFT",
        scopeType:      "BOTH",
        apiEnabled:     false,
        apiBaseUrl:     "",
        apiKey:         "",
        apiFormat:      "REST",
        syncFrequencyH: 24,
        isGlobal:       false,
    });

    const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    useEffect(() => {
        async function load() {
            try {
                const [p, l] = await Promise.all([
                    partnersService.getById(id),
                    partnersService.getSyncLogs(id),
                ]);
                setPartner(p);
                setLogs(l);
                setForm({
                    name:           p.name,
                    sector:         p.sector,
                    logoUrl:        p.logoUrl ?? "",
                    contactEmail:   p.contactEmail ?? "",
                    websiteUrl:     p.websiteUrl ?? "",
                    notes:          p.notes ?? "",
                    status:         p.status,
                    scopeType:      p.scopeType,
                    apiEnabled:     p.apiEnabled,
                    apiBaseUrl:     p.apiBaseUrl ?? "",
                    apiKey:         "",
                    apiFormat:      p.apiFormat ?? "REST",
                    syncFrequencyH: p.syncFrequencyH ?? 24,
                    isGlobal:       p.isGlobal,
                });
            } catch (err) {
                toast.error(getErrorMessage(err, t("partnerNotFound")));
                router.push("/admin/partners");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name:       form.name,
                sector:     form.sector,
                status:     form.status,
                scopeType:  form.scopeType,
                isGlobal:   form.isGlobal,
                apiEnabled: form.apiEnabled,
                logoUrl:    form.logoUrl || null,
                contactEmail: form.contactEmail || null,
                websiteUrl: form.websiteUrl || null,
                notes:      form.notes || null,
            };
            if (form.apiEnabled) {
                if (form.apiBaseUrl) payload.apiBaseUrl = form.apiBaseUrl;
                if (form.apiKey)     payload.apiKey     = form.apiKey;
                payload.apiFormat      = form.apiFormat;
                payload.syncFrequencyH = form.syncFrequencyH;
            }
            await partnersService.update(id, payload);
            toast.success(t("partnerUpdated"));
        } catch (err) {
            toast.error(getErrorMessage(err, t("errorWhileUpdating")));
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await partnersService.sync(id);
            toast.success(res.message);
            const l = await partnersService.getSyncLogs(id);
            setLogs(l);
        } catch (err) {
            toast.error(getErrorMessage(err, t("synchronizationFailed")));
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 size={24} className="animate-spin mr-2" /> {t("loading")}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{partner?.name}</h1>
                    <p className="text-sm text-gray-500">{partner?.sector}</p>
                </div>
                {partner?.apiEnabled && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleSync} disabled={syncing}
                            title={t("simulationDoesNotCall")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                            {t("synchronize")}
                        </button>
                        <span
                            title={t("synchronizationSimulationNo")}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-help">
                            <FlaskConical size={12} />
                            {t("simulation")}
                        </span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Informations générales */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{t("generalInformation")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("name")}</label>
                            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("industry")}</label>
                            <input value={form.sector} onChange={(e) => set("sector", e.target.value)} required
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("contactEmail")}</label>
                            <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("website")}</label>
                            <input type="url" value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("logoUrl")}</label>
                            <input type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("internalNotes")}</label>
                            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-teal-400" />
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{t("configuration")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("status")}</label>
                            <select value={form.status} onChange={(e) => set("status", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
                                <option value="DRAFT">{t("draft")}</option>
                                <option value="ACTIVE">{t("active")}</option>
                                <option value="INACTIVE">{t("inactive")}</option>
                                <option value="SUSPENDED">{t("suspended")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("scope")}</label>
                            <select value={form.scopeType} onChange={(e) => set("scopeType", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
                                <option value="CSE">{t("cseOnly")}</option>
                                <option value="VOYAGE">{t("travelOnly")}</option>
                                <option value="BOTH">{t("cseTravel")}</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="isGlobal" checked={form.isGlobal}
                                onChange={(e) => set("isGlobal", e.target.checked)} className="w-4 h-4 rounded" />
                            <label htmlFor="isGlobal" className="text-sm text-gray-700">{t("globalPartner")}</label>
                        </div>
                    </div>
                </div>

                {/* API */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{t("apiIntegration")}</h2>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="apiEnabled" checked={form.apiEnabled}
                                onChange={(e) => set("apiEnabled", e.target.checked)} className="w-4 h-4 rounded" />
                            <label htmlFor="apiEnabled" className="text-sm text-gray-700">{t("enable")}</label>
                        </div>
                    </div>
                    {form.apiEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("baseUrl")}</label>
                                <input type="url" value={form.apiBaseUrl} onChange={(e) => set("apiBaseUrl", e.target.value)}
                                    placeholder="https://api.partenaire.com/v1"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    {t("newApiKey")} {partner?.hasApiKey && <span className="text-green-600">{t("configured")}</span>}
                                </label>
                                <input type="password" value={form.apiKey} onChange={(e) => set("apiKey", e.target.value)}
                                    placeholder={partner?.hasApiKey ? t("leaveEmptyKeep") : t("enterApiKey")}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("format")}</label>
                                <select value={form.apiFormat} onChange={(e) => set("apiFormat", e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
                                    <option value="REST">REST</option>
                                    <option value="GRAPHQL">{t("graphql")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("syncFrequencyH")}</label>
                                <input type="number" min={1} max={168} value={form.syncFrequencyH}
                                    onChange={(e) => set("syncFrequencyH", parseInt(e.target.value))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
                        {t("cancel")}
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                        style={{ background: "var(--color-primary)" }}>
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        {t("save")}
                    </button>
                </div>
            </form>

            {/* Historique de synchronisation */}
            {logs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 space-y-2">
                        <h2 className="font-semibold text-gray-900 text-sm">{t("synchronizationHistory")}</h2>
                        <p className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 w-fit">
                            <FlaskConical size={12} className="shrink-0" />
                            {t("simulatedFeatureNoneThese")}
                        </p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                                {STATUS_LOG_ICON[log.status as keyof typeof STATUS_LOG_ICON] ?? STATUS_LOG_ICON.FAILED}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {log.type === "MANUAL" ? t("manual") : t("automatic")} — {log.status}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {t("createdUpdatedError", { offersCreated: log.offersCreated, offersUpdated: log.offersUpdated, errors: log.errors, p4: log.errors !== 1 ? "s" : "" })}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">
                                    {new Date(log.createdAt).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
