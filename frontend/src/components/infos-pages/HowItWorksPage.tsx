"use client";

import { useRef, useEffect, useState } from "react";

// ─── Interfaces & Types Typés Premium ────────────────────────────────────────

interface Step {
    number: string;
    icon: string;
    title: string;
    subtitle: string;
    description: string;
    metrics: { label: string; value: string; change?: string }[];
    features: string[];
    mediaType: "video" | "mockup" | "dual-grid" | "dashboard";
    videoUrl?: string;
    imageUrl?: string;
    imageAlt: string;
    svgIllustration?: React.ReactNode;
    roiHighlight?: { amount: string; label: string };
}

interface Benefit {
    icon: string;
    title: string;
    description: string;
    metric: string;
    gradient: string;
}

// ─── SVG Illustrations pour chaque étape ─────────────────────────────────────

const Step1SVG = () => (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="400" height="300" rx="16" fill="url(#grad1)" fillOpacity="0.05"/>
        <defs>
            <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#10B981"/>
            </linearGradient>
            <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#8B5CF6"/>
                <stop offset="1" stopColor="#6366F1"/>
            </linearGradient>
        </defs>
        
        {/* Central Hub */}
        <circle cx="200" cy="150" r="45" fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="2"/>
        <circle cx="200" cy="150" r="25" fill="#6366F1" fillOpacity="0.3"/>
        <text x="200" y="156" textAnchor="middle" fill="#6366F1" fontSize="14" fontWeight="bold" fontFamily="monospace">HUB</text>
        
        {/* Connecting nodes */}
        <g>
            {/* Node 1 - RH */}
            <circle cx="95" cy="85" r="18" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5"/>
            <text x="95" y="90" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="bold">RH</text>
            <line x1="113" y1="103" x2="175" y2="135" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
            
            {/* Node 2 - Finance */}
            <circle cx="85" cy="215" r="18" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.5"/>
            <text x="85" y="220" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="bold">💰</text>
            <line x1="103" y1="203" x2="175" y2="160" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
            
            {/* Node 3 - Voyages */}
            <circle cx="305" cy="85" r="18" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="1.5"/>
            <text x="305" y="90" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="bold">✈️</text>
            <line x1="287" y1="103" x2="225" y2="135" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
            
            {/* Node 4 - CSE */}
            <circle cx="315" cy="215" r="18" fill="#8B5CF6" fillOpacity="0.15" stroke="#8B5CF6" strokeWidth="1.5"/>
            <text x="315" y="220" textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="bold">🎁</text>
            <line x1="297" y1="203" x2="225" y2="160" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
        </g>
        
        {/* Animated pulse rings */}
        <circle cx="200" cy="150" r="60" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" from="45" to="70" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="200" cy="150" r="60" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" from="45" to="70" dur="2s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" begin="1s" repeatCount="indefinite"/>
        </circle>
    </svg>
);

const Step2SVG = () => (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="400" height="300" rx="16" fill="#10B981" fillOpacity="0.03"/>
        
        {/* Search bar */}
        <rect x="50" y="50" width="300" height="40" rx="20" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
        <text x="75" y="75" fill="#9CA3AF" fontSize="12">🔍 Recherche de vol...</text>
        
        {/* Flight cards */}
        <g>
            <rect x="50" y="105" width="300" height="55" rx="10" fill="#10B981" fillOpacity="0.08" stroke="#10B981" strokeWidth="1"/>
            <text x="70" y="125" fill="#065F46" fontSize="11" fontWeight="bold">✈️ Cotonou → Paris</text>
            <text x="70" y="142" fill="#059669" fontSize="9">€450 • Conforme • Vol direct</text>
            <rect x="280" y="115" width="50" height="20" rx="6" fill="#10B981"/>
            <text x="305" y="129" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">-12%</text>
        </g>
        
        <g>
            <rect x="50" y="170" width="300" height="55" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
            <text x="70" y="190" fill="#374151" fontSize="11" fontWeight="bold">✈️ Dakar → Abidjan</text>
            <text x="70" y="207" fill="#6B7280" fontSize="9">€280 • Budget OK</text>
            <rect x="280" y="180" width="50" height="20" rx="6" fill="#F59E0B"/>
            <text x="305" y="194" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">-8%</text>
        </g>
        
        {/* Heatmap mini */}
        <rect x="50" y="240" width="300" height="40" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="65" y="260" fill="#4B5563" fontSize="9">Heatmap dépenses mensuelles</text>
        <rect x="65" y="268" width="40" height="6" rx="3" fill="#EF4444"/>
        <rect x="110" y="270" width="35" height="4" rx="2" fill="#F59E0B"/>
        <rect x="150" y="268" width="50" height="6" rx="3" fill="#10B981"/>
        <rect x="205" y="270" width="30" height="4" rx="2" fill="#F59E0B"/>
        <rect x="240" y="268" width="45" height="6" rx="3" fill="#EF4444"/>
    </svg>
);

