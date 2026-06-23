"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Zap, ShieldCheck, TrendingUp, RefreshCw, Plane, Gift, BarChart2 } from "lucide-react";

// ─── Interfaces & Types Typés Premium ────────────────────────────────────────

interface Step {
    number: string;
    Icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    description: string;
    metrics: { label: string; value: string; change?: string }[];
    features: string[];
    mediaType: "video" | "mockup" | "dual-grid" | "dashboard";
    videoUrl?: string;
    imageUrl?: string;
    imageAlt: string;
    illustration?: React.ReactNode;
    roiHighlight?: { amount: string; label: string };
}

interface Benefit {
    Icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    metric: string;
    gradient: string;
}

// ─── Données Métiers Unifiées avec Images Réelles ────────────────────────────

const steps: Step[] = [
    {
        number: "01",
        Icon: RefreshCw,
        title: "Configurez en 5 minutes",
        subtitle: "Centralisez tous vos services",
        description: "Connectez vos équipes RH, Finance et Voyages en quelques clics. Notre interface intuitive vous guide pas à pas, tandis que l'IA synchronise automatiquement vos données et budgets en arrière-plan.",
        metrics: [
            { label: "Configuration", value: "< 5 min", change: "-70%" },
            { label: "Services intégrés", value: "3", change: "+100%" },
            { label: "Automatisation", value: "95%", change: "+45%" }
        ],
        features: [
            "Configuration guidée en moins de 5 minutes",
            "Synchronisation automatique des données",
            "IA pour l'optimisation budgétaire",
            "Interface intuitive et épurée"
        ],
        mediaType: "video",
        videoUrl: "/bg-whyUse.mp4", 
        imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop",
        imageAlt: "Équipe configurant la plateforme",
        illustration: (
            <div className="relative w-full h-full min-h-[250px] rounded-xl overflow-hidden">
                <Image 
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop"
                    alt="Configuration de la plateforme"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-indigo-600">⚡ Configuration rapide</span>
                </div>
            </div>
        )
    },
    {
        number: "02",
        Icon: Plane,
        title: "Réservez en toute simplicité",
        subtitle: "Des voyages optimisés et conformes",
        description: "Vos collaborateurs trouvent et réservent leurs déplacements en moins de 3 minutes. Les budgets s'affichent en temps réel avec des alertes intelligentes pour maîtriser vos coûts.",
        metrics: [
            { label: "Temps de réservation", value: "< 3 min", change: "-60%" },
            { label: "Conformité", value: "98%", change: "+25%" },
            { label: "Économies", value: "-30%", change: "+12%" }
        ],
        features: [
            "Recherche multi-compagnies en temps réel",
            "Alertes budget et conformité",
            "Scan automatique des notes de frais",
            "Politiques de voyage personnalisées"
        ],
        mediaType: "dual-grid",
        imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop",
        imageAlt: "Réservation de voyage professionnelle",
        illustration: (
            <div className="relative w-full h-full min-h-[250px] rounded-xl overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop"
                    alt="Réservation de voyage professionnelle"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-emerald-600">Réservation en 3 minutes</span>
                </div>
            </div>
        )
    },
    {
        number: "03",
        Icon: Gift,
        title: "Valorisez vos équipes",
        subtitle: "Des avantages sociaux à portée de clic",
        description: "Offrez à vos collaborateurs un accès 24/7 à une galerie d'avantages moderne. Ils parcourent, choisissent et utilisent leurs bénéfices en quelques secondes pour un bien-être renforcé.",
        metrics: [
            { label: "Satisfaction", value: "96%", change: "+42%" },
            { label: "Utilisation", value: "89%", change: "+67%" },
            { label: "Engagement", value: "+47%", change: "NPS +35" }
        ],
        features: [
            "Catalogue d'avantages varié et local",
            "Interface fluide et intuitive",
            "Notifications en temps réel",
            "Accès mobile 24/7"
        ],
        mediaType: "mockup",
        videoUrl: "/videos/cse-gallery-scroll.mp4",
        imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop",
        imageAlt: "Avantages sociaux pour collaborateurs",
        illustration: (
            <div className="relative w-full h-full min-h-[250px] rounded-xl overflow-hidden">
                <Image 
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop"
                    alt="Avantages sociaux"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-purple-600">🎁 Avantages 24/7</span>
                </div>
            </div>
        )
    },
    {
        number: "04",
        Icon: BarChart2,
        title: "Pilotez votre performance",
        subtitle: "Des données claires pour des décisions éclairées",
        description: "Accédez à une vue unifiée de vos indicateurs clés. Le tableau de bord fusionne les données d'engagement et de dépenses avec des alertes automatisées pour optimiser vos performances.",
        metrics: [
            { label: "Visibilité", value: "100%", change: "+100%" },
            { label: "Conformité", value: "99.9%", change: "+15%" },
            { label: "ROI", value: "+25%", change: "Année 1" }
        ],
        features: [
            "Tableau de bord personnalisé",
            "Alertes prédictives intelligentes",
            "Rapports d'audit en un clic",
            "Indicateurs de performance en temps réel"
        ],
        mediaType: "dashboard",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
        imageAlt: "Tableau de bord analytique",
        illustration: (
            <div className="relative w-full h-full min-h-[250px] rounded-xl overflow-hidden">
                <Image 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
                    alt="Tableau de bord"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-indigo-600">📊 Pilotage en temps réel</span>
                </div>
            </div>
        ),
        roiHighlight: { amount: "-30%", label: "d'économies constatées sur les déplacements" }
    }
];

