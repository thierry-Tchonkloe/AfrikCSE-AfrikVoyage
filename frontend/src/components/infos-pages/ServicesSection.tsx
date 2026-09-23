// /src/components/infos-pages/ServicesSection.tsx
"use client";

import React, { useState, useRef, useMemo } from "react";
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
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.servicesSection">>;

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

const getServices = (t: Translator): Service[] => ([
  {
    id: 1,
    icon: <Plane className="w-6 h-6" />,
    title: t("businessTravel"),
    description: t("manageAllBusinessTrips"),
    longDescription: t("completeSolutionOptimize"),
    features: [
      t("flightHotelBooking"),
      t("localTransportManagement"),
      t("realTimeExpenseTracking"),
      t("customizedTravelPolicies"),
      t("text247DisruptionHandling")
    ],
    benefits: [
      t("costReductionUp30"),
      t("administrativeTimeSavings"),
      t("fullExpenseVisibility")
    ],
    color: "from-indigo-500 to-blue-600",
    tag: t("travel"),
    category: "voyage",
    stats: [
      { label: t("savings"), value: "-30%" },
      { label: t("citiesCovered"), value: "200+" }
    ]
  },
  {
    id: 2,
    icon: <Gift className="w-6 h-6" />,
    title: t("premiumCseBenefits"),
    description: t("offerEmployeesCatalog"),
    longDescription: t("fullRangeCseBenefits"),
    features: [
      t("digitalGiftCards"),
      t("leisureCultureTicketing"),
      t("localDiscountOffers"),
      t("cseCreditManagement"),
      t("personalizedCatalog")
    ],
    benefits: [
      t("increasedEmployee"),
      t("talentRetention"),
      t("strengthenedEmployerBrand")
    ],
    color: "from-emerald-500 to-teal-600",
    tag: t("cse"),
    category: "cse",
    stats: [
      { label: t("offers"), value: "500K+" },
      { label: t("satisfaction"), value: "98%" }
    ]
  },
  {
    id: 3,
    icon: <Hotel className="w-6 h-6" />,
    title: t("accommodationStays"),
    description: t("wideChoiceAccommodationEvery"),
    longDescription: t("accommodationSolutionsSuited"),
    features: [
      t("text15StarHotels"),
      t("apartmentsResidences"),
      t("longStayAccommodation"),
      t("exclusiveCorporateOffers"),
      t("instantBooking")
    ],
    benefits: [
      t("bestNegotiatedRates"),
      t("wideChoiceAccommodation"),
      t("flexibleBooking")
    ],
    color: "from-purple-500 to-pink-600",
    tag: t("accommodation"),
    category: "both",
    stats: [
      { label: t("hotels"), value: "50K+" },
      { label: t("destinations"), value: "300+" }
    ]
  },
  {
    id: 4,
    icon: <Ticket className="w-6 h-6" />,
    title: t("leisureEntertainment"),
    description: t("accessThousandsDiscounted"),
    longDescription: t("exceptionalCatalogActivities"),
    features: [
      t("cinemaShows"),
      t("themeParks"),
      t("sportingEvents"),
      t("culturalActivities"),
      t("exclusiveDeals")
    ],
    benefits: [
      t("savingsUp50"),
      t("activitiesWholeFamily"),
      t("culturalDiscoveries")
    ],
    color: "from-amber-500 to-orange-600",
    tag: t("leisure"),
    category: "cse",
    stats: [
      { label: t("activities"), value: "10K+" },
      { label: t("savings"), value: "50%" }
    ]
  },
  {
    id: 5,
    icon: <Shield className="w-6 h-6" />,
    title: t("assistanceSecurity"),
    description: t("text247AssistanceTravelers"),
    longDescription: t("totalPeaceMindEmployees"),
    features: [
      t("text247TravelAssistance"),
      t("disruptionHandling"),
      t("dataSecurity"),
      t("gdprCompliance"),
      t("multichannelSupport")
    ],
    benefits: [
      t("peaceMindTravelers"),
      t("responsivenessEmergencies"),
      t("fullCompliance")
    ],
    color: "from-rose-500 to-red-600",
    tag: t("security"),
    category: "both",
    stats: [
      { label: t("availability"), value: "24/7" },
      { label: t("sla"), value: "99.9%" }
    ]
  },
  {
    id: 6,
    icon: <Smartphone className="w-6 h-6" />,
    title: t("mobileApp"),
    description: t("manageAllBenefitsBookings"),
    longDescription: t("smoothMobileExperienceAccess"),
    features: [
      t("iosAndroidApp"),
      t("realTimeReceiptScanning"),
      t("pushNotifications"),
      t("geolocatedOffers"),
      t("mobilePayment")
    ],
    benefits: [
      t("optimalUserExperience"),
      t("mobilityManagement"),
      t("instantAccess")
    ],
    color: "from-cyan-500 to-blue-600",
    tag: t("digital"),
    category: "both",
    stats: [
      { label: t("downloads"), value: "50K+" },
      { label: t("rating"), value: "4.8★" }
    ]
  },
  {
    id: 7,
    icon: <Users className="w-6 h-6" />,
    title: t("eventsSeminars"),
    description: t("organizeCompanyEvents"),
    longDescription: t("turnkeySolutionOrganizing"),
    features: [
      t("seminarOrganization"),
      t("teamBuilding"),
      t("conferencesTraining"),
      t("participantManagement"),
      t("eventLogistics")
    ],
    benefits: [
      t("organizationalTimeSavings"),
      t("memorableExperiences"),
      t("strengthenedTeamCohesion")
    ],
    color: "from-violet-500 to-purple-600",
    tag: t("events"),
    category: "both",
    stats: [
      { label: t("events"), value: "1K+" },
      { label: t("participants"), value: "50K+" }
    ]
  },
  {
    id: 8,
    icon: <TrendingUp className="w-6 h-6" />,
    title: t("analyticsReporting"),
    description: t("detailedReportsManageTravel"),
    longDescription: t("preciseDataDepthAnalyses"),
    features: [
      t("customDashboards"),
      t("expenseAnalysis"),
      t("travelCseKpis"),
      t("automatedReports"),
      t("budgetForecasts")
    ],
    benefits: [
      t("informedDecisions"),
      t("budgetOptimization"),
      t("fullVisibility")
    ],
    color: "from-emerald-500 to-teal-600",
    tag: t("analytics"),
    category: "both",
    stats: [
      { label: t("kpis"), value: "50+" },
      { label: t("accuracy"), value: "98%" }
    ]
  }
]);