const Step3SVG = () => (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="400" height="300" rx="16" fill="#8B5CF6" fillOpacity="0.03"/>
        
        {/* Gallery header */}
        <text x="50" y="50" fill="#5B21B6" fontSize="16" fontWeight="bold">Service Gallery</text>
        <text x="50" y="68" fill="#6B7280" fontSize="10">Avantages sociaux</text>
        
        {/* Benefit cards grid */}
        <g>
            {/* Card 1 */}
            <rect x="50" y="85" width="85" height="85" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
            <text x="92" y="115" textAnchor="middle" fontSize="28">🎟️</text>
            <text x="92" y="135" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="bold">Tickets</text>
            <text x="92" y="150" textAnchor="middle" fill="#6B7280" fontSize="8">Restau</text>
            
            {/* Card 2 */}
            <rect x="145" y="85" width="85" height="85" rx="12" fill="#8B5CF6" fillOpacity="0.1" stroke="#8B5CF6" strokeWidth="1.5"/>
            <text x="187" y="115" textAnchor="middle" fontSize="28">🛒</text>
            <text x="187" y="135" textAnchor="middle" fill="#5B21B6" fontSize="9" fontWeight="bold">Bons d'achat</text>
            <text x="187" y="150" textAnchor="middle" fill="#6B7280" fontSize="8">Carrefour</text>
            <rect x="200" y="88" width="20" height="12" rx="4" fill="#10B981"/>
            <text x="210" y="97" textAnchor="middle" fill="white" fontSize="7">NEW</text>
            
            {/* Card 3 */}
            <rect x="240" y="85" width="85" height="85" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
            <text x="282" y="115" textAnchor="middle" fontSize="28">🏨</text>
            <text x="282" y="135" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="bold">Loisirs</text>
            <text x="282" y="150" textAnchor="middle" fill="#6B7280" fontSize="8">Hôtels</text>
        </g>
        
        {/* Budget indicator */}
        <rect x="50" y="185" width="300" height="50" rx="10" fill="#F3F4F6"/>
        <text x="70" y="205" fill="#374151" fontSize="10" fontWeight="bold">Subvention disponible</text>
        <text x="70" y="222" fill="#5B21B6" fontSize="18" fontWeight="black">50 000 FCFA</text>
        
        {/* Satisfaction bar */}
        <rect x="50" y="248" width="300" height="30" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="70" y="267" fill="#4B5563" fontSize="9">Satisfaction utilisateurs</text>
        <rect x="210" y="256" width="120" height="12" rx="6" fill="#10B981"/>
        <text x="335" y="267" fill="#10B981" fontSize="9" fontWeight="bold">96%</text>
    </svg>
);

