"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Structure enrichie pour le Méga-Menu - PLUS DE DÉTAILS (version compacte)
const ALL_SOLUTIONS = [
  {
    category: "Gestion des voyages",
    icon: "✈️",
    color: "indigo",
    href: "/infos/solutions#voyage",
    items: [
      { label: "Réservation centralisée", desc: "Vols, hôtels, trains et visas", tag: "Nouveau", tagColor: "indigo", href: "/infos/solutions#voyage" },
      { label: "Contrôle budgétaire", desc: "Politiques de voyage automatisées", tag: "Populaire", tagColor: "emerald", href: "/infos/solutions#voyage" },
      { label: "Reporting & ROI", desc: "Analyses financières en temps réel", tag: null, href: "/infos/solutions#voyage" },
      { label: "Gestion des notes de frais", desc: "Scan automatique par IA", tag: "IA", tagColor: "purple", href: "/infos/solutions#voyage" },
    ]
  },
  {
    category: "Avantages collaborateurs",
    icon: "🎁",
    color: "emerald",
    href: "/infos/solutions#cse",
    items: [
      { label: "Service Gallery", desc: "Avantages et billetterie centralisés", tag: "Nouveau", tagColor: "emerald", href: "/infos/solutions#cse" },
      { label: "Suivi de satisfaction", desc: "Sondages et feedbacks instantanés", tag: null, href: "/infos/solutions#cse" },
      { label: "Gestion des subventions", desc: "Budgets alloués par bénéficiaire", tag: null, href: "/infos/solutions#cse" },
      { label: "Programme de fidélité", desc: "Points cumulables", tag: "Gold", tagColor: "amber", href: "/infos/solutions#cse" },
    ]
  },
  {
    category: "Intelligence & Support",
    icon: "🤖",
    color: "purple",
    href: "/infos/solutions#intelligence",
    items: [
      { label: "IA prédictive", desc: "Anticipez les dépenses", tag: "Beta", tagColor: "purple", href: "/infos/solutions#intelligence" },
      { label: "Assistant voyage 24/7", desc: "Support multicanal en temps réel", tag: null, href: "/infos/solutions#intelligence" },
      { label: "Dashboard personnalisable", desc: "KPI sur mesure", tag: null, href: "/infos/solutions#intelligence" },
      { label: "Intégrations API", desc: "Connectez votre ERP", tag: "Enterprise", tagColor: "indigo", href: "/infos/solutions#intelligence" },
    ]
  },
  {
    category: "Sécurité & Conformité",
    icon: "🛡️",
    color: "slate",
    href: "/infos/solutions#security",
    items: [
      { label: "Alertes sécurité voyage", desc: "Notifications situations à risque", tag: "Live", tagColor: "red", href: "/infos/solutions#security" },
      { label: "Conformité RGPD", desc: "Protection des données", tag: null, href: "/infos/solutions#security" },
      { label: "Assurance voyage intégrée", desc: "Couverture automatique", tag: null, href: "/infos/solutions#security" },
      { label: "Validation multi-niveaux", desc: "Workflow d'approbation", tag: null, href: "/infos/solutions#security" },
    ]
  }
];

// Plateforme en bref (infos sans tout visiter) - version compacte
const PLATFORM_HIGHLIGHTS = [
  { label: "entreprises clientes", icon: "🏢", value: "500+" },
  { label: "pays couverts", icon: "🌍", value: "54" },
  { label: "satisfaction", icon: "⭐", value: "95%" },
  { label: "économies", icon: "📉", value: "-30%" },
];

