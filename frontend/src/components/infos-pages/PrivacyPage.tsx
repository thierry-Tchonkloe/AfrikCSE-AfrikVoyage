const SECTIONS = [
    {
        title: "1. Données collectées",
        body: `Dans le cadre de l'utilisation de la plateforme AfrikCSE & AfrikVoyage, nous collectons les
        données nécessaires à la gestion de votre compte : identité (nom, prénom, email, téléphone),
        données professionnelles (poste, département, organisation), et données liées aux fonctionnalités
        utilisées (notes de frais, voyages, avantages CSE, messages).`,
    },
    {
        title: "2. Finalités du traitement",
        body: `Ces données sont utilisées pour : la gestion des comptes utilisateurs et des accès,
        le traitement des demandes de voyages et de notes de frais, la gestion des avantages CSE,
        l'envoi de notifications et communications liées au service, et l'amélioration continue de la plateforme.`,
    },
    {
        title: "3. Base légale",
        body: `Le traitement de vos données repose sur l'exécution du contrat conclu entre votre organisation
        et Waxeho, ainsi que sur l'intérêt légitime à assurer le bon fonctionnement et la sécurité du service.`,
    },
    {
        title: "4. Durée de conservation",
        body: `Vos données sont conservées pendant toute la durée de votre relation contractuelle avec votre
        organisation, puis archivées ou supprimées conformément aux obligations légales applicables.`,
    },
    {
        title: "5. Cookies",
        body: `La plateforme utilise des cookies essentiels au fonctionnement du service (authentification,
        préférences d'affichage) ainsi que, le cas échéant, des cookies analytiques soumis à votre consentement.
        Vous pouvez gérer vos préférences via la bannière de consentement affichée lors de votre première visite.`,
    },
    {
        title: "6. Vos droits (RGPD)",
        body: `Conformément au Règlement Général sur la Protection des Données (RGPD) et aux législations
        locales applicables, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation
        et de portabilité de vos données, ainsi que d'un droit d'opposition. Pour exercer ces droits, contactez
        votre administrateur d'organisation ou notre équipe via la page Contact.`,
    },
    {
        title: "7. Sécurité",
        body: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement,
        contrôle d'accès basé sur les rôles, hébergement sécurisé) afin de protéger vos données contre
        tout accès non autorisé, perte ou divulgation.`,
    },
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
            {/* ── HERO ── */}
            <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                        Protection des données
                    </span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl leading-[1.05]">
                        Politique de confidentialité
                    </h1>
                    <p className="mt-4 text-sm text-slate-500">
                        Dernière mise à jour : janvier 2026
                    </p>
                </div>
            </section>

            {/* ── CONTENU ── */}
            <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
                {SECTIONS.map((section) => (
                    <div key={section.title}>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">{section.title}</h2>
                        <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{section.body}</p>
                    </div>
                ))}
            </section>
        </main>
    );
}
