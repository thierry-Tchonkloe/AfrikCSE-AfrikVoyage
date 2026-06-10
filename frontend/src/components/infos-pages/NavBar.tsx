"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Liens de redirection internes vers les sections de la page d'accueil (via ancres)
const HOME_SECTIONS = [
    { label: "Aperçu Solutions", id: "hero", desc: "Découvrez notre écosystème unifié." },
    { label: "Défis & Problématiques", id: "challenges", desc: "Les frictions métiers que nous résolvons." },
    { label: "Nos Partenaires", id: "partners", desc: "Les entreprises engagées à nos côtés." },
    { label: "Bénéfices & Impact", id: "benefits", desc: "Indicateurs de performance et ROI." }
];

// Liens d'onglets réels déjà développés ou structurels
const NAV_LINKS = [
    { label: "Accueil", href: "/infos" },
    { label: "À propos", href: "/infos/about" },
    { label: "Comment ça marche", href: "/infos/how-it-works" },
    { label: "Contact", href: "/infos/contact" },
    { label: "Rejoignez-nous", href: "/infos/join-us" }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "FR">("FR");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fonction de défilement fluide pour les ancres
  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    setSolutionsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Hauteur de la navbar h-20
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-slate-950/90 backdrop-blur-md border-slate-900 shadow-lg shadow-slate-950/20"
          : "bg-[#F9FAFB]/95 backdrop-blur-md border-slate-200/60 shadow-sm shadow-slate-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* ── LOGO CHAMÉLÉON VIBRANT ── */}
          <Link
            href="/infos"
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center p-[1px] transition-transform duration-300 group-hover:scale-105">
              <div
                className={`w-full h-full rounded-[11px] flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-950" : "bg-white"}`}
              >
                <svg
                  className={`w-4 h-4 transition-colors ${isScrolled ? "text-emerald-400" : "text-indigo-600"} group-hover:text-emerald-500`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  fontFamily: "Sanomat, ui-serif, system-ui",
                  fontWeight: 600,
                }}
                className={`text-base tracking-tight leading-none mb-0.5 transition-colors ${isScrolled ? "text-white" : "text-[rgb(21,0,44)]"}`}
              >
                Afrik
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">
                  Workspace
                </span>
              </span>
              <span
                className={`text-[9px] font-black tracking-[0.15em] uppercase leading-none transition-colors ${isScrolled ? "text-slate-500" : "text-slate-400"}`}
              >
                Voyage &amp; CSE
              </span>
            </div>
          </Link>

          {/* ── DESKTOP NAVIGATION STRUCTURELLE ET PRO ── */}
          <nav
            className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border transition-all ${
              isScrolled
                ? "bg-slate-900/40 border-slate-800/60"
                : "bg-white border-slate-200/80 shadow-inner shadow-slate-50"
            }`}
          >
            {/* Onglet Déroulant Dynamique : Nos Solutions / Parcourir la Page */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button
                style={{
                  fontFamily: "Sanomat, ui-serif, system-ui",
                  fontWeight: 600,
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isScrolled
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-700 hover:text-[rgb(21,0,44)]"
                } ${solutionsOpen && !isScrolled ? "bg-slate-50" : ""} ${solutionsOpen && isScrolled ? "bg-slate-800/50" : ""}`}
              >
                <span>Nos Solutions</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${solutionsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {/* Menu déroulant (Flyout Megamenu) */}
              {solutionsOpen && (
                <div
                  className={`absolute top-full left-0 mt-2 w-80 rounded-2xl border p-3 shadow-xl transition-all duration-200 animate-fadeIn ${
                    isScrolled
                      ? "bg-slate-950 border-slate-800 shadow-slate-950/80 text-white"
                      : "bg-white border-slate-100 shadow-slate-200/50 text-slate-900"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500 px-3 py-1 mb-1">
                    Anatomie de la plateforme
                  </div>
                  {HOME_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left flex flex-col p-3 rounded-xl transition-colors ${
                        isScrolled ? "hover:bg-slate-900" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        style={{ fontFamily: "Sanomat, ui-serif" }}
                        className="text-sm font-bold tracking-tight"
                      >
                        {section.label}
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {section.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reste des liens d'onglets réels déjà créés */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "Sanomat, ui-serif, system-ui",
                  fontWeight: 600,
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isScrolled
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    : "text-slate-600 hover:text-[rgb(21,0,44)] hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── ACTIONS BUSINESS DROITE ── */}
          <div className="hidden md:flex items-center gap-5">
            {/* Sélecteur de langue */}
            <div
              className={`flex items-center text-xs font-bold transition-colors border px-2.5 py-1.5 rounded-lg ${
                isScrolled
                  ? "text-slate-500 border-slate-900 bg-slate-950/40"
                  : "text-slate-400 border-slate-200 bg-slate-50"
              }`}
            >
              <button
                onClick={() => setLang("EN")}
                className={`px-1.5 transition-colors ${lang === "EN" ? (isScrolled ? "text-indigo-400 font-black" : "text-indigo-600 font-black") : "hover:text-slate-600"}`}
              >
                EN
              </button>
              <span
                className={isScrolled ? "text-slate-800" : "text-slate-200"}
              >
                |
              </span>
              <button
                onClick={() => setLang("FR")}
                className={`px-1.5 transition-colors ${lang === "FR" ? (isScrolled ? "text-emerald-400 font-black" : "text-emerald-600 font-black") : "hover:text-slate-600"}`}
              >
                FR
              </button>
            </div>

            {/* Mon Espace */}
            <Link
              href="/login"
              style={{
                fontFamily: "Sanomat, ui-serif, system-ui",
                fontWeight: 600,
              }}
              className={`text-sm font-semibold transition-colors ${isScrolled ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-[rgb(21,0,44)]"}`}
            >
              Mon Espace
            </Link>

            {/* CTA Principal */}
            <Link
              href="#"
              style={{ fontFamily: "Sanomat, ui-serif, system-ui" }}
              className={`text-xs font-black px-5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap shadow-sm ${
                isScrolled
                  ? "bg-white hover:bg-slate-100 text-slate-950"
                  : "bg-slate-950 hover:bg-slate-800 text-white"
              }`}
            >
              Demander une démo
            </Link>
          </div>

          {/* ── INTERFACE TABLETTE & MOBILE ── */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 rounded-xl border transition-all ${
                isScrolled
                  ? "text-slate-400 bg-slate-900/60 border-slate-800"
                  : "text-slate-600 bg-slate-50 border-slate-200"
              }`}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MENU TIERS MOBILE ── */}
      {menuOpen && (
        <div
          className={`md:hidden border-t px-6 pb-8 pt-4 space-y-2 backdrop-blur-lg transition-all ${
            isScrolled
              ? "border-slate-900 bg-slate-950/95 text-white"
              : "border-slate-200/60 bg-[#F9FAFB]/98 text-slate-900"
          }`}
        >
          {/* Liens ancres internes de Solutions sur Mobile */}
          <div className="py-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-4 mb-1">
              Nos Solutions (Sections)
            </span>
            {HOME_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left block py-2.5 px-4 rounded-xl text-sm font-medium ${
                  isScrolled
                    ? "text-slate-300 hover:bg-slate-900"
                    : "text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                • {section.label}
              </button>
            ))}
          </div>

          <div
            className={`border-t my-2 ${isScrolled ? "border-slate-900" : "border-slate-200/60"}`}
          />

          {/* Liens de pages réelles */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-3 px-4 rounded-xl text-base font-medium ${
                isScrolled
                  ? "text-slate-300 hover:bg-slate-900"
                  : "text-slate-600 hover:bg-slate-200/50"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div
            className={`pt-4 mt-4 border-t flex flex-col gap-3 ${isScrolled ? "border-slate-900" : "border-slate-200/60"}`}
          >
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className={`block text-center py-3 rounded-xl text-sm font-medium border ${
                isScrolled
                  ? "text-slate-300 bg-slate-900 border-slate-800"
                  : "text-slate-600 bg-white border-slate-200"
              }`}
            >
              Mon Espace
            </Link>
            <Link
              href="#"
              onClick={() => setMenuOpen(false)}
              className={`block text-center text-sm font-black py-3 rounded-xl shadow-md ${
                isScrolled
                  ? "bg-white text-slate-950"
                  : "bg-slate-950 text-white"
              }`}
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
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
}