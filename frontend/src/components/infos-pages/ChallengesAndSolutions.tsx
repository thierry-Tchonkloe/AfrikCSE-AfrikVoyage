"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Plane, 
  Gift, 
  ShieldCheck, 
  Receipt, 
  Megaphone, 
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Compass,
  Clock,
  Sparkles,
  BarChart3,
  Building2,
  Luggage,
  Sparkle
} from "lucide-react";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.challengesAndSolutions">>;

// ─── 1. DONNÉES DES FONCTIONNALITÉS ──────────────────────────────────────────
type FeatureCategory = "cse" | "travel";

interface FeatureItem {
  id: string;
  category: FeatureCategory;
  categoryLabel: string;
  title: string;
  description: string;
  btnText: string;
  href: string;
  badge: string;
  image: string;
  icon: React.ElementType;
}

const getFeaturesData = (t: Translator): FeatureItem[] => ([
  // --- FONCTIONNALITÉS CSE ---
  {
    id: "billetterie-subventions",
    category: "cse",
    categoryLabel: t("cseSpace"),
    title: t("ticketingEmployeeSubsidies"),
    description: t("accessThousandsNegotiated"),
    btnText: t("exploreCseModule"),
    href: "/cse/billetterie",
    badge: t("discountsBenefits"),
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    icon: Ticket,
  },
  {
    id: "cartes-cadeaux",
    category: "cse",
    categoryLabel: t("cseSpace"),
    title: t("giftCardsUrssafEvents"),
    description: t("instantIssuanceDigitalGift"),
    btnText: t("cseGiftCards"),
    href: "/cse/cartes-cadeaux",
    badge: t("text100UrssafCompliance"),
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    icon: Gift,
  },
  {
    id: "communication-espace",
    category: "cse",
    categoryLabel: t("cseSpace"),
    title: t("employeePortalCseInfo"),
    description: t("unifiedSpaceShareMinutes"),
    btnText: t("communicationPortal"),
    href: "/cse/communication",
    badge: t("connectionEngagement"),
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    icon: Megaphone,
  },

  // --- FONCTIONNALITÉS VOYAGES D'ENTREPRISE ---
  {
    id: "deplacements-pro",
    category: "travel",
    categoryLabel: t("businessTravelCategory"),
    title: t("flightTrainHotelBooking"),
    description: t("completeBookingToolBusiness"),
    btnText: t("bookTrip"),
    href: "/voyages/reservation",
    badge: t("corporateTravel"),
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    icon: Plane,
  },
  {
    id: "politiques-voyage",
    category: "travel",
    categoryLabel: t("businessTravelCategory"),
    title: t("travelPoliciesCeilings"),
    description: t("setupAutomaticApprovalRules"),
    btnText: t("manageTravelPolicy"),
    href: "/voyages/politique",
    badge: t("governanceControl"),
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    icon: ShieldCheck,
  },
  {
    id: "notes-frais",
    category: "travel",
    categoryLabel: t("businessTravelCategory"),
    title: t("expenseReportsReimbursements"),
    description: t("digitizationTravelReceipts"),
    btnText: t("reimbursementManagement"),
    href: "/voyages/frais",
    badge: t("paperlessManagement"),
    image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80",
    icon: Receipt,
  },
]);

