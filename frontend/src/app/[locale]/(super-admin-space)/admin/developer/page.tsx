"use client";

import { useState, useEffect, useCallback } from "react";
import { Code2, Plus, Trash2, ToggleLeft, Webhook, ChevronDown, ChevronUp, Copy, Check, Eye, EyeOff } from "lucide-react";
import {
    developerService,
    ApiClientItem,
    ApiClientCreated,
    WebhookEndpoint,
    WebhookDelivery,
} from "@/services/admin/developer.service";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

const AVAILABLE_SCOPES = ["bookings:read","bookings:write","orders:read","wallet:read","commissions:read","reporting:read"];
const AVAILABLE_EVENTS = ["booking.confirmed","booking.rejected","booking.completed","booking.cancelled","travel.approved","travel.rejected","travel.completed","order.confirmed","order.cancelled","wallet.credited"];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="ml-2 text-gray-400 hover:text-gray-600"
        >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
    );
}

function KeyReveal({ rawKey }: { rawKey: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
            <span className="text-yellow-700 text-sm font-mono flex-1">
                {show ? rawKey : "ak_••••••••••••••••••••••••••••••••••••••••••••••••••••"}
            </span>
            <button onClick={() => setShow(!show)} className="text-yellow-600 hover:text-yellow-800">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <CopyButton text={rawKey} />
        </div>
    );
}