const benefits: Benefit[] = [
    {
        Icon: Zap,
        title: "Gagnez un temps précieux",
        description: "Automatisez vos processus complexes et réduisez drastiquement le temps consacré à la gestion administrative quotidienne.",
        metric: "-70% de temps administratif",
        gradient: "from-indigo-500 to-blue-500"
    },
    {
        Icon: ShieldCheck,
        title: "Sécurisez vos opérations",
        description: "Suivez en temps réel les réglementations locales et internationales pour une conformité totale et une sérénité juridique.",
        metric: "Zéro risque juridique",
        gradient: "from-emerald-500 to-teal-500"
    },
    {
        Icon: TrendingUp,
        title: "Optimisez vos budgets",
        description: "Maîtrisez vos dépenses grâce à des analyses prédictives et des alertes intelligentes au moment de chaque achat.",
        metric: "Jusqu'à 30% d'économies",
        gradient: "from-purple-500 to-pink-500"
    }
];

// ─── Hook Custom: Intersection Observer ─────────────────────────────────────

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    obs.disconnect();
                }
            },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref, threshold]);
    return inView;
}

// ─── Composant Counter Animé ────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "", duration = 1000 }: { value: string; suffix?: string; duration?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref);
    
    const numericValue = parseInt(value.replace(/[^0-9-]/g, '')) || 0;
    
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const increment = numericValue / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= numericValue) {
                setCount(numericValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [inView, numericValue, duration]);
    
    return (
        <span ref={ref} className="inline-block">
            {inView ? count : 0}{suffix}
        </span>
    );
}

// ─── Composant Carrousel Mobile ────────────────────────────────────────────

function MobileCarousel({ children }: { children: React.ReactNode[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % children.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + children.length) % children.length);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 50) {
            nextSlide();
        }
        if (touchStart - touchEnd < -50) {
            prevSlide();
        }
    };

    return (
        <div className="relative md:hidden">
            <div 
                className="overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {children.map((child, index) => (
                        <div key={index} className="w-full flex-shrink-0 px-4">
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center gap-2 mt-8">
                {children.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            currentIndex === index 
                                ? "w-8 bg-gradient-to-r from-indigo-600 to-emerald-500" 
                                : "w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                        aria-label={`Aller à la slide ${index + 1}`}
                    />
                ))}
            </div>

            <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                aria-label="Slide précédent"
            >
                ←
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                aria-label="Slide suivant"
            >
                →
            </button>
        </div>
    );
}

