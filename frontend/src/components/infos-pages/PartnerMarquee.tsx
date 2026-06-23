"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";

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

// ── COMPOSANT TRUST BAR AVEC LOGOS DÉFILANTS ───────────────────────────────────
const TrustMarquee = () => {
    const logos = [
        { name: "ORANGE", color: "#FF7900" },
        { name: "TOTALENERGIES", color: "#ED1B24" },
        { name: "ECOBANK", color: "#009F4D" },
        { name: "BRIDGECORP", color: "#1E3A8A" },
        { name: "MTN", color: "#FFCD00" },
        { name: "BOLLORÉ", color: "#004080" },
        { name: "SUNU", color: "#E87C1F" },
        { name: "BICICI", color: "#003399" },
    ];
    
    const duplicatedLogos = [...logos, ...logos, ...logos];

    return (
        <div className="w-full overflow-hidden py-6 mb-16 border-y border-slate-200/50 bg-slate-50/30 rounded-2xl">
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
                    {duplicatedLogos.map((logo, idx) => (
                        <div
                            key={idx}
                            className="inline-flex items-center justify-center px-4 py-2 transition-all duration-300 grayscale hover:grayscale-0 hover:scale-110 cursor-pointer"
                        >
                            <span className="text-slate-400 text-xl font-bold tracking-wider hover:text-slate-800 transition-colors">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="absolute top-0 left-0 w-20 h-full bg-linear-to-r from-[#F9FAFB] to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-20 h-full bg-linear-to-l from-[#F9FAFB] to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
};

// ── COMPOSANT PARTNER CAROUSEL ────────────────────────────────────────────────
const PartnerCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const nextSlide = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % PARTNERS.length);
        setTimeout(() => setIsAnimating(false), 400);
    };

    const prevSlide = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + PARTNERS.length) % PARTNERS.length);
        setTimeout(() => setIsAnimating(false), 400);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0
        })
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block w-fit">
                        Écosystème
                    </span>
                    <h3 className="text-slate-900 font-bold text-2xl md:text-3xl tracking-tight mt-2">
                        Nos partenaires stratégiques
                    </h3>
                </div>
                <div className="flex gap-2 self-end">
                    <button 
                        onClick={prevSlide}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-sm"
                    >
                        ←
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-sm"
                    >
                        →
                    </button>
                </div>
            </div>
            
            <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-50 to-emerald-50 flex items-center justify-center shrink-0">
                        {PARTNERS[activeIndex].logoSvg}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-xl">{PARTNERS[activeIndex].name}</h4>
                        <p className="text-slate-500 text-sm mt-1">
                            {PARTNERS[activeIndex].city}, {PARTNERS[activeIndex].country}
                        </p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                        <Link href={PARTNERS[activeIndex].websiteUrl} target="_blank" className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-100 transition-colors">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
                            </svg>
                        </Link>
                        <Link href={PARTNERS[activeIndex].linkedinUrl} target="_blank" className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 transition-colors">
                            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            </motion.div>
            
            <div className="flex items-center justify-center gap-2 mt-6">
                {PARTNERS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            if (isAnimating) return;
                            setIsAnimating(true);
                            setDirection(i > activeIndex ? 1 : -1);
                            setActiveIndex(i);
                            setTimeout(() => setIsAnimating(false), 400);
                        }}
                        className={`transition-all duration-300 rounded-full ${i === activeIndex ? 'w-6 h-1.5 bg-indigo-600' : 'w-1.5 h-1.5 bg-slate-300'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default function PartnerMarquee() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    const titleStyle = {
        fontFamily: "Sanomat, ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
        fontStyle: "normal",
        fontWeight: 600,
        color: "rgb(21, 0, 44)",
        fontSize: "45px",
        lineHeight: "54px"
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                duration: 0.6
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.6
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.7
            }
        }
    };

    return (
        <section 
            ref={sectionRef}
            className="w-full bg-[#F9FAFB] py-24 overflow-hidden border-t border-slate-200/60 relative"
        >
            {/* Texture de fond subtile */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[length:14px_24px] pointer-events-none" />
            
            {/* Halos lumineux */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-50/40 blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-50/40 blur-[100px]" />
            </div>

            <motion.div
                initial="hidden"
                animate={controls}
                variants={containerVariants}
                className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24"
            >
                {/* Trust Bar */}
                {/* <motion.div variants={itemVariants}>
                    <TrustMarquee />
                </motion.div> */}

                {/* ── SECTION "THE WHY" - MANIFESTE ET FONDATEURS ── */}
                <div className="space-y-16">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                            Notre manifeste
                        </span>
                        <h3 style={titleStyle} className="mt-4 tracking-tight hidden sm:block">
                            Pourquoi avoir créé cette solution ?
                        </h3>
                        <h3 style={{ ...titleStyle, fontSize: "32px", lineHeight: "40px" }} className="mt-4 tracking-tight sm:hidden">
                            Pourquoi avoir créé cette solution ?
                        </h3>
                        <p className="text-slate-500 mt-4 text-base sm:text-lg font-medium max-w-2xl mx-auto">
                            L'histoire derrière la convergence unique d'AfrikVoyage et AfrikCSE racontée par ses concepteurs.
                        </p>
                    </div>

                    {/* Grille harmonisée et symétrique pour les cartes de fondateurs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        
                        {/* Carte Richnel (Uniformisée) */}
                        <motion.div variants={cardVariants} className="flex">
                            <div className="gradient-border-card relative p-0.5 rounded-[2.5rem] flex flex-col w-full transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 group">
                                <div className="h-full bg-white rounded-[2.40rem] p-8 sm:p-10 flex flex-col justify-between overflow-hidden relative z-10">
                                    <div>
                                        <div className="flex items-center justify-between w-full flex-wrap gap-2">
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

                                    <div className="flex items-end justify-between gap-4 mt-12 border-t border-slate-100 pt-6 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
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
                                        <div className="flex flex-col items-end text-right bg-slate-50 border border-slate-100 p-3 rounded-xl transition-all duration-300 group-hover:bg-emerald-50 group-hover:border-emerald-500">
                                            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Optimisation</span>
                                            <span className="text-lg font-black text-slate-900 mt-0.5">-30% de coûts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Carte Michaelis (Uniformisée aux mêmes proportions) */}
                        <motion.div variants={cardVariants} className="flex">
                            <div className="gradient-border-card relative p-0.5 rounded-[2.5rem] flex flex-col w-full transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 group">
                                <div className="h-full bg-white rounded-[2.40rem] p-8 sm:p-10 flex flex-col justify-between overflow-hidden relative z-10">
                                    <div>
                                        <div className="flex items-center justify-between w-full flex-wrap gap-2">
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

                                    <div className="flex items-end justify-between gap-4 mt-12 border-t border-slate-100 pt-6 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
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
                                        <div className="flex flex-col items-end text-right bg-slate-50 border border-slate-100 p-3 rounded-xl transition-all duration-300 group-hover:bg-indigo-50 group-hover:border-indigo-500">
                                            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Indicateur</span>
                                            <span className="text-lg font-black text-slate-900 mt-0.5">Retours 100% Zen</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* ── 5. SECTION "NOS PARTENAIRES STRATÉGIQUES" ── */}
                <motion.div variants={itemVariants} className="pt-8">
                </motion.div>

            </motion.div>

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
                
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }

                .gradient-border-card {
                    overflow: hidden;
                }
                
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
                
                .gradient-border-card:hover::before {
                    animation: rotateGradient 4s linear infinite;
                }
                
                .gradient-border-card > div {
                    position: relative;
                    z-index: 2;
                }
            `}</style>
        </section>
    );
}