const Step4SVG = () => (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="400" height="300" rx="16" fill="#6366F1" fillOpacity="0.03"/>
        
        {/* Dashboard header */}
        <rect x="50" y="40" width="300" height="35" rx="8" fill="#1F2937"/>
        <text x="70" y="62" fill="white" fontSize="11" fontWeight="bold">📊 Tableau de bord</text>
        <circle cx="330" cy="58" r="4" fill="#10B981">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        {/* KPI Cards */}
        <g>
            <rect x="50" y="85" width="90" height="50" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
            <text x="95" y="105" textAnchor="middle" fill="#6B7280" fontSize="8">Visibilité</text>
            <text x="95" y="122" textAnchor="middle" fill="#10B981" fontSize="16" fontWeight="bold">100%</text>
        </g>
        
        <g>
            <rect x="150" y="85" width="90" height="50" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
            <text x="195" y="105" textAnchor="middle" fill="#6B7280" fontSize="8">Conformité</text>
            <text x="195" y="122" textAnchor="middle" fill="#6366F1" fontSize="16" fontWeight="bold">99.9%</text>
        </g>
        
        <g>
            <rect x="250" y="85" width="100" height="50" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
            <text x="300" y="105" textAnchor="middle" fill="#6B7280" fontSize="8">Économies</text>
            <text x="300" y="122" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="bold">-30%</text>
        </g>
        
        {/* Chart */}
        <rect x="50" y="148" width="300" height="90" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="70" y="168" fill="#4B5563" fontSize="9" fontWeight="bold">Évolution des dépenses</text>
        
        {/* Bars */}
        <rect x="70" y="200" width="25" height="25" rx="3" fill="#6366F1" opacity="0.7">
            <animate attributeName="height" values="25;35;25" dur="2s" repeatCount="indefinite"/>
        </rect>
        <rect x="110" y="185" width="25" height="40" rx="3" fill="#8B5CF6" opacity="0.7">
            <animate attributeName="height" values="40;50;40" dur="2.2s" repeatCount="indefinite"/>
        </rect>
        <rect x="150" y="170" width="25" height="55" rx="3" fill="#10B981" opacity="0.7">
            <animate attributeName="height" values="55;65;55" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <rect x="190" y="195" width="25" height="30" rx="3" fill="#F59E0B" opacity="0.7"/>
        <rect x="230" y="190" width="25" height="35" rx="3" fill="#EF4444" opacity="0.7"/>
        <rect x="270" y="180" width="25" height="45" rx="3" fill="#6366F1" opacity="0.7"/>
        
        {/* Line */}
        <polyline points="82,210 122,195 162,180 202,215 242,205 282,195" fill="none" stroke="#6366F1" strokeWidth="2"/>
        
        {/* ROI Highlight */}
        <rect x="50" y="250" width="300" height="35" rx="8" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1"/>
        <text x="200" y="272" textAnchor="middle" fill="#065F46" fontSize="11" fontWeight="bold">✨ Économies constatées : -30% sur les déplacements</text>
    </svg>
);

// ─── Données Métiers Unifiées & Synchronisées ────────────────────────────────

