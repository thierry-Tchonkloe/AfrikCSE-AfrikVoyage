// /src/components/infos-pages/ServicesSection.tsx
"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Plane, 
  Hotel, 
  Gift, 
  Ticket, 
  Briefcase, 
  Shield,
  Users,
  Smartphone,
  Sparkles,
  ChevronRight,
  Building2,
  Utensils,
  Car,
  Bus,
  Wifi,
  Coffee,
  Globe,
  Zap,
  Clock,
  Award,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  Headphones,
  CreditCard,
  Crown,
  Compass,
  Sun,
  Moon,
  Ship,
  Train,
  Bike,
  Camera,
  Music,
  ShoppingBag,
  Dumbbell,
  Film,
  Theater,
  Wine,
  Cake,
  Heart,
  Rocket
} from "lucide-react";
import { fadeInUp, scaleIn, staggerContainer } from "../styles/animations";

interface Service {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  longDescription: string;
  features: string[];
  benefits: string[];
  color: string;
  tag: string;
  category: "cse" | "voyage" | "both";
  stats: { label: string; value: string }[];
}

const services: Service[] = [
  {
    id: 1,
    icon: <Plane className="w-6 h-6" />,
    title: "Voyages d'affaires",
    description: "Gérez tous vos déplacements professionnels en une seule plateforme, sans avance de frais.",
    longDescription: "Une solution complète pour optimiser la gestion des voyages d'affaires de votre entreprise, de la réservation à la note de frais.",
    features: [
      "Réservation de vols et hôtels",
      "Gestion des transports locaux",
      "Suivi des dépenses en temps réel",
      "Politiques de voyage personnalisées",
      "Gestion des imprévus 24/7"
    ],
    benefits: [
      "Réduction des coûts jusqu'à 30%",
      "Gain de temps administratif",
      "Visibilité complète des dépenses"
    ],
    color: "from-indigo-500 to-blue-600",
    tag: "Voyages",
    category: "voyage",
    stats: [
      { label: "Économies", value: "-30%" },
      { label: "Villes couvertes", value: "200+" }
    ]
  },
  {
    id: 2,
    icon: <Gift className="w-6 h-6" />,
    title: "Avantages CSE Premium",
    description: "Offrez à vos collaborateurs un catalogue d'avantages exclusifs et personnalisés.",
    longDescription: "Une gamme complète d'avantages CSE pour fidéliser vos équipes et améliorer leur pouvoir d'achat.",
    features: [
      "Cartes cadeaux digitales",
      "Billetterie loisirs et culture",
      "Offres de réduction locales",
      "Gestion des crédits CSE",
      "Catalogue personnalisé"
    ],
    benefits: [
      "Augmentation de la satisfaction employés",
      "Fidélisation des talents",
      "Image employeur renforcée"
    ],
    color: "from-emerald-500 to-teal-600",
    tag: "CSE",
    category: "cse",
    stats: [
      { label: "Offres", value: "500K+" },
      { label: "Satisfaction", value: "98%" }
    ]
  },
  {
    id: 3,
    icon: <Hotel className="w-6 h-6" />,
    title: "Hébergement & Séjours",
    description: "Un large choix d'hébergements pour tous les budgets et tous les besoins.",
    longDescription: "Des solutions d'hébergement adaptées à tous les profils : voyages d'affaires, séminaires, ou escapades personnelles.",
    features: [
      "Hôtels 1 à 5 étoiles",
      "Appartements et résidences",
      "Séjours longue durée",
      "Offres corporate exclusives",
      "Réservation instantanée"
    ],
    benefits: [
      "Meilleurs tarifs négociés",
      "Large choix d'hébergements",
      "Réservation flexible"
    ],
    color: "from-purple-500 to-pink-600",
    tag: "Hébergement",
    category: "both",
    stats: [
      { label: "Hôtels", value: "50K+" },
      { label: "Destinations", value: "300+" }
    ]
  },
  {
    id: 4,
    icon: <Ticket className="w-6 h-6" />,
    title: "Loisirs & Divertissement",
    description: "Accédez à des milliers d'activités de loisirs à prix réduits.",
    longDescription: "Un catalogue exceptionnel d'activités pour tous les goûts : culture, sport, détente et découverte.",
    features: [
      "Cinéma et spectacles",
      "Parcs d'attractions",
      "Événements sportifs",
      "Activités culturelles",
      "Bons plans exclusifs"
    ],
    benefits: [
      "Économies jusqu'à 50%",
      "Activités pour toute la famille",
      "Découvertes culturelles"
    ],
    color: "from-amber-500 to-orange-600",
    tag: "Loisirs",
    category: "cse",
    stats: [
      { label: "Activités", value: "10K+" },
      { label: "Économies", value: "50%" }
    ]
  },
  {
    id: 5,
    icon: <Shield className="w-6 h-6" />,
    title: "Assistance & Sécurité",
    description: "Une assistance 24/7 pour vos voyageurs et une gestion sécurisée des données.",
    longDescription: "Une tranquillité d'esprit totale pour vos collaborateurs avec une assistance dédiée et une sécurité renforcée.",
    features: [
      "Assistance voyage 24/7",
      "Gestion des imprévus",
      "Sécurité des données",
      "Conformité RGPD",
      "Support multicanal"
    ],
    benefits: [
      "Sérénité pour les voyageurs",
      "Réactivité en cas d'urgence",
      "Conformité totale"
    ],
    color: "from-rose-500 to-red-600",
    tag: "Sécurité",
    category: "both",
    stats: [
      { label: "Disponibilité", value: "24/7" },
      { label: "SLA", value: "99.9%" }
    ]
  },
  {
    id: 6,
    icon: <Smartphone className="w-6 h-6" />,
    title: "Application Mobile",
    description: "Gérez tous vos avantages et réservations depuis votre smartphone.",
    longDescription: "Une expérience mobile fluide pour accéder à tous vos avantages et services en un clic.",
    features: [
      "Application iOS et Android",
      "Scan de reçus en temps réel",
      "Notifications push",
      "Offres géolocalisées",
      "Paiement mobile"
    ],
    benefits: [
      "Expérience utilisateur optimale",
      "Gestion en mobilité",
      "Accès instantané"
    ],
    color: "from-cyan-500 to-blue-600",
    tag: "Digital",
    category: "both",
    stats: [
      { label: "Téléchargements", value: "50K+" },
      { label: "Note", value: "4.8★" }
    ]
  },
  {
    id: 7,
    icon: <Users className="w-6 h-6" />,
    title: "Événements & Séminaires",
    description: "Organisez vos événements d'entreprise et séminaires en toute simplicité.",
    longDescription: "Une solution clé en main pour l'organisation de vos événements professionnels, du team building aux conférences.",
    features: [
      "Organisation de séminaires",
      "Team building",
      "Conférences et formations",
      "Gestion des participants",
      "Logistique événementielle"
    ],
    benefits: [
      "Gain de temps organisationnel",
      "Expériences mémorables",
      "Cohésion d'équipe renforcée"
    ],
    color: "from-violet-500 to-purple-600",
    tag: "Événements",
    category: "both",
    stats: [
      { label: "Événements", value: "1K+" },
      { label: "Participants", value: "50K+" }
    ]
  },
  {
    id: 8,
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Analytics & Reporting",
    description: "Des rapports détaillés pour piloter votre budget voyage et CSE.",
    longDescription: "Des données précises et des analyses approfondies pour optimiser vos décisions stratégiques.",
    features: [
      "Tableaux de bord personnalisés",
      "Analyse des dépenses",
      "KPI voyage et CSE",
      "Rapports automatisés",
      "Prévisions budgétaires"
    ],
    benefits: [
      "Décisions éclairées",
      "Optimisation budgétaire",
      "Visibilité complète"
    ],
    color: "from-emerald-500 to-teal-600",
    tag: "Analytics",
    category: "both",
    stats: [
      { label: "KPI", value: "50+" },
      { label: "Précision", value: "98%" }
    ]
  }
];

