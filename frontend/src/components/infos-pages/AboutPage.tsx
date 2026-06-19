"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimation, useInView } from "framer-motion";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface TeamMember { 
    name: string; 
    role: string; 
    title: string; 
    description: string; 
    imageUrl?: string;
    linkedin?: string;
    country?: string;
}
interface Partner {
    name: string;
    logo: string;
    industry: string;
}
interface Office {
    city: string;
    country: string;
    region: string;
    coordinates: { x: number; y: number };
    since: string;
    color: string;
}

// ─── DONNÉES ──────────────────────────────────────────────────────────────────

// Membres de l'équipe
const teamMembers: TeamMember[] = [
    { name: "Amadou Diallo", role: "PDG & Fondateur", title: "PDG", description: "Ancien cadre chez Orange, il a piloté la transformation digitale de plusieurs entreprises africaines.", imageUrl: undefined, linkedin: "#", country: "Sénégal" },
    { name: "Fatima Benali", role: "Directrice Technique", title: "CTO", description: "Architecte logicielle experte en cloud et intelligence artificielle.", imageUrl: undefined, linkedin: "#", country: "Maroc" },
    { name: "Kwame Asante", role: "Directeur des Opérations", title: "COO", description: "Spécialiste en opérations internationales sur 15 pays africains.", imageUrl: undefined, linkedin: "#", country: "Ghana" },
    { name: "Aisha Kone", role: "Directrice Produit", title: "CPO", description: "Designer produit primée, experte en expérience utilisateur.", imageUrl: undefined, linkedin: "#", country: "Côte d'Ivoire" },
    { name: "Oumar Sylla", role: "Directeur Commercial", title: "Sales", description: "Expert en développement commercial en Afrique de l'Ouest.", imageUrl: undefined, linkedin: "#", country: "Guinée" },
    { name: "Nadia Bencheikh", role: "Directrice Produit", title: "Product", description: "Passionnée par l'innovation produit et les nouvelles technologies.", imageUrl: undefined, linkedin: "#", country: "Tunisie" },
    { name: "Jean Kambaji", role: "Directeur Technique", title: "Engineering", description: "Expert en infrastructure cloud et architecture scalable.", imageUrl: undefined, linkedin: "#", country: "République Démocratique du Congo" },
    { name: "Sophie Amoah", role: "Directrice Clientèle", title: "Success", description: "Dédiée à la satisfaction client et à l'accompagnement personnalisé.", imageUrl: undefined, linkedin: "#", country: "Ghana" },
];

// Partenaires stratégiques
const partners: Partner[] = [
    { name: "Air France-KLM", logo: "AF", industry: "Transport aérien" },
    { name: "Booking.com", logo: "BK", industry: "Hébergement" },
    { name: "SNCF", logo: "SN", industry: "Transport ferroviaire" },
    { name: "Orange", logo: "OR", industry: "Télécommunications" },
    { name: "Ecobank", logo: "EC", industry: "Banque" },
    { name: "TotalEnergies", logo: "TT", industry: "Énergie" },
    { name: "Microsoft", logo: "MS", industry: "Cloud" },
    { name: "Salesforce", logo: "SF", industry: "CRM" },
    { name: "SAP", logo: "SP", industry: "ERP" },
    { name: "Accor", logo: "AC", industry: "Hôtellerie" },
];

// Bureaux en Afrique avec coordonnées précises pour la carte
const offices: Office[] = [
    { city: "Dakar", country: "Sénégal", region: "Afrique de l'Ouest", coordinates: { x: 17, y: 38 }, since: "2024", color: "indigo" },
    { city: "Abidjan", country: "Côte d'Ivoire", region: "Afrique de l'Ouest", coordinates: { x: 22, y: 46 }, since: "2024", color: "emerald" },
    { city: "Lagos", country: "Nigéria", region: "Afrique de l'Ouest", coordinates: { x: 30, y: 50 }, since: "2025", color: "purple" },
    { city: "Douala", country: "Cameroun", region: "Afrique Centrale", coordinates: { x: 34, y: 54 }, since: "2025", color: "amber" },
    { city: "Nairobi", country: "Kenya", region: "Afrique de l'Est", coordinates: { x: 55, y: 60 }, since: "2025", color: "emerald" },
    { city: "Johannesburg", country: "Afrique du Sud", region: "Afrique Australe", coordinates: { x: 47, y: 80 }, since: "2026", color: "indigo" },
    { city: "Casablanca", country: "Maroc", region: "Afrique du Nord", coordinates: { x: 13, y: 24 }, since: "2025", color: "teal" },
];