const steps: Step[] = [
    {
        number: "01",
        icon: "⚙️",
        title: "Configuration & Centralisation",
        subtitle: "Agrégation des flux Finance, RH et Voyages",
        description: "Intégrez les données structurelles de votre entreprise sans surcharge cognitive. Notre interface épurée applique le principe de divulgation progressive : configurez d'abord l'essentiel, puis laissez l'IA connecter vos départements et budgets en tâche de fond.",
        metrics: [
            { label: "Configuration", value: "< 5 min", change: "-70%" },
            { label: "Flux intégrés", value: "3", change: "+100%" },
            { label: "Automatisation", value: "95%", change: "+45%" }
        ],
        features: [
            "Configuration globale en moins de 5 minutes",
            "Bento Grid interactive de centralisation des flux",
            "Cartes sombres réactives s'illuminant au survol",
            "IA prédictive pour l'optimisation budgétaire"
        ],
        mediaType: "video",
        videoUrl: "/bg-whyUse.mp4", 
        imageUrl: "/images/onboarding.png",
        imageAlt: "Mockup de l'onboarding simplifié et centralisation des données",
        svgIllustration: <Step1SVG />
    },
    {
        number: "02",
        icon: "✈️",
        title: "Smart Search Prédictive",
        subtitle: "Fluidité des déplacements & Maîtrise des coûts",
        description: "Vos collaborateurs réservent leurs déplacements professionnels en moins de 3 minutes. Grâce à une affordance visuelle soignée, les plafonds budgétaires et politiques de voyage configurés s'activent et se signalent en temps réel à l'écran.",
        metrics: [
            { label: "Temps de réservation", value: "< 3 min", change: "-60%" },
            { label: "Conformité", value: "98%", change: "+25%" },
            { label: "Économies", value: "-30%", change: "+12%" }
        ],
        features: [
            "Recherche prédictive connectée aux hubs africains",
            "Indicateurs de conformité budgétaire instantanés",
            "Gestion des notes de frais par scan intelligent",
            "Alertes temps réel sur les dépassements"
        ],
        mediaType: "dual-grid",
        imageUrl: "/images/control.jpg",
        imageAlt: "Interface de Smart Search AfrikVoyage et Heatmaps de dépenses",
        svgIllustration: <Step2SVG />
    },
    {
        number: "03",
        icon: "🎁",
        title: "Service Gallery Digitale",
        subtitle: "Bien-être et valorisation des avantages sociaux",
        description: "Offrez à vos équipes un accès 24/7 à une vitrine d'avantages moderne style Netflix. Les employés parcourent leurs subventions, chèques cadeaux et micro-services en deux clics via une interface fluide magnifiée par le Glassmorphism.",
        metrics: [
            { label: "Satisfaction", value: "96%", change: "+42%" },
            { label: "Utilisation", value: "89%", change: "+67%" },
            { label: "Engagement", value: "+47%", change: "NPS +35" }
        ],
        features: [
            "Catalogue d'avantages dynamiques et locaux",
            "Micro-interaction de suivi de satisfaction en 1 clic",
            "Notification instantanée des dotations et recharges",
            "Accès mobile 24/7"
        ],
        mediaType: "mockup",
        videoUrl: "/videos/cse-gallery-scroll.mp4",
        imageUrl: "/images/img2.jpeg",
        imageAlt: "Défilement de la Service Gallery style Netflix AfrikCSE",
        svgIllustration: <Step3SVG />
    },
    {
        number: "04",
        icon: "📊",
        title: "Pilotage Stratégique",
        subtitle: "Transformer les flux administratifs en performance unifiée",
        description: "Accédez à une visibilité absolue. Le tableau de bord fusionne les indicateurs d'engagement d'AfrikCSE et les heatmaps de dépenses d'AfrikVoyage, adossé à un panneau de conformité automatisée garantissant votre sécurité juridique.",
        metrics: [
            { label: "Visibilité", value: "100%", change: "+100%" },
            { label: "Conformité", value: "99.9%", change: "+15%" },
            { label: "ROI", value: "+25%", change: "Année 1" }
        ],
        features: [
            "Heatmaps de dépenses prédictives pour les CFO",
            "Jauges de performance en temps réel et de santé du système",
            "Génération de rapports d'audit exportables en un clic",
            "Alertes prédictives sur anomalies"
        ],
        mediaType: "dashboard",
        imageUrl: "/images/dashbaord-roi.jpeg",
        imageAlt: "Dashboard analytique premium avec jauges dynamiques",
        svgIllustration: <Step4SVG />,
        roiHighlight: { amount: "-30%", label: "Coûts de voyage constatés chez TechAfrik" }
    }
];