function ClientsTab() {
    const dateLocale = useDateLocale();
    const t = useTranslations("admin.developer");
    const [clients, setClients]     = useState<ApiClientItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showForm, setShowForm]   = useState(false);
    const [newKey, setNewKey]       = useState<ApiClientCreated | null>(null);
    const [form, setForm]           = useState({ name: "", scopes: [] as string[], expiresAt: "" });
    const [error, setError]         = useState<string | null>(null);

    const load = useCallback(async () => {
        try { setClients(await developerService.listClients()); } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (form.scopes.length === 0) { setError(t("selectLeastOneScope")); return; }
        try {
            const result = await developerService.createClient({
                name:   form.name,
                scopes: form.scopes,
                expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
            });
            setNewKey(result);
            setShowForm(false);
            setForm({ name: "", scopes: [], expiresAt: "" });
            await load();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
            setError(typeof msg === "string" ? msg : t("failedCreateClient"));
        }
    }

    function toggleScope(s: string) {
        setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }));
    }

    return (
        <div>
            {newKey && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="font-semibold text-yellow-800 text-sm">{t("keyCreatedCopyNow")}</p>
                    <p className="text-xs text-yellow-700 mt-1">{t("name")} <strong>{newKey.client.name}</strong></p>
                    <KeyReveal rawKey={newKey.rawKey} />
                    <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-yellow-600 underline">{t("close")}</button>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">{t("apiClients", { length: clients.length })}</h2>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> {t("newClient")}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 border rounded-lg space-y-3">
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("name2")}</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={t("myMobileApp")} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("scopes")}</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SCOPES.map(s => (
                                <label key={s} className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input type="checkbox" checked={form.scopes.includes(s)} onChange={() => toggleScope(s)} />
                                    <span className={`px-2 py-0.5 rounded-full ${form.scopes.includes(s) ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{s}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("expirationOptional")}</label>
                        <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                            className="border rounded px-3 py-1.5 text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">{t("create")}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-100">{t("cancel")}</button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : clients.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noApiClients")}</p>
            ) : (
                <div className="space-y-3">
                    {clients.map(c => (
                        <div key={c.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-medium text-gray-800">{c.name}</span>
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                        {c.isActive ? t("active") : t("revoked")}
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1 font-mono">{t("prefix", { keyPrefix: c.keyPrefix })} <CopyButton text={c.keyPrefix} /></div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {c.scopes.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {c.isActive && (
                                        <button onClick={async () => { await developerService.revokeClient(c.id); await load(); }}
                                            className="text-xs flex items-center gap-1 text-orange-600 border border-orange-200 px-2 py-1 rounded hover:bg-orange-50">
                                            <ToggleLeft size={12} /> {t("revoke")}
                                        </button>
                                    )}
                                    <button onClick={async () => { if (confirm(t("deleteClient"))) { await developerService.deleteClient(c.id); await load(); } }}
                                        className="text-xs flex items-center gap-1 text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                                        <Trash2 size={12} /> {t("delete")}
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                {c.lastUsedAt ? t("lastUsed", { p1: new Date(c.lastUsedAt).toLocaleString(dateLocale) }) : t("neverUsed")} {t("webhookS", { webhooks: c._count.webhooks })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function WebhooksTab() {
    const dateLocale = useDateLocale();
    const t = useTranslations("admin.developer");
    const [webhooks, setWebhooks]       = useState<WebhookEndpoint[]>([]);
    const [loading, setLoading]         = useState(true);
    const [showForm, setShowForm]       = useState(false);
    const [expanded, setExpanded]       = useState<string | null>(null);
    const [deliveries, setDeliveries]   = useState<Record<string, WebhookDelivery[]>>({});
    const [form, setForm]               = useState({ url: "", events: [] as string[] });

    const load = useCallback(async () => {
        try { setWebhooks(await developerService.listWebhooks()); } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await developerService.createWebhook({ url: form.url, events: form.events });
            setShowForm(false);
            setForm({ url: "", events: [] });
            await load();
        } catch { /* ignore */ }
    }

    function toggleEvent(ev: string) {
        setForm(f => ({ ...f, events: f.events.includes(ev) ? f.events.filter(x => x !== ev) : [...f.events, ev] }));
    }

    async function loadDeliveries(id: string) {
        if (expanded === id) { setExpanded(null); return; }
        setExpanded(id);
        if (!deliveries[id]) {
            const d = await developerService.listDeliveries(id);
            setDeliveries(prev => ({ ...prev, [id]: d.deliveries }));
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">{t("webhookEndpoints", { length: webhooks.length })}</h2>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> {t("newEndpoint")}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 border rounded-lg space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("targetUrl")}</label>
                        <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                            required type="url" placeholder="https://mon-app.com/webhooks"
                            className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("events")}</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_EVENTS.map(ev => (
                                <label key={ev} className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} />
                                    <span className={`px-2 py-0.5 rounded-full ${form.events.includes(ev) ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{ev}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">{t("create")}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-100">{t("cancel")}</button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : webhooks.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noWebhookEndpoints")}</p>
            ) : (
                <div className="space-y-3">
                    {webhooks.map(w => (
                        <div key={w.id} className="border rounded-lg bg-white overflow-hidden">
                            <div className="flex justify-between items-start p-4">
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm text-gray-800 truncate">{w.url}</div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {w.events.map(ev => <span key={ev} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{ev}</span>)}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{t("deliveryIes", { deliveries: w._count.deliveries })}</div>
                                </div>
                                <div className="flex gap-2 ml-3">
                                    <button onClick={() => loadDeliveries(w.id)} className="text-xs flex items-center gap-1 text-gray-600 border px-2 py-1 rounded hover:bg-gray-50">
                                        {expanded === w.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {t("logs")}
                                    </button>
                                    <button onClick={async () => { await developerService.updateWebhook(w.id, { isActive: !w.isActive }); await load(); }}
                                        className={`text-xs border px-2 py-1 rounded ${w.isActive ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}>
                                        {w.isActive ? t("deactivate") : t("activate")}
                                    </button>
                                    <button onClick={async () => { if (confirm(t("deleteEndpoint"))) { await developerService.deleteWebhook(w.id); await load(); } }}
                                        className="text-xs text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            {expanded === w.id && (
                                <div className="border-t bg-gray-50 px-4 pb-4">
                                    <p className="text-xs font-medium text-gray-500 py-2">{t("latestDeliveries")}</p>
                                    {!deliveries[w.id] ? (
                                        <p className="text-xs text-gray-400">{t("loading")}</p>
                                    ) : deliveries[w.id].length === 0 ? (
                                        <p className="text-xs text-gray-400">{t("noDeliveries")}</p>
                                    ) : (
                                        <table className="w-full text-xs">
                                            <thead><tr className="text-gray-500"><th className="text-left py-1">{t("event")}</th><th className="text-left py-1">{t("status")}</th><th className="text-left py-1">HTTP</th><th className="text-left py-1">{t("date")}</th></tr></thead>
                                            <tbody>
                                                {deliveries[w.id].map(d => (
                                                    <tr key={d.id} className="border-t border-gray-100">
                                                        <td className="py-1 font-mono">{d.event}</td>
                                                        <td className="py-1">
                                                            <span className={`px-1.5 py-0.5 rounded-full ${d.failed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                                                {d.failed ? t("failed") : "OK"}
                                                            </span>
                                                        </td>
                                                        <td className="py-1 text-gray-600">{d.statusCode ?? "—"}</td>
                                                        <td className="py-1 text-gray-400">{d.deliveredAt ? new Date(d.deliveredAt).toLocaleString(dateLocale) : "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DeveloperApiToggle() {
    const t = useTranslations("admin.developer");
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        developerService.getSettings()
            .then((s) => setEnabled(s.developerApiEnabled))
            .catch(() => setEnabled(false));
    }, []);

    async function toggle() {
        if (enabled === null || saving) return;
        setSaving(true);
        try {
            const result = await developerService.updateSettings(!enabled);
            setEnabled(result.developerApiEnabled);
        } finally {
            setSaving(false);
        }
    }

    if (enabled === null) return null;

    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
            <div>
                <p className="text-sm font-medium text-gray-800">{t("developerApiAccess")}</p>
                <p className="text-xs text-gray-500">
                    {enabled
                        ? t("enabledOrganizationsApiKeys")
                        : t("disabledEvenValidKey")}
                </p>
            </div>
            <button
                onClick={toggle}
                disabled={saving}
                className={`ml-auto shrink-0 text-xs px-3 py-1.5 rounded border disabled:opacity-50 ${
                    enabled ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"
                }`}
            >
                {enabled ? t("deactivate") : t("activate")}
            </button>
        </div>
    );
}

export default function DeveloperPage() {
    const t = useTranslations("admin.developer");
    const [tab, setTab] = useState<"clients" | "webhooks">("clients");

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Code2 size={24} className="text-blue-600" />
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{t("developerApi")}</h1>
                    <p className="text-sm text-gray-500">{t("apiClientsWebhooksDelivery")}</p>
                </div>
            </div>

            <div className="mb-6">
                <DeveloperApiToggle />
            </div>

            <div className="flex gap-1 mb-6 border-b">
                <button onClick={() => setTab("clients")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px ${tab === "clients" ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    <Code2 size={14} /> {t("apiClients2")}
                </button>
                <button onClick={() => setTab("webhooks")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px ${tab === "webhooks" ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    <Webhook size={14} /> {t("webhooks")}
                </button>
            </div>

            {tab === "clients"  && <ClientsTab />}
            {tab === "webhooks" && <WebhooksTab />}
        </div>
    );
}