// Timeline d'expansion
const expansionMilestones = [
    { year: "2024", title: "Lancement officiel", description: "Création de la plateforme à Dakar", color: "indigo", icon: "🚀" },
    { year: "Janvier 2025", title: "Premiers clients", description: "Signature des 10 premières entreprises", color: "emerald", icon: "🎯" },
    { year: "Mars 2025", title: "Expansion Afrique Ouest", description: "Ouverture à Abidjan et Lomé", color: "purple", icon: "🌍" },
    { year: "Juillet 2025", title: "Afrique Centrale", description: "Bureaux à Douala et Libreville", color: "amber", icon: "🏢" },
    { year: "Octobre 2025", title: "Afrique de l'Est", description: "Lancement à Nairobi", color: "emerald", icon: "🦁" },
    { year: "2026", title: "Objectif Afrique Australe", description: "Johannesburg et Luanda en vue", color: "indigo", icon: "⭐" },
];

// Valeurs
const values = [
    { icon: "💡", title: "Innovation", description: "Nous repoussons constamment les limites technologiques pour offrir des solutions toujours plus performantes.", color: "indigo" },
    { icon: "🛡️", title: "Confiance", description: "La sécurité des données et la conformité réglementaire sont au cœur de chacune de nos décisions.", color: "emerald" },
    { icon: "🏆", title: "Performance", description: "Nous mesurons notre succès par le retour sur investissement concret de nos clients.", color: "amber" },
    { icon: "🤝", title: "Proximité", description: "Une équipe locale à votre écoute, comprenant vos enjeux et votre culture.", color: "purple" },
    { icon: "🌱", title: "Durabilité", description: "Les enjeux RSE sont intégrés dans notre ADN pour un impact positif durable.", color: "emerald" },
    { icon: "⚡", title: "Agilité", description: "Des solutions qui s'adaptent rapidement à vos besoins et à l'évolution du marché.", color: "indigo" },
];

// Certifications
const certifications = [
    { name: "ISO 27001", description: "Sécurité des données", icon: "🔒", color: "indigo" },
    { name: "RGPD", description: "Conformité européenne", icon: "🇪🇺", color: "blue" },
    { name: "EcoVadis", description: "Performance RSE", icon: "🌱", color: "emerald" },
    { name: "FinTech Africa", description: "Label Innovation", icon: "🏆", color: "amber" },
];

// ─── COMPOSANTS ────────────────────────────────────────────────────────────────