const NAV_LINKS = [
    { label: "Accueil", href: "/infos" },
    { label: "À propos", href: "/infos/about" },
    { label: "Comment ça marche", href: "/infos/how-it-works" },
    { label: "Contact", href: "/infos/contact" },
    { label: "Rejoignez-nous", href: "/infos/join-us" }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "FR">("FR");
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoverEffect, setHoverEffect] = useState(false);
  const solutionsButtonRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMegaMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 150);
  };

  const handleMegaMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMegaMenuMouseLeave = () => {
    setMegaMenuOpen(false);
  };

  const navigateToSolutions = (href: string) => {
    setMegaMenuOpen(false);
    router.push(href);
  };

  const isSolutionsActive = pathname === "/infos/solutions";

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-500 border-b ${
        isScrolled
          ? "bg-slate-900/80 backdrop-blur-xl border-slate-800/60 shadow-xl shadow-slate-950/20"
          : "bg-white/95 backdrop-blur-md border-slate-200/60 shadow-sm shadow-slate-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* ── ZONE GAUCHE : LOGO ── */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/infos" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center p-[1px] transition-transform duration-300 group-hover:scale-105">
                <div className={`w-full h-full rounded-[11px] flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-950" : "bg-white"}`}>
                  <svg
                    className={`w-4 h-4 transition-colors ${isScrolled ? "text-emerald-400" : "text-indigo-600"}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className={`text-base font-bold tracking-tight leading-none mb-0.5 transition-colors ${isScrolled ? "text-white" : "text-slate-900"}`}>
                  Afrik<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">Workspace</span>
                </span>
                <span className={`text-[9px] font-black tracking-[0.12em] uppercase leading-none ${isScrolled ? "text-slate-400" : "text-slate-500"}`}>
                  SaaS Platform
                </span>
              </div>
            </Link>
          </div>

          {/* ── ZONE CENTRALE ACCENTUÉE : NAVIGATION CAPSULE EXTENSIBLE ── */}
          <nav className={`hidden md:flex items-center xl:gap-2 lg:gap-1.5 gap-0.5 p-1.5 rounded-full border transition-all shrink-0 ${
            isScrolled ? "bg-slate-950/40 border-slate-800/80" : "bg-white border-slate-200/60"
          }`}>
            {/* Déclencheur du Méga-Menu */}
            <div
              ref={solutionsButtonRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/infos/solutions"
                className={`inline-flex items-center gap-1.5 xl:px-4 lg:px-3 px-2.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isScrolled ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                } ${megaMenuOpen ? (isScrolled ? "bg-slate-800/60" : "bg-slate-50") : ""} ${isSolutionsActive ? (isScrolled ? "text-indigo-400 bg-slate-900" : "text-indigo-600 bg-slate-100") : ""}`}
              >
                <span>Solutions</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${megaMenuOpen ? "rotate-180 text-indigo-500" : "text-slate-400"}`}
                  fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Link>

              {/* MÉGA-MENU ALIGNÉ */}
              {megaMenuOpen && (
                <div 
                  ref={megaMenuRef}
                  className="absolute top-full left-0 mt-3 w-[1000px] xl:w-[1100px] rounded-2xl border shadow-2xl transition-all duration-300 animate-fadeIn overflow-hidden z-50"
                  style={{ transform: "translateX(-10%)" }} // Léger décalage pour recentrer la boîte géante
                  onMouseEnter={handleMegaMenuMouseEnter}
                  onMouseLeave={handleMegaMenuMouseLeave}
                >
                  <div className={`p-5 ${
                    isScrolled ? "bg-slate-950 border-slate-800/80" : "bg-white border-slate-100"
                  }`}>
                    <div className="grid grid-cols-4 gap-5">
                      {ALL_SOLUTIONS.map((category, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2 px-2 pb-1.5 border-b border-slate-700/20">
                            <span className="text-base">{category.icon}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              category.color === 'indigo' ? 'text-indigo-500' :
                              category.color === 'emerald' ? 'text-emerald-500' :
                              category.color === 'purple' ? 'text-purple-500' :
                              'text-slate-500'
                            }`}>
                              {category.category}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item, itemIdx) => (
                              <button
                                key={itemIdx}
                                onClick={() => navigateToSolutions(item.href || category.href)}
                                className="group/item flex gap-2 p-1.5 rounded-lg hover:bg-slate-800/20 transition-all cursor-pointer w-full text-left"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-semibold ${isScrolled ? "text-slate-300 group-hover/item:text-indigo-400" : "text-slate-700 group-hover/item:text-indigo-600"}`}>
                                      {item.label}
                                    </span>
                                    {item.tag && (
                                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${
                                        item.tagColor === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                                        item.tagColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                        item.tagColor === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                                        item.tagColor === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                                      }`}>
                                        {item.tag}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => navigateToSolutions(category.href)}
                            className="mt-2 text-[9px] font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                          >
                            Voir toute la catégorie
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="my-4 border-t border-slate-700/20" />

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs">📊</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">La plateforme en bref</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {PLATFORM_HIGHLIGHTS.map((highlight, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/10">
                            <span className="text-lg">{highlight.icon}</span>
                            <div>
                              <p className="text-base font-black text-indigo-400 leading-tight">{highlight.value}</p>
                              <p className="text-[9px] text-slate-400 leading-tight">{highlight.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/20 flex items-center justify-between gap-3">
                      <p className="text-[10px] text-slate-400">
                        ✨ Découvrez comment AfrikWorkspace transforme la gestion des voyages
                      </p>
                      <Link
                        href="/infos/solutions"
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition whitespace-nowrap"
                        onClick={() => setMegaMenuOpen(false)}
                      >
                        Explorer la plateforme →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liens structurels corrigés (Pas de retour à la ligne + Espacement fluide) */}
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`xl:px-4 lg:px-3 px-2.5 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative whitespace-nowrap ${
                    isActive
                      ? isScrolled ? "text-indigo-400 bg-slate-900" : "text-indigo-600 bg-slate-100"
                      : isScrolled ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── ZONE DROITE : ACTIONS (Empêche l'écrasement de la nav) ── */}
          <div className="hidden md:flex items-center xl:gap-5 lg:gap-3 gap-2 shrink-0 ml-auto">
            {/* Sélecteur Région / Langue */}
            <div className={`flex items-center text-[11px] font-bold border px-2.5 py-1.5 rounded-xl transition-colors ${
              isScrolled ? "text-slate-400 border-slate-800 bg-slate-950/40" : "text-slate-500 border-slate-200 bg-slate-50"
            }`}>
              <button onClick={() => setLang("EN")} className={`px-1 transition-colors ${lang === "EN" ? "text-indigo-500 font-black" : "hover:text-slate-300"}`}>EN</button>
              <span className="text-slate-700 mx-1">|</span>
              <button onClick={() => setLang("FR")} className={`px-1 transition-colors ${lang === "FR" ? "text-indigo-500 font-black" : "hover:text-slate-300"}`}>FR</button>
            </div>

            {/* Bouton Connexion */}
            <Link
              href="/login"
              className={`text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                isScrolled ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Connexion
            </Link>

            {/* CTA Premium */}
            <Link
              href="#"
              onMouseEnter={() => setHoverEffect(true)}
              onMouseLeave={() => setHoverEffect(false)}
              className="relative text-xs font-black xl:px-5 lg:px-4 px-3.5 py-3 rounded-xl transition-all duration-300 overflow-hidden whitespace-nowrap group bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
              style={{
                boxShadow: hoverEffect 
                  ? "0 0 30px rgba(99, 102, 241, 0.8), 0 0 15px rgba(99, 102, 241, 0.4)" 
                  : "0 0 15px rgba(99, 102, 241, 0.3)"
              }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-xl">
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" style={{ width: "100%", height: "100%" }} />
              </span>
              <span className="absolute inset-0 rounded-xl animate-pulse-ring" 
                style={{
                  boxShadow: "0 0 0 0 rgba(99, 102, 241, 0.5)",
                  animation: "pulse-ring 2s infinite"
                }} 
              />
              <span className="relative flex items-center gap-1.5">
                Demander une démo
                <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <div className="flex md:hidden items-center gap-4 ml-auto">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 rounded-xl border ${isScrolled ? "text-slate-400 bg-slate-900 border-slate-800" : "text-slate-600 bg-slate-50 border-slate-200"}`}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── MOBILE ACCORDION ── */}
      {menuOpen && (
        <div className={`md:hidden border-t px-6 pb-8 pt-4 space-y-4 backdrop-blur-xl ${
          isScrolled ? "border-slate-800/80 bg-slate-950/95 text-white" : "border-slate-200/60 bg-white/98 text-slate-900"
        }`}>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block px-3">Solutions</span>
            {ALL_SOLUTIONS.flatMap(cat => cat.items).map((item, idx) => (
              <Link
                key={idx}
                href={item.href || "/infos/solutions"}
                onClick={() => setMenuOpen(false)}
                className="flex gap-3 p-2.5 rounded-xl hover:bg-slate-800/20"
              >
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold">{item.label}</span>
                  <span className="text-xs text-slate-400">{item.desc}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-800/40 my-2" />

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-medium hover:bg-slate-800/20"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-3">
            <Link href="/login" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-slate-800 bg-slate-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Connexion
            </Link>
            <Link href="#" className="block text-center text-sm font-black py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
              Demander une démo
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite;
        }
      `}</style>
    </header>
  );
}