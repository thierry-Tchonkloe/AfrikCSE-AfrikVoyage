"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// ── COMPOSANT STICKY SUB-NAVIGATION ──────────────────────────────────────────
const StickySubNav = ({ activeSection, setActiveSection }: { activeSection: string; setActiveSection: (section: string) => void }) => {
    const sections = [
        { id: "voyage", label: "Gestion des voyages", icon: "✈️", color: "indigo" },
        { id: "cse", label: "Avantages collaborateurs", icon: "🎁", color: "emerald" },
        { id: "intelligence", label: "Intelligence & Support", icon: "🤖", color: "purple" },
        { id: "security", label: "Sécurité & Conformité", icon: "🛡️", color: "slate" }
    ];

    return (
        <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-3 gap-6">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => {
                                setActiveSection(section.id);
                                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                                activeSection === section.id
                                    ? `bg-${section.color}-50 text-${section.color}-600 border border-${section.color}-200 shadow-sm`
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                            <span className="text-base">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── CARROUSEL D'IMAGES EN ARRIÈRE-PLAN ────────────────────────────────────────
const BackgroundCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const images = [
        { src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format", alt: "Voyage d'affaires - Avion", type: "travel" },
        { src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format", alt: "Voyage en voiture", type: "travel" },
        { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format", alt: "RH planning", type: "cse" },
        { src: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2074&auto=format", alt: "Gestion des avantages", type: "cse" },
        { src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format", alt: "Équipe au travail", type: "cse" },
    ];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {images.map((image, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: currentIndex === index ? 1 : 0 }}
                >
                    <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-slate-900/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
            ))}
        </div>
    );
};

// ── COMPOSANT SMART SEARCH WIDGET ─────────────────────────────────────────────
const SmartSearchWidget = () => {
    const [searchType, setSearchType] = useState<"flight" | "cse">("flight");
    
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <div className="flex gap-2 mb-6 border-b border-white/20 pb-3">
                <button
                    onClick={() => setSearchType("flight")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                        searchType === "flight"
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "text-slate-300 hover:text-white"
                    }`}
                >
                    ✈️ Rechercher un vol
                </button>
                <button
                    onClick={() => setSearchType("cse")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                        searchType === "cse"
                            ? "bg-emerald-600 text-white shadow-lg"
                            : "text-slate-300 hover:text-white"
                    }`}
                >
                    🎁 Avantage CSE
                </button>
            </div>
            
            {searchType === "flight" ? (
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="D'où partez-vous ?"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <input
                        type="text"
                        placeholder="Où allez-vous ?"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
                        <input type="date" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
                    </div>
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition">
                        Rechercher
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Rechercher un avantage (ex: chèque cadeau, billetterie...)"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        {["🎁 Chèque cadeau", "🎟️ Billetterie", "💊 Mutuelle"].map((item, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-3 text-center text-xs text-slate-300 hover:bg-white/10 transition cursor-pointer">
                                {item}
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition">
                        Explorer les avantages
                    </button>
                </div>
            )}
        </div>
    );
};

// ── COMPOSANT CARD AVEC SURVOL LUMINEUX ET IMAGE VISIBLE ──────────────────────
const SolutionCard = ({ title, description, icon, badge, color, onClick, imageUrl }: { title: string; description: string; icon: React.ReactNode; badge?: string; color: string; onClick?: () => void; imageUrl?: string }) => {
    const colorClasses = {
        indigo: "hover:border-indigo-300 hover:shadow-indigo-500/20",
        emerald: "hover:border-emerald-300 hover:shadow-emerald-500/20",
        purple: "hover:border-purple-300 hover:shadow-purple-500/20",
        slate: "hover:border-slate-300 hover:shadow-slate-500/20"
    };
    
    const colorBg = {
        indigo: "bg-indigo-50",
        emerald: "bg-emerald-50",
        purple: "bg-purple-50",
        slate: "bg-slate-50"
    };
    
    const colorText = {
        indigo: "text-indigo-600",
        emerald: "text-emerald-600",
        purple: "text-purple-600",
        slate: "text-slate-600"
    };
    
    return (
        <motion.div
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`group relative p-6 rounded-2xl border border-slate-200 bg-white transition-all duration-300 cursor-pointer ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-xl overflow-hidden`}
        >
            {imageUrl && (
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
            )}
            <div className={`relative z-10`}>
                <div className={`w-12 h-12 rounded-xl ${colorBg[color as keyof typeof colorBg]} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {badge && (
                    <span className={`absolute top-4 right-4 text-[10px] font-black px-2 py-0.5 rounded-full ${colorBg[color as keyof typeof colorBg]} ${colorText[color as keyof typeof colorText]}`}>
                        {badge}
                    </span>
                )}
                <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    En savoir plus
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};

// ── SECTION HERO ─────────────────────────────────────────────────────────────
function HeroSection() {
    return (
        <section className="relative bg-white overflow-hidden min-h-[90vh] flex items-center">
            <BackgroundCarousel />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 backdrop-blur-sm text-indigo-300 text-xs font-semibold mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        AfrikVoyage × AfrikCSE
                    </span>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
                        Une plateforme synchronisée pour<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                            l'entreprise africaine moderne
                        </span>
                    </h1>
                    
                    <p className="text-slate-200 text-lg max-w-2xl mx-auto mb-12">
                        Unifiez la performance financière de vos déplacements avec l'engagement social de vos collaborateurs.
                        Tout est centralisé, automatisé et accessible en un clic.
                    </p>
                    
                    <div className="max-w-md mx-auto">
                        <SmartSearchWidget />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-white/20">
                        <div>
                            <div className="text-3xl font-black text-indigo-400">500+</div>
                            <div className="text-xs text-slate-300">entreprises clientes</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-emerald-400">54</div>
                            <div className="text-xs text-slate-300">pays couverts</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-amber-400">95%</div>
                            <div className="text-xs text-slate-300">taux d'adoption</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-indigo-400">-30%</div>
                            <div className="text-xs text-slate-300">d'économies</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ── CARROUSEL D'IMAGES POUR LA SECTION CSE ────────────────────────────────────
const CSEImageCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const images = [
        { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format", alt: "Équipe en réunion", caption: "Collaboration et partage" },
        { src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format", alt: "Professionnelle souriante", caption: "Bien-être au travail" },
        { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2070&auto=format", alt: "Cadre travaillant", caption: "Performance et sérénité" },
        { src: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?q=80&w=2070&auto=format", alt: "Équipe tech", caption: "Innovation collaborative" },
    ];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className="relative rounded-2xl overflow-hidden shadow-xl h-[400px]">
            {images.map((image, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out"
                    style={{ opacity: currentIndex === index ? 1 : 0 }}
                >
                    <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <p className="text-lg font-semibold">{image.caption}</p>
                        <p className="text-sm text-white/80">Témoignage client</p>
                    </div>
                </div>
            ))}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-6 bg-emerald-500' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

// ── PILIER 1 : GESTION DES VOYAGES (INDIGO - PERFORMANCE) ─────────────────────
function TravelManagementSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    
    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };
    
    return (
        <section id="voyage" className="py-24 bg-white" ref={ref}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Pilier 1 - Performance
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight mb-6">
                            Gestion des voyages : <span className="text-indigo-600">l'efficience absolue</span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Automatisez, contrôlez et optimisez chaque déplacement professionnel
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        <div className="space-y-6">
                            <SolutionCard
                                title="Réservation centralisée"
                                description="Vols, hôtels, trains et visas sur une seule interface. Approbation en 1 clic."
                                icon="✈️"
                                badge="Nouveau"
                                color="indigo"
                                imageUrl="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format"
                            />
                            <div className="grid grid-cols-2 gap-6">
                                <SolutionCard
                                    title="Contrôle budgétaire"
                                    description="Politiques de voyage automatisées et plafonds personnalisés."
                                    icon="📊"
                                    badge="Populaire"
                                    color="indigo"
                                    imageUrl="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2074&auto=format"
                                />
                                <SolutionCard
                                    title="Notes de frais IA"
                                    description="Scan automatique par IA et validation simplifiée."
                                    icon="📱"
                                    badge="IA"
                                    color="indigo"
                                    imageUrl="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format"
                                />
                            </div>
                            <SolutionCard
                                title="Reporting & ROI"
                                description="Analyses financières en temps réel et heatmaps de dépenses."
                                icon="📈"
                                color="indigo"
                                imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format"
                            />
                        </div>
                        
                        <motion.div variants={itemVariants} className="bg-slate-50 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                            <img 
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format" 
                                alt="Dashboard analytics"
                                className="w-full h-64 object-cover"
                            />
                            <div className="p-6">
                                <h3 className="font-bold text-slate-800 mb-2">Visualisez vos performances en temps réel</h3>
                                <p className="text-slate-500 text-sm">Tableaux de bord personnalisables pour suivre vos KPI et optimiser votre stratégie de voyage.</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ── PILIER 2 : AVANTAGES COLLABORATEURS (EMERALD - BIEN-ÊTRE) ──────────────────
function CSEBenefitsSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    
    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);
    
    const benefits = [
        { name: "Chèques cadeaux", icon: "🎁", description: "Utilisables immédiatement" },
        { name: "Billetterie", icon: "🎟️", description: "Cinéma, concerts" },
        { name: "Mutuelle santé", icon: "💊", description: "Couverture optimisée" },
        { name: "Sport & bien-être", icon: "🏋️", description: "Abonnements sport" },
        { name: "Formation", icon: "📚", description: "E-learning" },
        { name: "Mobilité", icon: "🛴", description: "Forfaits mobilité" }
    ];
    
    return (
        <section id="cse" className="py-24 bg-slate-50" ref={ref}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Pilier 2 - Engagement
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight mb-6">
                            Avantages collaborateurs : <span className="text-emerald-600">l'expérience B2C</span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Offrez une galerie de services premium digne des plus grandes plateformes
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
                        {/* Carrousel d'images à gauche - amélioré avec plus de contenu */}
                        <motion.div variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }}>
                            <CSEImageCarousel />
                            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>+45% d'engagement</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>95% de satisfaction</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span>12+ avantages</span>
                                </div>
                            </div>
                        </motion.div>
                        
                        <div className="space-y-6">
                            <SolutionCard
                                title="Service Gallery"
                                description="Catalogue d'avantages personnalisé avec recommandations IA. Style Netflix pour vos employés."
                                icon="🎁"
                                badge="Netflix-like"
                                color="emerald"
                                imageUrl="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2074&auto=format"
                            />
                            <SolutionCard
                                title="Suivi de satisfaction"
                                description="Sondages instantanés et analytics d'engagement pour mesurer le climat social."
                                icon="❤️"
                                color="emerald"
                                imageUrl="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format"
                            />
                            <SolutionCard
                                title="Gestion des subventions"
                                description="Distribution automatisée des budgets par bénéficiaire avec reporting transparent."
                                icon="💰"
                                color="emerald"
                                imageUrl="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2074&auto=format"
                            />
                        </div>
                    </div>
                    
                    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {benefits.map((benefit, idx) => (
                            <motion.div
                                key={idx}
                                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } } }}
                                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                                className="bg-white rounded-xl p-4 text-center border border-emerald-100 shadow-sm hover:shadow-md cursor-pointer"
                            >
                                <div className="text-3xl mb-2">{benefit.icon}</div>
                                <div className="font-semibold text-sm text-slate-700">{benefit.name}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{benefit.description}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// ── PILIER 3 : INTELLIGENCE & SUPPORT (PURPLE - TECHNOLOGIE) ───────────────────
function IntelligenceSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    
    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);
    
    return (
        <section id="intelligence" className="py-24 bg-white" ref={ref}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Pilier 3 - Technologie
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight mb-6">
                            Intelligence & Support : <span className="text-purple-600">le cerveau de la plateforme</span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Une IA proactive qui anticipe vos besoins et vous accompagne 24/7
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <SolutionCard
                                title="IA prédictive"
                                description="Anticipe les dépenses et propose des optimisations en temps réel."
                                icon="🤖"
                                badge="Beta"
                                color="purple"
                                imageUrl="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2072&auto=format"
                            />
                            <div className="grid grid-cols-2 gap-6">
                                <SolutionCard
                                    title="Dashboard personnalisable"
                                    description="KPI sur mesure pour chaque département."
                                    icon="📊"
                                    color="purple"
                                    imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format"
                                />
                                <SolutionCard
                                    title="Intégrations API"
                                    description="Connectez votre ERP (SAP, Oracle, Odoo)."
                                    icon="🔗"
                                    badge="Enterprise"
                                    color="purple"
                                    imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format"
                                />
                            </div>
                            <SolutionCard
                                title="Assistant voyage 24/7"
                                description="Support multicanal en temps réel pour vos collaborateurs."
                                icon="💬"
                                color="purple"
                                imageUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076&auto=format"
                            />
                        </div>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }} className="bg-slate-50 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                            <img 
                                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2072&auto=format" 
                                alt="IA et données"
                                className="w-full h-64 object-cover"
                            />
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">🤖</div>
                                    <div>
                                        <div className="font-semibold text-slate-800">Sam - IA Assistant</div>
                                        <div className="text-xs text-slate-500">Prédiction voyage</div>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm">✈️ Vol AF 821 (Paris → Dakar) susceptible d'être retardé. Proposition de reprogrammation automatique vers vol AF 823.</p>
                                <div className="flex gap-2 mt-4">
                                    <button className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">Accepter</button>
                                    <button className="text-sm bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition">Voir alternatives</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ── PILIER 4 : SÉCURITÉ & CONFORMITÉ (SLATE - CONFIANCE) ──────────────────────
function SecuritySection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    
    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);
    
    const cities = [
        { name: "Dakar", status: "safe" },
        { name: "Abidjan", status: "warning" },
        { name: "Lagos", status: "safe" },
        { name: "Nairobi", status: "safe" },
        { name: "Johannesburg", status: "critical" }
    ];
    
    return (
        <section id="security" className="py-24 bg-slate-50" ref={ref}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            Pilier 4 - Confiance
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight mb-6">
                            Sécurité & Conformité : <span className="text-slate-600">un socle inébranlable</span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            La tranquillité d'esprit pour vos équipes et vos décideurs
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <SolutionCard
                                title="Alertes sécurité voyage"
                                description="Notifications en temps réel des situations à risque."
                                icon="🛡️"
                                badge="Live"
                                color="slate"
                                imageUrl="https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=2070&auto=format"
                            />
                            <SolutionCard
                                title="Conformité RGPD"
                                description="Protection des données et hébergement sécurisé."
                                icon="🔒"
                                color="slate"
                                imageUrl="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format"
                            />
                            <div className="grid grid-cols-2 gap-6">
                                <SolutionCard
                                    title="Assurance voyage"
                                    description="Couverture automatique pour chaque déplacement."
                                    icon="📄"
                                    color="slate"
                                />
                                <SolutionCard
                                    title="Validation multi-niveaux"
                                    description="Workflow d'approbation personnalisable."
                                    icon="✅"
                                    color="slate"
                                />
                            </div>
                        </div>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800">Afrik-Pulse - Surveillance en temps réel</h3>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs text-slate-500">Active</span>
                                </div>
                            </div>
                            
                            <img 
                                src="https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=2070&auto=format" 
                                alt="Carte de surveillance"
                                className="rounded-xl mb-4 w-full h-40 object-cover"
                            />
                            
                            <div className="space-y-2">
                                {cities.map((city, i) => (
                                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${city.status === 'warning' ? 'bg-amber-50 border border-amber-200' : city.status === 'critical' ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                                        <span className={`w-2 h-2 rounded-full ${city.status === 'safe' ? 'bg-emerald-500' : city.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        <span className="text-xs text-slate-700 flex-1">{city.name}</span>
                                        <span className="text-[10px] font-medium">{city.status === 'safe' ? 'Sécurisé' : city.status === 'warning' ? 'Vigilance' : 'Critique'}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">✓</div>
                                    <div>
                                        <div className="text-xs font-bold">Valeur probante</div>
                                        <div className="text-[10px] text-slate-400">Dématérialisation légale</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-emerald-600">Santé système</div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs">99.9%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function SolutionsPage() {
    const [activeSection, setActiveSection] = useState("voyage");
    
    useEffect(() => {
        const handleScroll = () => {
            const sections = ["voyage", "cse", "intelligence", "security"];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 200 && rect.bottom >= 200) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };
        
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    
    return (
        <main className="min-h-screen bg-white">
            <HeroSection />
            <StickySubNav activeSection={activeSection} setActiveSection={setActiveSection} />
            <TravelManagementSection />
            <CSEBenefitsSection />
            <IntelligenceSection />
            <SecuritySection />
        </main>
    );
}