// Hero Section - MODIFIÉE : Suppression des statistiques et centrage du contenu
function HeroSection() {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover"
                    poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format"
                >
                    <source src="/videos/bg-video1.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 mb-6"
                >
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-semibold text-indigo-700">Basé en Afrique · Rayonnement mondial</span>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6"
                    style={{ fontFamily: "Sanomat, ui-serif" }}
                >
                    L'architecte d'une gestion{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                        moderne
                    </span>
                    <br />
                    pour l'entreprise africaine
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10"
                >
                    Nous transformons la complexité administrative en avantage compétitif — en unifiant la gestion des voyages d'affaires et des services aux salariés sur une seule plateforme.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-wrap gap-4 justify-center"
                >
                    <Link href="#" className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all hover:scale-105 shadow-lg">
                        Découvrir notre histoire
                    </Link>
                    <Link href="#" className="px-8 py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        Rencontrer l'équipe
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

// Stats Section avec animation dynamique
function StatsSection() {
    const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (!isInView) return;
        const targets = [528, 54, 96, 31];
        const duration = 2000;
        const startTime = Date.now();
        const animate = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            setAnimatedValues([
                Math.floor(progress * targets[0]),
                Math.floor(progress * targets[1]),
                Math.floor(progress * targets[2]),
                Math.floor(progress * targets[3]),
            ]);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isInView]);

    return (
        <section ref={ref} className="py-20 bg-gradient-to-r from-indigo-600 to-emerald-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center text-white">
                        <div className="text-4xl font-black mb-2">{animatedValues[0]}</div>
                        <div className="text-sm opacity-90">Entreprises clientes</div>
                        <div className="text-xs text-indigo-200 mt-1">+28% en 2025</div>
                    </div>
                    <div className="text-center text-white">
                        <div className="text-4xl font-black mb-2">{animatedValues[1]}</div>
                        <div className="text-sm opacity-90">Pays couverts</div>
                        <div className="text-xs text-indigo-200 mt-1">3 continents</div>
                    </div>
                    <div className="text-center text-white">
                        <div className="text-4xl font-black mb-2">{animatedValues[2]}%</div>
                        <div className="text-sm opacity-90">Taux d'adoption</div>
                        <div className="text-xs text-indigo-200 mt-1">+12% vs objectif</div>
                    </div>
                    <div className="text-center text-white">
                        <div className="text-4xl font-black mb-2">-{animatedValues[3]}%</div>
                        <div className="text-sm opacity-90">Réduction des coûts</div>
                        <div className="text-xs text-indigo-200 mt-1">moyenne par client</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Section Mission
function MissionSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    return (
        <section ref={ref} className="py-24 bg-white">
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
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Notre mission
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Sanomat, ui-serif" }}>
                            Transformer le chaos en{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                                performance mesurable
                            </span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Nous libérons les équipes des ressources humaines et financières des tâches administratives pour qu'elles se concentrent sur l'essentiel.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🎯</div>
                            <h3 className="font-bold text-slate-800 mb-2">Notre vision</h3>
                            <p className="text-sm text-slate-500">Devenir la plateforme de référence pour la gestion d'entreprise en Afrique.</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✨</div>
                            <h3 className="font-bold text-slate-800 mb-2">Notre promesse</h3>
                            <p className="text-sm text-slate-500">Unifier déplacements professionnels et avantages sociaux en une seule interface.</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🤝</div>
                            <h3 className="font-bold text-slate-800 mb-2">Notre engagement</h3>
                            <p className="text-sm text-slate-500">Accompagner nos clients dans leur transformation digitale.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// Carte d'Afrique avec vraie image
function AfricaMapSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    const [hoveredOffice, setHoveredOffice] = useState<Office | null>(null);

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    return (
        <section ref={ref} className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Notre présence
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Sanomat, ui-serif" }}>
                            Ancrage africain,{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                                rayonnement mondial
                            </span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            7 bureaux stratégiques à travers l'Afrique, avec une équipe dédiée dans chaque région
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Carte d'Afrique avec vraie image */}
                        <motion.div variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }} className="relative">
                            <div className="rounded-2xl overflow-hidden shadow-2xl relative">
                                <img 
                                    src="/images/carte-d'afrique.jpeg" 
                                    alt="Carte de l'Afrique"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20" />
                                
                                {/* Points de présence sur la carte */}
                                {offices.map((office, idx) => (
                                    <div
                                        key={idx}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                                        style={{ left: `${office.coordinates.x}%`, top: `${office.coordinates.y}%` }}
                                        onMouseEnter={() => setHoveredOffice(office)}
                                        onMouseLeave={() => setHoveredOffice(null)}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-${office.color === 'indigo' ? 'indigo-500' : office.color === 'emerald' ? 'emerald-500' : office.color === 'purple' ? 'purple-500' : 'amber-500'} shadow-lg animate-pulse`}>
                                            <div className={`absolute -inset-1 rounded-full bg-${office.color === 'indigo' ? 'indigo-500' : office.color === 'emerald' ? 'emerald-500' : office.color === 'purple' ? 'purple-500' : 'amber-500'}/30 animate-ping`} />
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white rounded-lg shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-indigo-200">
                                            <div className="font-bold text-slate-800">{office.city}</div>
                                            <div className="text-slate-500 text-[10px]">{office.country}</div>
                                            <div className="text-indigo-600 text-[10px]">Depuis {office.since}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Légende */}
                            <div className="mt-4 flex flex-wrap justify-center gap-4">
                                {offices.slice(0, 4).map((office, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                        <div className={`w-3 h-3 rounded-full bg-${office.color === 'indigo' ? 'indigo' : office.color === 'emerald' ? 'emerald' : office.color === 'purple' ? 'purple' : 'amber'}-500`} />
                                        <span className="text-slate-600">{office.region}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Timeline */}
                        <div>
                            <div className="space-y-4 mb-8">
                                {expansionMilestones.map((milestone, idx) => (
                                    <motion.div
                                        key={idx}
                                        variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: idx * 0.1 } } }}
                                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-white transition-all group cursor-pointer"
                                    >
                                        <div className={`w-12 h-12 rounded-full bg-${milestone.color}-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform`}>
                                            {milestone.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-bold text-${milestone.color}-600`}>{milestone.year}</span>
                                                <span className="text-sm font-semibold text-slate-800">{milestone.title}</span>
                                            </div>
                                            <p className="text-sm text-slate-500">{milestone.description}</p>
                                            <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`w-0 h-full bg-${milestone.color}-500 rounded-full group-hover:w-full transition-all duration-700`} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Certifications */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-lg">🏅</span>
                                    <h3 className="font-bold text-slate-800">Certifications & Labels</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {certifications.map((cert, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="text-2xl">{cert.icon}</div>
                                            <div>
                                                <div className="font-semibold text-slate-800 text-sm">{cert.name}</div>
                                                <div className="text-xs text-slate-500">{cert.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// Section Valeurs
function ValuesSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    return (
        <section ref={ref} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Nos valeurs
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Sanomat, ui-serif" }}>
                            Des principes qui nous{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                                guident
                            </span>
                        </h2>
                        <p className="text-slate-500 text-lg">
                            L'humain, la confiance et l'innovation au cœur de notre action
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((value, idx) => (
                            <motion.div
                                key={idx}
                                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.05 } } }}
                                whileHover={{ y: -5 }}
                                className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all group"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-${value.color}-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-${value.color}-100 transition-all`}>
                                    {value.icon}
                                </div>
                                <h3 className={`text-lg font-bold text-slate-800 mb-2 group-hover:text-${value.color}-600 transition-colors`}>
                                    {value.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// Section Équipe - avec textes en français
function TeamSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const getAvatarColor = (name: string) => {
        const colors = ["bg-indigo-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-teal-500"];
        return colors[name.length % colors.length];
    };

    return (
        <section ref={ref} className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Rencontrez l'équipe
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Sanomat, ui-serif" }}>
                            Des talents <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">passionnés</span>
                        </h2>
                        <p className="text-slate-500 text-lg">
                            Plus de 15 talents répartis sur 3 continents, unis par une vision commune
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member, idx) => (
                            <motion.div
                                key={idx}
                                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.05 } } }}
                                whileHover={{ y: -8 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group border border-slate-100"
                            >
                                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-indigo-100 to-emerald-100">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className={`w-32 h-32 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
                                            {getInitials(member.name)}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-white/80">{member.country}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                                </svg>
                                            </div>
                                            <span className="text-white text-sm font-semibold">{member.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="mb-2">
                                        <span className="text-xs font-bold text-indigo-600">{member.role}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{member.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
                            <div className="text-3xl font-black text-indigo-600 mb-2">12+</div>
                            <p className="text-sm text-slate-600">Nationalités représentées</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
                            <div className="text-3xl font-black text-emerald-600 mb-2">45+</div>
                            <p className="text-sm text-slate-600">Années d'expérience cumulées</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
                            <div className="text-3xl font-black text-amber-600 mb-2">95%</div>
                            <p className="text-sm text-slate-600">Diplômés de grandes écoles</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// Section Partenaires - Carrousel défilant horizontalement
function PartnersSection() {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    // Dupliquer les partenaires pour un défilement infini
    const duplicatedPartners = [...partners, ...partners, ...partners];

    return (
        <section ref={ref} className="py-16 bg-white border-y border-slate-200 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5 } }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="text-center max-w-3xl mx-auto mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Ils nous font confiance
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Sanomat, ui-serif" }}>
                            Nos partenaires stratégiques
                        </h2>
                        <p className="text-slate-500 text-base">
                            Des leaders mondiaux qui nous accompagnent dans notre croissance
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Carrousel défilant */}
            <div className="relative w-full overflow-hidden">
                <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                
                <motion.div 
                    className="flex gap-8 py-4"
                    animate={{ x: [0, -1800] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                    {duplicatedPartners.map((partner, idx) => (
                        <div
                            key={idx}
                            className="flex-shrink-0 w-40 bg-slate-50 rounded-xl p-4 text-center border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer"
                        >
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all shadow-sm">
                                {partner.logo}
                            </div>
                            <div className="font-semibold text-slate-800 text-sm">{partner.name}</div>
                            <div className="text-xs text-slate-400 mt-1">{partner.industry}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// PAGE PRINCIPALE
export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            <HeroSection />
            <StatsSection />
            <MissionSection />
            <AfricaMapSection />
            <ValuesSection />
            <TeamSection />
            <PartnersSection />
        </main>
    );
}