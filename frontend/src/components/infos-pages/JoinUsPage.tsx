"use client";

import { useRef, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Value {
    icon: string;
    iconBg: string;
    title: string;
    description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const careerPoints = [
    "Environnement de travail flexible",
    "Formation continue et développement",
    "Avantages compétitifs",
    "Culture inclusive et collaborative",
];

const partnerPoints = [
    "Accès à un réseau en croissance",
    "Support marketing et commercial",
    "Intégration technique facilitée",
    "Modèle de revenus partagés",
];

const values: Value[] = [
    {
        icon: "💡",
        iconBg: "bg-teal-100",
        title: "Innovation",
        description: "Repousser les limites du possible",
    },
    {
        icon: "🧡",
        iconBg: "bg-orange-100",
        title: "Passion",
        description: "Aimer ce que nous faisons",
    },
    {
        icon: "🛡️",
        iconBg: "bg-blue-100",
        title: "Intégrité",
        description: "Transparence et confiance",
    },
    {
        icon: "🌍",
        iconBg: "bg-emerald-100",
        title: "Impact",
        description: "Transformer l'Afrique",
    },
];

// ─── Avatar Group ─────────────────────────────────────────────────────────────

const avatarColors = [
    "from-teal-400 to-emerald-500",
    "from-blue-400 to-indigo-500",
    "from-orange-400 to-amber-500",
    "from-purple-400 to-pink-500",
];
const avatarInitials = ["AM", "FK", "KA", "SB"];

function AvatarGroup() {
    return (
        <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
            {avatarInitials.map((init, i) => (
            <div
                key={init}
                className={`h-9 w-9 rounded-full bg-linear-to-br ${avatarColors[i]} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white`}
            >
                {init}
            </div>
            ))}
        </div>
        <div className="leading-tight">
            <p className="text-sm font-bold text-white">50+ talents</p>
            <p className="text-xs text-blue-200">dans 12 pays</p>
        </div>
        </div>
    );
}

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

// ─── Check List ───────────────────────────────────────────────────────────────

function CheckList({items, color,}: { items: string[]; color: "teal" | "orange";}) {
    const check =
        color === "teal"
        ? "bg-teal-100 text-teal-600"
        : "bg-orange-100 text-orange-500";
    return (
        <ul className="space-y-2.5 mb-6">
        {items.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${check} text-xs font-bold`}
            >
                ✓
            </span>
            {item}
            </li>
        ))}
        </ul>
    );
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-linear-to-br from-[#1a3a6b] via-[#1e4db7] to-[#2563eb] py-16 md:py-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
            {/* Large decorative icon circles */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 opacity-20">
            <div className="flex gap-5">
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl">👥</div>
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-2xl mt-8">💼</div>
            </div>
            <div className="flex gap-5 ml-8">
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-2xl">🤝</div>
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl">📈</div>
            </div>
            </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-teal-300 backdrop-blur-sm">
            <span>🚀</span>
            <span>Construisons l&apos;avenir ensemble</span>
            </div>

            <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
                Rejoignez une équipe qui
            <br />
            <span className="bg-linear-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                façonne l&apos;avenir
            </span>
            </h1>

            <p className="mb-10 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
                Participez à la construction de la plateforme qui révolutionne la
                gestion des voyages d&apos;affaires et des avantages sociaux en
                Afrique
            </p>

            <AvatarGroup />
        </div>
        </section>
    );
}

// ─── Section: Cards (Careers + Partners) ─────────────────────────────────────

function ContributeSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    return (
        <section className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Comment souhaitez-vous contribuer&nbsp;?
            </h2>
            <p className="text-base text-slate-500">
                Que vous cherchiez à rejoindre notre équipe ou à devenir partenaire,
                nous avons hâte de collaborer avec vous
            </p>
            </div>

            {/* Two cards */}
            <div
            ref={ref}
            className={`grid gap-6 sm:grid-cols-2 transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            >
            {/* Careers */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-7 flex flex-col">
                <div className="mb-5 flex items-start justify-between">
                <h3 className="text-xl font-extrabold text-[#1a3a6b]">
                    Carrières
                </h3>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xl">
                    💼
                </div>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Intégrez une équipe passionnée et innovante. Développez vos
                compétences tout en ayant un impact réel sur des milliers
                d&apos;entreprises africaines.
                </p>
                <CheckList items={careerPoints} color="teal" />
                <div className="mt-auto">
                <button className="w-full rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow transition hover:bg-teal-400 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                    Voir les postes ouverts →
                </button>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Postes disponibles</span>
                    <span className="font-bold text-teal-500 text-sm">12+</span>
                </div>
                </div>
            </div>

            {/* Partners */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-7 flex flex-col">
                <div className="mb-5 flex items-start justify-between">
                <h3 className="text-xl font-extrabold text-[#1a3a6b]">
                    Partenaires
                </h3>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xl">
                    🤝
                </div>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Collaborez avec nous pour étendre votre portée. Ensemble, créons
                de la valeur pour les entreprises à travers l&apos;Afrique et
                au-delà.
                </p>
                <CheckList items={partnerPoints} color="orange" />
                <div className="mt-auto">
                <button className="w-full rounded-xl bg-orange-400 px-5 py-3.5 text-sm font-bold text-white shadow transition hover:bg-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                    Devenir partenaire →
                </button>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Partenaires actifs</span>
                    <span className="font-bold text-orange-400 text-sm">25+</span>
                </div>
                </div>
            </div>
            </div>
        </div>
        </section>
    );
}

// ─── Section: Values ──────────────────────────────────────────────────────────

function ValuesSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    return (
        <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Nos valeurs fondamentales
            </h2>
            <p className="text-base text-slate-500">
                Ce qui nous guide au quotidien et fait notre différence
            </p>
            </div>

            <div
            ref={ref}
            className={`grid grid-cols-2 gap-5 sm:grid-cols-4 transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            >
            {values.map((v, i) => (
                <div
                key={v.title}
                className="group flex flex-col items-center rounded-2xl bg-slate-50 border border-slate-100 px-5 py-8 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}
                >
                <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${v.iconBg} text-2xl transition-transform duration-300 group-hover:scale-110`}
                >
                    {v.icon}
                </div>
                <h3 className="mb-1.5 text-base font-bold text-[#1a3a6b]">
                    {v.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                    {v.description}
                </p>
                </div>
            ))}
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
            Prêt à rejoindre l&apos;aventure&nbsp;?
            </h2>
            <p className="mb-8 text-base text-blue-100 sm:text-lg">
            Faites partie des pionniers qui transforment la gestion
            d&apos;entreprise en Afrique
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="w-full rounded-xl bg-teal-400 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-teal-300 hover:-translate-y-0.5 sm:w-auto">
                Voir les postes ouverts
            </button>
            <button className="w-full rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto">
                Devenir partenaire
            </button>
            </div>
        </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JoinUsPage() {
    return (
        <main className="min-h-screen font-sans antialiased">
            <HeroSection />
            <ContributeSection />
            <ValuesSection />
            {/* <CTASection /> */}
        </main>
    );
}