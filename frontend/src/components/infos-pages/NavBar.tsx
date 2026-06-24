"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plane, Gift, Bot, ShieldCheck, Building2, Globe, Star, TrendingDown, BarChart2, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Structure enrichie pour le Méga-Menu
const ALL_SOLUTIONS: { category: string; Icon: LucideIcon; color: string; href: string; items: { label: string; desc: string; tag: string | null; tagColor?: string; href: string }[] }[] = [
  {
    category: "Gestion des voyages",
    Icon: Plane,
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
    Icon: Gift,
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
    Icon: Bot,
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
    Icon: ShieldCheck,
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

const PLATFORM_HIGHLIGHTS: { label: string; Icon: LucideIcon; value: string }[] = [
  { label: "entreprises clientes", Icon: Building2, value: "500+" },
  { label: "pays couverts", Icon: Globe, value: "54" },
  { label: "satisfaction", Icon: Star, value: "95%" },
  { label: "économies", Icon: TrendingDown, value: "-30%" },
];

// Liens de navigation avec breakpoints pour affichage conditionnel
const NAV_LINKS = [
  { label: "À propos", href: "/infos/about", showOn: "lg" },
  { label: "Comment ça marche", href: "/infos/how-it-works", showOn: "xl" },
  { label: "Tarifs", href: "/infos/pricing", showOn: "lg" },
  { label: "Contact", href: "/infos/contact", showOn: "md" },
  { label: "Rejoignez-nous", href: "/infos/join-us", showOn: "xl" }
];

// Traductions pour le sélecteur de langue
const LANGUAGE_LABELS = {
  FR: "Français",
  EN: "English",
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [lang, setLang] = useState<"FR" | "EN">("FR");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoverEffect, setHoverEffect] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const solutionsButtonRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer les menus lors du clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        megaMenuOpen &&
        solutionsButtonRef.current &&
        !solutionsButtonRef.current.contains(event.target as Node) &&
        megaMenuRef.current &&
        !megaMenuRef.current.contains(event.target as Node)
      ) {
        setMegaMenuOpen(false);
      }
      if (
        langDropdownOpen &&
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [megaMenuOpen, langDropdownOpen]);

  // Gestion du méga-menu
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
    }, 200);
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

  // Gestion du changement de langue
  const handleLanguageChange = (newLang: "FR" | "EN") => {
    setLang(newLang);
    setLangDropdownOpen(false);
    const message = newLang === "FR"
      ? "Langue changée : Français"
      : "Language changed: English";
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isSolutionsActive = pathname === "/infos/solutions";

  // Fonction pour déterminer si un lien doit être affiché selon la taille d'écran
  const shouldShowLink = (showOn: string) => {
    if (showOn === "all") return true;
    if (showOn === "md") return true; // visible sur md et plus
    if (showOn === "lg") return true; // visible sur lg et plus
    if (showOn === "xl") return true; // visible sur xl et plus
    return true;
  };

  // Classes CSS pour l'affichage conditionnel
  const getLinkVisibilityClass = (showOn: string) => {
    switch(showOn) {
      case "all": return "";
      case "md": return "hidden md:inline-flex";
      case "lg": return "hidden lg:inline-flex";
      case "xl": return "hidden xl:inline-flex";
      default: return "";
    }
  };

  return (
    <>
      <header
        className={`w-full sticky top-0 z-50 transition-all duration-500 border-b ${
          isScrolled
            ? "bg-slate-900/80 backdrop-blur-xl border-slate-800/60 shadow-xl shadow-slate-950/20"
            : "bg-white/95 backdrop-blur-md border-slate-200/60 shadow-sm shadow-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 overflow-visible">
          <div className="flex items-center justify-between h-16 md:h-20 gap-1 sm:gap-2">
            
            {/* ── LOGO ── */}
            <div className="flex items-center shrink-0">
              <Link href="/infos" className="flex items-center gap-2 sm:gap-3 group">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center p-[1px] transition-transform duration-300 group-hover:scale-105 shrink-0">
                  <div className={`w-full h-full rounded-[11px] flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-950" : "bg-white"}`}>
                    <svg
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isScrolled ? "text-emerald-400" : "text-indigo-600"}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </div>
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className={`text-sm md:text-base font-bold tracking-tight leading-none mb-0.5 transition-colors whitespace-nowrap ${isScrolled ? "text-white" : "text-slate-900"}`}>
                    Afrik<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">Workspace</span>
                  </span>
                  <span className={`text-[8px] md:text-[9px] font-black tracking-[0.12em] uppercase leading-none whitespace-nowrap ${isScrolled ? "text-slate-400" : "text-slate-500"}`}>
                    SaaS Platform
                  </span>
                </div>
                <div className="hidden sm:flex lg:hidden flex-col">
                  <span className={`text-xs font-bold tracking-tight leading-none transition-colors ${isScrolled ? "text-white" : "text-slate-900"}`}>
                    Afrik<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">Workspace</span>
                  </span>
                </div>
              </Link>
            </div>

            {/* ── NAVIGATION PRINCIPALE ── */}
            <nav className="hidden md:flex items-center justify-end flex-1 mx-1 lg:mx-2 overflow-visible">
              <div className="flex items-center gap-0.5 lg:gap-1 p-1 rounded-full border transition-all bg-white/95 backdrop-blur-sm border-slate-200/60 shadow-sm flex-wrap">
                {/* Méga-Menu - Positionné sous le bouton et s'étend vers la droite */}
                <div
                  ref={solutionsButtonRef}
                  className="relative shrink-0"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href="/infos/solutions"
                    className={`inline-flex items-center gap-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      isScrolled ? "text-slate-700 hover:text-slate-900" : "text-slate-700 hover:text-slate-900"
                    } ${megaMenuOpen ? "bg-slate-100" : ""} ${isSolutionsActive ? "text-indigo-600 bg-slate-100" : ""}`}
                  >
                    <span>Solutions</span>
                    <svg
                      className={`w-3 h-3 transition-transform duration-300 ${megaMenuOpen ? "rotate-180 text-indigo-500" : "text-slate-400"}`}
                      fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </Link>

                  {/* MÉGA-MENU CORRIGÉ - Adapté à tous les écrans */}
                  {megaMenuOpen && (
                    <div 
                      ref={megaMenuRef}
                      className="absolute top-full left-0 mt-2 w-screen max-w-[1200px] rounded-2xl border shadow-2xl transition-all duration-300 animate-fadeIn overflow-hidden z-50 bg-white border-slate-100"
                      style={{ 
                        left: '0',
                        transform: 'translateX(0)',
                        width: 'min(calc(100vw - 2rem), 1200px)'
                      }}
                      onMouseEnter={handleMegaMenuMouseEnter}
                      onMouseLeave={handleMegaMenuMouseLeave}
                    >
                      <div className="p-4 md:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                          {ALL_SOLUTIONS.map((category, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                                <category.Icon className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                                  {category.category}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {category.items.map((item, itemIdx) => (
                                  <button
                                    key={itemIdx}
                                    onClick={() => navigateToSolutions(item.href || category.href)}
                                    className="group/item flex gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer w-full text-left"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-semibold text-slate-700 group-hover/item:text-indigo-600">
                                          {item.label}
                                        </span>
                                        {item.tag && (
                                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${
                                            item.tagColor === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                            item.tagColor === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                            item.tagColor === 'purple' ? 'bg-purple-100 text-purple-600' :
                                            item.tagColor === 'amber' ? 'bg-amber-100 text-amber-600' :
                                            'bg-red-100 text-red-600'
                                          }`}>
                                            {item.tag}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => navigateToSolutions(category.href)}
                                className="mt-1 text-[9px] font-semibold text-indigo-500 hover:text-indigo-600 transition flex items-center gap-1"
                              >
                                Voir toute la catégorie
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="my-3 border-t border-slate-200" />

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">La plateforme en bref</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {PLATFORM_HIGHLIGHTS.map((highlight, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                <highlight.Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                                <div>
                                  <p className="text-sm font-black text-indigo-500">{highlight.value}</p>
                                  <p className="text-[9px] text-slate-500">{highlight.label}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                          <p className="inline-flex items-center gap-1 text-[9px] text-slate-500 text-center sm:text-left">
                            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                            Découvrez comment AfrikWorkspace transforme la gestion
                          </p>
                          <Link
                            href="/infos/solutions"
                            className="text-[9px] font-semibold px-2 py-1 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition whitespace-nowrap"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            Explorer →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Liens navigation - Affichage conditionnel par breakpoint */}
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const visibilityClass = getLinkVisibilityClass(link.showOn);
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-1.5 lg:px-3 xl:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold transition-all duration-300 relative whitespace-nowrap ${visibilityClass} ${
                        isActive
                          ? "text-indigo-600 bg-slate-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0 lg:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* ── ACTIONS DROITE ── */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2 xl:gap-3 shrink-0">
              {/* ── SÉLECTEUR DE LANGUE ── */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isScrolled
                      ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{LANGUAGE_LABELS[lang]}</span>
                  <span className="sm:hidden">{lang}</span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown langue */}
                {langDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50">
                    <button
                      onClick={() => handleLanguageChange("FR")}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 ${
                        lang === "FR" ? "text-indigo-600 bg-indigo-50" : "text-slate-700"
                      }`}
                    >
                      <span>🇫🇷</span>
                      Français
                      {lang === "FR" && (
                        <svg className="w-3 h-3 ml-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleLanguageChange("EN")}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 ${
                        lang === "EN" ? "text-indigo-600 bg-indigo-50" : "text-slate-700"
                      }`}
                    >
                      <span>🇬🇧</span>
                      English
                      {lang === "EN" && (
                        <svg className="w-3 h-3 ml-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ── BOUTON CONNEXION ── */}
              <Link
                href="/login"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isScrolled
                    ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Connexion</span>
                <span className="sm:hidden">Se connecter</span>
              </Link>

              {/* ── BOUTON DÉMO ── */}
              <Link
                href="/infos/demo"
                onMouseEnter={() => setHoverEffect(true)}
                onMouseLeave={() => setHoverEffect(false)}
                className="relative text-[9px] lg:text-xs font-black px-2 lg:px-4 py-1.5 lg:py-2 rounded-xl transition-all duration-300 overflow-hidden whitespace-nowrap group bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shrink-0"
                style={{
                  boxShadow: hoverEffect 
                    ? "0 0 20px rgba(99, 102, 241, 0.5), 0 0 10px rgba(99, 102, 241, 0.3)" 
                    : "0 2px 8px rgba(99, 102, 241, 0.2)"
                }}
              >
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </span>
                <span className="relative flex items-center gap-1">
                  <span className="hidden xs:inline">Démo</span>
                  <span className="xs:hidden">Essayer</span>
                  <svg className="w-2.5 h-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* ── MOBILE ── */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/login"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                Connexion
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-1.5 rounded-lg border ${isScrolled ? "text-slate-400 bg-slate-900 border-slate-800" : "text-slate-600 bg-slate-50 border-slate-200"}`}
              >
                {menuOpen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── MENU MOBILE ── */}
        {menuOpen && (
          <div className={`md:hidden border-t px-4 pb-6 pt-4 space-y-3 backdrop-blur-xl ${
            isScrolled ? "border-slate-800/80 bg-slate-950/95 text-white" : "border-slate-200/60 bg-white/98 text-slate-900"
          }`}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AW</span>
              </div>
              <span className="font-bold text-sm">AfrikWorkspace</span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">Solutions</p>
              {ALL_SOLUTIONS.flatMap(cat => cat.items).map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href || "/infos/solutions"}
                  onClick={() => setMenuOpen(false)}
                  className="flex gap-3 p-2.5 rounded-xl hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-slate-400">{item.desc}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-800/40 my-2" />

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-3 rounded-xl text-sm font-medium hover:bg-slate-800/20 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-slate-800/40 my-2" />

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Langue</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setLang("EN"); setMenuOpen(false); }}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      lang === "EN" 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    ENGLISH
                  </button>
                  <button
                    onClick={() => { setLang("FR"); setMenuOpen(false); }}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      lang === "FR" 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    FRANÇAIS
                  </button>
                </div>
              </div>
              
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-slate-800 bg-slate-900 mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Connexion
              </Link>
              <Link
                href="/infos/demo"
                className="block text-center text-sm font-bold py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
                onClick={() => setMenuOpen(false)}
              >
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
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out forwards;
          }
          @media (min-width: 480px) {
            .xs\\:inline {
              display: inline;
            }
            .xs\\:hidden {
              display: none;
            }
          }
        `}</style>
      </header>

      {/* ── TOAST DE CONFIRMATION DE LANGUE ── */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-sm font-semibold animate-slideIn border border-slate-700">
          {toastMessage}
        </div>
      )}
    </>
  );
}