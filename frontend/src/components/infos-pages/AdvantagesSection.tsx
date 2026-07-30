// /src/components/infos-pages/AdvantagesSection.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Ticket, 
  Smartphone, 
  Users, 
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Film,
  Dumbbell,
  MapPin,
  Shield,
  Clock,
  Award,
  Rocket,
  Globe,
  BadgeCheck,
  ArrowUpRight,
  CircleCheck,
  Plane,
  Hotel,
  Briefcase,
  CreditCard,
  Headphones,
  Calendar,
  Compass,
  TrendingUp,
  Zap,
  Star,
  Crown,
  Building2,
  Luggage,
  Coffee,
  Wifi,
  Car,
  Bus,
  Train,
  Ship,
  Mountain,
  Sun,
  Umbrella,
  Camera,
  Music,
  Theater,
  Utensils,
  Wine,
  Cake,
  Heart,
  Gem as GemIcon
} from "lucide-react";
import { fadeInUp, scaleIn, floatAnimation } from "../styles/animations";

interface Advantage {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  color: string;
  gradient: string;
  stats: { value: string; label: string }[];
  benefits: string[];
  category: "cse" | "voyage" | "both";
  image: string;
  glowColor: string;
}

const advantages: Advantage[] = [
  {
    id: 1,
    icon: <Gift className="w-6 h-6" />,
    title: "Avantages CSE & Pouvoir d'achat",
    description: "Cartes cadeaux digitales, billetterie premium et offres négociées pour maximiser le pouvoir d'achat de vos salariés.",
    tag: "CSE Premium",
    color: "from-indigo-500 to-blue-600",
    gradient: "from-indigo-600/30 via-blue-500/20 to-transparent",
    stats: [
      { value: "30%", label: "d'économies" },
      { value: "500+", label: "partenaires" }
    ],
    benefits: ["Cartes cadeaux digitales", "Billetterie premium", "Offres exclusives négociées"],
    category: "cse",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(99,102,241,0.2)"
  },
  {
    id: 2,
    icon: <Plane className="w-6 h-6" />,
    title: "Voyages d'affaires simplifiés",
    description: "Gérez tous vos déplacements professionnels sans avance de frais avec une plateforme centralisée et intuitive.",
    tag: "Voyages",
    color: "from-emerald-500 to-teal-600",
    gradient: "from-emerald-600/30 via-teal-500/20 to-transparent",
    stats: [
      { value: "200+", label: "destinations" },
      { value: "24/7", label: "assistance" }
    ],
    benefits: ["Réservation centralisée", "Sans avance de frais", "Assistance dédiée"],
    category: "voyage",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(16,185,129,0.2)"
  },
  {
    id: 3,
    icon: <Smartphone className="w-6 h-6" />,
    title: "Application Mobile & Digital",
    description: "Une expérience digitale fluide pour accéder à tous vos avantages CSE et réservations voyage en un clic.",
    tag: "Digital",
    color: "from-purple-500 to-pink-600",
    gradient: "from-purple-600/30 via-pink-500/20 to-transparent",
    stats: [
      { value: "4.8★", label: "note app" },
      { value: "100K+", label: "utilisateurs" }
    ],
    benefits: ["Application mobile", "Scan de reçus IA", "Notifications push"],
    category: "both",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(168,85,247,0.2)"
  },
  {
    id: 4,
    icon: <Hotel className="w-6 h-6" />,
    title: "Hébergement & Séjours",
    description: "Un large choix d'hébergements premium avec des tarifs négociés pour vos voyages d'affaires et séjours personnels.",
    tag: "Hébergement",
    color: "from-amber-500 to-orange-600",
    gradient: "from-amber-600/30 via-orange-500/20 to-transparent",
    stats: [
      { value: "50K+", label: "hôtels" },
      { value: "300+", label: "destinations" }
    ],
    benefits: ["Hôtels premium", "Résidences d'affaires", "Tarifs négociés"],
    category: "voyage",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(245,158,11,0.2)"
  },
  {
    id: 5,
    icon: <Users className="w-6 h-6" />,
    title: "Expérience Personnalisée",
    description: "Des avantages adaptés à chaque profil avec des recommandations intelligentes pour les loisirs, la culture et le sport.",
    tag: "Personnalisé",
    color: "from-rose-500 to-red-600",
    gradient: "from-rose-600/30 via-red-500/20 to-transparent",
    stats: [
      { value: "100%", label: "personnalisable" },
      { value: "50+", label: "catégories" }
    ],
    benefits: ["Recommandations IA", "Profils personnalisés", "Adaptation continue"],
    category: "cse",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(244,63,94,0.2)"
  },
  {
    id: 6,
    icon: <Ticket className="w-6 h-6" />,
    title: "Loisirs & Divertissement",
    description: "Accédez à des milliers d'activités de loisirs à prix réduits : cinéma, parcs, concerts, sport et shopping.",
    tag: "Loisirs",
    color: "from-cyan-500 to-blue-600",
    gradient: "from-cyan-600/30 via-blue-500/20 to-transparent",
    stats: [
      { value: "500K+", label: "offres" },
      { value: "98%", label: "couverture" }
    ],
    benefits: ["Cinéma & spectacles", "Parcs d'attractions", "Shopping exclusif"],
    category: "cse",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(6,182,212,0.2)"
  },
  {
    id: 7,
    icon: <Shield className="w-6 h-6" />,
    title: "Sécurité & Assistance 24/7",
    description: "Une assistance dédiée pour vos voyageurs et une sécurité maximale pour vos données et transactions.",
    tag: "Sécurité",
    color: "from-slate-700 to-slate-900",
    gradient: "from-slate-800/30 via-slate-700/20 to-transparent",
    stats: [
      { value: "24/7", label: "assistance" },
      { value: "99.9%", label: "disponibilité" }
    ],
    benefits: ["Support multicanal", "Données sécurisées", "Conformité RGPD"],
    category: "both",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(30,41,59,0.2)"
  },
  {
    id: 8,
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Analytics & Optimisation",
    description: "Des rapports détaillés pour piloter votre budget CSE et voyages avec des indicateurs de performance avancés.",
    tag: "Analytics",
    color: "from-emerald-500 to-cyan-600",
    gradient: "from-emerald-600/30 via-cyan-500/20 to-transparent",
    stats: [
      { value: "50+", label: "KPI" },
      { value: "98%", label: "précision" }
    ],
    benefits: ["Tableaux de bord", "Prévisions budgétaires", "Optimisation continue"],
    category: "both",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(16,185,129,0.2)"
  }
];

