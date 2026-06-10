"use client";

import React from "react";
import Link from "next/link";

interface Partner {
    id: number;
    name: string;
    city: string;
    country: string;
    countryCode: string;
    logoSvg: React.ReactNode;
    websiteUrl: string;
    linkedinUrl: string;
}

const PARTNERS: Partner[] = [
    {
        id: 1,
        name: "TechAfrik Solutions",
        city: "Cotonou",
        country: "Bénin",
        countryCode: "BJ",
        websiteUrl: "https://example.com",
        linkedinUrl: "https://linkedin.com",
        logoSvg: (
            <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
            </svg>
        )
    },
    {
        id: 2,
        name: "InnovCorp Global",
        city: "Dakar",
        country: "Sénégal",
        countryCode: "SN",
        websiteUrl: "https://example.com",
        linkedinUrl: "https://linkedin.com",
        logoSvg: (
            <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
        )
    },
    {
        id: 3,
        name: "EcoTransit Africa",
        city: "Abidjan",
        country: "Côte d'Ivoire",
        countryCode: "CI",
        websiteUrl: "https://example.com",
        linkedinUrl: "https://linkedin.com",
        logoSvg: (
            <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
        )
    },
    {
        id: 4,
        name: "Kamal Logistics",
        city: "Nairobi",
        country: "Kenya",
        countryCode: "KE",
        websiteUrl: "https://example.com",
        linkedinUrl: "https://linkedin.com",
        logoSvg: (
            <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
        )
    },
    {
        id: 5,
        name: "SonaBank Corp",
        city: "Lomé",
        country: "Togo",
        countryCode: "TG",
        websiteUrl: "https://example.com",
        linkedinUrl: "https://linkedin.com",
        logoSvg: (
            <svg className="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v2H3v-2h18zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z"/>
            </svg>
        )
    }
];

