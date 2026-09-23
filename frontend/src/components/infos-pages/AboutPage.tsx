// /src/components/infos-pages/AboutPage.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Target,
  Globe,
  Building2,
  MapPin,
  Star,
  ShieldCheck,
  Leaf,
  Award,
  Lightbulb,
  Trophy,
  Users,
  Zap,
  Medal,
  Gift,
  Ticket,
  Smartphone,
  ShoppingBag,
  Film,
  Dumbbell,
  Crown,
  Coffee,
  Heart,
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
  Sparkles,
  GemIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MessageCircle,
  Phone,
  Mail,
  Send,
  ChevronDown,
  Check,
  Clock,
  FileText,
  User,
  PhoneCall,
  ArrowRight,
  HelpCircle,
  Quote,
  ChevronLeft,
  ChevronRight,
  Star as StarIcon,
  Settings, // Ajout de l'import Settings
  Bell,     // Ajout de l'import Bell
  Apple,    // Ajout de l'import Apple
  Monitor,
  LayoutDashboard,
  Megaphone,
  Wallet,
  Building,
  GraduationCap,
  Handshake,
  Lightbulb as LightbulbIcon,
  ThumbsUp,
  BarChart3,
  FileCheck,
  Grid3x3,
  Layers,
  PanelRight,
  Sparkle,
  Crown as CrownIcon,
  Gem,
  Flame,
  Sun,
  Moon,
  Cloud,
  Database,
  Server,
  Code,
  Cpu,
  Globe2,
  Ship,
  Train,
  Bus,
  Car,
  Bike,
  Coffee as CoffeeIcon,
  Utensils,
  Wine,
  Cake,
  Gift as GiftIcon,
  Award as AwardIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon,
  ShieldCheck as ShieldCheckIcon,
  Leaf as LeafIcon,
  Users as UsersIcon,
  Heart as HeartIcon,
  Star as StarIcon2,
  Sparkles as SparklesIcon,
  Zap as ZapIcon,
  Rocket as RocketIcon,
  Target as TargetIcon,
  Globe as GlobeIcon,
  Building2 as BuildingIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  User as UserIcon,
  PhoneCall as PhoneCallIcon,
  ArrowRight as ArrowRightIcon,
  HelpCircle as HelpCircleIcon,
  Quote as QuoteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon,
  Bell as BellIcon,
  Apple as AppleIcon,
  Monitor as MonitorIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Megaphone as MegaphoneIcon,
  Wallet as WalletIcon,
  Building as BuildingIcon2,
  GraduationCap as GraduationCapIcon,
  Handshake as HandshakeIcon,
  Lightbulb as LightbulbIcon2,
  ThumbsUp as ThumbsUpIcon,
  BarChart3 as BarChartIcon,
  FileCheck as FileCheckIcon,
  Grid3x3 as GridIcon,
  Layers as LayersIcon,
  PanelRight as PanelRightIcon,
  Sparkle as SparkleIcon,
  Crown as CrownIcon2,
  Gem as GemIcon2,
  Flame as FlameIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Cloud as CloudIcon,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Code as CodeIcon,
  Cpu as CpuIcon,
  Globe2 as GlobeIcon2,
  Ship as ShipIcon,
  Train as TrainIcon,
  Bus as BusIcon,
  Car as CarIcon,
  Bike as BikeIcon,
  Coffee as CoffeeIcon2,
  Utensils as UtensilsIcon,
  Wine as WineIcon,
  Cake as CakeIcon
} from "lucide-react";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.aboutPage">>;

// ─── DONNÉES ──────────────────────────────────────────────────────────────

// Statistiques clés - inspirées de HappyPal
const getStats = (t: Translator) => ([
  { value: "500K+", label: t("beneficiaries"), icon: <Users className="w-5 h-5" />, color: "indigo" },
  { value: "10K+", label: t("clientCompanies"), icon: <Building2 className="w-5 h-5" />, color: "emerald" },
  { value: "500K+", label: t("availableOffers"), icon: <ShoppingBag className="w-5 h-5" />, color: "purple" },
  { value: "98%", label: t("userSatisfaction"), icon: <Heart className="w-5 h-5" />, color: "rose" },
]);

// Avantages - style HappyPal (cartes simples avec icônes)
const getAdvantages = (t: Translator) => ([
  {
    icon: <Gift className="w-6 h-6" />,
    title: t("cseTicketingDiscounts"),
    description: t("thousandsIrresistibleOffers"),
    color: "indigo"
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: t("intuitiveMobileExperience"),
    description: t("funEasyUseApp"),
    color: "emerald"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: t("activitiesBringPeople"),
    description: t("eventsKeepCseAlive"),
    color: "purple"
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    title: t("userSupport7Days"),
    description: t("responsiveTeamReadyListen"),
    color: "amber"
  }
]);

