import Link from "next/link";

// ── Icons ───────────────────────────────────────────────────────────
const QuestionIcon = () => (
    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const GroupIcon = () => (
    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ScaleIcon = () => (
    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
);

const PlaneIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const BriefcaseIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

// ── Data ────────────────────────────────────────────────────────────
const CHALLENGES = [
    {
        icon: <QuestionIcon />,
        iconBg: "bg-pink-100",
        title: "Coûts de voyage incontrôlés",
        description:
        "Les dépenses de voyage d'affaires explosent sans visibilité ni contrôle budgétaire approprié",
    },
    {
        icon: <GroupIcon />,
        iconBg: "bg-amber-100",
        title: "Complexité CSE",
        description:
        "Gestion manuelle et dispersée des comités sociaux et économiques, source d'inefficacité",
    },
    {
        icon: <ScaleIcon />,
        iconBg: "bg-blue-100",
        title: "Conformité réglementaire",
        description:
        "Difficultés à respecter les réglementations locales et internationales en constante évolution",
    },
];

const AFRIKVOYAGE_FEATURES = [
    "Réservation centralisée",
    "Contrôle budgétaire en temps réel",
    "Gestion des notes de frais",
    "Reporting avancé",
];

const AFRIKCSE_FEATURES = [
    "Gestion des avantages employés",
    "Catalogue de services",
    "Suivi de satisfaction",
    "Conformité automatisée",
];

// ── Component ───────────────────────────────────────────────────────
export default function ChallengesAndSolutions() {
    return (
        <div className="bg-white">
        {/* ── Section 1: Challenges ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-12">
            <h2 className="text-gray-900 font-extrabold text-2xl sm:text-3xl lg:text-4xl mb-3">
                Les défis que nous résolvons
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
                Les entreprises africaines font face à des défis uniques dans la gestion des voyages d&apos;affaires
                et des avantages employés
            </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHALLENGES.map((c) => (
                <div
                key={c.title}
                className="bg-gray-50 border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
                >
                <div className={`w-12 h-12 ${c.iconBg} rounded-full flex j items-center justify-center mb-4`}>
                    {c.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{c.description}</p>
                </div>
            ))}
            </div>
        </section>

        {/* ── Section 2: Two pillars ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
            <div className="text-center mb-12">
            <h2 className="text-gray-900 font-extrabold text-2xl sm:text-3xl lg:text-4xl mb-3">
                Deux piliers, une solution complète
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
                Notre plateforme unifiée transforme la gestion de vos voyages d&apos;affaires et avantages employés
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AfrikVoyage */}
            <div className="bg-teal-100/60 border border-teal-200/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                    <PlaneIcon />
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg">AfrikVoyage</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                Solution complète de gestion des voyages d&apos;affaires adaptée au contexte africain et international
                </p>
                <ul className="flex flex-col gap-2">
                {AFRIKVOYAGE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-700 text-sm">
                    <span className="text-teal-600">
                        <CheckIcon />
                    </span>
                    {f}
                    </li>
                ))}
                </ul>
                <Link
                href="/afrikvoyage"
                className="inline-flex items-center gap-1 text-teal-700 font-semibold text-sm hover:gap-2 transition-all duration-200 mt-auto"
                >
                En savoir plus
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                </Link>
            </div>

            {/* AfrikCSE */}
            <div className="bg-amber-50/80 border border-amber-200/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                    <BriefcaseIcon />
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg">AfrikCSE</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                Plateforme digitale pour optimiser la gestion des comités sociaux et économiques
                </p>
                <ul className="flex flex-col gap-2">
                {AFRIKCSE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-700 text-sm">
                    <span className="text-amber-500">
                        <CheckIcon />
                    </span>
                    {f}
                    </li>
                ))}
                </ul>
                <Link
                href="/afrikcse"
                className="inline-flex items-center gap-1 text-amber-600 font-semibold text-sm hover:gap-2 transition-all duration-200 mt-auto"
                >
                En savoir plus
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                </Link>
            </div>
            </div>
        </section>
        </div>
    );
}