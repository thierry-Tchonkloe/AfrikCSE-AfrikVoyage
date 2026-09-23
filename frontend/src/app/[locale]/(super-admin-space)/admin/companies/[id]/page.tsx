"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
    ArrowLeft, Pencil, Pause, Play, Trash2, Download, Copy, Check,
    X, Save, Loader2, RefreshCw, Mail, Phone, MapPin, Building2,
    Briefcase, Calendar, Users, TrendingUp, Plane, Gift, ShieldAlert,
} from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { countryConfigService, CountryConfig } from "@/services/admin/country-config.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";


type Translator = ReturnType<typeof useTranslations<"admin.companiesDetail">>;

// ── Types ──────────────────────────────────────────────────
interface OrgUser {
    id:          string;
    email:       string;
    firstName:   string;
    lastName:    string;
    role:        string;
    isActive:    boolean;
    lastLoginAt: string | null;
    avatar:      string | null;
    phone:       string | null;
    jobTitle:    string | null;
}

interface OrgDetail {
    id:            string;
    name:          string;
    email:         string | null;
    businessEmail: string | null;
    status:        string;
    hasCSE:        boolean;
    hasVoyage:     boolean;
    plan:          string;
    address:       string | null;
    city:          string | null;
    country:       string | null;
    postalCode:    string | null;
    region:        string | null;
    industry:      string | null;
    size:          string | null;
    phone:         string | null;
    createdAt:     string;
    validatedAt:   string | null;
    _count:        { users: number };
    users:         OrgUser[];
    subscription:  { status: string; currentPeriodEnd: string } | null;
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

const getRoleLabels = (tr: Translator): Record<string, string> => ({
    SUPER_ADMIN: "Super Admin",
    ADMIN:       tr("administrator"),
    MANAGER:     "Manager",
    RH:          tr("hr"),
    FINANCE:     "Finance",
    EMPLOYE:     tr("employee"),
});

/** Génère une valeur pseudo-aléatoire mais stable pour un seed donné (aperçu statistiques) */
function mockStat(seed: string, min: number, max: number): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return min + (hash % (max - min + 1));
}