// Témoignages - comme sur HappyPal
const getTestimonials = (t: Translator) => ([
  {
    id: 1,
    name: t("aureliaMarie"),
    role: t("cseRepresentatives"),
    text: t("cseWasAlreadyWorking"),
    avatar: "AM",
    color: "indigo"
  },
  {
    id: 2,
    name: t("nathalie"),
    role: t("cseRepresentative"),
    text: t("choseClubEmployesIts"),
    avatar: "N",
    color: "emerald"
  },
  {
    id: 3,
    name: t("sonia"),
    role: t("cseRepresentative"),
    text: t("wwfSCseCan"),
    avatar: "S",
    color: "purple"
  }
]);

// Avis utilisateurs
const getUserReviews = (t: Translator) => ([
  { text: t("iMReallyHappy"), author: t("marieD"), rating: 5 },
  { text: t("veryGoodPlatformEasy"), author: t("jeanP"), rating: 5 },
  { text: t("veryGoodAppNothing"), author: t("sophieL"), rating: 5 },
  { text: t("platformVeryWellMade"), author: t("thomasM"), rating: 5 },
  { text: t("overallChoiceSoWide"), author: t("amandineR"), rating: 5 },
]);

// ─── COMPOSANTS ────────────────────────────────────────────────────────────

// Hero Section - style HappyPal (deux parties + carrousel)
function HeroSection() {
  const t = useTranslations("infos.aboutPage");
  const stats = useMemo(() => getStats(t), [t]);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: t("simplifyCseManagement"),
      description: t("platformCentralizesAll"),
      image: "/images/hero-cse.jpg",
      cta: t("discover")
    },
    {
      title: t("thousandsOffersFingertips"),
      description: t("ticketingGiftCardsLocal"),
      image: "/images/hero-offers.jpg",
      cta: t("viewOffers")
    },
    {
      title: t("funMobileExperience"),
      description: t("intuitiveEasyUseApp"),
      image: "/images/hero-mobile.jpg",
      cta: t("download")
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white">
      {/* Partie gauche - Texte */}
      <div className="relative z-10 w-full lg:w-1/2 px-4 sm:px-6 lg:px-8 py-16 lg:py-0">
        <div className="max-w-xl mx-auto lg:mx-0">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-700">{t("csePlatform9Years")}</span>
          </motion.div>

          {/* Titre avec carrousel */}
          <div className="relative h-30 md:h-35 overflow-hidden mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-[1.1]">
                  {slides[activeSlide].title}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Description */}
          <motion.p
            key={`desc-${activeSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-600 mb-8 max-w-lg"
          >
            {slides[activeSlide].description}
          </motion.p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="#"
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all hover:scale-105 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
            >
              {slides[activeSlide].cta}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="px-8 py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            >
              {t("watchDemo")}
            </Link>
          </div>

          {/* Indicateurs de slide */}
          <div className="flex items-center gap-2 mt-8">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeSlide
                    ? 'w-8 h-2 bg-indigo-600'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
            <span className="text-xs text-slate-400 ml-2">
              {activeSlide + 1}/{slides.length}
            </span>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partie droite - Image avec carrousel */}
      <div className="hidden lg:block w-1/2 relative h-[85vh] bg-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <Image
              src={slides[activeSlide].image}
              alt={slides[activeSlide].title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-l from-transparent via-transparent to-white/20" />
          </motion.div>
        </AnimatePresence>

        {/* Contrôles du carrousel */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-lg flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-lg flex items-center justify-center z-10"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        {/* Indicateurs */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === activeSlide
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Section "Augmentez l'impact" - style HappyPal
function ImpactSection() {
  const tr = useTranslations("infos.aboutPage");
  const t = useTranslations("infos.aboutPage");
  const advantages = useMemo(() => getAdvantages(t), [t]);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            {t("mission")}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Sanomat', ui-serif" }}>
            {tr.rich("increaseCsesImpactEmployee", { span1: (chunks) => <span className="bg-linear-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">{chunks}</span> })}
          </h2>
          <p className="text-lg text-slate-500">
            {t("livelyPlatformEnriches")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((adv, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all text-center"
            >
              <div className={`w-14 h-14 rounded-xl bg-${adv.color}-100 flex items-center justify-center mx-auto mb-4`}>
                <div className={`text-${adv.color}-600`}>{adv.icon}</div>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{adv.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{adv.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section "Simplifiez la gestion" - style HappyPal
function ManagementSection() {
  const t = useTranslations("infos.aboutPage");
  const features = [
    {
      icon: <SettingsIcon className="w-5 h-5" />,
      title: t("setUpFewClicks"),
      description: t("giftAllowancesAscSubsidies")
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: t("advancedUserManagement"),
      description: t("beneficiariesDependents")
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: t("ultraSimplifiedAccounting"),
      description: t("automatedSubsidies")
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: t("expertSupport"),
      description: t("fromZCseSpecialists")
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
              <Zap className="w-4 h-4" />
              {t("simplifiedManagement")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Sanomat', ui-serif" }}>
              {t("simplifyBudgetManagementAs")}
            </h2>
            <p className="text-lg text-slate-500 mb-8">
              {t("platformCentralizes")}
            </p>
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600">{feature.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{feature.title}</h4>
                    <p className="text-sm text-slate-500">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6">
              <Image
                src="/images/dashboard-cse.jpg"
                alt={t("cseDashboard")}
                width={600}
                height={400}
                className="rounded-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-700">{t("live")}</span>
                  <span className="text-xs text-slate-400">{t("text1234Users")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Section "Créez du lien" - style HappyPal
function ConnectionSection() {
  const t = useTranslations("infos.aboutPage");
  const tools = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: t("newsletters"),
      description: t("targetedCommunication")
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: t("events"),
      description: t("registrationTravelManagement")
    },
    {
      icon: <BellIcon className="w-5 h-5" />,
      title: t("mobileNotifications"),
      description: t("realTimeAlerts")
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: t("advancedTargeting"),
      description: t("customRecipients")
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-200">
              <Image
                src="/images/mobile-app.jpg"
                alt={t("mobileApp")}
                width={500}
                height={400}
                className="rounded-2xl mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
              <Users className="w-4 h-4" />
              {t("buildConnections")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Sanomat', ui-serif" }}>
              {t("buildConnectionsBetween")}
            </h2>
            <p className="text-lg text-slate-500 mb-8">
              {t("suiteEasyUseTools")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {tools.map((tool, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600">{tool.icon}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm">{tool.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{tool.description}</p>
                </motion.div>
              ))}
            </div>
            <Link
              href="#"
              className="inline-flex items-center gap-2 mt-6 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              {t("seeCustomerReviews")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Section Témoignages - style HappyPal
function TestimonialsSection() {
  const tr = useTranslations("infos.aboutPage");
  const t = useTranslations("infos.aboutPage");
  const testimonials = useMemo(() => getTestimonials(t), [t]);
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-4">
            <Quote className="w-4 h-4" />
            {t("testimonials")}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Sanomat', ui-serif" }}>
            {tr.rich("recognizedCompaniesLoved", { span1: (chunks) => <span className="bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{chunks}</span> })}
          </h2>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-full bg-${testimonials[activeIndex].color}-100 flex items-center justify-center text-${testimonials[activeIndex].color}-600 font-bold text-xl`}>
                  {testimonials[activeIndex].avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{testimonials[activeIndex].name}</h4>
                  <p className="text-sm text-slate-500">{testimonials[activeIndex].role}</p>
                </div>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                "{testimonials[activeIndex].text}"
              </p>
              <div className="flex items-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === activeIndex
                  ? 'w-8 h-2 bg-indigo-600'
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Section Avis utilisateurs - style HappyPal (carrousel de citations)
function UserReviewsSection() {
  const t = useTranslations("infos.aboutPage");
  const userReviews = useMemo(() => getUserReviews(t), [t]);
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % userReviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: "'Sanomat', ui-serif" }}>
            {t("pamperUsersTheyReturn")}
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReview}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200"
            >
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                "{userReviews[activeReview].text}"
              </p>
              <p className="text-sm font-semibold text-slate-700 mt-4">
                — {userReviews[activeReview].author}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-6">
            {userReviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveReview(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeReview
                    ? 'w-6 h-1.5 bg-indigo-600'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Section "Tous vos avantages dans une application mobile"
function MobileAppSection() {
  const t = useTranslations("infos.aboutPage");
  return (
    <section className="py-20 bg-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold mb-4">
              <Smartphone className="w-4 h-4" />
              {t("mobileApp")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Sanomat', ui-serif" }}>
              {t("allBenefitsOneMobile")}
            </h2>
            <p className="text-lg text-indigo-200 mb-8">
              {t("accessAllDiscountsSubsidies")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#"
                className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2"
              >
                <AppleIcon className="w-5 h-5" />
                {t("appStore")}
              </Link>
              <Link
                href="#"
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                {t("googlePlay")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative">
              <Image
                src="/images/mobile-app-mockup.png"
                alt={t("clubEmployesMobileApp")}
                width={300}
                height={500}
                className="rounded-3xl shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute -bottom-4 -right-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-white font-semibold">{t("text500kUsers")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <ImpactSection />
      <ManagementSection />
      <ConnectionSection />
      <TestimonialsSection />
      <UserReviewsSection />
      <MobileAppSection />
    </main>
  );
}