const categories = [
  { id: "all", label: "Tous les services", icon: <Sparkles className="w-4 h-4" /> },
  { id: "voyage", label: "Voyages", icon: <Plane className="w-4 h-4" /> },
  { id: "cse", label: "CSE", icon: <Gift className="w-4 h-4" /> },
  { id: "both", label: "Voyages & CSE", icon: <Globe className="w-4 h-4" /> }
];

export default function ServicesSection() {
  const [activeService, setActiveService] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.6, 1, 1, 0.6]);

  const filteredServices = activeCategory === "all" 
    ? services 
    : services.filter(s => s.category === activeCategory);

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "voyage": return "border-indigo-200 bg-indigo-50/50";
      case "cse": return "border-emerald-200 bg-emerald-50/50";
      case "both": return "border-purple-200 bg-purple-50/50";
      default: return "border-slate-200 bg-slate-50/50";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "voyage": return <Plane className="w-3 h-3" />;
      case "cse": return <Gift className="w-3 h-3" />;
      case "both": return <Globe className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Arrière-plan dynamique avec parallax */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY, opacity }}
      >
        {/* Gradient principal */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/80" />
        
        {/* Cercles décoratifs animés */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Dots pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #6366f1 2px, transparent 2px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Lignes ondulées décoratives */}
        <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.05]" viewBox="0 0 1440 320">
          <path fill="#6366f1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,181.3C960,160,1056,128,1152,138.7C1248,149,1344,203,1392,229.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête avec animation */}
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              transition: { duration: 3, repeat: Infinity }
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-4 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-[0.15em] bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              Découvrez notre écosystème
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            Des services uniques pour
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">
              Voyages & CSE
            </span>
          </h2>
          
          <p className="text-slate-500 text-lg font-medium max-w-3xl mx-auto">
            Une plateforme tout-en-un qui combine la gestion des avantages CSE et des voyages d'affaires pour une expérience optimale
          </p>

          {/* Indicateurs de confiance */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {[
              { icon: <Users className="w-4 h-4" />, label: "500+ entreprises" },
              { icon: <Globe className="w-4 h-4" />, label: "30 pays couverts" },
              { icon: <Clock className="w-4 h-4" />, label: "Support 24/7" },
              { icon: <Award className="w-4 h-4" />, label: "Prix de l'innovation" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm"
              >
                <span className="text-indigo-500">{item.icon}</span>
                {item.label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filtres par catégorie */}
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-200/50 scale-105"
                  : "bg-white/70 backdrop-blur-sm text-slate-600 hover:bg-white border border-slate-200 hover:border-indigo-300"
              }`}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              variants={scaleIn}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2 }
              }}
              className={`group relative bg-white rounded-3xl border-2 p-6 transition-all duration-300 cursor-pointer ${
                activeService === service.id 
                  ? 'border-indigo-400 shadow-2xl scale-[1.02]' 
                  : 'border-slate-200 shadow-lg hover:border-indigo-300 hover:shadow-xl'
              }`}
              onMouseEnter={() => {
                setActiveService(service.id);
                setHoveredCard(service.id);
              }}
              onMouseLeave={() => {
                setActiveService(null);
                setHoveredCard(null);
              }}
            >
              {/* Catégorie badge */}
              <div className="absolute -top-2.5 right-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getCategoryColor(service.category)}`}>
                  {getCategoryIcon(service.category)}
                  {service.category === "voyage" ? "Voyage" : service.category === "cse" ? "CSE" : "Mixte"}
                </span>
              </div>

              {/* Icône avec gradient animé */}
              <motion.div 
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg mb-4`}
                animate={hoveredCard === service.id ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {service.icon}
              </motion.div>

              <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                {service.title}
              </h3>
              
              <p className="text-slate-500 text-sm leading-relaxed">
                {service.description}
              </p>

              {/* Stats */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                {service.stats.map((stat, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div className="text-base font-black text-indigo-600">{stat.value}</div>
                    <div className="text-[10px] font-medium text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Features - s'affichent au survol */}
              <AnimatePresence>
                {activeService === service.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-slate-100"
                  >
                    <div className="space-y-2">
                      {service.features.slice(0, 4).map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Benefits */}
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-600 mb-1">✓ Avantages clés</p>
                      <div className="flex flex-wrap gap-2">
                        {service.benefits.map((benefit, i) => (
                          <span key={i} className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-full">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicateur d'expansion */}
              <motion.div 
                className="absolute bottom-4 right-4"
                animate={activeService === service.id ? { rotate: 180 } : { rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Message pour les services non filtrés */}
        {filteredServices.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-500">Aucun service dans cette catégorie</p>
          </motion.div>
        )}

        {/* Call to action amélioré */}
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="relative inline-block">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse" />
            
            <div className="relative bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full px-8 py-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Prêt à transformer votre entreprise ?
                </span>
                <div className="flex items-center gap-3">
                  <a 
                    href="#tarifs" 
                    className="px-6 py-2 bg-white text-indigo-600 rounded-full text-sm font-bold hover:scale-105 transition-transform duration-300 shadow-lg"
                  >
                    Découvrir nos offres
                  </a>
                  <a 
                    href="#contact" 
                    className="px-6 py-2 bg-transparent border-2 border-white/50 text-white rounded-full text-sm font-bold hover:bg-white/10 transition-all duration-300"
                  >
                    Contactez-nous
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pied de section avec marque de confiance */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-xs text-slate-400"
        >
          <span className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            Des milliers d'utilisateurs satisfaits
          </span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Sécurité et conformité assurées
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Support disponible 24/7
          </span>
        </motion.div>
      </div>
    </section>
  );
}