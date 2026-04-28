// ── Icons ────────────────────────────────────────────────────────────
const PiggyIcon = () => (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const HeartIcon = () => (
    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const ShieldIcon = () => (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

// ── Data ──────────────────────────────────────────────────────────────
const BENEFITS = [
    {
        icon: <PiggyIcon />,
        iconBg: "bg-teal-500",
        title: "Contrôle des coûts",
        description:
        "Réduisez vos dépenses de voyage et optimisez votre budget CSE grâce à notre intelligence artificielle et nos analyses prédictives",
    },
    {
        icon: <HeartIcon />,
        iconBg: "bg-amber-400",
        title: "Satisfaction employés",
        description:
        "Améliorez l'expérience collaborateur avec des outils modernes et des services personnalisés qui répondent à leurs besoins",
    },
    {
        icon: <ShieldIcon />,
        iconBg: "bg-blue-600",
        title: "Conformité",
        description:
        "Respectez automatiquement les réglementations locales et internationales avec notre système de compliance intégré",
    },
];

const LOGOS = ["LOGO 1", "LOGO 2", "LOGO 3", "LOGO 4", "LOGO 5"];

const TESTIMONIALS = [
    {
        name: "Marie Dubois",
        role: "Directrice RH, TechAfrik",
        avatar: "MD",
        avatarBg: "bg-teal-600",
        text: "AfrikCSE & AfrikVoyage ont révolutionné notre gestion RH. Nous avons réduit nos coûts de voyage de 30% tout en améliorant la satisfaction de nos employés.",
    },
    {
        name: "Jean-Paul Kouassi",
        role: "CFO, InnovCorp",
        avatar: "JK",
        avatarBg: "bg-blue-600",
        text: "La plateforme nous offre une visibilité complète sur nos dépenses et une conformité automatique avec les réglementations locales.",
    },
];

// ── Component ─────────────────────────────────────────────────────────
export default function BenefitsAndTrust() {
    return (
        <div className="bg-white">
        {/* ── Benefits ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-14">
            <h2 className="text-gray-900 font-extrabold text-2xl sm:text-3xl lg:text-4xl mb-3">
                Les bénéfices clés pour votre entreprise
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
                Transformez votre gestion d&apos;entreprise avec notre solution intégrée
            </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
            {BENEFITS.map((b) => (
                <div key={b.title} className="flex flex-col items-center text-center gap-4">
                <div
                    className={`w-16 h-16 ${b.iconBg} rounded-full flex items-center justify-center shadow-md`}
                >
                    {b.icon}
                </div>
                <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
                </div>
            ))}
            </div>
        </section>

        {/* ── Trust / Social proof ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
            <div className="text-center mb-10">
            <h2 className="text-gray-900 font-extrabold text-2xl sm:text-3xl lg:text-4xl mb-3">
                Ils nous font confiance
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
                Plus de 500 entreprises africaines et internationales utilisent notre plateforme
            </p>
            </div>

            {/* Logo strip */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
            {LOGOS.map((logo) => (
                <div
                key={logo}
                className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg px-6 py-3 text-gray-400 font-semibold text-sm"
                >
                {logo}
                </div>
            ))}
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
                <div
                key={t.name}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                <div className="flex items-center gap-3 mb-4">
                    <div
                    className={`w-10 h-10 ${t.avatarBg} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}
                    >
                    {t.avatar}
                    </div>
                    <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                    </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{t.text}</p>
                </div>
            ))}
            </div>
        </section>
        </div>
    );
}