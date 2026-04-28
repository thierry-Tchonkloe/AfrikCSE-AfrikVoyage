"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
    fullName: string;
    company: string;
    email: string;
    phone: string;
    companySize: string;
    message: string;
    acceptMarketing: boolean;
}

interface FormErrors {
    fullName?: string;
    company?: string;
    email?: string;
    message?: string;
}

type Status = "idle" | "loading" | "success" | "error";

const companySizes = [
    "1 – 10 employés",
    "11 – 50 employés",
    "51 – 200 employés",
    "201 – 500 employés",
    "500+ employés",
];

const faqs = [
    {
        question: "Combien de temps faut-il pour implémenter la solution ?",
        answer:
        "L'implémentation standard prend entre 3 et 7 jours ouvrés. Notre équipe vous accompagne à chaque étape : configuration, import des données, formation des administrateurs et go-live.",
    },
    {
        question: "Proposez-vous une période d'essai gratuite ?",
        answer:
        "Oui, nous proposons un essai gratuit de 14 jours sans engagement ni carte bancaire. Vous accédez à toutes les fonctionnalités de la plateforme pendant cette période.",
    },
    {
        question: "Comment se déroule la formation des utilisateurs ?",
        answer:
        "La formation est intégrée à la plateforme sous forme de tutoriels interactifs, vidéos et documentation. Nous proposons également des sessions de formation live pour les équipes RH et CSE.",
    },
    {
        question: "Vos données sont-elles hébergées en Afrique ?",
        answer:
        "Nous offrons le choix de l'hébergement : datacenter africain (Afrique du Sud, Nigeria) ou européen (France). Toutes les données sont chiffrées et conformes au RGPD.",
    },
    {
        question: "Quels modes de paiement acceptez-vous ?",
        answer:
        "Nous acceptons les virements bancaires, les cartes Visa/Mastercard, Mobile Money (Orange Money, MTN MoMo, Wave) et les paiements via Stripe pour les entreprises internationales.",
    },
];

