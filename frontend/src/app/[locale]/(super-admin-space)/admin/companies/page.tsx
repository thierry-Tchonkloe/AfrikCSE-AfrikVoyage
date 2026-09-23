"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import {
    Plus, Search, Eye, Pencil, Pause, Play,
    Trash2, Download, ChevronLeft, ChevronRight,
    X, Save, Loader2, Copy, Check,
} from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { countryConfigService, CountryConfig } from "@/services/admin/country-config.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"admin.companies">>;

// ── Types ──────────────────────────────────────────────────
interface Org {
    id:            string;
    name:          string;
    businessEmail: string;
    country:       string;
    city:          string | null;
    phone:         string | null;
    size:          string | null;
    industry:      string | null;
    plan:          string;
    status:        string;
    hasCSE:        boolean;
    hasVoyage:     boolean;
    createdAt:     string;
    validatedAt:   string | null;
    _count:        { users: number };
    users:         Array<{ firstName: string; lastName: string; email: string }>;
}

// ── Config ─────────────────────────────────────────────────
const getStatusConfig = (t: Translator): Record<string, { label: string; color: string }> => ({
    PENDING:   { label: t("pending"), color: "#f59e0b" },
    ACTIVE:    { label: t("active"),     color: "#10b981" },
    SUSPENDED: { label: t("suspended"),  color: "#ef4444" },
    REJECTED:  { label: t("rejected"),    color: "#6b7280" },
});

const COUNTRY_FLAGS: Record<string, string> = {
    BJ: "🇧🇯", SN: "🇸🇳", CI: "🇨🇮", ML: "🇲🇱",
    BF: "🇧🇫", TG: "🇹🇬", GH: "🇬🇭", NG: "🇳🇬",
    CM: "🇨🇲", FR: "🇫🇷", MA: "🇲🇦",
};

