"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { countryConfigService, CountryConfig } from "@/services/admin/country-config.service";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"admin.companiesNew">>;

const getSchema = (t: Translator) => (z.object({
    name: z.string().min(2, t("nameRequired")),
    businessEmail: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
    country: z.string().min(1, t("countryRequired")),
    phone: z.string().optional(),
    city: z.string().optional(),
    plan: z.enum(["STARTER", "BUSINESS", "ENTERPRISE"]),
    status: z.enum(["PENDING", "ACTIVE"]),
    hasCSE: z.boolean(),
    hasVoyage: z.boolean(),
    adminFirstName: z.string().min(1, t("firstNameRequired")),
    adminLastName: z.string().min(1, t("lastNameRequired")),
    adminEmail: z.string().email(t("invalidAdminEmail")),
    notes: z.string().optional(),
}));

type FormData = z.infer<ReturnType<typeof getSchema>>;

export default function NewCompanyPage() {
    const t = useTranslations("admin.companiesNew");
    const schema = useMemo(() => getSchema(t), [t]);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState<CountryConfig[]>([]);
    const [result, setResult] = useState<{
        invitationLink: string;
        org: { name: string; id: string };
    } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        countryConfigService.list()
        .then((list) => setCountries(list.filter((c) => c.isActive)))
        .catch(() => toast.error(t("errorLoadingCountries")));
    }, []);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
        plan: "STARTER",
        status: "PENDING",
        hasCSE: false,
        hasVoyage: false,
        },
    });

    const onSubmit = async (data: FormData): Promise<void> => {
        setLoading(true);
        try {
        const res = await adminService.createOrganization(data);
        setResult({ invitationLink: res.invitationLink, org: res.org });
        toast.success(t("companyCreatedSuccessfully"));
        } catch (err) {
        toast.error(getErrorMessage(err, t("creationError")));
        } finally {
        setLoading(false);
        }
    };

    const copyLink = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result.invitationLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t("linkCopied"));
    };

    // ── Succès : affiche le lien d'invitation ──
    if (result) {
        return (
        <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "#f0fdf4" }}
            >
                <Check size={32} style={{ color: "#10b981" }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
                {t("companyCreated")}
            </h2>
            <p className="text-sm text-gray-500">
                {t("sendActivationLink")}{" "}
                <strong>{result.org.name}</strong>{t("willLetThemSet")}
            </p>

            {/* Lien d'invitation */}
            <div className="rounded-xl border border-gray-200 p-3 flex items-center gap-2 text-left">
                <p className="text-xs text-gray-600 flex-1 truncate font-mono">
                {result.invitationLink}
                </p>
                <button
                onClick={copyLink}
                className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: copied ? "#10b981" : "#6b7280" }}
                >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>

            <div
                className="rounded-xl p-3 text-xs text-left"
                style={{ background: "#fffbeb", color: "#92400e" }}
            >
                {t.rich("linkValid7Days", { strong1: (chunks) => <strong>{chunks}</strong> })}
            </div>

            <div className="flex gap-2 pt-2">
                <button
                onClick={() => router.push("/admin/companies")}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                {t("backList")}
                </button>
                <button
                onClick={() => router.push(`/admin/companies/${result.org.id}`)}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
                >
                {t("viewCompany")}
                </button>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => router.push("/admin/companies")}
            className="hover:underline flex items-center gap-1">
            <ArrowLeft size={14} /> {t("backList")}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{t("createCompany")}</span>
        </div>

        <div>
            <h1 className="text-xl font-bold text-gray-900">{t("createNewCompany")}</h1>
            <p className="text-sm text-gray-500">
            {t("setUpInformationModules")}
            </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ── Infos entreprise ── */}
            <Section title={t("companyInformation")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t("companyName")} error={errors.name?.message} colSpan>
                <input {...register("name")} placeholder={t("eGTechcorpAfrica")} className={inp} />
                </Field>
                <Field label={t("businessEmail")} error={errors.businessEmail?.message}>
                <input {...register("businessEmail")} type="email" placeholder={t("emailPlaceholderContact")} className={inp} />
                </Field>
                <Field label={t("phone")}>
                <input {...register("phone")} placeholder={t("text221XxXxxXx")} className={inp} />
                </Field>
                <Field label={t("country")} error={errors.country?.message}>
                <select {...register("country")} className={inp}>
                    <option value="">{t("select")}</option>
                    {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
                </Field>
                <Field label={t("city")}>
                <input {...register("city")} placeholder={t("eGDakar")} className={inp} />
                </Field>
            </div>
            </Section>

            {/* ── Modules & Plan ── */}
            <Section title={t("modulesPlan")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Modules */}
                <Field label={t("modulesActivate")} colSpan={false}>
                <div className="space-y-2">
                    {[
                    { field: "hasCSE" as const, label: t("afrikcse"), desc: t("employeeCseBenefits") },
                    { field: "hasVoyage" as const, label: t("afrikvoyage"), desc: t("businessTravel") },
                    ].map((mod) => (
                    <label key={mod.field}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                        {...register(mod.field)}
                        type="checkbox"
                        className="w-4 h-4"
                        style={{ accentColor: "var(--color-primary)" }}
                        />
                        <div>
                        <p className="text-sm font-medium text-gray-900">{mod.label}</p>
                        <p className="text-xs text-gray-500">{mod.desc}</p>
                        </div>
                    </label>
                    ))}
                </div>
                </Field>

                {/* Plan + Statut */}
                <div className="space-y-3">
                <Field label={t("plan")} error={errors.plan?.message}>
                    <select {...register("plan")} className={inp}>
                    <option value="STARTER">{t("starterFree")}</option>
                    <option value="BUSINESS">{t("businessQuote")}</option>
                    <option value="ENTERPRISE">{t("enterpriseQuote")}</option>
                    </select>
                </Field>
                <Field label={t("initialStatus")} error={errors.status?.message}>
                    <select {...register("status")} className={inp}>
                    <option value="PENDING">{t("pending")}</option>
                    <option value="ACTIVE">{t("activeImmediately")}</option>
                    </select>
                </Field>
                <p className="text-xs text-gray-500">
                    {t("pendingStatusLetsPrepare")}
                </p>
                </div>
            </div>

            {/* Notes */}
            <Field label={t("additionalNotes")}>
                <textarea
                {...register("notes")}
                rows={3}
                placeholder={t("additionalInformationAbout")}
                className={inp + " resize-none"}
                />
            </Field>
            </Section>

            {/* ── Compte administrateur ── */}
            <Section title={t("administratorAccount")}>
            <p className="text-xs text-gray-500 mb-3">
                {t("activationLinkWillGenerated")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t("firstName")} error={errors.adminFirstName?.message}>
                <input {...register("adminFirstName")} placeholder={t("eGJohn")} className={inp} />
                </Field>
                <Field label={t("lastName")} error={errors.adminLastName?.message}>
                <input {...register("adminLastName")} placeholder={t("eGDoe")} className={inp} />
                </Field>
                <Field label={t("email")} error={errors.adminEmail?.message} colSpan>
                <input {...register("adminEmail")} type="email" placeholder={t("emailPlaceholderAdmin")} className={inp} />
                </Field>
            </div>
            </Section>

            {/* Boutons */}
            <div className="flex justify-end gap-3">
            <button
                type="button"
                onClick={() => router.push("/admin/companies")}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
                {t("cancel")}
            </button>
            <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-70"
                style={{ background: "var(--color-primary)" }}
            >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {t("saveCompany")}
            </button>
            </div>
        </form>
        </div>
    );
}

// ── Composants utilitaires ──

const inp = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-400 bg-white text-gray-900";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">{title}</h3>
        {children}
        </div>
    );
}

function Field({
    label, error, children, colSpan = false,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    colSpan?: boolean;
}) {
    return (
        <div className={colSpan ? "sm:col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}