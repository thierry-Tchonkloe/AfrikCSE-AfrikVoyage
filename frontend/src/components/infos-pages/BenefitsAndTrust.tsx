"use client";

import React, { useState, useEffect, useRef } from "react";

// ── TYPES & CONFIGURATIONS DATA ───────────────────────────────────────

interface Testimonial {
    id: number;
    name: string;
    role: string;
    company: string;
    avatar: string;
    avatarBg: string;
    metric: string;
    metricLabel: string;
    text: string;
    videoThumbnail: string;
    videoUrl: string;
}

const COMPARISONS = [
    {
        criterion: "Gestion des reçus & frais",
        old: "Notes de frais papier perdues, saisie manuelle interminable.",
        new: "Scan IA instantané, rapprochement bancaire automatique en 2s.",
        status: "bad"
    },
    {
        criterion: "Validation des dépenses",
        old: "Chaîne d'e-mails interminable, blocages opérationnels.",
        new: "Workflows de validation dynamiques et alertes Slack/WhatsApp.",
        status: "good"
    },
    {
        criterion: "Réservation de voyages",
        old: "Salariés qui avancent les frais sur des sites grand public.",
        new: "Inventaire centralisé (vols, hôtels, bus) sans avance de frais.",
        status: "good"
    },
    {
        criterion: "Avantages & Crédits CSE",
        old: "Chèques cadeaux physiques périmés ou oubliés au fond d'un tiroir.",
        new: "Compte unique digitalisé utilisable instantanément via mobile.",
        status: "good"
    }
];

const STEPS = [
    {
        num: "01",
        title: "Centralisation & Configuration",
        desc: "Déployez la plateforme en quelques minutes. Connectez vos banques locales, configurez vos politiques de dépenses et invitez vos collaborateurs.",
        tag: "Setup Express",
        color: "from-teal-500 to-emerald-500"
    },
    {
        num: "02",
        title: "Utilisation & Autonomie",
        desc: "Les employés réservent leurs déplacements ou profitent de leurs avantages CSE directement depuis l'application via une interface fluide style Netflix.",
        tag: "Expérience B2C",
        color: "from-indigo-500 to-blue-600"
    },
    {
        num: "03",
        title: "Rapprochement & Audit IA",
        desc: "Notre intelligence artificielle analyse, catégorise et valide la conformité fiscale de chaque transaction en temps réel. Zéro gestion papier.",
        tag: "Contrôle Total",
        color: "from-purple-500 to-pink-600"
    }
];

const EXTENDED_TESTIMONIALS: Testimonial[] = [
    {
        id: 1,
        name: "Marie Dubois",
        role: "Directrice RH",
        company: "TechAfrik",
        avatar: "MD",
        avatarBg: "bg-teal-600",
        metric: "-30%",
        metricLabel: "De frais de voyage",
        text: "AfrikVoyage a révolutionné notre gestion. Nous avons divisé nos coûts tout en offrant une autonomie totale et une expérience ultra moderne à nos équipes sur le terrain.",
        videoThumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
        videoUrl: "#"
    },
    {
        id: 2,
        name: "Jean-Paul Kouassi",
        role: "CFO",
        company: "InnovCorp",
        avatar: "JK",
        avatarBg: "bg-blue-600",
        metric: "100%",
        metricLabel: "Conformité Audit",
        text: "La sérénité fiscale que nous apporte la plateforme est inestimable. Chaque centime dépensé est tracé, catégorisé et conforme aux lois de finances locales sans aucune ressaisie manuelle.",
        videoThumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
        videoUrl: "#"
    },
    {
        id: 3,
        name: "Amina Diop",
        role: "Head of People",
        company: "Baobab Digital",
        avatar: "AD",
        avatarBg: "bg-amber-500",
        metric: "+45%",
        metricLabel: "Engagement CSE",
        text: "Le catalogue d'avantages digitalisé fonctionne comme une galerie de services premium personnalisée. Les employés adorent la flexibilité de l'application et l'accès instantané aux offres.",
        videoThumbnail: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop",
        videoUrl: "#"
    }
];

// ── COMPOSANTS INTERNES DECORATIFS ───────────────────────────────────

const MarkerHighlight = ({ children, color = "rgba(99, 102, 241, 0.15)" }: { children: React.ReactNode, color?: string }) => (
    <span className="relative inline-block px-1 z-10">
        <span className="relative z-10">{children}</span>
        <svg className="absolute left-0 bottom-1 w-full h-[50%] -z-10 pointer-events-none transform scale-x-105" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,5 Q20,2 40,6 T80,3 T100,5 L100,9 Q80,7 50,9 T15,7 Z" fill={color} />
        </svg>
    </span>
);