const categories = [
  { id: "all", label: "Tous", icon: <Sparkles className="w-4 h-4" /> },
  { id: "cse", label: "CSE", icon: <Gift className="w-4 h-4" /> },
  { id: "voyage", label: "Voyages", icon: <Plane className="w-4 h-4" /> },
  { id: "both", label: "CSE & Voyages", icon: <Globe className="w-4 h-4" /> }
];

// Composant pour une carte d'avantage avec image de fond
const AdvantageCard = ({ 
  advantage, 
  index, 
  isActive, 
  onHover,
  onSelect 
}: { 
  advantage: Advantage; 
  index: number; 
  isActive: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = advantage.image;
    img.onload = () => setImageLoaded(true);
  }, [advantage.image]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const getCategoryBadge = () => {
    switch(advantage.category) {
      case "cse": return { label: "CSE", color: "bg-indigo-100 text-indigo-700" };
      case "voyage": return { label: "Voyage", color: "bg-emerald-100 text-emerald-700" };
      case "both": return { label: "CSE & Voyage", color: "bg-purple-100 text-purple-700" };
    }
  };

  const badge = getCategoryBadge();

  return (
    <motion.div
      ref={cardRef}
      variants={scaleIn}
      custom={index}
      onMouseEnter={() => onHover(advantage.id)}
      onMouseLeave={() => onHover(null)}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(advantage.id)}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2, type: "spring", stiffness: 300 }
      }}
      className="relative group cursor-pointer"
      style={{
        perspective: "1000px"
      }}
    >
      <motion.div
        className="relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
        style={{
          transform: isActive 
            ? `rotateX(${mousePosition.y * -6}deg) rotateY(${mousePosition.x * 6}deg)`
            : "rotateX(0deg) rotateY(0deg)",
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out"
        }}
      >
        {/* Image de fond */}
        <div className="absolute inset-0 w-full h-full">
          <div 
            className={`w-full h-full bg-cover bg-center transition-all duration-700 ${
              imageLoaded ? 'scale-100' : 'scale-110'
            }`}
            style={{ backgroundImage: `url(${advantage.image})` }}
          />
          {/* Overlay avec gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${advantage.gradient} backdrop-blur-[2px]`} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/20" />
        </div>

        {/* Glow effect au survol */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at ${50 + mousePosition.x * 30}% ${50 + mousePosition.y * 30}%, ${advantage.glowColor}, transparent 70%)`,
          }}
        />

        {/* Contenu */}
        <div className="relative p-8 min-h-[380px] flex flex-col justify-between">
          {/* Badge catégorie */}
          <div className="flex items-start justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.color} border border-white/20 backdrop-blur-sm`}>
              {badge.label}
            </span>
            
            {/* Icône avec effet */}
            <motion.div 
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${advantage.color} flex items-center justify-center text-white shadow-lg backdrop-blur-sm border border-white/20`}
              whileHover={{ 
                scale: 1.15,
                rotate: [0, -8, 8, 0],
                transition: { duration: 0.4 }
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {advantage.icon}
            </motion.div>
          </div>

          {/* Stats flottantes */}
          <div className="flex gap-3 mt-2">
            {advantage.stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <div className="text-lg font-black text-white">{stat.value}</div>
                <div className="text-[9px] font-medium text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Titre et description */}
          <div className="mt-auto">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-indigo-300 to-emerald-300 transition-all duration-300">
              {advantage.title}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
              {advantage.description}
            </p>

            {/* Benefits - s'affichent au survol */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="space-y-1.5">
                    {advantage.benefits.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-2 text-sm text-white/80"
                      >
                        <CircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        {benefit}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton d'action */}
            <motion.div 
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
              whileHover={{ x: 8 }}
            >
              <span>Découvrir</span>
              <ArrowUpRight className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Indicateur de sélection */}
          <div className="absolute bottom-4 right-4">
            <motion.div 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-white/30'
              }`}
              animate={isActive ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Bordure lumineuse */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(135deg, ${advantage.glowColor}, transparent 50%, ${advantage.glowColor})`,
              padding: "2px",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function AdvantagesSection() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);

  const filteredAdvantages = selectedCategory === "all" 
    ? advantages 
    : advantages.filter(a => a.category === selectedCategory || (selectedCategory === "both" && a.category === "both"));

  return (
    <section 
      ref={sectionRef}
      className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-900"
    >
      {/* Arrière-plan dynamique */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY, opacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-emerald-950/80" />
        
        {/* Cercles flous lumineux */}
        <motion.div 
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        />

        {/* Grille */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-4xl mx-auto mb-12"
        >
          <motion.div 
            variants={floatAnimation}
            animate="animate"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-[0.15em] text-white/80">
              Club Employés • Solution Intégrée
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
            Des avantages pensés pour
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              vos salariés & voyageurs
            </span>
          </h2>
          
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            Une plateforme unique qui combine les avantages CSE et la gestion des voyages d'affaires pour une expérience optimale
          </p>

          {/* Filtres */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-white/10 backdrop-blur-sm text-slate-300 hover:bg-white/20 border border-white/10"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grille d'avantages */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredAdvantages.map((adv, idx) => (
            <AdvantageCard
              key={adv.id}
              advantage={adv}
              index={idx}
              isActive={activeCard === adv.id}
              onHover={setActiveCard}
              onSelect={() => setSelectedCard(selectedCard === adv.id ? null : adv.id)}
            />
          ))}
        </motion.div>

        {/* Statistiques */}
        <motion.div 
          variants={fadeInUp}
          className="mt-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8">
            {[
              { value: "500K+", label: "Offres disponibles", icon: <ShoppingBag className="w-5 h-5" /> },
              { value: "200+", label: "Destinations voyage", icon: <Globe className="w-5 h-5" /> },
              { value: "98%", label: "Taux de satisfaction", icon: <Award className="w-5 h-5" /> },
              { value: "24/7", label: "Support dédié", icon: <Headphones className="w-5 h-5" /> }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, y: -4 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-2xl font-black text-white">
                  <span className="text-indigo-400">{stat.icon}</span>
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <motion.div
            className="inline-flex items-center gap-6 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full px-8 py-4 shadow-2xl shadow-indigo-500/25"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-white font-bold flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Prêt à transformer l'expérience de vos salariés ?
            </span>
            <button className="px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg">
              Découvrir la solution
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}