// ─── Section 1: Hero Section ────────────────────────────────────────────────

function HeroSection() {
    const [activeTab, setActiveTab] = useState<"voyage" | "cse">("voyage");
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTab((prev) => (prev === "voyage" ? "cse" : "voyage"));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32 border-b border-slate-100">
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[420px] h-[420px] sm:w-[720px] sm:h-[720px] rounded-full opacity-15 blur-[100px] sm:blur-[140px]" style={{ background: "#6366F1" }} />
                <div className="absolute bottom-0 right-0 w-[320px] h-[320px] sm:w-[520px] sm:h-[520px] rounded-full opacity-15 blur-[100px] sm:blur-[130px]" style={{ background: "#10B981" }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:34px_34px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
                
                {/* ── Visuel central : point d'interrogation ── */}
                <div className="absolute left-[43%] top-[47%] -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-5 pointer-events-none z-0">
                    <div className="relative h-80 w-60 xl:h-[410px] xl:w-80">
                        <img
                            src="/images/question_mark-removebg-preview 1.png"
                            alt=""
                            className="h-full w-full object-contain drop-shadow-[0_28px_45px_rgba(79,70,229,0.28)]"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsVideoOpen(true)}
                    className="absolute left-[53%] top-[47%] z-30 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-indigo-600 shadow-[0_24px_70px_rgba(79,70,229,0.32)] backdrop-blur-md transition-all duration-300 before:absolute before:inset-[-10px] before:rounded-full before:border before:border-indigo-200/70 before:bg-indigo-500/5 hover:scale-105 hover:bg-indigo-600 hover:text-white lg:flex"
                    aria-label="Lire la vidéo de présentation"
                >
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 text-white shadow-[0_12px_28px_rgba(79,70,229,0.35)]">
                        <span className="ml-1 text-xl leading-none">▶</span>
                    </span>
                </button>

                {isVideoOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-md" onClick={() => setIsVideoOpen(false)}>
                        <div className="relative w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 p-2 shadow-[0_35px_100px_rgba(0,0,0,0.55)]" onClick={(event) => event.stopPropagation()}>
                            <div className="flex items-center justify-between px-3 pb-2 pt-1">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg">
                                        ▶
                                    </span>
                                    <span className="text-sm font-bold text-white">Vidéo de présentation</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsVideoOpen(false)}
                                className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-white/90 text-xl font-bold text-slate-900 shadow-lg transition-colors hover:bg-white"
                                aria-label="Fermer la vidéo"
                            >
                                ×
                            </button>
                            <video src="/bg-whyUse.mp4" autoPlay loop muted playsInline className="aspect-video w-full rounded-[1.25rem] bg-black object-cover" />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 items-center">

                    <div className="lg:col-span-4 text-center lg:text-left relative z-10">
                        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-4 sm:mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Comment ça marche
                        </span>
                        
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-tight sm:leading-none">
                            Une plateforme, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">
                                4 étapes simples
                            </span>
                        </h1>
                        
                        <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-slate-600 font-medium px-4 sm:px-0">
                            Découvrez comment notre solution unifiée transforme la gestion de vos voyages d'affaires et avantages sociaux en un processus fluide, automatisé et centré sur vos collaborateurs.
                        </p>
                        
                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setIsVideoOpen(true)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-slate-950 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold text-white border border-slate-950 shadow-xl transition-all duration-300 hover:bg-indigo-600 hover:border-indigo-600"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white text-[10px] shadow-md">
                                    <span className="ml-0.5">▶</span>
                                </span>
                                Voir la démo en 5 min
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 hidden lg:block" />

                    <div className="lg:col-span-6 relative z-10">
                        <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-3 sm:p-4 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl group transition-all duration-500">
                            
                            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100 relative z-20">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500/40" />
                                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-amber-500/40" />
                                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500/40" />
                                </div>
                                
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner z-20">
                                    <button 
                                        onClick={() => setActiveTab("voyage")}
                                        className={`px-2 sm:px-4 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "voyage" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-500 hover:text-slate-950"}`}
                                    >
                                        🌐 Voyages
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab("cse")}
                                        className={`px-2 sm:px-4 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "cse" ? "bg-indigo-500 text-white shadow-md" : "text-slate-500 hover:text-slate-950"}`}
                                    >
                                        🎁 Avantages
                                    </button>
                                </div>
                            </div>

                            <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-200 flex items-center justify-center">
                                
                                <div className="absolute inset-0 w-full h-full mix-blend-screen opacity-40 pointer-events-none z-0">
                                    <video 
                                        src="/bg-whyUse.mp4"
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                                </div>

                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-10" />

                                <div className="relative z-20 w-full px-4 sm:px-6 md:px-12 text-center transition-all duration-500 transform">
                                    {activeTab === "voyage" ? (
                                        <div className="animate-fade-in space-y-3 sm:space-y-4">
                                            <div>
                                                <span className="text-[8px] sm:text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 sm:py-1 rounded border border-emerald-500/20">
                                                    Mobilité d'affaires
                                                </span>
                                                <h4 className="text-base sm:text-xl lg:text-2xl font-black text-white mt-1 sm:mt-2 tracking-tight">Recherche de vol optimisée</h4>
                                            </div>
                                            
                                            <div className="mx-auto max-w-sm rounded-xl bg-slate-950/80 backdrop-blur-xl border border-white/10 p-3 sm:p-4 text-left shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                                                <div className="flex justify-between items-center mb-2 relative z-10">
                                                    <div className="h-1.5 w-10 sm:w-12 bg-emerald-500 rounded" />
                                                    <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 sm:px-2 rounded">✓ Tarif négocié</span>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-200 font-medium relative z-10">Cotonou → Paris • Classe Économique</p>
                                                <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono mt-1 relative z-10">Tarif préférentiel • <span className="text-emerald-400 font-bold">-12%</span></p>
                                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 flex justify-between items-center text-[8px] sm:text-[10px] text-slate-400 relative z-10">
                                                    <span>Politique : Conforme</span>
                                                    <span className="bg-emerald-500 text-slate-950 font-bold px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px]">✓ Validé</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in space-y-3 sm:space-y-4">
                                            <div>
                                                <span className="text-[8px] sm:text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 sm:py-1 rounded border border-indigo-500/20">
                                                    Avantages sociaux
                                                </span>
                                                <h4 className="text-base sm:text-xl lg:text-2xl font-black text-white mt-1 sm:mt-2 tracking-tight">Galerie de services</h4>
                                            </div>
                                            
                                            <div className="mx-auto max-w-sm rounded-xl bg-slate-950/80 backdrop-blur-xl border border-white/10 p-3 sm:p-4 text-left shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                                                <div className="flex justify-between items-center mb-2 relative z-10">
                                                    <div className="h-1.5 w-12 sm:w-16 bg-indigo-500 rounded" />
                                                    <span className="text-[8px] sm:text-[10px] font-mono font-bold text-indigo-400">Allocation active</span>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-200 font-medium relative z-10">Subvention disponible : <span className="text-white font-bold">50 000 FCFA</span></p>
                                                
                                                <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 relative z-10">
                                                    <div className="h-10 sm:h-12 bg-white/[0.03] hover:bg-white/10 rounded-lg border border-white/5 flex flex-col items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer">
                                                        <span className="text-sm sm:text-base">🎟️</span>
                                                        <span className="text-[6px] sm:text-[8px] text-slate-400 mt-0.5">Tickets</span>
                                                    </div>
                                                    <div className="h-10 sm:h-12 bg-white/[0.03] hover:bg-white/10 rounded-lg border border-white/5 flex flex-col items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer">
                                                        <span className="text-sm sm:text-base">🛒</span>
                                                        <span className="text-[6px] sm:text-[8px] text-slate-400 mt-0.5">Bons</span>
                                                    </div>
                                                    <div className="h-10 sm:h-12 bg-white/[0.03] hover:bg-white/10 rounded-lg border border-white/5 flex flex-col items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer">
                                                        <span className="text-sm sm:text-base">🏨</span>
                                                        <span className="text-[6px] sm:text-[8px] text-slate-400 mt-0.5">Loisirs</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>
        </section>
    );
}