export default function BenefitsTrustAndProcess() {
    const [activeStep, setActiveStep] = useState(0);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-advance pour la section "Comment ça marche" (Style Story/Netflix)
    useEffect(() => {
        stepIntervalRef.current = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % STEPS.length);
        }, 6000);
        return () => {
            if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
        };
    }, []);

    const currentTestimonial = EXTENDED_TESTIMONIALS[activeTestimonial];

    return (
        <div className="relative w-full bg-white text-slate-900 overflow-hidden">
            
            {/* ── 1. COMPARAISON RADICALE : AVANT VS AFRIK (STYLE RAMP) ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-slate-100">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">L'ancien paradigme est révolu</span>
                    <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-6">
                        Pourquoi les leaders <MarkerHighlight color="rgba(16, 185, 129, 0.12)">changent de méthode</MarkerHighlight>
                    </h2>
                    <p className="text-slate-500 text-base font-medium">
                        Comparez la lourdeur des processus manuels traditionnels avec l’agilité de l’écosystème unifié d’Afrik.
                    </p>
                </div>

                <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-900 text-white font-bold p-5 text-sm tracking-wide border-b border-slate-800">
                        <div className="hidden md:block">CRITÈRE</div>
                        <div className="opacity-60">AVANT (MÉTHODES ANCIENNES)</div>
                        <div className="text-emerald-400 flex items-center gap-2">
                            MAINTENANT AVEC AFRIK 
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {COMPARISONS.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 gap-4 text-sm items-center hover:bg-slate-50/60 transition-colors">
                                <div className="font-black text-slate-900 text-base md:text-sm">{item.criterion}</div>
                                <div className="text-slate-400 font-medium md:pr-4 flex items-start gap-2">
                                    <span className="text-rose-500 text-lg leading-none">✕</span> {item.old}
                                </div>
                                <div className="text-slate-700 font-semibold bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2 shadow-sm">
                                    <span className="text-emerald-500 text-lg leading-none">✓</span> {item.new}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── 2. COMMENT ÇA MARCHE : IMMERSION IMMÉDIATE (STYLE NETFLIX) ── */}
            <section className="bg-slate-950 text-white py-28 relative">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        {/* Gauche : Textes explicatifs */}
                        <div className="lg:col-span-5">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Déploiement Agile</span>
                            <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-white tracking-tight mt-3 mb-8">
                                Une intégration en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">trois temps forts</span>
                            </h2>
                            
                            <div className="flex flex-col gap-4">
                                {STEPS.map((step, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setActiveStep(idx); if (stepIntervalRef.current) clearInterval(stepIntervalRef.current); }}
                                        className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                            activeStep === idx 
                                            ? "bg-slate-900 border-slate-800 shadow-2xl" 
                                            : "bg-transparent border-transparent opacity-40 hover:opacity-75"
                                        }`}
                                    >
                                        {/* Ligne d'avancement temporelle active style Stories */}
                                        {activeStep === idx && (
                                            <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-indigo-500 to-emerald-400 animate-[slide_6s_linear_infinite] w-full" />
                                        )}
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className={`text-xs font-black px-2.5 py-1 rounded-md bg-gradient-to-br text-white ${step.color}`}>
                                                {step.num}
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{step.tag}</span>
                                        </div>
                                        <h3 className="font-black text-lg text-white mb-1">{step.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{step.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Droite : Écran de simulation d'interface Premium */}
                        <div className="lg:col-span-7 w-full">
                            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-2 shadow-2xl relative group">
                                <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/60 p-6 min-h-[400px] flex flex-col justify-between">
                                    {/* Header simulé de l'app */}
                                    <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span className="text-[11px] text-slate-600 font-bold ml-2">afrik-workspace // core-system</span>
                                        </div>
                                        <div className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 px-3 py-1 rounded-full border border-slate-800">
                                            Live Sandbox
                                        </div>
                                    </div>

                                    {/* Contenu changeant selon l'étape active */}
                                    <div className="py-8 flex-1 flex flex-col justify-center">
                                        {activeStep === 0 && (
                                            <div className="space-y-4">
                                                <div className="text-xs font-bold text-indigo-400">CONNECTIVITÉ BANCAIRE SECURE</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {["Ecobank Hub", "NSIA Banque", "Orange Money API", "MTN MoMo Business"].map((b, i) => (
                                                        <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-300">{b}</span>
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">ACTIVE</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {activeStep === 1 && (
                                            <div className="space-y-4">
                                                <div className="text-xs font-bold text-emerald-400">GALERIE DE SERVICES FLUIDE (STYLE B2C)</div>
                                                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-black text-slate-200">Vol Cotonou (COO) ➔ Paris (CDG)</span>
                                                        <span className="text-xs font-black text-white bg-indigo-600 px-2 py-1 rounded">Approuvé</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                                                        <div className="w-2/3 h-full bg-gradient-to-r from-emerald-500 to-indigo-500" />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-bold">
                                                        <span>Politique Voyage Respectée</span>
                                                        <span>0 F CFA Avancé par le salarié</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeStep === 2 && (
                                            <div className="space-y-4">
                                                <div className="text-xs font-bold text-purple-400">RAPPROCHEMENT IA & AUDIT TRAIL</div>
                                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                                        <span className="font-mono text-xs text-slate-300">Analyse du justificatif numérique...</span>
                                                    </div>
                                                    <div className="p-3 bg-slate-950 rounded-lg border border-purple-950 text-[11px] text-purple-300 font-mono">
                                                        [✓] TVA Intégrée détectée // [✓] Localisation certifiée Cotonou // [✓] Conforme directives internes région CEDEAO.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Légende */}
                                    <div className="border-t border-slate-900 pt-4 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                        <span>Sécurité Chiffrement AES-256</span>
                                        <span>Mise à jour temps réel</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>


            {/* ── 3. TÉMOIGNAGES EVENTAIL & CARROUSEL VIDÉO MUTLI-ENTREPRISES (STYLE TRAVELPERK) ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 relative">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">Validation Empirique</span>
                    <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-5">
                        La validation par les <MarkerHighlight color="rgba(59,130,246,0.12)">chiffres clés</MarkerHighlight>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Gauche : Sélecteur & Témoignages écrits sous forme de cartes d'impact */}
                    <div className="lg:col-span-7 space-y-6">
                        {EXTENDED_TESTIMONIALS.map((t, idx) => (
                            <div
                                key={t.id}
                                onClick={() => setActiveTestimonial(idx)}
                                className={`p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                    activeTestimonial === idx
                                    ? "bg-white border-slate-900 shadow-xl shadow-slate-100 scale-[1.02]"
                                    : "bg-slate-50/60 border-slate-100 opacity-60 hover:opacity-90"
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full ${t.avatarBg} text-white font-black flex items-center justify-center shadow-md`}>
                                            {t.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-base">{t.name}</h4>
                                            <p className="text-slate-400 text-xs font-bold">{t.role}, <span className="text-indigo-600">{t.company}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{t.metric}</div>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t.metricLabel}</div>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium italic">
                                    "{t.text}"
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Droite : Carrousel Vidéo Immersif synchronisé */}
                    <div className="lg:col-span-5">
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-2xl group min-h-[440px] flex flex-col justify-between p-8 transition-all duration-500">
                            
                            {/* Image d'arrière-plan immersive rafraîchie selon l'index actif */}
                            <img 
                                key={currentTestimonial.id}
                                src={currentTestimonial.videoThumbnail} 
                                alt={`Video testimonial thumbnail for ${currentTestimonial.company}`} 
                                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 select-none pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                            <div className="relative z-10 flex justify-between items-center">
                                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                                    Success Story Vidéo
                                </span>
                                <span className="text-xs font-bold text-slate-400 tracking-wider">
                                    {currentTestimonial.company}
                                </span>
                            </div>

                            {/* Bouton Play Central Actif */}
                            <div className="relative z-10 self-center">
                                <button 
                                    onClick={() => setIsVideoOpen(true)}
                                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-950 shadow-2xl transform transition-all duration-300 group-hover:scale-110 hover:bg-emerald-50 relative"
                                >
                                    <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                                    <svg className="w-6 h-6 ml-1 fill-current text-slate-950" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Informations de bas de carte synchronisées */}
                            <div className="relative z-10">
                                <div className="text-2xl font-black text-white mb-1">
                                    {currentTestimonial.metric} {currentTestimonial.metricLabel.toLowerCase()}
                                </div>
                                <p className="text-xs text-slate-300 font-medium">
                                    Découvrez comment {currentTestimonial.company} a transformé ses processus internes grâce à nos solutions.
                                </p>

                                {/* Mini sélecteurs manuels de secours bas de carte */}
                                <div className="flex gap-1.5 mt-4">
                                    {EXTENDED_TESTIMONIALS.map((_, dotIdx) => (
                                        <button
                                            key={dotIdx}
                                            onClick={(e) => { e.stopPropagation(); setActiveTestimonial(dotIdx); }}
                                            className={`h-1 rounded-full transition-all duration-300 ${dotIdx === activeTestimonial ? "w-6 bg-emerald-400" : "w-1.5 bg-slate-700"}`}
                                            aria-label={`Slide vidéo ${dotIdx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── MODAL POPUP : LECTEUR VIDÉO INTERACTIF DYNAMIQUE ── */}
            {isVideoOpen && (
                <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-black w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
                        <button 
                            onClick={() => setIsVideoOpen(false)}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors z-10"
                        >
                            ✕
                        </button>
                        
                        <div className="w-full h-full flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-slate-900 to-slate-950">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-white text-xl font-black mb-2">Lecture de la Success Story de {currentTestimonial.company}</h3>
                            <p className="text-slate-400 text-sm max-w-md">
                                Flux sécurisé. L'intégration de votre lecteur personnalisé (Wistia, Vimeo ou YouTube) se connecte directement ici via : <code className="text-emerald-400">{currentTestimonial.name}</code>.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}