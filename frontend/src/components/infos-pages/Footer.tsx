import Link from "next/link";

const FOOTER_LINKS = {
    Produits: [
        { label: "AfrikCSE", href: "/afrikcse" },
        { label: "AfrikVoyage", href: "/afrikvoyage" },
        { label: "Intégrations", href: "/integrations" },
        { label: "API", href: "/api" },
    ],
    Entreprise: [
        { label: "À Propos", href: "/infos/about" },
        { label: "Comment ça marche", href: "/infos/how-it-works" },
        { label: "Contact", href: "/infos/contact" },
        { label: "Rejoignez-nous", href: "/infos/join-us" },
    ],
    Support: [
        { label: "Centre d'aide", href: "/infos/contact" },
        { label: "Tarifs", href: "/infos/pricing" },
        { label: "Politique de confidentialité", href: "/infos/privacy" },
        { label: "Contact", href: "/infos/contact" },
    ],
};

const SOCIAL_LINKS = [
    {
        label: "LinkedIn",
        href: "https://linkedin.com",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.57a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z" />
            </svg>
        ),
    },
    {
        label: "Twitter",
        href: "https://twitter.com",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: "Facebook",
        href: "https://facebook.com",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.875v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
        ),
    },
    {
        label: "YouTube",
        href: "https://youtube.com",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
];

export default function Footer() {
    return (
        <footer className="bg-[#0d1b2a] text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                {/* Main grid - 3 colonnes sur mobile, 4 sur desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    
                    {/* Brand - prend toute la largeur sur mobile, 1 colonne sur desktop */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all duration-300">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-base tracking-tight">
                                AfrikCSE <span className="text-teal-400">&amp;</span> AfrikVoyage
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                            Offrir aux entreprises africaines des solutions numériques modernes pour la gestion des voyages et des employés.
                        </p>
                        
                        {/* Socials avec animations */}
                        <div className="flex items-center gap-2.5">
                            {SOCIAL_LINKS.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className="w-9 h-9 rounded-full bg-slate-800/50 hover:bg-teal-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-teal-500/20 border border-slate-700/50 hover:border-teal-400"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns - 3 colonnes sur mobile, alignées */}
                    {Object.entries(FOOTER_LINKS).map(([section, links]) => (
                        <div key={section} className="space-y-4">
                            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                                {section}
                            </h3>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:pl-1 border-l-2 border-transparent hover:border-teal-400 pl-0 hover:pl-2"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar avec séparateur */}
                <div className="mt-12 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2024 AfrikCSE &amp; AfrikVoyage. Tous droits réservés.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        {[
                            { label: "Confidentialité", href: "/infos/privacy" },
                            { label: "Conditions", href: "/infos/legal" },
                            { label: "Cookies", href: "/infos/privacy" },
                            { label: "Mentions légales", href: "/infos/legal" },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 hover:underline underline-offset-2"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Badge de confiance */}
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        Sécurité RGPD
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        Hébergement souverain
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        Support 24/7
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        ISO 27001 certifié
                    </span>
                </div>
            </div>
        </footer>
    );
}