// /src/components/infos-pages/AdvantagesSection.tsx
"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Ticket, 
  Smartphone, 
  Users, 
  ChevronRight,
  Star,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Film,
  Dumbbell,
  MapPin,
  Crown,
  Zap,
  Shield,
  Clock,
  Award,
  Heart,
  Rocket,
  Globe,
  Coffee,
  Sun,
  Moon,
  PartyPopper,
  BadgeCheck,
  ArrowUpRight,
  CircleCheck,
  Gem,
  Flame,
  Compass
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
  emoji: string;
  glowColor: string;
}

const advantages: Advantage[] = [
  {
    id: 1,
    icon: <Gift className="w-6 h-6" />,
    title: "Plus de pouvoir d'achat toute l'année",
    description: "Cartes cadeaux, billetterie CSE et offres négociées permettent aux salariés de faire des économies sur leurs loisirs, achats et vacances.",
    tag: "Économies",
    color: "from-indigo-500 to-blue-600",
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
    stats: [
      { value: "30%", label: "d'économies" },
      { value: "500+", label: "partenaires" }
    ],
    benefits: ["Cartes cadeaux digitales", "Billetterie premium", "Offres exclusives"],
    emoji: "🎁",
    glowColor: "rgba(99,102,241,0.15)"
  },
  {
    id: 2,
    icon: <Ticket className="w-6 h-6" />,
    title: "Des milliers d'offres de réduction locales et nationales",
    description: "Cinéma, parcs, concerts, sport ou shopping : chacun accède à un large catalogue d'offres à prix réduits.",
    tag: "Offres",
    color: "from-emerald-500 to-teal-600",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    stats: [
      { value: "500K+", label: "offres" },
      { value: "98%", label: "couverture" }
    ],
    benefits: ["Cinéma & spectacles", "Parcs d'attractions", "Shopping & loisirs"],
    emoji: "🎟️",
    glowColor: "rgba(16,185,129,0.15)"
  },
  {
    id: 3,
    icon: <Smartphone className="w-6 h-6" />,
    title: "Une expérience digitale simple et intuitive",
    description: "Les salariés consultent leurs offres et utilisent leurs avantages facilement depuis leur ordinateur ou leur smartphone.",
    tag: "Digital",
    color: "from-purple-500 to-pink-600",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    stats: [
      { value: "4.8★", label: "note app" },
      { value: "100K+", label: "utilisateurs" }
    ],
    benefits: ["Application mobile", "Interface fluide", "Accès instantané"],
    emoji: "📱",
    glowColor: "rgba(168,85,247,0.15)"
  },
  {
    id: 4,
    icon: <Users className="w-6 h-6" />,
    title: "Des avantages adaptés à tous les profils",
    description: "Loisirs, culture, vacances, shopping ou sport : chaque salarié profite des avantages qui lui correspondent.",
    tag: "Personnalisé",
    color: "from-amber-500 to-orange-600",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    stats: [
      { value: "100%", label: "personnalisable" },
      { value: "50+", label: "catégories" }
    ],
    benefits: ["Profils personnalisés", "Recommandations IA", "Adaptation continue"],
    emoji: "🎯",
    glowColor: "rgba(245,158,11,0.15)"
  }
];

// Composant pour une carte d'avantage améliorée
const AdvantageCard = ({ advantage, index, isActive, onHover }: { 
  advantage: Advantage; 
  index: number; 
  isActive: boolean;
  onHover: (id: number | null) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      variants={scaleIn}
      custom={index}
      onMouseEnter={() => onHover(advantage.id)}
      onMouseLeave={() => onHover(null)}
      onMouseMove={handleMouseMove}
      whileHover={{ 
        y: -12,
        transition: { duration: 0.2, type: "spring", stiffness: 300 }
      }}
      className="relative group"
      style={{
        perspective: "1000px"
      }}
    >
      <motion.div
        className="relative bg-white rounded-3xl border border-slate-200 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
        style={{
          transform: isActive 
            ? `rotateX(${mousePosition.y * -8}deg) rotateY(${mousePosition.x * 8}deg)`
            : "rotateX(0deg) rotateY(0deg)",
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out"
        }}
      >
        {/* Glow effect au survol */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at ${50 + mousePosition.x * 30}% ${50 + mousePosition.y * 30}%, ${advantage.glowColor}, transparent 70%)`,
          }}
        />

        {/* Badge avec animation */}
        <motion.div 
          className="absolute -top-3 right-6 z-10"
          whileHover={{ scale: 1.1 }}
        >
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 shadow-sm">
            <Sparkles className="w-3 h-3" />
            {advantage.tag}
          </span>
        </motion.div>

        {/* Emoji flottant */}
        <motion.div
          className="absolute -top-4 -left-4 text-4xl opacity-10 group-hover:opacity-20 transition-opacity"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {advantage.emoji}
        </motion.div>

        {/* Icône avec effet 3D */}
        <motion.div 
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${advantage.color} flex items-center justify-center text-white shadow-lg mb-5 relative`}
          whileHover={{ 
            scale: 1.15,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.3 }
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {advantage.icon}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/20"
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Titre avec gradient au survol */}
        <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300">
          {advantage.title}
        </h3>
        
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          {advantage.description}
        </p>

        {/* Stats avec animation */}
        <div className="flex gap-4 mb-4">
          {advantage.stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center border border-slate-100"
              whileHover={{ scale: 1.05, backgroundColor: "#f0f4ff" }}
            >
              <div className="text-lg font-black text-indigo-600">{stat.value}</div>
              <div className="text-[10px] font-medium text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Benefits avec animation d'apparition */}
        <motion.div 
          className="space-y-1.5 mb-4"
          initial={false}
        >
          {advantage.benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              {benefit}
            </motion.div>
          ))}
        </motion.div>

        {/* Bouton "En savoir plus" avec effet */}
        <motion.div 
          className="mt-2 flex items-center gap-2 text-sm font-semibold text-indigo-500"
          whileHover={{ x: 8 }}
        >
          <span>En savoir plus</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Effet de bordure lumineuse au survol */}
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
      </motion.div>
    </motion.div>
  );
};

