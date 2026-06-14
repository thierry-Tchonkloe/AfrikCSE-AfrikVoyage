const SECTIONS = [
    {
        title: "1. Éditeur du site",
        body: `Le site et la plateforme AfrikCSE & AfrikVoyage sont édités par Waxeho.
        Pour toute question relative à l'édition du site, contactez-nous via la page Contact.`,
    },
    {
        title: "2. Hébergement",
        body: `La plateforme est hébergée sur des infrastructures cloud sécurisées (Render pour les services
        applicatifs, Vercel pour le site et les espaces clients), garantissant disponibilité et conformité
        aux standards de sécurité en vigueur.`,
    },
    {
        title: "3. Propriété intellectuelle",
        body: `L'ensemble des éléments accessibles sur le site (textes, images, logos, interfaces, code source)
        sont la propriété exclusive de Waxeho ou de ses partenaires, et sont protégés par le droit
        de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle,
        sans autorisation préalable est interdite.`,
    },
    {
        title: "4. Conditions d'utilisation",
        body: `L'accès et l'utilisation de la plateforme AfrikCSE & AfrikVoyage sont soumis à l'acceptation des
        présentes mentions légales ainsi qu'aux conditions contractuelles propres à chaque organisation cliente.
        Waxeho se réserve le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment.`,
    },
    {
        title: "5. Responsabilité",
        body: `Waxeho met tout en œuvre pour assurer l'exactitude des informations diffusées sur la plateforme,
        mais ne peut garantir l'absence d'erreurs ou d'omissions. Waxeho ne pourra être tenu responsable des
        dommages directs ou indirects résultant de l'utilisation du site ou de l'impossibilité d'y accéder.`,
    },
    {
        title: "6. Droit applicable",
        body: `Les présentes mentions légales sont soumises au droit applicable dans le pays d'immatriculation
        de l'organisation cliente. Tout litige relatif à leur interprétation ou exécution relève des juridictions
        compétentes.`,
    },
];

export default function LegalPage() {
    return (
        <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
            {/* ── HERO ── */}
            <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                        Cadre légal
                    </span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl leading-[1.05]">
                        Mentions légales
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
