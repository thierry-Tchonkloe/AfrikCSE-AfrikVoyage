"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/errors";

// ── Schémas par étape ────────────────────────────────────

const step1Schema = z.object({
    companyName: z.string().min(2, "Nom requis"),
    businessEmail: z.string().email("Email invalide"),
    country: z.string().min(1, "Pays requis"),
    phone: z.string().min(8, "Téléphone requis"),
    size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
    industry: z.string().min(1, "Secteur requis"),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
});

const step2Schema = z.object({
    requestVoyage: z.boolean(),
    requestCSE: z.boolean(),
});

const step3Schema = z.object({
    plan: z.enum(["STARTER", "BUSINESS", "ENTERPRISE"]),
});

const step4Schema = z.object({
    adminFirstName: z.string().min(1, "Prénom requis"),
    adminLastName: z.string().min(1, "Nom requis"),
    adminEmail: z.string().email("Email invalide"),
    adminPassword: z
        .string()
        .min(8, "Minimum 8 caractères")
        .regex(/[A-Z]/, "Au moins une majuscule")
        .regex(/[0-9]/, "Au moins un chiffre"),
    confirmPassword: z.string(),
}).refine((d) => d.adminPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

// ── Données des étapes ───────────────────────────────────

const STEPS = [
    { id: 1, label: "Infos entreprise" },
    { id: 2, label: "Modules" },
    { id: 3, label: "Plan" },
    { id: 4, label: "Confirmation" },
];

const PLANS = [
    {
        id: "STARTER" as const,
        name: "Starter",
        price: "Gratuit",
        desc: "Pour démarrer",
        features: ["1 module", "Jusqu'à 50 employés", "Support email"],
    },
    {
        id: "BUSINESS" as const,
        name: "Business",
        price: "Sur devis",
        desc: "Pour les PME",
        features: ["2 modules", "Jusqu'à 500 employés", "Support prioritaire", "Reporting avancé"],
        popular: true,
    },
    {
        id: "ENTERPRISE" as const,
        name: "Enterprise",
        price: "Sur devis",
        desc: "Pour les grandes entreprises",
        features: ["Tous les modules", "Employés illimités", "Support dédié 24/7", "API & intégrations"],
    },
];

const INDUSTRIES = [
    "Technologie", "Finance", "Santé", "Éducation", "Commerce",
    "Industrie", "Transport", "Agriculture", "Services", "Autre",
];

const COUNTRIES = [
    { code: "BJ", name: "Bénin" },
    { code: "SN", name: "Sénégal" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "ML", name: "Mali" },
    { code: "BF", name: "Burkina Faso" },
    { code: "TG", name: "Togo" },
    { code: "GH", name: "Ghana" },
    { code: "NG", name: "Nigeria" },
    { code: "CM", name: "Cameroun" },
    { code: "FR", name: "France" },
];

// ── Composant principal ──────────────────────────────────

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Accumule les données des 4 étapes
    type AllStepsData = Step1Data & Step2Data & Step3Data & Omit<Step4Data, "confirmPassword">;

    const [formData, setFormData] = useState<Partial<AllStepsData>>({
        requestVoyage: false,
        requestCSE: false,
        plan: "STARTER",
    });

    // ── Formulaire étape 1 ──
    const form1 = useForm<Step1Data>({
        resolver: zodResolver(step1Schema),
        defaultValues: formData,
    });

    // ── Formulaire étape 2 ──
    const form2 = useForm<Step2Data>({
        defaultValues: { requestVoyage: false, requestCSE: false },
    });

    // ── Formulaire étape 3 ──
    const form3 = useForm<Step3Data>({
        resolver: zodResolver(step3Schema),
        defaultValues: { plan: "STARTER" },
    });

    // ── Formulaire étape 4 ──
    const form4 = useForm<Step4Data>({
        resolver: zodResolver(step4Schema),
        defaultValues: {
        adminFirstName: "",
        adminLastName: "",
        adminEmail: formData.businessEmail || "",
        adminPassword: "",
        confirmPassword: "",
        },
    });

    const nextStep = (data: Partial<AllStepsData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    // ── Soumission finale étape 4 ──
    const onSubmit = async (data: Step4Data) => {
        setLoading(true);

        // Backend expects admin email under the key `email` (not `adminEmail`).
        const payload = { ...formData, ...data, email: (data as any).adminEmail ?? (formData as any).adminEmail };

        try {
        await authService.registerCompany(payload);
        toast.success("Demande envoyée ! Vous serez notifié par email après validation.");
        router.push("/login");
        } catch (err) {
        toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4" style={{ background: "var(--color-bg)" }}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: "var(--color-primary)" }}
            >
                A
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>
                AfrikCSE & AfrikVoyage
            </span>
            </div>
        </div>

        {/* Titre */}
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Créer votre compte entreprise
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
            Rejoignez des centaines d`entreprises qui gèrent voyages et avantages salariés efficacement
            </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-10 max-w-lg mx-auto">
            {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                    style={{
                    background: step > s.id
                        ? "var(--color-primary)"
                        : step === s.id
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    color: step >= s.id ? "white" : "var(--color-muted)",
                    }}
                >
                    {step > s.id ? <Check size={16} /> : s.id}
                </div>
                <span
                    className="text-xs mt-1.5 text-center hidden sm:block"
                    style={{ color: step === s.id ? "var(--color-primary)" : "var(--color-muted)" }}
                >
                    {s.label}
                </span>
                </div>
                {i < STEPS.length - 1 && (
                <div
                    className="h-0.5 flex-1 mx-1 mt-4"
                    style={{
                    background: step > s.id ? "var(--color-primary)" : "var(--color-border)",
                    }}
                />
                )}
            </div>
            ))}
        </div>

        {/* Card */}
        <div
            className="max-w-xl mx-auto rounded-2xl p-8 shadow-sm border"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            {/* ── Étape 1 : Infos entreprise ── */}
            {step === 1 && (
            <form onSubmit={form1.handleSubmit((data) => nextStep(data))} className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>
                Informations entreprise
                </h2>

                <div className="grid grid-cols-2 gap-4">
                <Field label="Nom de l'entreprise *" error={form1.formState.errors.companyName?.message} colSpan>
                    <input {...form1.register("companyName")} placeholder="Acme Corp" className={inputCls} />
                </Field>
                <Field label="Email professionnel *" error={form1.formState.errors.businessEmail?.message} colSpan>
                    <input {...form1.register("businessEmail")} type="email" placeholder="admin@entreprise.com" className={inputCls} />
                </Field>
                <Field label="Pays *" error={form1.formState.errors.country?.message}>
                    <select {...form1.register("country")} className={inputCls}>
                    <option value="">Sélectionner</option>
                    {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                    </select>
                </Field>
                <Field label="Téléphone *" error={form1.formState.errors.phone?.message}>
                    <input {...form1.register("phone")} placeholder="+229 XX XX XX XX" className={inputCls} />
                </Field>
                <Field label="Taille *" error={form1.formState.errors.size?.message}>
                    <select {...form1.register("size")} className={inputCls}>
                    <option value="">Sélectionner</option>
                    {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                        <option key={s} value={s}>{s} employés</option>
                    ))}
                    </select>
                </Field>
                <Field label="Secteur *" error={form1.formState.errors.industry?.message}>
                    <select {...form1.register("industry")} className={inputCls}>
                    <option value="">Sélectionner</option>
                    {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                    </select>
                </Field>
                <Field label="Adresse" colSpan>
                    <input {...form1.register("address")} placeholder="Rue, quartier..." className={inputCls} />
                </Field>
                <Field label="Ville">
                    <input {...form1.register("city")} placeholder="Cotonou" className={inputCls} />
                </Field>
                <Field label="Code postal">
                    <input {...form1.register("postalCode")} placeholder="01 BP..." className={inputCls} />
                </Field>
                </div>

                <StepNav onPrev={null} loading={false} isLast={false} />
            </form>
            )}

            {/* ── Étape 2 : Choix des modules ── */}
            {step === 2 && (
            <form onSubmit={form2.handleSubmit((data) => nextStep(data))} className="space-y-4">
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>
                Modules souhaités
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                Sélectionnez les modules à activer. L`activation est confirmée par notre équipe.
                </p>

                <div className="space-y-4">
                {[
                    {
                    field: "requestCSE" as const,
                    title: "AfrikCSE",
                    desc: "Gestion des avantages salariés, billetterie, subventions et communication CSE",
                    features: ["Catalogue d'offres", "Billetterie", "Budgets CSE"],
                    },
                    {
                    field: "requestVoyage" as const,
                    title: "AfrikVoyage",
                    desc: "Gestion des voyages d'affaires, notes de frais et politiques de déplacement",
                    features: ["Réservations", "Notes de frais", "Reporting"],
                    },
                ].map((mod) => {
                    const checked = form2.watch(mod.field);
                    return (
                    <label
                        key={mod.field}
                        className="flex gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                        style={{
                        borderColor: checked ? "var(--color-primary)" : "var(--color-border)",
                        background: checked ? "var(--color-primary-light)" : "var(--color-card)",
                        }}
                    >
                        <input
                        {...form2.register(mod.field)}
                        type="checkbox"
                        className="mt-1 w-4 h-4"
                        style={{ accentColor: "var(--color-primary)" }}
                        />
                        <div>
                        <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                            {mod.title}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
                            {mod.desc}
                        </p>
                        <ul className="mt-2 space-y-0.5">
                            {mod.features.map((f) => (
                            <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                                <Check size={12} style={{ color: "var(--color-primary)" }} /> {f}
                            </li>
                            ))}
                        </ul>
                        </div>
                    </label>
                    );
                })}
                </div>

                <StepNav onPrev={prevStep} loading={false} isLast={false} />
            </form>
            )}

            {/* ── Étape 3 : Plan ── */}
            {step === 3 && (
            <form onSubmit={form3.handleSubmit((data) => nextStep(data))} className="space-y-4">
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>
                Choisissez votre plan
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                Vous pourrez changer de plan à tout moment.
                </p>

                <div className="space-y-3">
                {PLANS.map((plan) => {
                    const selected = form3.watch("plan") === plan.id;
                    return (
                    <label
                        key={plan.id}
                        className="flex gap-4 p-4 rounded-xl border cursor-pointer transition-all relative"
                        style={{
                        borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                        background: selected ? "var(--color-primary-light)" : "var(--color-card)",
                        }}
                    >
                        <input
                        {...form3.register("plan")}
                        type="radio"
                        value={plan.id}
                        className="mt-1"
                        style={{ accentColor: "var(--color-primary)" }}
                        />
                        <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                            {plan.name}
                            </span>
                            {plan.popular && (
                            <span
                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ background: "var(--color-secondary)" }}
                            >
                                Populaire
                            </span>
                            )}
                            <span className="ml-auto font-bold" style={{ color: "var(--color-primary)" }}>
                            {plan.price}
                            </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                            {plan.desc}
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                            {plan.features.map((f) => (
                            <li key={f} className="text-xs flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
                                <Check size={11} style={{ color: "var(--color-primary)" }} /> {f}
                            </li>
                            ))}
                        </ul>
                        </div>
                    </label>
                    );
                })}
                </div>

                <StepNav onPrev={prevStep} loading={false} isLast={false} />
            </form>
            )}

            {/* ── Étape 4 : Compte administrateur ── */}
            {step === 4 && (
            <form onSubmit={form4.handleSubmit((data) => onSubmit(data))} className="space-y-4">
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>
                Compte administrateur
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                Ces identifiants vous permettront de vous connecter une fois votre compte validé.
                </p>

                <div className="grid grid-cols-2 gap-4">
                <Field label="Prénom *" error={form4.formState.errors.adminFirstName?.message}>
                    <input {...form4.register("adminFirstName")} placeholder="Marie" className={inputCls} />
                </Field>
                <Field label="Nom *" error={form4.formState.errors.adminLastName?.message}>
                    <input {...form4.register("adminLastName")} placeholder="Dubois" className={inputCls} />
                </Field>
                <Field label="Email *" error={form4.formState.errors.adminEmail?.message} colSpan>
                    <input {...form4.register("adminEmail")} type="email" placeholder="admin@entreprise.com" className={inputCls} />
                </Field>
                <Field label="Mot de passe *" error={form4.formState.errors.adminPassword?.message} colSpan>
                    <input {...form4.register("adminPassword")} type="password" placeholder="Min. 8 car., 1 maj., 1 chiffre" className={inputCls} />
                </Field>
                <Field label="Confirmer le mot de passe *" error={form4.formState.errors.confirmPassword?.message} colSpan>
                    <input {...form4.register("confirmPassword")} type="password" placeholder="••••••••" className={inputCls} />
                </Field>
                </div>

                {/* Récapitulatif */}
                <div
                className="rounded-xl p-4 mt-2 space-y-1"
                style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary)" }}
                >
                <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                    Récapitulatif de votre demande
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    Entreprise : <strong>{formData.companyName}</strong>
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    Plan : <strong>{formData.plan}</strong>
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    Modules : <strong>
                    {[formData.requestCSE && "AfrikCSE", formData.requestVoyage && "AfrikVoyage"]
                        .filter(Boolean).join(", ") || "Aucun sélectionné"}
                    </strong>
                </p>
                </div>

                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                En soumettant, vous acceptez nos{" "}
                <a href="/terms" className="underline" style={{ color: "var(--color-primary)" }}>
                    conditions d`utilisation
                </a>{" "}
                et notre{" "}
                <a href="/privacy" className="underline" style={{ color: "var(--color-primary)" }}>
                    politique de confidentialité
                </a>.
                </p>

                <StepNav onPrev={prevStep} loading={loading} isLast />
            </form>
            )}
        </div>

        {/* Lien retour login */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--color-muted)" }}>
            Déjà un compte ?{" "}
            <a href="/login" className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
            Se connecter
            </a>
        </p>

        {/* Badges sécurité */}
        <div className="flex justify-center gap-8 mt-8">
            {[
            { icon: "🔒", label: "Chiffrement SSL" },
            { icon: "✅", label: "RGPD Conforme" },
            { icon: "🕐", label: "Support 24/7" },
            ].map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1">
                <span className="text-xl">{b.icon}</span>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>{b.label}</span>
            </div>
            ))}
        </div>
        </div>
    );
    }

    // ── Composants utilitaires ───────────────────────────────

    const inputCls =
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors bg-white";

    function Field({
    label,
    error,
    children,
    colSpan,
    }: {
    label: string;
    error?: string;
    children: React.ReactNode;
    colSpan?: boolean;
    }) {
    return (
        <div className={colSpan ? "col-span-2" : ""}>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
            {label}
        </label>
        {children}
        {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
        </div>
    );
}

function StepNav({onPrev,loading,isLast,}: {
    onPrev: (() => void) | null;
    loading: boolean;
    isLast: boolean;
}) {
    return (
        <div className="flex justify-between items-center pt-4">
        {onPrev ? (
            <button
                type="button"
                onClick={onPrev}
                className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg border transition-colors"
                style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
            >
                <ChevronLeft size={16} /> Retour
            </button>
        ) : (
            <a
                href="/login"
                className="text-sm"
                style={{ color: "var(--color-muted)" }}
            >
                ← Déjà un compte ?
            </a>
        )}

        <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-70"
            style={{ background: "var(--color-primary)" }}
        >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isLast ? "Soumettre la demande" : (
            <>Continuer <ChevronRight size={16} /></>
            )}
        </button>
        </div>
    );
}