const getCategories = (t: Translator) => ([
  { id: "all", label: t("allServices"), icon: <Sparkles className="w-4 h-4" /> },
  { id: "voyage", label: t("travel"), icon: <Plane className="w-4 h-4" /> },
  { id: "cse", label: t("cse"), icon: <Gift className="w-4 h-4" /> },
  { id: "both", label: t("travelCse"), icon: <Globe className="w-4 h-4" /> }
]);

export default function ServicesSection() {
  const tr = useTranslations("infos.servicesSection");
  const t = useTranslations("infos.servicesSection");
  const services = useMemo(() => getServices(t), [t]);
  const categories = useMemo(() => getCategories(t), [t]);
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
              {t("discoverEcosystem")}
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            {tr.rich("uniqueServicesTravelCse", { span1: (chunks) => <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">{chunks}</span> })}
          </h2>
          
          <p className="text-slate-500 text-lg font-medium max-w-3xl mx-auto">
            {t("allOnePlatformCombines")}
          </p>

          {/* Indicateurs de confiance */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {[
              { icon: <Users className="w-4 h-4" />, label: t("text500Companies") },
              { icon: <Globe className="w-4 h-4" />, label: t("text30CountriesCovered") },
              { icon: <Clock className="w-4 h-4" />, label: t("text247Support") },
              { icon: <Award className="w-4 h-4" />, label: t("innovationAward") }
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
                  {service.category === "voyage" ? t("travel2") : service.category === "cse" ? "CSE" : t("mixed")}
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
                      <p className="text-xs font-semibold text-indigo-600 mb-1">{t("keyBenefits")}</p>
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
            <p className="text-slate-500">{t("noServicesCategory")}</p>
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
                  {t("readyTransformBusiness")}
                </span>
                <div className="flex items-center gap-3">
                  <a 
                    href="#tarifs" 
                    className="px-6 py-2 bg-white text-indigo-600 rounded-full text-sm font-bold hover:scale-105 transition-transform duration-300 shadow-lg"
                  >
                    {t("discoverOffers")}
                  </a>
                  <a 
                    href="#contact" 
                    className="px-6 py-2 bg-transparent border-2 border-white/50 text-white rounded-full text-sm font-bold hover:bg-white/10 transition-all duration-300"
                  >
                    {t("contactUs")}
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
            {t("thousandsSatisfiedUsers")}
          </span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            {t("securityComplianceAssured")}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            {t("supportAvailable247")}
          </span>
        </motion.div>
      </div>
    </section>
  );
}