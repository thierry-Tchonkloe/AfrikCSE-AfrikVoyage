// /src/components/infos-pages/AdvantagesSection.tsx
"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
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
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.advantagesSection">>;

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

const getAdvantages = (t: Translator): Advantage[] => ([
  {
    id: 1,
    icon: <Gift className="w-6 h-6" />,
    title: t("cseBenefitsPurchasingPower"),
    description: t("digitalGiftCardsPremium"),
    tag: t("csePremium"),
    color: "from-indigo-500 to-blue-600",
    gradient: "from-indigo-600/30 via-blue-500/20 to-transparent",
    stats: [
      { value: "30%", label: t("savings") },
      { value: "500+", label: "partenaires" }
    ],
    benefits: [t("digitalGiftCards"), t("premiumTicketing"), t("negotiatedExclusiveOffers")],
    category: "cse",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(99,102,241,0.2)"
  },
  {
    id: 2,
    icon: <Plane className="w-6 h-6" />,
    title: t("simplifiedBusinessTravel"),
    description: t("manageAllBusinessTrips"),
    tag: t("travel"),
    color: "from-emerald-500 to-teal-600",
    gradient: "from-emerald-600/30 via-teal-500/20 to-transparent",
    stats: [
      { value: "200+", label: "destinations" },
      { value: "24/7", label: "assistance" }
    ],
    benefits: [t("centralizedBooking"), t("noUpfrontCosts"), t("dedicatedAssistance")],
    category: "voyage",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(16,185,129,0.2)"
  },
  {
    id: 3,
    icon: <Smartphone className="w-6 h-6" />,
    title: t("mobileDigitalApp"),
    description: t("smoothDigitalExperience"),
    tag: t("digital"),
    color: "from-purple-500 to-pink-600",
    gradient: "from-purple-600/30 via-pink-500/20 to-transparent",
    stats: [
      { value: "4.8★", label: t("appRating") },
      { value: "100K+", label: "utilisateurs" }
    ],
    benefits: [t("mobileApp"), t("aiReceiptScanning"), t("pushNotifications")],
    category: "both",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(168,85,247,0.2)"
  },
  {
    id: 4,
    icon: <Hotel className="w-6 h-6" />,
    title: t("accommodationStays"),
    description: t("wideChoicePremium"),
    tag: t("accommodation"),
    color: "from-amber-500 to-orange-600",
    gradient: "from-amber-600/30 via-orange-500/20 to-transparent",
    stats: [
      { value: "50K+", label: t("hotels") },
      { value: "300+", label: "destinations" }
    ],
    benefits: [t("premiumHotels"), t("businessResidences"), t("negotiatedRates")],
    category: "voyage",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(245,158,11,0.2)"
  },
  {
    id: 5,
    icon: <Users className="w-6 h-6" />,
    title: t("personalizedExperience"),
    description: t("benefitsTailoredEachProfile"),
    tag: t("personalized"),
    color: "from-rose-500 to-red-600",
    gradient: "from-rose-600/30 via-red-500/20 to-transparent",
    stats: [
      { value: "100%", label: "personnalisable" },
      { value: "50+", label: t("categories") }
    ],
    benefits: [t("aiRecommendations"), t("personalizedProfiles"), t("continuousAdaptation")],
    category: "cse",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(244,63,94,0.2)"
  },
  {
    id: 6,
    icon: <Ticket className="w-6 h-6" />,
    title: t("leisureEntertainment"),
    description: t("accessThousandsDiscounted"),
    tag: t("leisure"),
    color: "from-cyan-500 to-blue-600",
    gradient: "from-cyan-600/30 via-blue-500/20 to-transparent",
    stats: [
      { value: "500K+", label: "offres" },
      { value: "98%", label: "couverture" }
    ],
    benefits: [t("cinemaShows"), t("themeParks"), t("exclusiveShopping")],
    category: "cse",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(6,182,212,0.2)"
  },
  {
    id: 7,
    icon: <Shield className="w-6 h-6" />,
    title: t("security247Assistance"),
    description: t("dedicatedAssistanceTravelers"),
    tag: t("security"),
    color: "from-slate-700 to-slate-900",
    gradient: "from-slate-800/30 via-slate-700/20 to-transparent",
    stats: [
      { value: "24/7", label: "assistance" },
      { value: "99.9%", label: t("availability") }
    ],
    benefits: [t("multichannelSupport"), t("secureData"), t("gdprCompliance")],
    category: "both",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(30,41,59,0.2)"
  },
  {
    id: 8,
    icon: <TrendingUp className="w-6 h-6" />,
    title: t("analyticsOptimization"),
    description: t("detailedReportsManageCse"),
    tag: t("analytics"),
    color: "from-emerald-500 to-cyan-600",
    gradient: "from-emerald-600/30 via-cyan-500/20 to-transparent",
    stats: [
      { value: "50+", label: t("kpis") },
      { value: "98%", label: t("accuracy") }
    ],
    benefits: [t("dashboards"), t("budgetForecasts"), t("continuousOptimization")],
    category: "both",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80",
    glowColor: "rgba(16,185,129,0.2)"
  }
]);

const getCategories = (t: Translator) => ([
  { id: "all", label: t("all"), icon: <Sparkles className="w-4 h-4" /> },
  { id: "cse", label: t("cse"), icon: <Gift className="w-4 h-4" /> },
  { id: "voyage", label: t("travel"), icon: <Plane className="w-4 h-4" /> },
  { id: "both", label: t("cseTravel"), icon: <Globe className="w-4 h-4" /> }
]);

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
  const t = useTranslations("infos.advantagesSection");
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
      case "cse": return { label: t("badgeCse"), color: "bg-indigo-100 text-indigo-700" };
      case "voyage": return { label: t("badgeTravel"), color: "bg-emerald-100 text-emerald-700" };
      case "both": return { label: t("badgeCseTravel"), color: "bg-purple-100 text-purple-700" };
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
              <span>{t("discover")}</span>
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
  const tr = useTranslations("infos.advantagesSection");
  const t = useTranslations("infos.advantagesSection");
  const advantages = useMemo(() => getAdvantages(t), [t]);
  const categories = useMemo(() => getCategories(t), [t]);
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
              {t("clubEmployesIntegrated")}
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
            {tr.rich("benefitsDesignedEmployees", { span1: (chunks) => <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">{chunks}</span> })}
          </h2>
          
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            {t("singlePlatformCombinesCse")}
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
              { value: "500K+", label: t("availableOffers"), icon: <ShoppingBag className="w-5 h-5" /> },
              { value: "200+", label: t("travelDestinations"), icon: <Globe className="w-5 h-5" /> },
              { value: "98%", label: t("satisfactionRate"), icon: <Award className="w-5 h-5" /> },
              { value: "24/7", label: t("dedicatedSupport"), icon: <Headphones className="w-5 h-5" /> }
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
              {t("readyTransformEmployees")}
            </span>
            <button className="px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg">
              {t("discoverSolution")}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}