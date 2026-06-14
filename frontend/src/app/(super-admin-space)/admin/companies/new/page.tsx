"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
    name: z.string().min(2, "Nom requis"),
    businessEmail: z.string().email("Email invalide").optional().or(z.literal("")),
    country: z.string().min(1, "Pays requis"),
    phone: z.string().optional(),
    city: z.string().optional(),
    plan: z.enum(["STARTER", "BUSINESS", "ENTERPRISE"]),
    status: z.enum(["PENDING", "ACTIVE"]),
    hasCSE: z.boolean(),
    hasVoyage: z.boolean(),
    adminFirstName: z.string().min(1, "Prénom requis"),
    adminLastName: z.string().min(1, "Nom requis"),
    adminEmail: z.string().email("Email admin invalide"),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const COUNTRIES = [
    { code: "BJ", name: "Bénin" }, { code: "SN", name: "Sénégal" },
    { code: "CI", name: "Côte d'Ivoire" }, { code: "ML", name: "Mali" },
    { code: "BF", name: "Burkina Faso" }, { code: "TG", name: "Togo" },
    { code: "GH", name: "Ghana" }, { code: "NG", name: "Nigeria" },
    { code: "CM", name: "Cameroun" }, { code: "MA", name: "Maroc" },
    { code: "FR", name: "France" },
];

export default function NewCompanyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        invitationLink: string;
        org: { name: string; id: string };
    } | null>(null);
    const [copied, setCopied] = useState(false);

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
        toast.success("Entreprise créée avec succès");
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur création"));
        } finally {
        setLoading(false);
        }
    };

    const copyLink = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result.invitationLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Lien copié !");
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
                Entreprise créée !
            </h2>
            <p className="text-sm text-gray-500">
                Envoyez ce lien d&apos;activation à l&apos;administrateur de{" "}
                <strong>{result.org.name}</strong>. Il lui permettra de définir
                son mot de passe et d&apos;accéder à son espace.
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
                Ce lien est valable <strong>7 jours</strong>. Après expiration,
                vous devrez en générer un nouveau depuis le détail de l&apos;entreprise.
            </div>

            <div className="flex gap-2 pt-2">
                <button
                onClick={() => router.push("/admin/companies")}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                Retour à la liste
                </button>
                <button
                onClick={() => router.push(`/admin/companies/${result.org.id}`)}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
                >
                Voir l&apos;entreprise
                </button>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => router.push("/admin/companies")}
            className="hover:underline flex items-center gap-1">
            <ArrowLeft size={14} /> Retour à la liste
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Créer une entreprise</span>
        </div>

        <div>
            <h1 className="text-xl font-bold text-gray-900">Créer une nouvelle entreprise</h1>
            <p className="text-sm text-gray-500">
            Configurez les informations et modules pour une nouvelle entreprise cliente.
            </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ── Infos entreprise ── */}
            <Section title="Informations de l'entreprise">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nom de l'entreprise *" error={errors.name?.message} colSpan>
                <input {...register("name")} placeholder="Ex: TechCorp Afrique" className={inp} />
                </Field>
                <Field label="Email professionnel" error={errors.businessEmail?.message}>
                <input {...register("businessEmail")} type="email" placeholder="contact@entreprise.com" className={inp} />
                </Field>
                <Field label="Téléphone">
                <input {...register("phone")} placeholder="+221 XX XXX XX XX" className={inp} />
                </Field>
                <Field label="Pays *" error={errors.country?.message}>
                <select {...register("country")} className={inp}>
                    <option value="">Sélectionner</option>
                    {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
                </Field>
                <Field label="Ville">
                <input {...register("city")} placeholder="Ex: Dakar" className={inp} />
                </Field>
            </div>
            </Section>

            {/* ── Modules & Plan ── */}
            <Section title="Modules & Plan">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Modules */}
                <Field label="Modules à activer" colSpan={false}>
                <div className="space-y-2">
                    {[
                    { field: "hasCSE" as const, label: "AfrikCSE", desc: "Avantages salariés et CSE" },
                    { field: "hasVoyage" as const, label: "AfrikVoyage", desc: "Voyages d'affaires" },
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
                <Field label="Plan *" error={errors.plan?.message}>
                    <select {...register("plan")} className={inp}>
                    <option value="STARTER">Starter — Gratuit</option>
                    <option value="BUSINESS">Business — Sur devis</option>
                    <option value="ENTERPRISE">Enterprise — Sur devis</option>
                    </select>
                </Field>
                <Field label="Statut initial *" error={errors.status?.message}>
                    <select {...register("status")} className={inp}>
                    <option value="PENDING">En attente</option>
                    <option value="ACTIVE">Actif directement</option>
                    </select>
                </Field>
                <p className="text-xs text-gray-500">
                    Le statut &#34;En attente&#34; permet de préparer le compte avant activation.
                </p>
                </div>
            </div>

            {/* Notes */}
            <Field label="Notes additionnelles">
                <textarea
                {...register("notes")}
                rows={3}
                placeholder="Informations complémentaires sur l'entreprise..."
                className={inp + " resize-none"}
                />
            </Field>
            </Section>

            {/* ── Compte administrateur ── */}
            <Section title="Compte administrateur">
            <p className="text-xs text-gray-500 mb-3">
                Un lien d&apos;activation sera généré pour cet administrateur après création.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prénom *" error={errors.adminFirstName?.message}>
                <input {...register("adminFirstName")} placeholder="Ex: Jean" className={inp} />
                </Field>
                <Field label="Nom *" error={errors.adminLastName?.message}>
                <input {...register("adminLastName")} placeholder="Ex: Dupont" className={inp} />
                </Field>
                <Field label="Email *" error={errors.adminEmail?.message} colSpan>
                <input {...register("adminEmail")} type="email" placeholder="admin@entreprise.com" className={inp} />
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
                Annuler
            </button>
            <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-70"
                style={{ background: "var(--color-primary)" }}
            >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Enregistrer l&apos;entreprise
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