// ─── 2. DASHBOARD CLAIR COMPACT ──────────────────────────────────────────────
const getMetricsLight = (t: Translator) => ([
  { label: t("cseBudgetDistributed"), value: "248 500 €", change: "+14.2%", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
  { label: t("businessTravelSavings"), value: "34 200 €", change: t("text18Cost"), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: t("employeeAdoptionRate"), value: "95.8%", change: "+6.1%", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: t("compliantBookings"), value: "99.4%", change: "100% OK", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
]);

const getRecentActivities = (t: Translator) => ([
  { id: "ACT-01", name: t("marcVance"), detail: t("planeTicketParisCotonou"), type: t("travel"), date: t("text10MinAgo"), amount: "840 €", status: t("approvedPolicyOk"), isTravel: true },
  { id: "ACT-02", name: t("claireDupont"), detail: t("christmasGiftVoucherSubsidy"), type: "CSE", date: t("text32MinAgo"), amount: "170 €", status: t("granted"), isTravel: false },
  { id: "ACT-03", name: t("ablamMensah"), detail: t("hotelNovotelDakar2"), type: t("travel"), date: t("text1HAgo"), amount: "310 €", status: t("pendingHr"), isTravel: true },
  { id: "ACT-04", name: t("sophieMartin"), detail: t("backSchoolInvoice"), type: "CSE", date: t("text2HAgo"), amount: "150 €", status: t("reimbursed"), isTravel: false },
]);

const LightCockpitDashboard = () => {
  const t = useTranslations("infos.challengesAndSolutions");
  const METRICS_LIGHT = useMemo(() => getMetricsLight(t), [t]);
  const RECENT_ACTIVITIES = useMemo(() => getRecentActivities(t), [t]);
  const [tab, setTab] = useState<"analytics" | "operations">("analytics");

  return (
    <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
      <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider pl-2 border-l border-slate-200">
            {t("controlConsoleAfrikcse")}
          </span>
        </div>

        <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab("analytics")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
              tab === "analytics"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 size={14} className="text-blue-600" />
            {t("budgetOverview")}
          </button>
          <button
            onClick={() => setTab("operations")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
              tab === "operations"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock size={14} className="text-emerald-600" />
            {t("activityFeed")}
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6 bg-slate-50/20">
        {tab === "analytics" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {METRICS_LIGHT.map((m, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${m.bg} ${m.color}`}>
                      <m.icon size={18} />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {m.change}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{m.value}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Compass size={16} className="text-blue-600" />
                      {t("cseVsBusinessTravel")}
                    </h4>
                    <p className="text-xs text-slate-500">{t("currentMonthAutomatic")}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {t("realTime")}
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { title: t("ticketingEmployeeBenefitsCse"), pct: 45, color: "bg-blue-600" },
                    { title: t("planeTicketsHotelsBusiness"), pct: 30, color: "bg-emerald-600" },
                    { title: t("urssafGiftCardsCse"), pct: 15, color: "bg-indigo-600" },
                    { title: t("travelExpensesReceipts"), pct: 10, color: "bg-amber-500" },
                  ].map((row, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${row.color}`} />
                          {row.title}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{row.pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
                    <Sparkles size={12} />
                    {t("automatedControl")}
                  </span>
                  <h4 className="text-lg font-bold">{t("integratedCeilingsTravel")}</h4>
                  <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                    {t("cseRulesBusinessTravel")}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-100">{t("automaticApprovals")}</span>
                    <span className="font-mono font-bold text-white">92%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-100">{t("hrRepresentativesTimeSaved")}</span>
                    <span className="font-mono font-bold text-emerald-300">{t("text12hWeek")}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">{t("latestRecordedTransactions")}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <th className="pb-3 pr-4 font-bold">{t("sector")}</th>
                    <th className="pb-3 pr-4 font-bold">{t("employee")}</th>
                    <th className="pb-3 pr-4 font-bold">{t("description")}</th>
                    <th className="pb-3 pr-4 font-bold">{t("delay")}</th>
                    <th className="pb-3 pr-4 font-bold">{t("amount")}</th>
                    <th className="pb-3 font-bold">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RECENT_ACTIVITIES.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          act.isTravel ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {act.isTravel ? <Plane size={10} /> : <Ticket size={10} />}
                          {act.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold text-slate-900">{act.name}</td>
                      <td className="py-3 pr-4 text-xs text-slate-600">{act.detail}</td>
                      <td className="py-3 pr-4 text-xs font-mono text-slate-400">{act.date}</td>
                      <td className="py-3 pr-4 text-xs font-mono font-bold text-slate-900">{act.amount}</td>
                      <td className="py-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function FeaturesCSEAndTravelLight() {
  const tr = useTranslations("infos.challengesAndSolutions");
  const t = useTranslations("infos.challengesAndSolutions");
  const FEATURES_DATA = useMemo(() => getFeaturesData(t), [t]);
  const [filter, setFilter] = useState<"all" | "cse" | "travel">("all");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const filteredFeatures = FEATURES_DATA.filter((item) => {
    if (filter === "cse") return item.category === "cse";
    if (filter === "travel") return item.category === "travel";
    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, duration: 0.5 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-[#F8FAFC] text-slate-900 py-20 sm:py-28 overflow-hidden">
      
      {/* ─── FOND DYNAMIQUE SUR-MESURE (SOFT MESH GRADIENTS) ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[650px] h-[650px] bg-gradient-to-br from-blue-200/35 via-indigo-100/20 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-gradient-to-tl from-emerald-200/35 via-teal-100/20 to-transparent blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-[-100px] w-[450px] h-[450px] bg-purple-200/25 blur-[130px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="space-y-16"
        >
          
          {/* ─── EN-TÊTE ET FILTRES D'ONGLETS ─── */}
          <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs tracking-wider uppercase shadow-md">
              <Sparkle size={14} className="text-amber-400" />
              {t("unifiedPlatformAfrikcse")}
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {tr.rich("allFeaturesCseBenefits", { span1: (chunks) => <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">{chunks}</span>, span2: (chunks) => <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">{chunks}</span> })}
            </h2>

            <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
              {t("clearIntuitiveSolution")}
            </p>

            {/* BARRE DE FILTRAGE PAR CATEGORIE (CSE vs VOYAGES) */}
            <div className="pt-4 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  filter === "all"
                    ? "bg-slate-900 text-white shadow-md scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {t("allFeatures")}
              </button>
              
              <button
                onClick={() => setFilter("cse")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  filter === "cse"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                    : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                }`}
              >
                <Building2 size={14} />
                {t("cseServices")}{FEATURES_DATA.filter(f => f.category === "cse").length})
              </button>

              <button
                onClick={() => setFilter("travel")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  filter === "travel"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105"
                    : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <Luggage size={14} />
                {t("businessTravel")}{FEATURES_DATA.filter(f => f.category === "travel").length})
              </button>
            </div>
          </motion.div>

          {/* ─── GRILLE DE CARTES A CONCEPTION DESIMBRIQUEE (DESTRUCTURÉE) ─── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            <AnimatePresence mode="popLayout">
              {filteredFeatures.map((feature) => {
                const isCSE = feature.category === "cse";

                return (
                  <motion.div
                    key={feature.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`group relative p-6 rounded-3xl transition-all duration-500 flex flex-col justify-between
                      /* Au repos : Pas de cadre, pas de fond visible -> Éléments désimbriqués */
                      bg-transparent border border-transparent
                      /* Au HOVER : Apparition fluide du conteneur unifié */
                      hover:bg-white hover:shadow-2xl hover:translate-y-[-8px]
                      ${
                        isCSE
                          ? "hover:border-blue-300 hover:shadow-blue-500/10"
                          : "hover:border-emerald-300 hover:shadow-emerald-500/10"
                      }
                    `}
                  >
                    
                    {/* 1. BLOC IMAGE INDÉPENDANT (Agrémente un cadre arrondi propre) */}
                    <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden mb-6 shadow-sm group-hover:shadow-md transition-all duration-500 bg-slate-100">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Badge du secteur (Flottant sur l'image) */}
                      <span className={`absolute top-3 left-3 text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md border shadow-sm ${
                        isCSE 
                          ? "bg-blue-600/90 text-white border-blue-400/30" 
                          : "bg-emerald-600/90 text-white border-emerald-400/30"
                      }`}>
                        {feature.badge}
                      </span>

                      {/* Tag d'Espace (CSE vs Travel) en haut à droite */}
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                        {feature.categoryLabel}
                      </span>

                      {/* Icône du secteur */}
                      <div className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${
                        isCSE ? "bg-blue-600" : "bg-emerald-600"
                      }`}>
                        <feature.icon size={20} />
                      </div>
                    </div>

                    {/* 2. BLOC TEXTE DESIMBRIQUÉ (Separé visuellement au repos par une ligne d'accentuation) */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Petite ligne indicatrice de secteur au repos */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-8 h-1 rounded-full transition-all duration-300 group-hover:w-12 ${
                            isCSE ? "bg-blue-500" : "bg-emerald-500"
                          }`} />
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${
                            isCSE ? "text-blue-600" : "text-emerald-600"
                          }`}>
                            {isCSE ? t("committeeBenefit") : t("businessTrip")}
                          </span>
                        </div>

                        {/* Titre */}
                        <h3 className={`text-xl font-bold text-slate-900 mb-2 transition-colors duration-300 ${
                          isCSE ? "group-hover:text-blue-600" : "group-hover:text-emerald-600"
                        }`}>
                          {feature.title}
                        </h3>

                        {/* Description claire */}
                        <p className="text-slate-600 text-sm leading-relaxed mb-6">
                          {feature.description}
                        </p>
                      </div>

                      {/* 3. BOUTON ACTION LÉGER (S'intensifie au HOVER) */}
                      <Link
                        href={feature.href}
                        className={`w-full inline-flex items-center justify-between font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all duration-300 ${
                          isCSE
                            ? "bg-blue-50/70 text-blue-700 group-hover:bg-blue-600 group-hover:text-white border border-blue-200/60 group-hover:border-blue-600 shadow-sm"
                            : "bg-emerald-50/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white border border-emerald-200/60 group-hover:border-emerald-600 shadow-sm"
                        }`}
                      >
                        <span>{feature.btnText}</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* ─── BLOC DASHBOARD COCKPIT ─── */}
          <motion.div variants={itemVariants} className="pt-8">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">
                {t("managementCockpit")}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t("text360ViewRepresentativesTravel")}
              </h3>
              <p className="text-slate-500 text-sm">
                {t("manageBudgetEnvelopesApprove")}
              </p>
            </div>

            <LightCockpitDashboard />
          </motion.div>

          {/* ─── CALL TO ACTION FINAL ─── */}
          <motion.div variants={itemVariants} className="text-center pt-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-base px-9 py-4 rounded-full transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-blue-500/25 hover:scale-[1.02]"
            >
              {t("requestInteractiveDemo")}
              <ArrowRight size={18} />
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}