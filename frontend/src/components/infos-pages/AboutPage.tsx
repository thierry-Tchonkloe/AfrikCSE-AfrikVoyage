"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
    name: string;
    role: string;
    title: string;
    description: string;
    initials: string;
    color: string;
}

interface VisionCard {
    icon: string;
    title: string;
    description: string;
    bg: string;
}

interface ValueCard {
    icon: string;
    title: string;
    color: string;
    iconBg: string;
    description: string;
    points: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const teamMembers: TeamMember[] = [
    {
        name: "Amadou Diallo",
        role: "CEO & Fondateur",
        title: "CEO",
        description:
        "Expert en fintech avec 15 ans d'expérience dans l'innovation technologique africaine",
        initials: "AD",
        color: "from-blue-400 to-teal-500",
    },
    {
        name: "Fatima Benali",
        role: "CTO",
        title: "CTO",
        description:
        "Architecte logiciel passionnée par les solutions SaaS scalables et la sécurité des données",
        initials: "FB",
        color: "from-emerald-400 to-cyan-500",
    },
    {
        name: "Kwame Asante",
        role: "COO",
        title: "COO",
        description:
        "Spécialiste en opérations et développement commercial avec une expertise des marchés africains",
        initials: "KA",
        color: "from-amber-400 to-orange-500",
    },
    {
        name: "Aisha Kone",
        role: "CPO",
        title: "CPO",
        description:
        "Experte en design produit et expérience utilisateur, focalisée sur l'innovation centrée utilisateur",
        initials: "AK",
        color: "from-purple-400 to-pink-500",
    },
];

const visionCards: VisionCard[] = [
    {
        icon: "🌍",
        title: "Ancrage Africain",
        description:
        "Comprendre et servir les spécificités des marchés africains avec une expertise locale approfondie",
        bg: "bg-[#1a3a6b]",
    },
    {
        icon: "🚀",
        title: "Expansion Internationale",
        description:
        "Étendre notre portée vers les marchés internationaux en maintenant notre excellence africaine",
        bg: "bg-emerald-500",
    },
    {
        icon: "📈",
        title: "Croissance Durable",
        description:
        "Accompagner la croissance des entreprises avec des solutions évolutives et durables",
        bg: "bg-orange-500",
    },
    ];

    const valueCards: ValueCard[] = [
    {
        icon: "💡",
        title: "Innovation",
        color: "text-emerald-600",
        iconBg: "bg-emerald-100",
        description:
        "Nous repoussons constamment les limites de la technologie pour créer des solutions révolutionnaires adaptées aux défis africains.",
        points: ["R&D continue", "Technologies émergentes", "Solutions disruptives"],
    },
    {
        icon: "🤝",
        title: "Confiance",
        color: "text-[#1a3a6b]",
        iconBg: "bg-blue-100",
        description:
        "La confiance est au cœur de nos relations avec nos clients. Nous nous engageons à la transparence et à la sécurité absolue.",
        points: ["Sécurité des données", "Transparence totale", "Support fiable"],
    },
    {
        icon: "🏆",
        title: "Performance",
        color: "text-amber-600",
        iconBg: "bg-amber-100",
        description: "Nous visons l'excellence dans tout ce que nous faisons, en mesurant notre succès par celui de nos clients.",
        points: [
            "Résultats mesurables",
            "Amélioration continue",
            "Excellence opérationnelle",
        ],
    },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function useInView(ref: React.RefObject<HTMLElement | null>) {
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
        { threshold: 0.2 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref]);
    return inView;
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-linear-to-br from-[#1a3a6b] via-[#1e4db7] to-[#2563eb] py-10 md:py-15 lg:py-15">
        {/* Background decorative circles */}
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/5" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-teal-300 backdrop-blur-sm">
            <span><img src="/icons/Vector-location.png" alt="vector-location" /></span>
            <span>Basé en Afrique, orienté vers le monde</span>
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Révolutionner la gestion
                <br />
                <span className="bg-linear-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    d&apos;entreprise en Afrique
                </span>
            </h1>

            <p className="mx-auto max-w-3xl text-base leading-relaxed text-blue-100 sm:text-lg md:text-xl">
            Découvrez l&apos;histoire d&apos;AfrikCSE &amp; AfrikVoyage, une
            plateforme née de la vision de simplifier la gestion des voyages
            d&apos;affaires et des avantages sociaux pour les entreprises
            africaines.
            </p>
        </div>
        </section>
    );
}

// ─── Section: Mission ─────────────────────────────────────────────────────────

function MissionSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    const problems = [
        {
        title: "Complexité administrative",
        desc: "Simplifier les processus bureaucratiques africains",
        },
        {
        title: "Coûts élevés",
        desc: "Réduire les frais de gestion et d'administration",
        },
        {
        title: "Manque d'outils adaptés",
        desc: "Créer des solutions pensées pour l'Afrique",
        },
    ];

