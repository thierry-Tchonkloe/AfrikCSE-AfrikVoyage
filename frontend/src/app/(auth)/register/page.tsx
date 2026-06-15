"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Check, ShieldCheck, CheckCircle2, Building2, Layers, LayoutGrid, UserCheck, Globe, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth.service";
import Link from "next/link";
import Image from "next/image";
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
    { id: 1, label: "Entreprise", icon: Building2 },
    { id: 2, label: "Modules", icon: Layers },
    { id: 3, label: "Plan", icon: LayoutGrid },
    { id: 4, label: "Administrateur", icon: UserCheck },
];

const PLANS = [
    {
        id: "STARTER" as const,
        name: "Starter",
        price: "Gratuit",
        desc: "Idéal pour tester la puissance de la plateforme",
        features: ["1 module au choix", "Jusqu'à 50 employés maximum", "Support standard par email"],
    },
    {
        id: "BUSINESS" as const,
        name: "Business",
        price: "Sur devis",
        desc: "Le choix parfait pour la croissance des PME",
        features: ["2 modules inclus", "Jusqu'à 500 employés", "Support prioritaire", "Reporting avancé"],
        popular: true,
    },
    {
        id: "ENTERPRISE" as const,
        name: "Enterprise",
        price: "Sur devis",
        desc: "Pour les grandes structures exigeantes",
        features: ["Tous les modules inclus", "Nombre d'employés illimité", "Support dédié 24/7", "API & intégrations sur mesure"],
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

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    type AllStepsData = Step1Data & Step2Data & Step3Data & Omit<Step4Data, "confirmPassword">;

    const [formData, setFormData] = useState<Partial<AllStepsData>>({
        requestVoyage: false,
        requestCSE: false,
        plan: "STARTER",
    });

    const form1 = useForm<Step1Data>({
        resolver: zodResolver(step1Schema),
        defaultValues: formData,
    });

    const form2 = useForm<Step2Data>({
        defaultValues: { requestVoyage: false, requestCSE: false },
    });

    const form3 = useForm<Step3Data>({
        resolver: zodResolver(step3Schema),
        defaultValues: { plan: "STARTER" },
    });

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

    const onSubmit = async (data: Step4Data) => {
        setLoading(true);
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
        <div className="min-h-screen bg-[#F4F8FA] flex font-sans antialiased selection:bg-cyan-500/30 overflow-hidden">
            
            {/* ── SECTION GAUCHE : STEPPER ET FORMULAIRE PREMIUM ── */}
            <div className="flex-1 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-20 bg-white relative z-10 shadow-xl border-r border-slate-100 overflow-y-auto">
                
                {/* Header / Logo */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/infos" className="flex items-center gap-2.5 group">
                        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-emerald-500 flex items-center justify-center p-[1px] transition-transform duration-300 group-hover:scale-105 shadow-sm">
                            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-bold tracking-tight text-slate-900 leading-none mb-0.5">
                                Afrik<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">Workspace</span>
                            </span>
                        </div>
                    </Link>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        Étape {step} sur 4
                    </span>
                </div>

                <div className="w-full max-w-xl mx-auto my-auto space-y-8 animate-fadeIn">
                    
                    {/* Titres dynamiques selon l'étape */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            {step === 1 && "Créer votre espace entreprise"}
                            {step === 2 && "Sélectionnez vos modules de travail"}
                            {step === 3 && "Choisissez la formule idéale"}
                            {step === 4 && "Finalisez votre compte administrateur"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {step === 1 && "Renseignez les informations de votre structure pour commencer l'intégration."}
                            {step === 2 && "Activez les services requis. Nos équipes se chargeront de la configuration."}
                            {step === 3 && "Adaptez la puissance de l'infrastructure à la taille de vos équipes."}
                            {step === 4 && "Configurez l'accès maître pour piloter l'ensemble de vos modules de gestion."}
                        </p>
                    </div>

                    {/* Stepper horizontal épuré */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-5">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const isCompleted = step > s.id;
                            const isActive = step === s.id;
                            return (
                                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                                            isCompleted ? "bg-cyan-50 border-cyan-200 text-cyan-600" :
                                            isActive ? "bg-gradient-to-br from-cyan-500 to-indigo-500 border-transparent text-white shadow-md shadow-cyan-500/10" :
                                            "bg-white border-slate-200 text-slate-400"
                                        }`}>
                                            {isCompleted ? <Check size={14} className="stroke-[3]" /> : <Icon size={14} />}
                                        </div>
                                        <span className={`text-xs font-semibold hidden md:block ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`h-[2px] flex-1 mx-4 rounded hidden md:block ${step > s.id ? "bg-cyan-500" : "bg-slate-100"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Conteneur principal du formulaire */}
                    <div className="bg-white rounded-xl">
                        
                        {/* Étape 1 : Infos entreprise */}
                        {step === 1 && (
                            <form onSubmit={form1.handleSubmit((data) => nextStep(data))} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Nom de l'entreprise *" error={form1.formState.errors.companyName?.message} colSpan>
                                        <input {...form1.register("companyName")} placeholder="Ex: TechAfrik SARL" className={inputCls(!!form1.formState.errors.companyName)} />
                                    </Field>
                                    <Field label="Email professionnel *" error={form1.formState.errors.businessEmail?.message} colSpan>
                                        <input {...form1.register("businessEmail")} type="email" placeholder="contact@entreprise.com" className={inputCls(!!form1.formState.errors.businessEmail)} />
                                    </Field>
                                    <Field label="Pays *" error={form1.formState.errors.country?.message}>
                                        <select {...form1.register("country")} className={inputCls(!!form1.formState.errors.country)}>
                                            <option value="">Sélectionner</option>
                                            {COUNTRIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Téléphone *" error={form1.formState.errors.phone?.message}>
                                        <input {...form1.register("phone")} placeholder="+229 XX XX XX XX" className={inputCls(!!form1.formState.errors.phone)} />
                                    </Field>
                                    <Field label="Taille de l'effectif *" error={form1.formState.errors.size?.message}>
                                        <select {...form1.register("size")} className={inputCls(!!form1.formState.errors.size)}>
                                            <option value="">Sélectionner</option>
                                            {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                                                <option key={s} value={s}>{s} employés</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Secteur d'activité *" error={form1.formState.errors.industry?.message}>
                                        <select {...form1.register("industry")} className={inputCls(!!form1.formState.errors.industry)}>
                                            <option value="">Sélectionner</option>
                                            {INDUSTRIES.map((i) => (
                                                <option key={i} value={i}>{i}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Adresse physique" colSpan>
                                        <input {...form1.register("address")} placeholder="Rue, quartier, immeuble..." className={inputCls(false)} />
                                    </Field>
                                    <Field label="Ville">
                                        <input {...form1.register("city")} placeholder="Cotonou" className={inputCls(false)} />
                                    </Field>
                                    <Field label="Code postal / BP">
                                        <input {...form1.register("postalCode")} placeholder="01 BP 1234" className={inputCls(false)} />
                                    </Field>
                                </div>
                                <StepNav onPrev={null} loading={false} isLast={false} />
                            </form>
                        )}

                        {/* Étape 2 : Choix des modules */}
                        {step === 2 && (
                            <form onSubmit={form2.handleSubmit((data) => nextStep(data))} className="space-y-4">
                                <div className="space-y-3">
                                    {[
                                        {
                                            field: "requestCSE" as const,
                                            title: "AfrikCSE",
                                            desc: "Gestion complète des avantages sociaux, de la communication interne et des subventions salariés.",
                                            features: ["Catalogue d'offres locales", "Billetterie intégrée", "Budgets CSE"],
                                        },
                                        {
                                            field: "requestVoyage" as const,
                                            title: "AfrikVoyage",
                                            desc: "Gestion centralisée des déplacements d'affaires, notes de frais et politiques de voyage.",
                                            features: ["Réservations d'hôtels & vols", "Gestion des frais", "Reporting analytique"],
                                        },
                                    ].map((mod) => {
                                        const checked = form2.watch(mod.field);
                                        return (
                                            <label
                                                key={mod.field}
                                                className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 relative group ${
                                                    checked 
                                                        ? "border-cyan-500 bg-cyan-50/40 shadow-sm" 
                                                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                <input
                                                    {...form2.register(mod.field)}
                                                    type="checkbox"
                                                    className="mt-1.5 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 text-sm">{mod.title}</p>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {mod.features.map((f) => (
                                                            <span key={f} className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-white border border-slate-100 text-slate-500 flex items-center gap-1">
                                                                <Check size={10} className="text-cyan-500 stroke-[3]" /> {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                <StepNav onPrev={prevStep} loading={false} isLast={false} />
                            </form>
                        )}

                        {/* Étape 3 : Plan */}
                        {step === 3 && (
                            <form onSubmit={form3.handleSubmit((data) => nextStep(data))} className="space-y-4">
                                <div className="space-y-3">
                                    {PLANS.map((plan) => {
                                        const selected = form3.watch("plan") === plan.id;
                                        return (
                                            <label
                                                key={plan.id}
                                                className={`flex gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-300 relative ${
                                                    selected 
                                                        ? "border-cyan-500 bg-cyan-50/40 shadow-sm" 
                                                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
                                                }`}
                                            >
                                                <input
                                                    {...form3.register("plan")}
                                                    type="radio"
                                                    value={plan.id}
                                                    className="mt-1 w-4 h-4 text-cyan-600 border-slate-300 focus:ring-cyan-500/20"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">{plan.name}</span>
                                                        {plan.popular && (
                                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white uppercase tracking-wider">
                                                                Recommandé
                                                            </span>
                                                        )}
                                                        <span className="ml-auto text-sm font-black text-cyan-600">{plan.price}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                                                    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                                                        {plan.features.map((f) => (
                                                            <li key={f} className="text-[11px] font-medium flex items-center gap-1.5 text-slate-500">
                                                                <Check size={11} className="text-cyan-500 stroke-[3]" /> {f}
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

                        {/* Étape 4 : Compte administrateur */}
                        {step === 4 && (
                            <form onSubmit={form4.handleSubmit((data) => onSubmit(data))} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Prénom de l'administrateur *" error={form4.formState.errors.adminFirstName?.message}>
                                        <input {...form4.register("adminFirstName")} placeholder="Ex: Marie" className={inputCls(!!form4.formState.errors.adminFirstName)} />
                                    </Field>
                                    <Field label="Nom de l'administrateur *" error={form4.formState.errors.adminLastName?.message}>
                                        <input {...form4.register("adminLastName")} placeholder="Ex: Dubois" className={inputCls(!!form4.formState.errors.adminLastName)} />
                                    </Field>
                                    <Field label="Adresse email Master *" error={form4.formState.errors.adminEmail?.message} colSpan>
                                        <input {...form4.register("adminEmail")} type="email" placeholder="admin.master@entreprise.com" className={inputCls(!!form4.formState.errors.adminEmail)} />
                                    </Field>
                                    <Field label="Mot de passe de sécurité *" error={form4.formState.errors.adminPassword?.message} colSpan>
                                        <input {...form4.register("adminPassword")} type="password" placeholder="••••••••" className={inputCls(!!form4.formState.errors.adminPassword)} />
                                    </Field>
                                    <Field label="Confirmer le mot de passe *" error={form4.formState.errors.confirmPassword?.message} colSpan>
                                        <input {...form4.register("confirmPassword")} type="password" placeholder="••••••••" className={inputCls(!!form4.formState.errors.confirmPassword)} />
                                    </Field>
                                </div>

                                {/* Récapitulatif Satiné Clarté */}
                                <div className="rounded-xl p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100 space-y-1.5 shadow-inner">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Résumé de la configuration
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                                        <div className="text-slate-500">Structure: <strong className="text-slate-800 font-semibold">{formData.companyName || "-"}</strong></div>
                                        <div className="text-slate-500">Formule: <strong className="text-slate-800 font-semibold">{formData.plan}</strong></div>
                                        <div className="text-slate-500 truncate">Modules: <strong className="text-slate-800 font-semibold">
                                            {[formData.requestCSE && "CSE", formData.requestVoyage && "Voyage"].filter(Boolean).join(", ") || "Aucun"}
                                        </strong></div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-400 leading-relaxed text-center sm:text-left">
                                    En validant cette demande, vous acceptez nos{" "}
                                    <a href="/terms" className="text-cyan-600 font-semibold hover:underline">conditions générales</a>{" "}
                                    et notre{" "}
                                    <a href="/privacy" className="text-cyan-600 font-semibold hover:underline">politique de traitement des données</a>.
                                </p>

                                <StepNav onPrev={prevStep} loading={loading} isLast />
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer Discret */}
                <div className="flex items-center justify-center gap-6 pt-6 border-t border-slate-100 text-[11px] font-medium text-slate-400 mt-8">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Infrastructure RGPD</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" /> Support Déployé 24/7</span>
                </div>
            </div>

            {/* ── SECTION DROITE : IMMERSION VISUELLE LUMINEUSE ── */}
            <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-gradient-to-br from-cyan-500/10 via-indigo-500/5 to-emerald-500/10 overflow-hidden">
                
                {/* Image thématique : Hub de transit, architecture moderne et lumineuse de voyage d'affaires */}
                <Image 
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1474&auto=format&fit=crop" 
                    alt="Business Travel Corporate Hub"
                    fill
                    priority
                    className="object-cover object-center opacity-75 mix-blend-multiply scale-105 animate-subtleZoom"
                />

                {/* Masquages dégradés pour fusion parfaite */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />

                {/* Contenu textuel et indicateurs financiers/RH */}
                <div className="relative z-10 flex flex-col justify-between h-full w-full p-16 text-slate-800">
                    
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full px-3.5 py-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Déploiement Corporate Automatisé</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-snug max-w-md text-slate-900">
                            Rejoignez l'écosystème de gestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600">le plus performant</span>.
                        </h2>
                        <p className="text-slate-600 max-w-sm text-sm leading-relaxed font-medium">
                            Centralisez la logistique de vos équipes, offrez des avantages CSE exclusifs et pilotez l'ensemble de votre gouvernance financière sur un outil unique.
                        </p>
                    </div>

                    {/* Preuve sociale intégrée */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-md flex flex-col gap-3 max-w-md">
                        <div className="flex items-center gap-1 text-cyan-600">
                            <Globe className="w-4 h-4" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Couverture Continentale</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                            "Un gain de temps exceptionnel pour nos équipes RH. L'interface multi-modules s'adapte précisément à nos filiales dans toute la sous-région."
                        </p>
                        <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3 text-[11px]">
                            <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-black">
                                T
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">Secrétariat Général Finances</p>
                                <p className="text-slate-500 font-semibold text-[10px]">TechAfrik Industries</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Styles d'animations globaux */}
            <style jsx global>{`
                @keyframes subtleZoom {
                    from { transform: scale(1.01); }
                    to { transform: scale(1.06); }
                }
                .animate-subtleZoom {
                    animation: subtleZoom 25s ease-in-out infinite alternate;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}

// ── Composants utilitaires ───────────────────────────────

const inputCls = (hasError: boolean) => `
    w-full px-3.5 py-2 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all duration-300 
    focus:bg-white focus:ring-4 
    ${hasError 
        ? "border-red-300 focus:ring-red-500/10 focus:border-red-500" 
        : "border-slate-200 focus:ring-cyan-600/10 focus:border-cyan-600"
    }
`;

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
        <div className={colSpan ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                {label}
            </label>
            {children}
            {error && <p className="text-xs font-medium text-red-500 mt-1 pl-1">{error}</p>}
        </div>
    );
}

function StepNav({ onPrev, loading, isLast }: {
    onPrev: (() => void) | null;
    loading: boolean;
    isLast: boolean;
}) {
    return (
        <div className="flex justify-between items-center pt-5 border-t border-slate-100 mt-6">
            {onPrev ? (
                <button
                    type="button"
                    onClick={onPrev}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                    <ChevronLeft size={14} className="stroke-[2.5]" /> Retour
                </button>
            ) : (
                <Link
                    href="/login"
                    className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                    ← Se connecter
                </Link>
            )}

            <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-600 to-emerald-500 hover:opacity-95 shadow-md shadow-cyan-600/10 disabled:opacity-70 disabled:cursor-not-allowed group/btn transform active:scale-[0.99] transition-all"
            >
                {loading && <Loader2 size={14} className="animate-spin text-white" />}
                {isLast ? "Soumettre la demande" : (
                    <>Continuer <ChevronRight size={14} className="stroke-[2.5] group-hover/btn:translate-x-0.5 transition-transform" /></>
                )}
            </button>
        </div>
    );
}