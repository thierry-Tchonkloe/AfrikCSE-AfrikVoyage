"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
    { label: "Accueil", href: "/infos" },
    { label: "À propos", href: "/infos/about" },
    { label: "Comment ça marche", href: "/infos/how-it-works" },
    { label: "Contact", href: "/infos/contact" },
    { label: "Recrutement", href: "/infos/join-us" }
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [lang, setLang] = useState<"EN" | "FR">("FR");
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header 
            className={`w-full sticky top-0 z-50 transition-all duration-300 border-b ${
                isScrolled 
                ? "bg-slate-950/90 backdrop-blur-md border-slate-900 shadow-lg shadow-slate-950/20" 
                : "bg-white/90 backdrop-blur-md border-slate-100 shadow-sm"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    
                    {/* ── LOGO CHAMÉLÉON (S'ADAPTE AU FOND) ── */}
                    <Link href="/" className="flex items-center gap-3 shrink-0 group">
                        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center p-[1px] transition-transform duration-300 group-hover:scale-105">
                            <div className={`w-full h-full rounded-[11px] flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-950" : "bg-white"}`}>
                                <svg className={`w-4 h-4 transition-colors ${isScrolled ? "text-emerald-400" : "text-indigo-600"} group-hover:text-emerald-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span 
                                style={{ fontFamily: "Sanomat, ui-serif, system-ui", fontWeight: 600 }}
                                className={`text-base tracking-tight leading-none mb-0.5 transition-colors ${isScrolled ? "text-white" : "text-slate-900"}`}
                            >
                                Afrik<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Workspace</span>
                            </span>
                            <span className={`text-[9px] font-black tracking-[0.15em] uppercase leading-none transition-colors ${isScrolled ? "text-slate-500" : "text-slate-400"}`}>
                                Voyage &amp; CSE
                            </span>
                        </div>
                    </Link>

                    {/* ── DESKTOP NAVIGATION MODULAIRE ── */}
                    <nav className={`hidden md:flex items-center gap-1 lg:gap-2 p-1.5 rounded-full border transition-all ${
                        isScrolled 
                        ? "bg-slate-900/40 border-slate-800/60" 
                        : "bg-slate-100/80 border-slate-200/60"
                    }`}>
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{ fontFamily: "Sanomat, ui-serif, system-ui" }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                    isScrolled 
                                    ? "text-slate-400 hover:text-white hover:bg-slate-800/40" 
                                    : "text-slate-600 hover:text-slate-950 hover:bg-white shadow-sm shadow-transparent hover:shadow-slate-200/50"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* ── ACTIONS ET ACCÈS PARTICULIERS ── */}
                    <div className="hidden md:flex items-center gap-5">
                        
                        {/* Sélecteur de Langue Dynamique */}
                        <div className={`flex items-center text-xs font-bold transition-colors border px-2.5 py-1.5 rounded-lg ${
                            isScrolled 
                            ? "text-slate-500 border-slate-900 bg-slate-950/40" 
                            : "text-slate-400 border-slate-200 bg-slate-50"
                        }`}>
                            <button
                                onClick={() => setLang("EN")}
                                className={`px-1.5 transition-colors ${lang === "EN" ? (isScrolled ? "text-indigo-400 font-black" : "text-indigo-600 font-black") : (isScrolled ? "hover:text-slate-300" : "hover:text-slate-700")}`}
                            >
                                EN
                            </button>
                            <span className={isScrolled ? "text-slate-800" : "text-slate-200"}>|</span>
                            <button
                                onClick={() => setLang("FR")}
                                className={`px-1.5 transition-colors ${lang === "FR" ? (isScrolled ? "text-emerald-400 font-black" : "text-emerald-600 font-black") : (isScrolled ? "hover:text-slate-300" : "hover:text-slate-700")}`}
                            >
                                FR
                            </button>
                        </div>

                        {/* Mon Espace */}
                        <Link
                            href="/login"
                            style={{ fontFamily: "Sanomat, ui-serif, system-ui" }}
                            className={`text-sm font-medium transition-colors ${isScrolled ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-950"}`}
                        >
                            Mon Espace
                        </Link>

                        {/* CTA Principal Auto-adaptatif */}
                        <Link
                            href="/infos/demo"
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

                    {/* ── INTERFACE MOBILE DYNAMIQUE ── */}
                    <div className="flex md:hidden items-center gap-4">
                        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${isScrolled ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-slate-100"}`}>
                            <button onClick={() => setLang("EN")} className={`px-1 ${lang === "EN" ? (isScrolled ? "text-indigo-400" : "text-indigo-600") : ""}`}>EN</button>
                            <span className={`mx-1 ${isScrolled ? "text-slate-700" : "text-slate-300"}`}>|</span>
                            <button onClick={() => setLang("FR")} className={`px-1 ${lang === "FR" ? (isScrolled ? "text-emerald-400" : "text-emerald-600") : ""}`}>FR</button>
                        </div>

                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className={`p-2 rounded-xl border transition-all ${
                                isScrolled 
                                ? "text-slate-400 bg-slate-900/60 border-slate-800 hover:text-white" 
                                : "text-slate-600 bg-slate-50 border-slate-200 hover:text-slate-950"
                            }`}
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* ── MENU MOBILE ADAPTATIF ── */}
            {menuOpen && (
                <div className={`md:hidden border-t px-6 pb-8 pt-4 space-y-2 backdrop-blur-lg transition-all ${
                    isScrolled 
                    ? "border-slate-900 bg-slate-950/95 text-white" 
                    : "border-slate-100 bg-white/95 text-slate-900"
                }`}>
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className={`block py-3 px-4 rounded-xl text-base font-medium transition-all ${
                                isScrolled 
                                ? "text-slate-300 hover:bg-slate-900 hover:text-white" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className={`pt-4 mt-4 border-t flex flex-col gap-3 ${isScrolled ? "border-slate-900" : "border-slate-100"}`}>
                        <Link
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className={`block text-center py-3 rounded-xl text-sm font-medium border ${
                                isScrolled 
                                ? "text-slate-300 bg-slate-900 border-slate-800" 
                                : "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                            Mon Espace
                        </Link>
                        <Link
                            href="/infos/demo"
                            onClick={() => setMenuOpen(false)}
                            className={`block text-center text-sm font-black py-3 rounded-xl shadow-md transition-all ${
                                isScrolled 
                                ? "bg-white text-slate-950 hover:bg-slate-100" 
                                : "bg-slate-950 text-white hover:bg-slate-900"
                            }`}
                        >
                            Demander une démo
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}