// ── Composant principal ────────────────────────────────────
export default function CompaniesPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("admin.companies");
    const t = useTranslations("admin.companies");
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const router = useRouter();

    const [orgs, setOrgs]         = useState<Org[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [status, setStatus]     = useState("");
    const [module, setModule]     = useState("");
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]       = useState(0);
    const [countries, setCountries] = useState<CountryConfig[]>([]);

    useEffect(() => {
        countryConfigService.list()
        .then((list) => setCountries(list.filter((c) => c.isActive)))
        .catch(() => toast.error(t("errorLoadingCountries")));
    }, []);

    // Modales
    const [editOrg, setEditOrg]   = useState<Org | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [inviteOrg, setInviteOrg] = useState<Org | null>(null);

    // États actions
    const [processing, setProcessing] = useState<string | null>(null);
    const [editForm, setEditForm]     = useState<Partial<Org>>({});
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied]         = useState(false);

    // ── Chargement ──────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
        const res = await adminService.getOrganizations({
            page, limit: 10, search, status, module,
        });
        setOrgs(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        } catch {
        toast.error(t("errorLoadingCompanies"));
        } finally {
        setLoading(false);
        }
    }, [page, search, status, module]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, status, module]);

    // ── Actions ─────────────────────────────────────────────

    const handleEditOpen = (org: Org) => {
        setEditOrg(org);
        setEditForm({
        name:          org.name,
        businessEmail: org.businessEmail,
        country:       org.country,
        city:          org.city,
        phone:         org.phone,
        size:          org.size,
        industry:      org.industry,
        hasCSE:        org.hasCSE,
        hasVoyage:     org.hasVoyage,
        });
    };

    const handleEditSave = async () => {
        if (!editOrg) return;
        setProcessing("edit");
        try {
        // `plan`, `hasCSE` et `hasVoyage` ont leurs propres routes dédiées côté
        // backend (updateOrgSchema est `.strict()` et les rejette avec 400) — on
        // ne les envoie jamais dans le payload général, et les modules passent
        // par PATCH /organizations/:id/modules quand ils ont changé.
        const { hasCSE, hasVoyage, ...generalFields } = editForm;
        await adminService.updateOrganization(editOrg.id, generalFields);
        if (hasCSE !== editOrg.hasCSE || hasVoyage !== editOrg.hasVoyage) {
            await adminService.updateModules(editOrg.id, {
            hasCSE:    hasCSE ?? editOrg.hasCSE,
            hasVoyage: hasVoyage ?? editOrg.hasVoyage,
            });
        }
        toast.success(t("organizationUpdated"));
        setEditOrg(null);
        load();
        } catch {
        toast.error(t("updateError"));
        } finally {
        setProcessing(null);
        }
    };

    const handleSuspend = async (org: Org) => {
        setProcessing(org.id + "-suspend");
        try {
        await adminService.suspendOrganization(org.id);
        toast.success(t("organizationSuspended"));
        load();
        } catch {
        toast.error(t("error"));
        } finally {
        setProcessing(null);
        }
    };

    const handleReactivate = async (org: Org) => {
        setProcessing(org.id + "-reactivate");
        try {
        await adminService.reactivateOrganization(org.id);
        toast.success(t("organizationReactivated"));
        load();
        } catch {
        toast.error(t("reactivationError"));
        } finally {
        setProcessing(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setProcessing("delete");
        try {
        await adminService.deleteOrganization(deleteId);
        toast.success(t("organizationDeactivated"));
        setDeleteId(null);
        load();
        } catch {
        toast.error(t("deletionError"));
        } finally {
        setProcessing(null);
        }
    };

    const handleGenerateInvite = async (org: Org) => {
        setInviteOrg(org);
        setProcessing("invite");
        try {
        const res = await adminService.regenerateInvitation(org.id);
        setInviteLink(res.invitationLink);
        } catch {
        toast.error(t("linkGenerationError"));
        setInviteOrg(null);
        } finally {
        setProcessing(null);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success(t("linkCopied"));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExport = async () => {
        setProcessing("export");
        try {
        const blob = await adminService.exportOrganizations({ search, status, module });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `organisations-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        } catch {
        toast.error(t("errorDuringExport"));
        } finally {
        setProcessing(null);
        }
    };

    // ── Rendu ────────────────────────────────────────────────
    return (
        <div className="space-y-5">

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{t("companyManagement")}</h1>
            <p className="text-sm text-gray-500">
                {t("manageAdministerAllClient")}
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={handleExport}
                disabled={processing === "export"}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
                {processing === "export"
                ? <Loader2 size={15} className="animate-spin" />
                : <Download size={15} />}
                {t("export")}
            </button>
            <button
                onClick={() => router.push("/admin/companies/new")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
            >
                <Plus size={15} /> {t("addCompany")}
            </button>
            </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchCompany")}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
                <option value="">{t("allStatuses")}</option>
                <option value="PENDING">{t("pending")}</option>
                <option value="ACTIVE">{t("active")}</option>
                <option value="SUSPENDED">{t("suspended")}</option>
                <option value="REJECTED">{t("rejected")}</option>
            </select>
            <select value={module} onChange={(e) => setModule(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
                <option value="">{t("allModules")}</option>
                <option value="CSE">{t("afrikcse")}</option>
                <option value="VOYAGE">{t("afrikvoyage")}</option>
            </select>
            </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {[tr("company"), tr("country"), tr("modules"), tr("status"), tr("registrationDate"), tr("actions")].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                        <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : orgs.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                        {t("noCompanyFound")}
                    </td>
                    </tr>
                ) : (
                    orgs.map((org) => {
                    const st = STATUS_CONFIG[org.status] ?? STATUS_CONFIG.PENDING;
                    const isSuspending = processing === org.id + "-suspend";
                    const isReactivating = processing === org.id + "-reactivate";

                    return (
                        <tr key={org.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

                        {/* Entreprise */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                            <OrgAvatar name={org.name} />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{org.name}</p>
                                <p className="text-xs text-gray-500">{org.businessEmail}</p>
                            </div>
                            </div>
                        </td>

                        {/* Pays */}
                        <td className="px-5 py-3 text-sm text-gray-600">
                            {COUNTRY_FLAGS[org.country] ?? ""} {org.country}
                        </td>

                        {/* Modules */}
                        <td className="px-5 py-3">
                            <div className="flex gap-1.5 flex-wrap">
                            {org.hasCSE && <ModuleBadge label={t("afrikcse")} color="#0f766e" />}
                            {org.hasVoyage && <ModuleBadge label={t("afrikvoyage")} color="#f59e0b" />}
                            {!org.hasCSE && !org.hasVoyage && (
                                <span className="text-xs text-gray-400">—</span>
                            )}
                            </div>
                        </td>

                        {/* Statut */}
                        <td className="px-5 py-3">
                            <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ color: st.color, background: st.color + "18" }}
                            >
                            {st.label}
                            </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(org.createdAt).toLocaleDateString(dateLocale, {
                            day: "numeric", month: "short", year: "numeric",
                            })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                            {/* Voir */}
                            <ActionBtn
                                icon={<Eye size={14} />}
                                title={t("viewDetails")}
                                onClick={() => router.push(`/admin/companies/${org.id}`)}
                            />

                            {/* Modifier */}
                            <ActionBtn
                                icon={<Pencil size={14} />}
                                title={t("edit")}
                                onClick={() => handleEditOpen(org)}
                            />

                            {/* Suspendre / Réactiver */}
                            {org.status === "SUSPENDED" ? (
                                <ActionBtn
                                icon={isReactivating
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Play size={14} />}
                                title={t("reactivate")}
                                onClick={() => handleReactivate(org)}
                                color="#10b981"
                                />
                            ) : org.status === "ACTIVE" ? (
                                <ActionBtn
                                icon={isSuspending
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Pause size={14} />}
                                title={t("suspend")}
                                onClick={() => handleSuspend(org)}
                                color="#f59e0b"
                                />
                            ) : null}

                            {/* Lien invitation */}
                            <ActionBtn
                                icon={<Copy size={14} />}
                                title={t("generateInvitationLink")}
                                onClick={() => handleGenerateInvite(org)}
                                color="#6366f1"
                            />

                            {/* Supprimer */}
                            <ActionBtn
                                icon={<Trash2 size={14} />}
                                title={t("deactivate")}
                                onClick={() => setDeleteId(org.id)}
                                danger
                            />
                            </div>
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
                {t("showingCompanies", { length: orgs.length, total })}
            </p>
            <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                <ChevronLeft size={16} />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                    className="w-7 h-7 rounded text-xs font-medium"
                    style={page === i + 1
                    ? { background: "var(--color-primary)", color: "white" }
                    : { color: "#6b7280" }}>
                    {i + 1}
                </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                <ChevronRight size={16} />
                </button>
            </div>
            </div>
        </div>

        {/* ══════════════════════════════════════════
            MODAL : MODIFIER
        ══════════════════════════════════════════ */}
        {editOrg && (
            <Modal
            title={t("edit2", { name: editOrg.name })}
            onClose={() => setEditOrg(null)}
            size="lg"
            >
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t("companyName")} colSpan>
                    <input value={editForm.name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("businessEmail")} colSpan>
                    <input value={editForm.businessEmail ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, businessEmail: e.target.value })}
                    type="email" className={inp} />
                </Field>
                <Field label={t("country")}>
                    <select value={editForm.country ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className={inp}>
                    {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                    </select>
                </Field>
                <Field label={t("city")}>
                    <input value={editForm.city ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("phone")}>
                    <input value={editForm.phone ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("size")}>
                    <select value={editForm.size ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                    className={inp}>
                    {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                        <option key={s}>{s}</option>
                    ))}
                    </select>
                </Field>
                </div>

                {/* Modules — persisté séparément via PATCH /organizations/:id/modules,
                    pas via le payload général (voir handleEditSave). */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">{t("activeModules")}</p>
                <div className="flex gap-3">
                    {[
                    { key: "hasCSE" as const,    label: t("afrikcse"),    color: "#0f766e" },
                    { key: "hasVoyage" as const, label: t("afrikvoyage"), color: "#f59e0b" },
                    ].map((mod) => (
                    <label key={mod.key}
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm"
                        style={editForm[mod.key]
                        ? { borderColor: mod.color, background: mod.color + "10", color: mod.color }
                        : { borderColor: "#e5e7eb", color: "#6b7280" }}
                    >
                        <input type="checkbox"
                        checked={editForm[mod.key] ?? false}
                        onChange={(e) => setEditForm({ ...editForm, [mod.key]: e.target.checked })}
                        style={{ accentColor: mod.color }} />
                        {mod.label}
                    </label>
                    ))}
                </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setEditOrg(null)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                    {t("cancel")}
                </button>
                <button
                    onClick={handleEditSave}
                    disabled={processing === "edit"}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                    style={{ background: "var(--color-primary)" }}
                >
                    {processing === "edit"
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Save size={14} />}
                    {t("save")}
                </button>
                </div>
            </div>
            </Modal>
        )}

        {/* ══════════════════════════════════════════
            MODAL : LIEN INVITATION
        ══════════════════════════════════════════ */}
        {inviteOrg && (
            <Modal
            title={t("invitationLink", { name: inviteOrg.name })}
            onClose={() => { setInviteOrg(null); setInviteLink(""); }}
            >
            {processing === "invite" ? (
                <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
            ) : inviteLink ? (
                <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    {t.rich("sendLinkAdministratorWill", { name: inviteOrg.name, strong1: (chunks) => <strong>{chunks}</strong>, strong2: (chunks) => <strong>{chunks}</strong> })}
                </p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-mono text-gray-700 flex-1 truncate">
                    {inviteLink}
                    </p>
                    <button onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ color: copied ? "#10b981" : "#6b7280" }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
                <div className="p-3 rounded-xl text-xs"
                    style={{ background: "#fffbeb", color: "#92400e" }}>
                    {t("linkSingleUseOnce")}
                </div>
                <button
                    onClick={() => { setInviteOrg(null); setInviteLink(""); }}
                    className="w-full py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}
                >
                    {t("done")}
                </button>
                </div>
            ) : null}
            </Modal>
        )}

        {/* ══════════════════════════════════════════
            MODAL : CONFIRMATION SUPPRESSION
        ══════════════════════════════════════════ */}
        {deleteId && (
            <Modal title={t("confirmDeactivation")} onClose={() => setDeleteId(null)}>
            <p className="text-sm text-gray-500 mb-5">
                {t("actionWillDeactivate")}
            </p>
            <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                {t("cancel")}
                </button>
                <button
                onClick={handleDelete}
                disabled={processing === "delete"}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white bg-red-500 disabled:opacity-70"
                >
                {processing === "delete" && <Loader2 size={14} className="animate-spin" />}
                {t("deactivate")}
                </button>
            </div>
            </Modal>
        )}
        </div>
    );
}

// ── Composants utilitaires ─────────────────────────────────

function OrgAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors   = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0f766e"];
    const color    = colors[name.charCodeAt(0) % colors.length];
    const cls      = size === "lg"
        ? "w-14 h-14 rounded-xl text-lg"
        : "w-8 h-8 rounded-lg text-xs";
    return (
        <div
        className={`${cls} flex items-center justify-center text-white font-bold shrink-0`}
        style={{ background: color }}
        >
        {initials}
        </div>
    );
}

function ModuleBadge({ label, color }: { label: string; color: string }) {
    return (
        <span className="text-xs font-medium px-2 py-0.5 rounded"
        style={{ color, background: color + "18" }}>
        {label}
        </span>
    );
}

function ActionBtn({ icon, title, onClick, danger = false, color }: {
    icon:     React.ReactNode;
    title:    string;
    onClick:  () => void;
    danger?:  boolean;
    color?:   string;
}) {
    return (
        <button title={title} onClick={onClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        style={{ color: danger ? "#ef4444" : color ?? "#6b7280" }}>
        {icon}
        </button>
    );
}

function Field({ label, children, colSpan = false }: {
    label:    string;
    children: React.ReactNode;
    colSpan?: boolean;
}) {
    return (
        <div className={colSpan ? "col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        {children}
        </div>
    );
}

function Modal({ title, children, onClose, size = "md" }: {
    title:    string;
    children: React.ReactNode;
    onClose:  () => void;
    size?:    "md" | "lg";
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div
            className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ width: size === "lg" ? "640px" : "480px", maxWidth: "100%" }}
        >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
            </button>
            </div>
            <div className="p-5">{children}</div>
        </div>
        </div>
    );
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";