// ── Composant principal ────────────────────────────────────
export default function CompanyDetailPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("admin.companiesDetail");
    const ROLE_LABELS = useMemo(() => getRoleLabels(tr), [tr]);
    const t = useTranslations("admin.companiesDetail");
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [org, setOrg]         = useState<OrgDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Modale édition
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<OrgDetail>>({});

    // Modale lien d'invitation / changement de responsable
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied]         = useState(false);

    // Modale suppression
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [countries, setCountries] = useState<CountryConfig[]>([]);
    useEffect(() => {
        countryConfigService.list()
        .then((list) => setCountries(list.filter((c) => c.isActive)))
        .catch(() => toast.error(t("errorLoadingCountries")));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const data = await adminService.getOrganization(id);
        setOrg(data);
        } catch {
        toast.error(t("companyNotFound"));
        router.push("/admin/companies");
        } finally {
        setLoading(false);
        }
    }, [id, router]);

    useEffect(() => { load(); }, [load]);

    // ── Actions ─────────────────────────────────────────────

    const handleEditOpen = () => {
        if (!org) return;
        setEditForm({
        name:          org.name,
        email:         org.email,
        businessEmail: org.businessEmail,
        phone:         org.phone,
        address:       org.address,
        city:          org.city,
        postalCode:    org.postalCode,
        region:        org.region,
        country:       org.country,
        industry:      org.industry,
        size:          org.size,
        });
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        if (!org) return;
        setProcessing("edit");
        try {
        await adminService.updateOrganization(org.id, editForm);
        toast.success(t("organizationUpdated"));
        setEditOpen(false);
        load();
        } catch {
        toast.error(t("errorWhileUpdating"));
        } finally {
        setProcessing(null);
        }
    };

    const handleSuspend = async () => {
        if (!org) return;
        setProcessing("suspend");
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

    const handleReactivate = async () => {
        if (!org) return;
        setProcessing("reactivate");
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

    const handleToggleModule = async (key: "hasCSE" | "hasVoyage") => {
        if (!org) return;
        if (org.status !== "ACTIVE") {
        toast.error(t("organizationMustActiveModify"));
        return;
        }
        setProcessing(key);
        try {
        await adminService.updateModules(org.id, {
            hasCSE:    key === "hasCSE" ? !org.hasCSE : org.hasCSE,
            hasVoyage: key === "hasVoyage" ? !org.hasVoyage : org.hasVoyage,
        });
        toast.success(t("modulesUpdated"));
        load();
        } catch {
        toast.error(t("errorUpdatingModules"));
        } finally {
        setProcessing(null);
        }
    };

    const handleGenerateInvite = async () => {
        if (!org) return;
        setInviteOpen(true);
        setInviteLink("");
        setProcessing("invite");
        try {
        const res = await adminService.regenerateInvitation(org.id);
        setInviteLink(res.invitationLink);
        } catch {
        toast.error(t("errorWhileGeneratingLink"));
        setInviteOpen(false);
        } finally {
        setProcessing(null);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDelete = async () => {
        if (!org) return;
        setProcessing("delete");
        try {
        await adminService.deleteOrganization(org.id);
        toast.success(t("organizationDeactivated"));
        router.push("/admin/companies");
        } catch {
        toast.error(t("errorWhileDeleting"));
        } finally {
        setProcessing(null);
        }
    };

    const handleExportPdf = () => {
        if (!org) return;
        const admin = org.users.find((u) => u.role === "ADMIN");
        const st = STATUS_CONFIG[org.status] ?? STATUS_CONFIG.PENDING;
        const w = window.open("", "_blank");
        if (!w) {
        toast.error(t("pleaseAllowPopUps"));
        return;
        }
        w.document.write(`<!DOCTYPE html><html><head><title>${t("exportSheetTitle", { name: org.name })}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
            td:first-child { color: #6b7280; width: 220px; }
            .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; }
        </style></head><body>
            <h1>${org.name}</h1>
            <span class="badge" style="background:${st.color}22; color:${st.color}">${st.label}</span>
            <h2>${t("generalInformation")}</h2>
            <table>
                <tr><td>${t("businessEmail")}</td><td>${org.businessEmail ?? "—"}</td></tr>
                <tr><td>${t("contactEmail")}</td><td>${org.email ?? "—"}</td></tr>
                <tr><td>${t("phone")}</td><td>${org.phone ?? "—"}</td></tr>
                <tr><td>${t("address")}</td><td>${[org.address, org.city, org.region, org.postalCode].filter(Boolean).join(", ") || "—"}</td></tr>
                <tr><td>${t("country")}</td><td>${org.country ?? "—"}</td></tr>
                <tr><td>${t("industry")}</td><td>${org.industry ?? "—"}</td></tr>
                <tr><td>${t("size")}</td><td>${org.size ?? "—"}</td></tr>
                <tr><td>${t("plan")}</td><td>${org.plan}</td></tr>
                <tr><td>${t("exportUsers")}</td><td>${org._count.users}</td></tr>
                <tr><td>${t("exportRegistrationDate")}</td><td>${new Date(org.createdAt).toLocaleDateString(dateLocale)}</td></tr>
                ${org.validatedAt ? `<tr><td>${t("exportValidationDate")}</td><td>${new Date(org.validatedAt).toLocaleDateString(dateLocale)}</td></tr>` : ""}
            </table>
            <h2>${t("modules")}</h2>
            <table>
                <tr><td>AfrikCSE</td><td>${org.hasCSE ? t("enabled") : t("disabled")}</td></tr>
                <tr><td>AfrikVoyage</td><td>${org.hasVoyage ? t("enabled") : t("disabled")}</td></tr>
                ${org.subscription ? `<tr><td>${t("exportSubscriptionValidUntil")}</td><td>${new Date(org.subscription.currentPeriodEnd).toLocaleDateString(dateLocale)}</td></tr>` : ""}
            </table>
            ${admin ? `<h2>${t("primaryContact")}</h2>
            <table>
                <tr><td>${t("exportName")}</td><td>${admin.firstName} ${admin.lastName}</td></tr>
                <tr><td>Email</td><td>${admin.email}</td></tr>
                <tr><td>${t("phone")}</td><td>${admin.phone ?? "—"}</td></tr>
            </table>` : ""}
            <p class="footer">${t("exportGeneratedOn", { date: new Date().toLocaleString(dateLocale) })} — AfrikCSE &amp; AfrikVoyage</p>
        </body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    };

    // ── Rendu ───────────────────────────────────────────────

    if (loading) {
        return <Skeleton />;
    }

    if (!org) return null;

    const admin = org.users.find((u) => u.role === "ADMIN") ?? org.users[0];

    const revenue = mockStat(org.id + "rev", 50000, 900000);
    const trips   = mockStat(org.id + "voy", 0, 45);
    const perks   = mockStat(org.id + "cse", 0, 130);

    return (
        <div className="space-y-5">
        {/* Retour */}
        <button
            onClick={() => router.push("/admin/companies")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
            <ArrowLeft size={15} /> {t("backCompanies")}
        </button>

        {/* En-tête */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <OrgAvatar name={org.name} size="lg" />
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
                <StatusBadge status={org.status} />
                </div>
                <p className="text-sm text-gray-500">
                {org.businessEmail ?? "—"} · {COUNTRY_FLAGS[org.country ?? ""] ?? ""} {org.country ?? "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                {t("created", { p1: new Date(org.createdAt).toLocaleDateString(dateLocale), p2: org.validatedAt ? t("validated", { p1: new Date(org.validatedAt).toLocaleDateString(dateLocale) }) : "" })}
                </p>
            </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
            <button
                onClick={handleEditOpen}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
            >
                <Pencil size={14} /> {t("edit")}
            </button>
            {org.status === "SUSPENDED" ? (
                <button
                onClick={handleReactivate}
                disabled={processing === "reactivate"}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium bg-green-500 disabled:opacity-60"
                >
                {processing === "reactivate" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {t("reactivate")}
                </button>
            ) : (
                <button
                onClick={handleSuspend}
                disabled={processing === "suspend" || org.status !== "ACTIVE"}
                title={org.status !== "ACTIVE" ? t("onlyActiveOrganizationsCan") : undefined}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium bg-amber-500 disabled:opacity-60"
                >
                {processing === "suspend" ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
                {t("suspend")}
                </button>
            )}
            <button
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
                <Download size={14} /> {t("exportRecord")}
            </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-5">
            {/* Informations générales */}
            <Section title={t("generalInformation")}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { icon: <Mail size={13} />,     label: t("businessEmail"), value: org.businessEmail ?? "—" },
                    { icon: <Mail size={13} />,     label: t("contactEmail"),    value: org.email ?? "—" },
                    { icon: <Phone size={13} />,    label: t("phone"),           value: org.phone ?? "—" },
                    { icon: <MapPin size={13} />,   label: t("address"),             value: [org.address, org.city].filter(Boolean).join(", ") || "—" },
                    { icon: <MapPin size={13} />,   label: t("regionPostalCode"), value: [org.region, org.postalCode].filter(Boolean).join(" · ") || "—" },
                    { icon: <Building2 size={13} />, label: t("country"),               value: `${COUNTRY_FLAGS[org.country ?? ""] ?? ""} ${org.country ?? "—"}` },
                    { icon: <Briefcase size={13} />, label: t("industry"),            value: org.industry ?? "—" },
                    { icon: <Users size={13} />,    label: t("sizeUsers"), value: tr("userS", { p1: org.size ?? "—", users: org._count.users }) },
                    { icon: <Calendar size={13} />, label: t("plan"),                value: org.plan },
                ].map((row) => (
                    <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">{row.icon} {row.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{row.value}</p>
                    </div>
                ))}
                </div>
            </Section>

            {/* Modules */}
            <Section title={t("modules")}>
                <div className="space-y-3">
                <ModuleRow
                    label={t("afrikcse")}
                    desc={tr("employeeCseBenefits")}
                    color="#0f766e"
                    checked={org.hasCSE}
                    disabled={org.status !== "ACTIVE" || processing === "hasCSE"}
                    loading={processing === "hasCSE"}
                    onToggle={() => handleToggleModule("hasCSE")}
                />
                <ModuleRow
                    label={t("afrikvoyage")}
                    desc={tr("businessTravelManagement")}
                    color="#f59e0b"
                    checked={org.hasVoyage}
                    disabled={org.status !== "ACTIVE" || processing === "hasVoyage"}
                    loading={processing === "hasVoyage"}
                    onToggle={() => handleToggleModule("hasVoyage")}
                />
                </div>
                {org.status !== "ACTIVE" && (
                <p className="text-xs text-gray-400 mt-3">
                    {t("modulesCanOnlyModified")}
                </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                {org.subscription
                    ? t("subscriptionValidUntil", { p1: new Date(org.subscription.currentPeriodEnd).toLocaleDateString(dateLocale) })
                    : t("noActiveSubscriptionNo")}
                </p>
            </Section>

            {/* Statistiques */}
            <Section title={t("statistics")} desc={tr("previewSampleDataAnalytics")}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatBox icon={<TrendingUp size={16} />} color="#10b981" label={t("monthlyRevenue")} value={`${revenue.toLocaleString(dateLocale)} XOF`} />
                <StatBox icon={<Plane size={16} />} color="#f59e0b" label={t("tripsBooked")} value={String(trips)} />
                <StatBox icon={<Gift size={16} />} color="#0f766e" label={t("cseBenefitsUsed")} value={String(perks)} />
                </div>
            </Section>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-5">
            {/* Responsable principal */}
            <Section title={t("primaryContact")}>
                {admin ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                    {admin.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={admin.avatar} alt="" className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                        <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                        style={{ background: "var(--color-primary)" }}
                        >
                        {admin.firstName[0]}{admin.lastName[0]}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{admin.firstName} {admin.lastName}</p>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                        <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                        {ROLE_LABELS[admin.role] ?? admin.role}
                        </span>
                    </div>
                    </div>
                    {admin.phone && <p className="text-xs text-gray-500">📞 {admin.phone}</p>}
                    {admin.jobTitle && <p className="text-xs text-gray-500">💼 {admin.jobTitle}</p>}
                    <button
                    onClick={handleGenerateInvite}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                    <RefreshCw size={14} /> {t("change")}
                    </button>
                </div>
                ) : (
                <div className="space-y-3">
                    <p className="text-sm text-gray-400">{t("noContactAssigned")}</p>
                    <button
                    onClick={handleGenerateInvite}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}
                    >
                    <RefreshCw size={14} /> {t("generateInvitationLink")}
                    </button>
                </div>
                )}
            </Section>

            {/* Actions admin */}
            <Section title={t("adminActions")}>
                <div className="space-y-2">
                <button
                    onClick={handleGenerateInvite}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                    <RefreshCw size={14} /> {t("regenerateInvitationLink")}
                </button>
                <button
                    onClick={() => setDeleteOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-500 hover:bg-red-50"
                >
                    <Trash2 size={14} /> {t("deleteOrganization")}
                </button>
                </div>
            </Section>
            </div>
        </div>

        {/* ══════════ MODAL : MODIFIER ══════════ */}
        {editOpen && (
            <Modal title={t("edit2", { name: org.name })} onClose={() => setEditOpen(false)} size="lg">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t("companyName")} colSpan>
                    <input value={editForm.name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("businessEmail")}>
                    <input value={editForm.businessEmail ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, businessEmail: e.target.value })}
                    type="email" className={inp} />
                </Field>
                <Field label={t("contactEmail")}>
                    <input value={editForm.email ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    type="email" className={inp} />
                </Field>
                <Field label={t("phone")}>
                    <input value={editForm.phone ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={inp} />
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
                <Field label={t("region")}>
                    <input value={editForm.region ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("postalCode")}>
                    <input value={editForm.postalCode ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("address")} colSpan>
                    <input value={editForm.address ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className={inp} />
                </Field>
                <Field label={t("industry")}>
                    <input value={editForm.industry ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
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
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                    {t("cancel")}
                </button>
                <button
                    onClick={handleEditSave}
                    disabled={processing === "edit"}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                    style={{ background: "var(--color-primary)" }}
                >
                    {processing === "edit" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {t("save")}
                </button>
                </div>
            </div>
            </Modal>
        )}

        {/* ══════════ MODAL : LIEN D'INVITATION ══════════ */}
        {inviteOpen && (
            <Modal title={t("invitationLink")} onClose={() => setInviteOpen(false)}>
            <div className="space-y-3">
                <p className="text-xs text-gray-500">
                {t("passLinkCompanysManager")}
                </p>
                {processing === "invite" ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="animate-spin text-gray-400" />
                </div>
                ) : (
                <div className="flex items-center gap-2">
                    <input readOnly value={inviteLink} className={inp + " text-xs"} />
                    <button onClick={handleCopy} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                    {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                    </button>
                </div>
                )}
            </div>
            </Modal>
        )}

        {/* ══════════ MODAL : SUPPRESSION ══════════ */}
        {deleteOpen && (
            <Modal title={t("deleteOrganization")} onClose={() => setDeleteOpen(false)}>
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-600">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm">
                    {t("actionWillDeactivate")} <strong>{org.name}</strong> {t("allItsUsersAction")}
                </p>
                </div>
                <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                    {t("cancel")}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={processing === "delete"}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white bg-red-500 disabled:opacity-70"
                >
                    {processing === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {t("delete")}
                </button>
                </div>
            </div>
            </Modal>
        )}
        </div>
    );
}

// ── Composants utilitaires ─────────────────────────────────

function Skeleton() {
    return (
        <div className="space-y-5 animate-pulse">
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100" />
            <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-100 rounded" />
                <div className="h-3 w-56 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
            </div>
            <div className="flex gap-2">
            <div className="h-9 w-28 bg-gray-100 rounded-lg" />
            <div className="h-9 w-28 bg-gray-100 rounded-lg" />
            <div className="h-9 w-32 bg-gray-100 rounded-lg" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
            <div className="h-40 bg-white rounded-xl border border-gray-200" />
            <div className="h-32 bg-white rounded-xl border border-gray-200" />
            <div className="h-28 bg-white rounded-xl border border-gray-200" />
            </div>
            <div className="space-y-5">
            <div className="h-44 bg-white rounded-xl border border-gray-200" />
            <div className="h-32 bg-white rounded-xl border border-gray-200" />
            </div>
        </div>
        </div>
    );
}

function Section({ title, desc, children }: {
    title:    string;
    desc?:    string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {desc && <p className="text-xs text-gray-400 mb-3">{desc}</p>}
        <div className={desc ? "" : "mt-3"}>{children}</div>
        </div>
    );
}

function StatBox({ icon, color, label, value }: {
    icon:  React.ReactNode;
    color: string;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1" style={{ color }}>
            {icon}
            <span className="text-xs text-gray-500">{label}</span>
        </div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}

function ModuleRow({ label, desc, color, checked, disabled, loading, onToggle }: {
    label:    string;
    desc:     string;
    color:    string;
    checked:  boolean;
    disabled: boolean;
    loading:  boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className="relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50"
            style={{ background: checked ? color : "#d1d5db" }}
        >
            {loading ? (
            <Loader2 size={12} className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
            ) : (
            <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: checked ? "translateX(20px)" : "translateX(0px)" }}
            />
            )}
        </button>
        </div>
    );
}

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

function StatusBadge({ status }: { status: string }) {
    const t = useTranslations("admin.companiesDetail");
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ color: st.color, background: st.color + "18" }}>
        {st.label}
        </span>
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
