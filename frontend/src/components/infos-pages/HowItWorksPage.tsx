"use client";

import { useRef, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
    number: number;
    icon: string;
    title: string;
    description: string;
    checks: string[];
    imageAlt: string;
    imageBg: string;
    imageEmoji: string;
    side: "left" | "right";
}

interface Benefit {
    icon: string;
    iconBg: string;
    title: string;
    description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps: Step[] = [
    {
        number: 1,
        icon: "⚙️",
        title: "Création du compte entreprise",
        description:
        "Votre administrateur crée le compte de votre entreprise en quelques minutes. Définissez votre structure organisationnelle, vos départements et vos budgets.",
        checks: [
            "Configuration en moins de 5 minutes",
            "Interface d'administration intuitive",
            "Support dédié pour l'onboarding",
        ],
        imageAlt: "Création du compte",
        imageBg: "from-blue-50 to-indigo-100",
        imageEmoji: "🧑‍💼",
        side: "left",
    },
    {
        number: 2,
        icon: "👥",
        title: "Intégration des utilisateurs",
        description:
        "Invitez vos collaborateurs et représentants CSE sur la plateforme. Chaque utilisateur reçoit ses accès personnalisés selon son rôle et ses permissions.",
        checks: [
            "Invitation par email automatique",
            "Gestion des rôles et permissions",
            "Formation en ligne intégrée",
        ],
        imageAlt: "Intégration utilisateurs",
        imageBg: "from-teal-50 to-emerald-100",
        imageEmoji: "🫂",
        side: "right",
    },
    {
        number: 3,
        icon: "🛡️",
        title: "Configuration des politiques",
        description:
        "Paramétrez vos politiques de voyage, budgets par département, et configurez les avantages CSE selon les besoins de votre entreprise.",
        checks: [
            "Politiques de voyage personnalisables",
            "Gestion des budgets par équipe",
            "Catalogue d'avantages CSE",
        ],
        imageAlt: "Configuration",
        imageBg: "from-amber-50 to-orange-100",
        imageEmoji: "📋",
        side: "left",
    },
    {
        number: 4,
        icon: "🧑‍💻",
        title: "Utilisation par les employés",
        description:
        "Vos collaborateurs accèdent à la plateforme pour réserver leurs voyages d'affaires et profiter des avantages CSE, le tout dans une interface simple et intuitive.",
        checks: [
            "Réservation en quelques clics",
            "Application mobile native",
            "Accès aux avantages CSE 24/7",
        ],
        imageAlt: "Utilisation employés",
        imageBg: "from-purple-50 to-violet-100",
        imageEmoji: "📱",
        side: "right",
    },
    {
        number: 5,
        icon: "📊",
        title: "Suivi et reporting",
        description:
        "Accédez à des tableaux de bord complets pour suivre les dépenses, analyser l'utilisation et optimiser vos politiques d'entreprise en temps réel.",
        checks: [
            "Rapports financiers détaillés",
            "Analytics en temps réel",
            "Export pour comptabilité",
        ],
        imageAlt: "Reporting",
        imageBg: "from-slate-50 to-blue-100",
        imageEmoji: "📈",
        side: "left",
    },
];

const benefits: Benefit[] = [
    {
        icon: "🕐",
        iconBg: "bg-teal-100",
        title: "Gain de temps",
        description:
        "Automatisez vos processus et réduisez le temps administratif de 70%",
    },
    {
        icon: "💰",
        iconBg: "bg-amber-100",
        title: "Économies",
        description:
        "Optimisez vos dépenses et réalisez jusqu'à 30% d'économies",
    },
    {
        icon: "😊",
        iconBg: "bg-blue-100",
        title: "Satisfaction",
        description:
        "Améliorez l'expérience collaborateur avec des outils modernes",
    },
];

// ─── Hook: InView ─────────────────────────────────────────────────────────────

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
            }
        },
        { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref, threshold]);
    return inView;
}

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: Step; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    const isRight = step.side === "right";

    return (
        <div
        ref={ref}
        className={`relative grid items-center gap-8 lg:grid-cols-2 transition-all duration-700 delay-100 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
        >
        {/* Content */}
        <div className={`${isRight ? "lg:order-2" : "lg:order-1"}`}>
            <div className="flex items-start gap-4">
            {/* Step number badge */}
            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a3a6b] text-white font-extrabold text-lg shadow-md">
                {step.number}
            </div>
            <div>
                <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{step.icon}</span>
                <h3 className="text-xl font-bold text-[#1a3a6b] sm:text-2xl">
                    {step.title}
                </h3>
                </div>
            </div>
            </div>

            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-[15px]">
            {step.description}
            </p>

            <ul className="mt-5 space-y-2">
            {step.checks.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-xs font-bold">
                    ✓
                </span>
                {c}
                </li>
            ))}
            </ul>
        </div>

        {/* Illustration */}
        <div className={`${isRight ? "lg:order-1" : "lg:order-2"}`}>
            <div
            className={`overflow-hidden rounded-2xl bg-linear-to-br ${step.imageBg} aspect-4/3 flex items-center justify-center shadow-md border border-white`}
            >
            <div className="text-center p-8">
                <div className="text-7xl mb-3">{step.imageEmoji}</div>
                <p className="text-slate-500 text-sm font-medium">{step.imageAlt}</p>
            </div>
            </div>
        </div>

        {/* Connector dot (hidden on last) */}
        {index < steps.length - 1 && (
            <div className="absolute left-6 -bottom-10 hidden h-8 w-0.5 bg-linear-to-b from-teal-300 to-transparent lg:block" />
        )}
        </div>
    );
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-linear-to-br from-[#1a3a6b] via-[#1e4db7] to-[#2563eb] py-16 md:py-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-teal-400/10 blur-3xl" />
            {/* Vertical dashed line (decorative) */}
            <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 border-l-2 border-dashed border-white/20 lg:block" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* 3D question mark illustration placeholder */}
            <div className="flex justify-center lg:justify-start">
                <div className="relative">
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/10 text-8xl backdrop-blur-sm sm:h-48 sm:w-48">
                    ❓
                </div>
                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-teal-400/20 backdrop-blur-sm" />
                </div>
            </div>

            <div>
                <h1 className="mb-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
                Comment fonctionne
                <br />
                notre plateforme&nbsp;?
                </h1>
                <p className="mb-6 text-base leading-relaxed text-blue-100 sm:text-lg">
                Découvrez en 5 étapes simples comment AfrikCSE &amp; AfrikVoyage
                transforme la gestion des voyages d&apos;affaires et des avantages
                sociaux de votre entreprise
                </p>
                <button className="inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-teal-300 backdrop-blur-sm transition hover:bg-white/20">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400 text-white text-xs">
                    ▶
                </span>
                Processus simplifié en 5 minutes
                </button>
            </div>
            </div>
        </div>
        </section>
    );
}

// ─── Section: Why ─────────────────────────────────────────────────────────────

function WhySection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    return (
        <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Pourquoi choisir notre solution&nbsp;?
            </h2>
            <p className="text-base text-slate-500 sm:text-lg">
                Une plateforme complète qui simplifie la gestion de votre entreprise
            </p>
            </div>

            <div
            ref={ref}
            className={`grid gap-8 sm:grid-cols-3 transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            >
            {benefits.map((b, i) => (
                <div
                key={b.title}
                className="group flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 100}ms` }}
                >
                <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${b.iconBg} text-3xl transition-transform duration-300 group-hover:scale-110`}
                >
                    {b.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#1a3a6b]">
                    {b.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                    {b.description}
                </p>
                </div>
            ))}
            </div>
        </div>
        </section>
    );
}

// ─── Section: Steps ───────────────────────────────────────────────────────────

function StepsSection() {
    return (
        <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Un processus simple et efficace
            </h2>
            <p className="text-base text-slate-500 sm:text-lg">
                Notre plateforme a été conçue pour être intuitive et permettre une
                adoption rapide par vos équipes
            </p>
            </div>

            {/* Timeline wrapper */}
            <div className="relative">
            {/* Vertical timeline line (desktop only) */}
            <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 border-l-2 border-dashed border-teal-200 lg:block" />

            <div className="space-y-16 md:space-y-20">
                {steps.map((step, index) => (
                <StepCard key={step.number} step={step} index={index} />
                ))}
            </div>
            </div>
        </div>
        </section>
    );
}

// ─── Section: CTA ─────────────────────────────────────────────────────────────

function CTASection() {
    return (
        <section className="bg-linear-to-br from-[#1a3a6b] to-[#2563eb] py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
            Prêt à transformer votre gestion&nbsp;?
            </h2>
            <p className="mb-8 text-base text-blue-100 sm:text-lg">
            Rejoignez plus de 500 entreprises africaines qui font confiance à
            AfrikCSE &amp; AfrikVoyage
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="w-full rounded-xl bg-teal-400 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-teal-300 sm:w-auto">
                Commencer gratuitement
            </button>
            <button className="w-full rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto">
                Demander une démo
            </button>
            </div>
        </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
    return (
        <main className="min-h-screen font-sans antialiased">
            <HeroSection />
            <StepsSection />
            <WhySection />
            {/* <CTASection /> */}
        </main>
    );
}