const benefits: Benefit[] = [
    {
        icon: "⚡",
        title: "Efficience Opérationnelle",
        description: "Automatisation de vos processus complexes et réduction drastique du temps de gestion RH et Comptable.",
        metric: "-70% de temps administratif",
        gradient: "from-indigo-500 to-blue-500"
    },
    {
        icon: "🛡️",
        title: "Compliance Totale",
        description: "Suivi en temps réel des réglementations fiscales locales et internationales pour une sécurité sans faille.",
        metric: "Zéro risque juridique",
        gradient: "from-emerald-500 to-teal-500"
    },
    {
        icon: "📈",
        title: "Optimisation Budgétaire",
        description: "Contrôle des dérives financières grâce aux analyses prédictives et alertes d'affordance au moment de l'achat.",
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
        <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32 border-b border-slate-100 selection:bg-indigo-500 selection:text-white">
            {/* Fond clair avec halos très doux */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[420px] h-[420px] sm:w-[720px] sm:h-[720px] rounded-full opacity-15 blur-[100px] sm:blur-[140px]" style={{ background: "#6366F1" }} />
                <div className="absolute bottom-0 right-0 w-[320px] h-[320px] sm:w-[520px] sm:h-[520px] rounded-full opacity-15 blur-[100px] sm:blur-[130px]" style={{ background: "#10B981" }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:34px_34px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
                
                {/* ── Visuel central : point d'interrogation + image, en arrière-plan du texte ── */}
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
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-emerald-500 text-white shadow-[0_12px_28px_rgba(79,70,229,0.35)]">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                    
                    {/* Colonne Gauche : Argumentaire Accrocheur */}
                    <div className="lg:col-span-5 text-center lg:text-left relative z-10">
                        
                        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-4 sm:mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Écosystème Unifié Premium
                        </span>
                        
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-tight sm:leading-none">
                            Une seule plateforme, <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-purple-500 to-emerald-500">
                                3 étapes vers l'excellence
                            </span>
                        </h1>
                        
                        <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-slate-600 font-medium px-4 sm:px-0">
                            Découvrez comment AfrikVoyage &amp; AfrikCSE transforment le chaos des processus éparpillés en une performance fluide, automatisée et centrée sur le collaborateur.
                        </p>
                        
                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setIsVideoOpen(true)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-slate-950 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold text-white border border-slate-950 shadow-xl transition-all duration-300 hover:bg-indigo-600 hover:border-indigo-600"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-emerald-500 text-white text-[10px] shadow-md">
                                    <span className="ml-0.5">▶</span>
                                </span>
                                Processus simulé en 5 min
                            </button>
                        </div>

                    </div>

                    {/* Zone tampon centrale vide pour laisser de la place à l'élément absolu central sur desktop */}
                    <div className="lg:col-span-1 hidden lg:block" />

                    {/* Colonne Droite : Le Simulateur Workspace Switcher Interactif */}
                    <div className="lg:col-span-6 relative z-10">
                        <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-3 sm:p-4 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl group transition-all duration-500">
                            
                            {/* Barre supérieure style Châssis d'Application */}
                            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100 relative z-20">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500/40" />
                                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-amber-500/40" />
                                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500/40" />
                                </div>
                                
                                {/* Switcher Mode Démo Actif */}
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner z-20">
                                    <button 
                                        onClick={() => setActiveTab("voyage")}
                                        className={`px-2 sm:px-4 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "voyage" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-500 hover:text-slate-950"}`}
                                    >
                                        🌐 AfrikVoyage
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab("cse")}
                                        className={`px-2 sm:px-4 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === "cse" ? "bg-indigo-500 text-white shadow-md" : "text-slate-500 hover:text-slate-950"}`}
                                    >
                                        🎁 AfrikCSE
                                    </button>
                                </div>
                            </div>

                            {/* Conteneur d'affichage Écran avec Intégration Vidéo et Overlays Réels */}
                            <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-200 flex items-center justify-center">
                                
                                {/* ÉLÉMENT WOW : Arrière-plan Vidéo Réel avec Traitement de Couleur Mix-Blend */}
                                <div className="absolute inset-0 w-full h-full mix-blend-screen opacity-40 pointer-events-none z-0">
                                    <video 
                                        src="/bg-whyUse.mp4"
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                                </div>

                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-10" />

                                <div className="relative z-20 w-full px-4 sm:px-6 md:px-12 text-center transition-all duration-500 transform">
                                    {activeTab === "voyage" ? (
                                        <div className="animate-fade-in space-y-3 sm:space-y-4">
                                            <div>
                                                <span className="text-[8px] sm:text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 sm:py-1 rounded border border-emerald-500/20">
                                                    Flux Actif : Mobilité d&apos;Affaires
                                                </span>
                                                <h4 className="text-base sm:text-xl lg:text-2xl font-black text-white mt-1 sm:mt-2 tracking-tight">Recherche de Vol Prédit</h4>
                                            </div>
                                            
                                            <div className="mx-auto max-w-sm rounded-xl bg-slate-950/80 backdrop-blur-xl border border-white/10 p-3 sm:p-4 text-left shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                                                <div className="flex justify-between items-center mb-2 relative z-10">
                                                    <div className="h-1.5 w-10 sm:w-12 bg-emerald-500 rounded" />
                                                    <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 sm:px-2 rounded">✓ Tarification Locale</span>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-200 font-medium relative z-10">Axe Cotonou — Paris . Classe Économique Négociée</p>
                                                <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono mt-1 relative z-10">Tarif préférentiel appliqué • <span className="text-emerald-400 font-bold">-12% direct</span></p>
                                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 flex justify-between items-center text-[8px] sm:text-[10px] text-slate-400 relative z-10">
                                                    <span>Politique Voyage : Conforme</span>
                                                    <span className="bg-emerald-500 text-slate-950 font-bold px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px]">Validé</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in space-y-3 sm:space-y-4">
                                            <div>
                                                <span className="text-[8px] sm:text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 sm:py-1 rounded border border-indigo-500/20">
                                                    Flux Actif : Avantages Sociaux
                                                </span>
                                                <h4 className="text-base sm:text-xl lg:text-2xl font-black text-white mt-1 sm:mt-2 tracking-tight">Service Gallery Digitale</h4>
                                            </div>
                                            
                                            <div className="mx-auto max-w-sm rounded-xl bg-slate-950/80 backdrop-blur-xl border border-white/10 p-3 sm:p-4 text-left shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                                                <div className="flex justify-between items-center mb-2 relative z-10">
                                                    <div className="h-1.5 w-12 sm:w-16 bg-indigo-500 rounded" />
                                                    <span className="text-[8px] sm:text-[10px] font-mono font-bold text-indigo-400">Allocation CSE Active</span>
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
            
            {/* ── MOBILE FALLBACK: Le Point d'Interrogation affiché sous le contenu sur mobile ── */}
            <div className="mt-12 sm:mt-16 lg:hidden flex flex-col items-center gap-3 relative z-10 px-4">
                <div className="flex items-end gap-2">
                    <div className="relative inline-block">
                        <img src="/images/question_mark-removebg-preview 1.png" alt="" className="h-36 w-28 sm:h-44 sm:w-34 object-contain drop-shadow-xl" />
                        <button type="button" onClick={() => setIsVideoOpen(true)} className="absolute left-1/2 top-1/2 flex h-12 w-12 sm:h-14 sm:w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white/90 text-indigo-600 shadow-xl backdrop-blur transition-colors hover:bg-indigo-600 hover:text-white" aria-label="Lire la vidéo de présentation">
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-emerald-500 text-white">
                                <span className="ml-0.5 text-xs sm:text-sm">▶</span>
                            </span>
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs sm:text-sm text-slate-500 max-w-xs">Vous vous posez des questions sur la gestion ? Nous avons les réponses unifiées.</p>
            </div>

            <style jsx global>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float { animation: float 4s ease-in-out infinite; }
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
            {/* Colonne SVG Illustration */}
            <div className={`lg:col-span-5 ${index % 2 === 1 ? "lg:order-2" : "lg:order-1"}`}>
                <div className="relative rounded-2xl bg-white p-4 border border-slate-200 shadow-lg overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="aspect-square w-full max-w-md mx-auto">
                        {step.svgIllustration}
                    </div>
                </div>
            </div>

            {/* Colonne Contenu */}
            <div className={`lg:col-span-7 ${index % 2 === 1 ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-indigo-600 to-emerald-500 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg">
                        {step.number}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{step.icon}</span>
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

                {/* Metrics Grid */}
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

                {/* Features List */}
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
                    <div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3">
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
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                        Excellence Opérationnelle
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Un processus fluide en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">4 étapes</span>
                    </h2>
                    <p className="mt-3 text-slate-500 max-w-md mx-auto">
                        De la configuration à l&apos;analyse, découvrez comment nous transformons votre gestion administrative
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
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r ${benefit.gradient} text-white text-xl sm:text-2xl flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                {benefit.icon}
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
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        Pourquoi nous choisir
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Des bénéfices <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">mesurables</span>
                    </h2>
                    <p className="mt-3 text-slate-500">
                        Des résultats concrets pour votre entreprise
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