export default function PartnerMarquee() {
    const duplicatedPartners = [...PARTNERS, ...PARTNERS, ...PARTNERS];

    // Style unifié pour respecter strictement la charte Sanomat demandée
    const titleStyle = {
        fontFamily: "Sanomat, ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
        fontStyle: "normal",
        fontWeight: 600,
        color: "rgb(21, 0, 44)",
        fontSize: "45px",
        lineHeight: "54px"
    };

    return (
        /* Arrière-plan global : Blanc cassé ultra-premium (#F9FAFB) */
        <section className="w-full bg-[#F9FAFB] py-24 overflow-hidden border-t border-slate-200/60 relative">
            {/* Texture de fond subtile */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            
            {/* ── SECTION 1 : LOGO MARQUEE EN CONTINU ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center relative z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">
                    Confiance et Impact régional
                </span>
                <h3 style={titleStyle} className="mt-4 tracking-tight hidden sm:block">
                    Les entreprises engagées à nos côtés
                </h3>
                {/* Fallback responsive pour mobile uniquement */}
                <h3 style={{ ...titleStyle, fontSize: "32px", lineHeight: "40px" }} className="mt-4 tracking-tight sm:hidden">
                    Les entreprises engagées à nos côtés
                </h3>
            </div>

            <div className="relative w-full flex items-center mb-32 z-10">
                {/* Ombres de fondu latérales */}
                <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-r from-[#F9FAFB] to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-l from-[#F9FAFB] to-transparent z-20 pointer-events-none" />

                {/* Ruban Marquee */}
                <div className="flex gap-6 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] py-4 px-2 select-none whitespace-nowrap">
                    {duplicatedPartners.map((partner, index) => (
                        <div
                            key={`${partner.id}-${index}`}
                            className="group relative inline-flex flex-col min-w-[280px] sm:min-w-[320px] bg-white border border-slate-200/80 rounded-2xl p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                        >
                            <div className="flex items-center justify-between w-full transition-opacity duration-300 group-hover:opacity-20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                                        {partner.logoSvg}
                                    </div>
                                    <div className="flex flex-col">
                                        <span style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-slate-900 text-base tracking-tight">
                                            {partner.name}
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                            {partner.city}, {partner.country}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Couche d'action gris clair translucide au survol */}
                            <div className="absolute inset-0 bg-slate-50/95 rounded-2xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 px-6 backdrop-blur-[2px]">
                                <Link
                                    href={partner.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all transform translate-y-1 group-hover:translate-y-0"
                                >
                                    <span>Visiter le site</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </Link>

                                <Link
                                    href={partner.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl shadow-sm transition-all transform translate-y-1 group-hover:translate-y-0 duration-300"
                                    aria-label={`Profil LinkedIn de ${partner.name}`}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── SECTION 2 : "THE WHY" - PAROLES DES FONDATEURS ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                        Notre manifeste
                    </span>
                    <h3 style={titleStyle} className="mt-4 tracking-tight hidden sm:block">
                        Pourquoi avoir créé cette solution ?
                    </h3>
                    {/* Fallback responsive pour mobile uniquement */}
                    <h3 style={{ ...titleStyle, fontSize: "32px", lineHeight: "40px" }} className="mt-4 tracking-tight sm:hidden">
                        Pourquoi avoir créé cette solution ?
                    </h3>
                    <p className="text-slate-500 mt-4 text-base sm:text-lg font-medium max-w-2xl mx-auto">
                        L'histoire derrière la convergence unique d'AfrikVoyage et AfrikCSE racontée par ses concepteurs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                    
                    {/* CARTE 1 : TÉMOIGNAGE RICHNEL (FOND BLANC LUMINEUX & BORDURE DÉGRADÉ RUISSELANTE) */}
                    <div className="gradient-border-card relative p-[2px] rounded-[2.5rem] flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10">
                        {/* Structure interne : Pur blanc éclatant */}
                        <div className="h-full bg-white rounded-[2.40rem] p-8 sm:p-10 flex flex-col justify-between overflow-hidden relative z-10">
                            
                            <div>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[10px] font-black text-slate-800 tracking-widest uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                                        Fondateur & CEO
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Focus AfrikVoyage
                                    </span>
                                </div>
                                
                                <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed italic mt-8 relative pl-4 border-l-2 border-indigo-500">
                                    "Nous avons constaté que les entreprises africaines perdaient une énergie folle à synchroniser les déplacements terrains et la satisfaction des collaborateurs. Centraliser les dépenses de voyage et les avantages sociaux sur une interface unique était la seule réponse logique pour catalyser la croissance."
                                </p>
                            </div>

                            <div className="flex items-end justify-between gap-4 mt-12 border-t border-slate-100 pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                        <img 
                                            src="/richnel.jpg" 
                                            alt="Richnel AGAZOUNON" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 style={{ fontFamily: "Sanomat, ui-serif" }} className="text-slate-900 font-bold text-lg tracking-tight">
                                            Richnel AGAZOUNON
                                        </h4>
                                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                                            Ex-McKinsey // Tech Visionary
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden sm:flex flex-col items-end text-right bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Optimisation</span>
                                    <span className="text-lg font-black text-slate-900 mt-0.5">-30% de coûts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARTE 2 : TÉMOIGNAGE MICHAELIS (FOND BLANC LUMINEUX & BORDURE DÉGRADÉ RUISSELANTE) */}
                    <div className="gradient-border-card relative p-[2px] rounded-[2.5rem] flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10">
                        {/* Structure interne : Pur blanc éclatant */}
                        <div className="h-full bg-white rounded-[2.40rem] p-8 sm:p-10 flex flex-col justify-between overflow-hidden relative z-10">
                            
                            <div>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-lg">
                                        Co-fondateur & CTO
                                    </span>
                                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Focus AfrikCSE
                                    </span>
                                </div>
                                
                                <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed italic mt-8 relative pl-4 border-l-2 border-emerald-500">
                                    "La tech n'a de valeur que si elle sert l'humain. Avec le volet CSE, nous redonnons du pouvoir d'achat et une reconnaissance directe aux salariés via un catalogue fluide, tandis que la branche Voyage élimine la friction administrative pour les équipes financières."
                                </p>
                            </div>

                            <div className="flex items-end justify-between gap-4 mt-12 border-t border-slate-100 pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                        <img 
                                            src="/michaelis.jpg" 
                                            alt="Michaelis MAHOUTO" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 style={{ fontFamily: "Sanomat, ui-serif" }} className="text-slate-900 font-bold text-lg tracking-tight">
                                            Michaelis MAHOUTO
                                        </h4>
                                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                                            Ex-VP Operations // Fintech Expert
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden sm:flex flex-col items-end text-right bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                    <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Indicateur</span>
                                    <span className="text-lg font-black text-slate-900 mt-0.5">Retours 100% Zen</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Injections styles globaux requis */}
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-33.3333%); }
                }
                @keyframes rotateGradient {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .w-18 { width: 4.5rem; }
                .h-18 { height: 4.5rem; }

                /* Style de la bordure magique à dégradé ruisselant */
                .gradient-border-card {
                    overflow: hidden;
                }
                /* Le dégradé tourne en arrière-plan pour simuler le ruissellement continuel */
                .gradient-border-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(
                        from 0deg,
                        transparent 20%,
                        #6366f1 40%,
                        #10b981 60%,
                        transparent 80%
                    );
                    animation: rotateGradient 8s linear infinite;
                    z-index: 1;
                }
                /* Empêche le bug de lissage des angles arrondis sur certains navigateurs */
                .gradient-border-card > div {
                    position: relative;
                    z-index: 2;
                }
            `}</style>
        </section>
    );
}