export default function AdvantagesSection() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);

  return (
    <section 
      ref={sectionRef}
      className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Arrière-plan dynamique */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY, opacity }}
      >
        {/* Gradient de fond */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/80" />
        
        {/* Cercles flous animés */}
        <motion.div 
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 25, repeat: Infinity, delay: 4 }}
        />

        {/* Grille de points */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #6366f1 2px, transparent 2px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Vagues décoratives */}
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-[0.04]" viewBox="0 0 1440 320">
          <path fill="#6366f1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,181.3C960,160,1056,128,1152,138.7C1248,149,1344,203,1392,229.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>

        {/* Particules flottantes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.2
            }}
            animate={{
              y: [0, -30 - Math.random() * 50, 0],
              x: [0, 10 - Math.random() * 20, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête amélioré */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <motion.div 
            variants={floatAnimation}
            animate="animate"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200 rounded-full px-5 py-2 mb-4 shadow-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </motion.div>
            <span className="text-xs font-black uppercase tracking-[0.15em] bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              Club Employés • Solution CSE
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            Les avantages de notre
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">
              solution CSE
            </span>
          </h2>
          
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Offrez à vos salariés une expérience unique avec des avantages pensés pour leur quotidien
          </p>

          {/* Indicateurs de confiance */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { icon: <BadgeCheck className="w-4 h-4" />, label: "100% digital" },
              { icon: <Shield className="w-4 h-4" />, label: "Sécurisé" },
              { icon: <Clock className="w-4 h-4" />, label: "Disponible 24/7" },
              { icon: <Award className="w-4 h-4" />, label: "Prix de l'innovation" }
            ].map((item, idx) => (
              <span 
                key={idx}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
              >
                <span className="text-indigo-500">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Grille d'avantages améliorée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {advantages.map((adv, idx) => (
            <AdvantageCard
              key={adv.id}
              advantage={adv}
              index={idx}
              isActive={activeCard === adv.id}
              onHover={setActiveCard}
            />
          ))}
        </div>

        {/* Statistiques avec effet woah */}
        <motion.div 
          variants={fadeInUp}
          className="mt-20 relative"
        >
          {/* Fond avec effet de verre */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-emerald-500/5 to-transparent rounded-3xl blur-xl" />
          
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 p-8 shadow-xl">
            {[
              { 
                value: "500K+", 
                label: "Offres disponibles",
                icon: <ShoppingBag className="w-5 h-5" />,
                color: "from-indigo-500 to-blue-600"
              },
              { 
                value: "98%", 
                label: "Couverture nationale",
                icon: <MapPin className="w-5 h-5" />,
                color: "from-emerald-500 to-teal-600"
              },
              { 
                value: "500+", 
                label: "Parcs de loisirs",
                icon: <Film className="w-5 h-5" />,
                color: "from-purple-500 to-pink-600"
              },
              { 
                value: "3K+", 
                label: "Salles de sport",
                icon: <Dumbbell className="w-5 h-5" />,
                color: "from-amber-500 to-orange-600"
              }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ 
                  scale: 1.08,
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                className="text-center group cursor-pointer"
              >
                <motion.div 
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {stat.icon}
                </motion.div>
                <motion.div 
                  className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-xs font-medium text-slate-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to action flottant */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <motion.div
            className="inline-flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full px-6 py-3 shadow-2xl shadow-indigo-200/50"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Prêt à transformer l'expérience de vos salariés ?
            </span>
            <button className="px-5 py-2 bg-white text-indigo-600 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg">
              Découvrir
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}