// ─── Validate ─────────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!data.fullName.trim()) errors.fullName = "Le nom est requis";
    if (!data.company.trim()) errors.company = "L'entreprise est requise";
    if (!data.email.trim()) {
        errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "Email invalide";
    }
    if (!data.message.trim()) errors.message = "Le message est requis";
    return errors;
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ faq }: { faq: (typeof faqs)[0] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-[#1a3a6b] hover:bg-slate-50 transition-colors"
        >
            <span>{faq.question}</span>
            <span
            className={`text-slate-400 transition-transform duration-200 text-lg ${
                open ? "rotate-180" : ""
            }`}
            >
            ⌄
            </span>
        </button>
        {open && (
            <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
            {faq.answer}
            </div>
        )}
        </div>
    );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactForm() {
    const [form, setForm] = useState<FormData>({
        fullName: "",
        company: "",
        email: "",
        phone: "",
        companySize: "",
        message: "",
        acceptMarketing: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [status, setStatus] = useState<Status>("idle");

    function set(field: keyof FormData, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    async function handleSubmit(e: React.MouseEvent) {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length) {
        setErrors(errs);
        return;
        }
        setStatus("loading");
        try {
        const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        setStatus("success");
        setForm({
            fullName: "",
            company: "",
            email: "",
            phone: "",
            companySize: "",
            message: "",
            acceptMarketing: false,
        });
        } catch {
        setStatus("error");
        }
    }

    const inputBase =
        "w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-teal-400 focus:border-teal-400";
    const inputNormal = `${inputBase} border-slate-200 bg-white`;
    const inputError = `${inputBase} border-red-400 bg-red-50 focus:ring-red-300`;

    return (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 md:p-8">
        <h2 className="mb-1 text-xl font-bold text-[#1a3a6b]">
            Contactez notre équipe commerciale
        </h2>
        <p className="mb-6 text-sm text-slate-500">
            Remplissez ce formulaire et nous vous recontacterons dans les 24h pour
            discuter de vos besoins.
        </p>

        {status === "success" && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-700 flex items-center gap-2">
            <span>✅</span>
            <span>
                Votre demande a bien été envoyée ! Nous vous répondrons sous 24h.
            </span>
            </div>
        )}

        {status === "error" && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            <span>Une erreur est survenue. Veuillez réessayer.</span>
            </div>
        )}

        <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                placeholder="Votre nom"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={errors.fullName ? inputError : inputNormal}
                />
                {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                )}
            </div>
            <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                Entreprise <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                placeholder="Nom de votre entreprise"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                className={errors.company ? inputError : inputNormal}
                />
                {errors.company && (
                <p className="mt-1 text-xs text-red-500">{errors.company}</p>
                )}
            </div>
            </div>

            {/* Row 2 */}
            <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                Email professionnel <span className="text-red-500">*</span>
                </label>
                <input
                type="email"
                placeholder="votre.email@entreprise.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={errors.email ? inputError : inputNormal}
                />
                {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
            </div>
            <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                Téléphone
                </label>
                <input
                type="tel"
                placeholder="+33 1 23 45 67 89"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputNormal}
                />
            </div>
            </div>

            {/* Row 3 — Select */}
            <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
                Taille de l&apos;entreprise
            </label>
            <div className="relative">
                <select
                value={form.companySize}
                onChange={(e) => set("companySize", e.target.value)}
                className={`${inputNormal} appearance-none pr-10`}
                >
                <option value="">Sélectionnez une option</option>
                {companySizes.map((s) => (
                    <option key={s} value={s}>
                    {s}
                    </option>
                ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                ⌄
                </span>
            </div>
            </div>

            {/* Row 4 — Textarea */}
            <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
                Message <span className="text-red-500">*</span>
            </label>
            <textarea
                rows={5}
                placeholder="Décrivez votre projet et vos besoins..."
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                className={`${errors.message ? inputError : inputNormal} resize-none`}
            />
            {errors.message && (
                <p className="mt-1 text-xs text-red-500">{errors.message}</p>
            )}
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
            <input
                type="checkbox"
                checked={form.acceptMarketing}
                onChange={(e) => set("acceptMarketing", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-500"
            />
            <span className="text-xs text-slate-500 leading-relaxed">
                J&apos;accepte de recevoir les communications commerciales de la
                part d&apos;AfrikCSE &amp; AfrikVoyage conformément à la politique
                de confidentialité.
            </span>
            </label>

            {/* Submit */}
            <button
            onClick={handleSubmit}
            disabled={status === "loading"}
            className="w-full rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-teal-400 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
            {status === "loading" ? (
                <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Envoi en cours…
                </>
            ) : (
                <>Envoyer ma demande →</>
            )}
            </button>
        </div>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
    return (
        <div className="space-y-5">
        {/* Call card */}
        <div className="rounded-2xl bg-linear-to-r from-orange-400 to-orange-500 p-6 text-white shadow-lg">
            <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                🎧
            </div>
            <div>
                <p className="font-bold text-sm">Parlez directement à nos experts</p>
                <p className="text-orange-100 text-xs">
                Obtenez des réponses personnalisées
                </p>
            </div>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-orange-500 transition hover:bg-orange-50">
            <span>📞</span>
            Programmer un appel
            </button>
        </div>

        {/* Coordinates */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-[#1a3a6b]">Nos coordonnées</h3>

            <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm">
                ✉️
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-700">Email</p>
                <p className="text-xs text-slate-500">
                contact@afrikcse-afrikvoyage.com
                </p>
                <p className="text-xs text-slate-500">
                support@afrikcse-afrikvoyage.com
                </p>
            </div>
            </div>

            <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm">
                📞
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-700">Téléphone</p>
                <p className="text-xs text-slate-500">+33 1 84 17 36 85</p>
                <p className="text-xs text-slate-400">Lun–Ven 9h–18h CET</p>
            </div>
            </div>

            <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm">
                📍
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-700">Adresse</p>
                <p className="text-xs text-slate-500">
                123 Avenue des Champs-Élysées
                </p>
                <p className="text-xs text-slate-500">75008 Paris, France</p>
            </div>
            </div>
        </div>

        {/* Response time */}
        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-500 text-base">ℹ️</span>
            <p className="text-sm font-semibold text-[#1a3a6b]">
                Temps de réponse garanti
            </p>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
            Nous nous engageons à vous répondre dans les{" "}
            <span className="font-semibold text-blue-600">
                24 heures ouvrées
            </span>{" "}
            pour toute demande commerciale.
            </p>
        </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
    return (
        <main className="min-h-screen font-sans antialiased bg-slate-50">
        {/* Hero */}
        <section className="bg-linear-to-br from-[#1a3a6b] via-[#1e4db7] to-[#2563eb] py-16 md:py-20">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
                Parlons de votre projet
            </h1>
            <p className="text-base leading-relaxed text-blue-100 sm:text-lg">
                Notre équipe d&apos;experts est prête à vous accompagner dans la
                transformation digitale de votre gestion des voyages d&apos;affaires
                et des avantages salariés.
            </p>
            </div>
        </section>

        {/* Form + Sidebar */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
            <ContactForm />
            <Sidebar />
            </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-14 md:py-20">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
                <h2 className="mb-2 text-2xl font-extrabold text-[#1a3a6b] sm:text-3xl">
                Questions fréquentes
                </h2>
                <p className="text-sm text-slate-500">
                Trouvez rapidement les réponses à vos questions les plus courantes
                </p>
            </div>
            <div className="space-y-3">
                {faqs.map((faq) => (
                <FAQItem key={faq.question} faq={faq} />
                ))}
            </div>
            </div>
        </section>
        </main>
    );
}