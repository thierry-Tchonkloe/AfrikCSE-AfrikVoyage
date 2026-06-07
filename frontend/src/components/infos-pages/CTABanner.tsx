"use client";

import React from "react";
import Link from "next/link";

interface CTABannerProps {
    title?: string;
    subtitle?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
}

export default function CTABanner({
    title = "Commencez votre transformation digitale dès aujourd'hui",
    subtitle = "Rejoignez les centaines d'entreprises qui optimisent déjà leurs voyages d'affaires et avantages employés avec notre solution.",
    primaryLabel = "Demander une démo gratuite",
    primaryHref = "/infos/demo",
    secondaryLabel = "Parler à un expert",
    secondaryHref = "/infos/contact",
}: CTABannerProps) {
    return (
        <section className="relative w-full bg-[#0F172A] overflow-hidden py-24 sm:py-32 lg:py-40 border-t border-slate-800">
            
            {/* ── COUCHE 1 : GRILLE TRIDIMENSIONNELLE EN PERSPECTIVE (STYLE RAMP / BREX) ── */}
            <div 
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #6366F1 1px, transparent 1px),
                        linear-gradient(to bottom, #6366F1 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                    transform: "perspective(500px) rotateX(60deg) translateY(-30%) scale(1.5)",
                    transformOrigin: "top center",
                }}
            />

            {/* ── COUCHE 2 : HALOS LUMINEUX CYAN & INDIGO IMMERSIFS (STYLE NAVAN) ── */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

            {/* ── COUCHE 3 : EFFET PARTICULES DISCRETES / LIGNES DE VOL (AFRIKVOYAGE) ── */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            
            {/* ── CONTENU PRINCIPAL CENTRÉ ── */}
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                
                {/* Badge contextuel */}
                <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 mb-8 transform hover:scale-105 transition-transform duration-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-300">
                        Prêt pour le niveau supérieur ?
                    </span>
                </div>

                {/* Titre Premium avec la police Sanomat (600) */}
                <h2 
                    style={{
                        fontFamily: "Sanomat, ui-serif",
                        fontWeight: 600,
                    }}
                    className="text-white text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6"
                >
                    {title.split("dès aujourd'hui")[0]}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                        dès aujourd'hui
                    </span>
                </h2>

                {/* Sous-titre aéré */}
                <p className="text-slate-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                    {subtitle}
                </p>

                {/* Boutons d'Action Haute Performance */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 max-w-md mx-auto sm:max-w-none">
                    
                    {/* Bouton Principal : Lumineux, Magnétique */}
                    <Link
                        href={primaryHref}
                        className="relative group w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-950 font-black text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] overflow-hidden"
                    >
                        {/* Effet de reflet interne au survol */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <span className="relative flex items-center gap-2">
                            {primaryLabel}
                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </span>
                    </Link>

                    {/* Bouton Secondaire : Épuré, Transparent */}
                    <Link
                        href={secondaryHref}
                        className="w-full sm:w-auto inline-flex items-center justify-center border border-slate-700 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-800/60 hover:border-slate-600 text-slate-300 hover:text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-300"
                    >
                        <span>{secondaryLabel}</span>
                    </Link>
                </div>

                {/* ── PREUVE DE SÉCURITÉ DISCRETE (FINANCIAL COMPLIANCE STYLE) ── */}
                <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-500 border-t border-slate-900 pt-8">
                    <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Démo personnalisée gratuite
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Mise en service en 48h
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Conforme RGPD & Réglementations régionales
                    </span>
                </div>

            </div>
        </section>
    );
}