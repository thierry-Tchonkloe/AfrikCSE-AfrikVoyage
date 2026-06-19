"use client";

import React from "react";
import Link from "next/link";

interface CTABannerProps {
    title?: string;
    subtitle?: string;
    primaryLabel?: string;
    primaryHref?: string;
}

export default function CTABanner({
    title = "Commencez votre transformation digitale",
    subtitle = "Rejoignez les centaines d'entreprises qui optimisent déjà leurs voyages d'affaires et avantages employés avec notre solution.",
    primaryLabel = "Commencer maintenant",
    primaryHref = "/auth/login",
}: CTABannerProps) {
    return (
        <section className="relative w-full bg-[#0F172A] overflow-hidden py-24 sm:py-32 lg:py-40 border-t border-slate-800">
            
            {/* ── COUCHE 1 : GRILLE TRIDIMENSIONNELLE EN PERSPECTIVE ── */}
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

            {/* ── COUCHE 2 : HALOS LUMINEUX IMMERSIFS ── */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />

            {/* ── COUCHE 3 : EFFET PARTICULES / LIGNES DE VOL ── */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            
            {/* Lignes décoratives animées */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            
            <div className="absolute top-1/4 left-0 w-px h-1/3 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
            <div className="absolute top-1/4 right-0 w-px h-1/3 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

            {/* ── CONTENU PRINCIPAL CENTRÉ ── */}
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                
                {/* Badge contextuel avec animation */}
                <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 mb-8 transform hover:scale-105 transition-transform duration-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-300">
                        Prêt pour le niveau supérieur ?
                    </span>
                </div>

                {/* Titre Premium avec gradient amélioré */}
                <h2 
                    style={{
                        fontFamily: "Sanomat, ui-serif",
                        fontWeight: 600,
                    }}
                    className="text-white text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6"
                >
                    {title.split("digitale")[0]}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                        digitale
                    </span>
                </h2>

                {/* Sous-titre aéré */}
                <p className="text-slate-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                    {subtitle}
                </p>

                {/* Bouton unique unifié - Commencer maintenant */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 max-w-md mx-auto sm:max-w-none">
                    <Link
                        href={primaryHref}
                        className="relative group w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:via-indigo-400 hover:to-emerald-400 text-white font-black text-sm sm:text-base px-10 py-4 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    >
                        {/* Effet de reflet interne au survol */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        
                        {/* Effet de glow au survol */}
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        
                        <span className="relative flex items-center gap-3">
                            <span className="text-xl">🚀</span>
                            {primaryLabel}
                            <svg className="w-5 h-5 transform group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </span>
                    </Link>
                </div>

                {/* ── PREUVE DE SÉCURITÉ ET CONFIANCES ── */}
                <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-500 border-t border-slate-900 pt-8">
                    <span className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Démo personnalisée gratuite
                    </span>
                    <span className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Mise en service en 48h
                    </span>
                    <span className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Conforme RGPD & Réglementations régionales
                    </span>
                    <span className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Support 24/7
                    </span>
                </div>

                {/* ── INDICATEUR DE CONFIANCE SUPPLÉMENTAIRE ── */}
                <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">⭐</span>
                        <span>4.9/5 satisfaction client</span>
                    </span>
                    <span className="w-px h-3 bg-slate-800" />
                    <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">🏆</span>
                        <span>500+ entreprises clientes</span>
                    </span>
                    <span className="w-px h-3 bg-slate-800" />
                    <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">🌍</span>
                        <span>54 pays couverts</span>
                    </span>
                </div>
            </div>

            {/* ── ANIMATIONS CSS ── */}
            <style jsx global>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </section>
    );
}