// ─── Section 2: StepsSection Améliorée ──────────────────────────────────────

function StepCard({ step, index }: { step: Step; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, 0.2);

    return (
        <div 
            ref={ref}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-1000 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
            }`}
        >
            <div className={`lg:col-span-5 ${index % 2 === 1 ? "lg:order-2" : "lg:order-1"}`}>
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    {step.illustration}
                </div>
            </div>

            <div className={`lg:col-span-7 ${index % 2 === 1 ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-indigo-600 to-emerald-500 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg">
                        {step.number}
                    </span>
                    <div className="flex items-center gap-2">
                        <step.Icon className="w-6 h-6 text-indigo-500" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            Étape {step.number}
                        </span>
                    </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                    {step.title}
                </h3>
                <span className="block text-sm sm:text-base font-semibold text-indigo-600 mt-1 mb-4">
                    {step.subtitle}
                </span>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {step.description}
                </p>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
                    {step.metrics.map((metric, i) => (
                        <div key={i} className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-3 text-center border border-slate-200 shadow-sm">
                            <div className="text-xl sm:text-2xl font-black text-indigo-600">
                                <AnimatedCounter value={metric.value} />
                            </div>
                            <div className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">{metric.label}</div>
                            {metric.change && (
                                <div className="text-[8px] sm:text-[9px] font-bold text-emerald-600 mt-0.5">{metric.change}</div>
                            )}
                        </div>
                    ))}
                </div>

                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 font-medium">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">
                                ✓
                            </span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                {step.roiHighlight && (
                    <div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
                        <div className="text-2xl">✨</div>
                        <div>
                            <div className="text-lg sm:text-xl font-black text-emerald-700">{step.roiHighlight.amount}</div>
                            <div className="text-[10px] sm:text-xs text-emerald-600 font-medium">{step.roiHighlight.label}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepsSection() {
    return (
        <section className="bg-white py-16 sm:py-24 lg:py-32 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 sm:mb-20 text-center max-w-2xl mx-auto">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                        Le processus en détail
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Tout commence par <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">4 étapes</span>
                    </h2>
                    <p className="mt-3 text-slate-500 max-w-md mx-auto">
                        De la configuration initiale au pilotage stratégique, suivez le guide
                    </p>
                </div>

                <div className="space-y-16 sm:space-y-24 lg:space-y-32">
                    {steps.map((step, index) => (
                        <StepCard key={index} step={step} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Section 3: WhySection ─────────────────────────────────────────────────

function WhySection() {
    const benefitsCards = benefits.map((benefit, i) => (
        <div 
            key={i} 
            className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
        >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r ${benefit.gradient} text-white flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <benefit.Icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {benefit.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 mb-5 font-medium">
                {benefit.description}
            </p>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Résultat prouvé</span>
                <span className={`text-xs font-extrabold bg-gradient-to-r ${benefit.gradient} bg-clip-text text-transparent`}>
                    {benefit.metric}
                </span>
            </div>
        </div>
    ));

    return (
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24 lg:py-32 border-t border-slate-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 sm:mb-20 text-center max-w-2xl mx-auto">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        Pourquoi nous choisir
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Des bénéfices <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">concrets</span>
                    </h2>
                    <p className="mt-3 text-slate-500">
                        Des résultats mesurables pour votre entreprise
                    </p>
                </div>

                <div className="hidden md:grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
                    {benefitsCards}
                </div>

                <MobileCarousel>
                    {benefitsCards}
                </MobileCarousel>
            </div>
        </section>
    );
}

// ─── Page Principale ────────────────────────────────────────────────────────

export default function HowItWorksPage() {
    return (
        <main className="min-h-screen bg-white font-sans antialiased selection:bg-indigo-500 selection:text-white">
            <HeroSection />
            <StepsSection />
            <WhySection />
        </main>
    );
}