    return (
        <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Mission */}
            <div
            ref={ref}
            className={`grid items-center gap-12 lg:grid-cols-2 transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            >
            {/* Image placeholder */}
            <div className="relative order-2 lg:order-1">
                {/* <div className="overflow-hidden rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 aspect-4/3 flex items-center justify-center shadow-xl"> */}
                    {/* <div className="text-center p-8">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-[#1a3a6b] to-[#2563eb]">
                        <span className="text-3xl">🏢</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                        AfrikCSE & AfrikVoyage
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                        Gestion d&apos;entreprise moderne
                        </p>
                    </div> */}
                    
                {/* </div> */}
                <div className="relative w-full rounded-2xl overflow-hidden">
                    <img src="/images/img1.png" alt="AfrikCSE & AfrikVoyage - Gestion d'entreprise moderne" />
                </div>
                {/* <div className="relative w-full aspect-4/3 rounded-2xl">
                    <Image
                        src="/images/img1.png"
                        alt="AfrikCSE & AfrikVoyage - Gestion d'entreprise moderne"
                        fill
                        className="object-cover"
                        priority
                    />
                    </div> */}
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 rounded-xl bg-white px-4 py-3 shadow-lg border border-slate-100">
                    <p className="text-xs font-semibold text-emerald-600">
                        ✓ Innovation africaine
                    </p>
                </div>
            </div>

            <div className="order-1 lg:order-2">
                <h2 className="mb-4 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Notre Mission
                </h2>
                <p className="mb-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                Démocratiser l&apos;accès aux outils de gestion d&apos;entreprise
                de classe mondiale pour les organisations africaines, en offrant
                une plateforme unifiée qui simplifie la gestion des voyages
                d&apos;affaires et l&apos;administration des comités sociaux et
                économiques.
                </p>
                <p className="mb-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                Nous croyons que chaque entreprise, quelle que soit sa taille,
                mérite d&apos;avoir accès aux mêmes outils technologiques avancés
                que les grandes multinationales.
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-500">
                <span>🚀</span>
                <span>Innovation au service de la croissance africaine</span>
                </div>
            </div>
            </div>

            {/* Why AfrikCSE */}
            <div className="mt-20 md:mt-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
                <div>
                <h2 className="mb-6 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                    Pourquoi AfrikCSE &amp; AfrikVoyage&nbsp;?
                </h2>
                <p className="mb-8 text-base leading-relaxed text-slate-600 sm:text-lg">
                    Face aux défis spécifiques des entreprises africaines en matière
                    de gestion administrative, nous avons identifié un besoin
                    critique&nbsp;: une solution intégrée qui comprend les réalités
                    locales tout en offrant des standards internationaux.
                </p>
                <ul className="space-y-4">
                    {problems.map((p) => (
                    <li key={p.title} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white text-xs">
                        ✓
                        </span>
                        <div>
                        <p className="font-semibold text-[#1a3a6b]">{p.title}</p>
                        <p className="text-sm text-slate-500">{p.desc}</p>
                        </div>
                    </li>
                    ))}
                </ul>
                </div>

                {/* Chart image placeholder */}
                <div className="overflow-hidden rounded-2xl bg-linear-to-br from-[#1a3a6b] to-[#2563eb] aspect-4/3 flex items-center justify-center shadow-xl relative">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-around px-8 pb-6 gap-3">
                    {[60, 80, 45, 90, 70, 95, 55, 85].map((h, i) => (
                        <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-amber-400"
                        style={{ height: `${h}%` }}
                        />
                    ))}
                    </div>
                </div>
                {/* <div className="relative text-center p-8">
                    <div className="text-6xl mb-3">📊</div>
                    <p className="text-white font-semibold text-lg">
                    Croissance &amp; Performance
                    </p>
                    <p className="text-blue-200 text-sm mt-1">
                    Résultats mesurables pour vos équipes
                    </p>
                </div> */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                    <img src="/images/img2.png" alt="AfrikCSE & AfrikVoyage - Gestion d'entreprise moderne" />
                </div>
                </div>
            </div>
            </div>
        </div>
        </section>
    );
}

// ─── Section: Vision ──────────────────────────────────────────────────────────

function VisionSection() {
    return (
        <section className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Notre Vision
            </h2>
            <p className="mx-auto max-w-3xl text-base text-slate-600 sm:text-lg">
                Devenir la plateforme de référence pour la gestion d&apos;entreprise
                en Afrique, tout en rayonnant à l&apos;international
            </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visionCards.map((card) => (
                <div
                key={card.title}
                className={`${card.bg} group relative overflow-hidden rounded-2xl p-8 text-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                >
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative">
                    <div className="mb-4 text-4xl">{card.icon}</div>
                    <h3 className="mb-3 text-xl font-bold">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-white/80">
                    {card.description}
                    </p>
                </div>
                </div>
            ))}
            </div>

            {/* Values */}
            <div className="mt-20 md:mt-28">
            <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Nos Valeurs Fondamentales
                </h2>
                <p className="text-slate-600">
                Les principes qui guident chacune de nos actions
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {valueCards.map((card) => (
                <div
                    key={card.title}
                    className="group rounded-2xl bg-white p-8 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                    <div
                    className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg} text-2xl`}
                    >
                    {card.icon}
                    </div>
                    <h3
                    className={`mb-3 text-xl font-bold ${card.color}`}
                    >
                    {card.title}
                    </h3>
                    <p className="mb-5 text-sm leading-relaxed text-slate-500">
                    {card.description}
                    </p>
                    <ul className="space-y-2">
                    {card.points.map((pt) => (
                        <li
                        key={pt}
                        className="flex items-center gap-2 text-sm text-slate-600"
                        >
                        <span className="text-teal-500">→</span>
                        {pt}
                        </li>
                    ))}
                    </ul>
                </div>
                ))}
            </div>
            </div>
        </div>
        </section>
    );
}

// ─── Section: Team ────────────────────────────────────────────────────────────

function TeamSection() {
    return (
        <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#1a3a6b] sm:text-4xl">
                Notre Équipe
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
                Une équipe passionnée et diverse, unie par la vision de transformer
                la gestion d&apos;entreprise en Afrique
            </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
                <div
                key={member.name}
                className="group flex flex-col items-center text-center"
                >
                {/* Avatar */}
                <div className="relative mb-5">
                    <div
                    className={`h-28 w-28 rounded-full bg-linear-to-br ${member.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-transform duration-300 group-hover:scale-105`}
                    >
                    {member.initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-teal-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                    {member.title[0]}
                    </div>
                </div>

                <h3 className="mb-1 text-base font-bold text-[#1a3a6b]">
                    {member.name}
                </h3>
                <p className="mb-3 text-sm font-semibold text-teal-500">
                    {member.role}
                </p>
                <p className="text-sm leading-relaxed text-slate-500">
                    {member.description}
                </p>
                </div>
            ))}
            </div>

            {/* CTA */}
            <div className="mt-14 text-center">
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#1a3a6b] px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                Rejoindre Notre Équipe
                <span>→</span>
            </button>
            </div>
        </div>
        </section>
    );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatsBanner() {
    const stats = [
        { value: "500+", label: "Entreprises clientes" },
        { value: "15", label: "Pays en Afrique" },
        { value: "50K+", label: "Voyages gérés" },
        { value: "99.9%", label: "Disponibilité SLA" },
    ];

    return (
        <section className="bg-linear-to-r from-[#1a3a6b] to-[#2563eb] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
                <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-white sm:text-4xl">
                    {s.value}
                </p>
                <p className="mt-1 text-sm text-blue-200">{s.label}</p>
                </div>
            ))}
            </div>
        </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
    return (
        <main className="min-h-screen font-sans antialiased">
        <HeroSection />
        <MissionSection />
        <StatsBanner />
        <VisionSection />
        <TeamSection />
        </main>
    );
}