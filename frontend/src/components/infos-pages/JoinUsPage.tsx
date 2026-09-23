"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Globe, Rocket, Star, Briefcase, Theater, Gift, TrendingUp, Film, Brain, Sparkles, Lightbulb, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface BentoCardProps {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  className?: string;
}

interface ContributionCardProps {
  number: string;
  title: string;
  description: string;
  tag: string;
}

// ─── HOOK: IN VIEW ───────────────────────────────────────────────────────────

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
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

// ─── COMPONENT: AVATAR GROUP ─────────────────────────────────────────────────

function AvatarGroup() {
  const t = useTranslations("infos.joinUsPage");
  const avatars = [
    { name: "AM", bg: "from-teal-400 to-emerald-500" },
    { name: "FK", bg: "from-indigo-400 to-purple-500" },
    { name: "KA", bg: "from-amber-400 to-orange-500" },
    { name: "SB", bg: "from-pink-400 to-rose-500" },
  ];

  return (
    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-2xl w-fit shadow-sm">
      <div className="flex -space-x-3">
        {avatars.map((avatar, i) => (
          <div
            key={i}
            className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white`}
          >
            {avatar.name}
          </div>
        ))}
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-800">{t("text50Talents")}</p>
        <p className="text-xs text-slate-500">{t("spreadAcross12Countries")}</p>
      </div>
    </div>
  );
}

// ─── 1. SECTION: HERO AVEC IMAGE DE FOND ─────────────────────────────────────

function HeroSection() {
  const tr = useTranslations("infos.joinUsPage");
  const t = useTranslations("infos.joinUsPage");
  return (
    <section className="relative min-h-[80vh] w-full overflow-hidden flex items-center justify-center bg-white pt-24 pb-16">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format"
          alt={t("hrPlanningTeamMeeting")}
          fill
          className="object-cover"
          priority
        />
        {/* Overlay pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" />
        
        {/* Blobs décoratifs */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-[150px] bg-[#6366F1]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[150px] bg-[#10B981]" />
      </div>

      {/* Contenu centré */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-1.5 text-xs font-semibold text-indigo-600 mb-6 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
          {t("activelyHiring")}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          {tr.rich("buildFutureAfricanBusiness", { span1: (chunks) => <span className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">{chunks}</span> })}
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-700 leading-relaxed bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl inline-block shadow-sm">
          {t("joinPassionateTeamUnifies")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="rounded-xl bg-[#6366F1] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:bg-[#5053db] hover:-translate-y-0.5 active:translate-y-0">
            {t("seeOpenPositions")}
          </button>
          <button className="rounded-xl border border-slate-300 bg-white/80 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white">
            {t("discoverManifesto")}
          </button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <AvatarGroup />
          
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200">
              <span className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Globe className="w-4 h-4" /></span>
              <span>{t("text12Countries")}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200">
              <span className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Rocket className="w-4 h-4" /></span>
              <span>{t("text500Customers")}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200">
              <span className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><Star className="w-4 h-4" /></span>
              <span>{t("text495Enps")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 2. SECTION: NOTRE DUALITÉ (DEUX PILIERS, UNE MISSION) ───────────────────

function DualMissionSection() {
  const t = useTranslations("infos.joinUsPage");
  const [activeTab, setActiveTab] = useState<"voyage" | "cse">("voyage");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === "voyage" ? "cse" : "voyage"));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              {t("uniqueDuality")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t("twoPillars")} <br />{t("oneSingleMission")}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t("donTJustWrite")}
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm italic text-slate-700">
              {t("aiRigorAfrikvoyageMeet")}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex bg-slate-200/60 p-1 rounded-lg border border-slate-300/40">
                  <button
                    onClick={() => setActiveTab("voyage")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeTab === "voyage"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{t("afrikvoyage")}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cse")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeTab === "cse"
                        ? "bg-[#6366F1] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1"><Theater className="w-3 h-3" />{t("afrikcse")}</span>
                  </button>
                </div>
                <div className="w-16 h-2 bg-slate-200 rounded-full" />
              </div>

              <div className="p-6 min-h-[260px] flex flex-col justify-between transition-all duration-500">
                {activeTab === "voyage" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">{t("performanceFocusSection")}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#10B981] border border-emerald-200">{t("liveAiHeatmap")}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{t("predictiveSearchBudget")}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">{t("financialFlow")}</span>
                        <span className="text-sm font-bold text-slate-900">94.2%</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">{t("predictiveRouting")}</span>
                        <span className="text-sm font-bold text-indigo-600">{t("optimal")}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">{t("directSavings")}</span>
                        <span className="text-sm font-bold text-[#10B981]">-30%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full w-[82%]" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">{t("humanFocusSection")}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">{t("netflixStyleExperience")}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{t("serviceGalleryEmployee")}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-tr from-white to-indigo-50/40 rounded-xl border border-indigo-100">
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-900 mb-1"><Gift className="w-3 h-3 text-indigo-600 shrink-0" />{t("benefitsCatalog")}</span>
                        <span className="text-[11px] text-slate-500">{t("cinemaGiftVouchersUnlimited")}</span>
                      </div>
                      <div className="p-3 bg-gradient-to-tr from-white to-emerald-50/40 rounded-xl border border-emerald-100">
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-900 mb-1"><TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />{t("engagementScore")}</span>
                        <span className="text-sm font-black text-[#10B981]">{t("enps72")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("employeesBrowseTheirPerks")}</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{t("unifiedManagementSystemV2")}</span>
                  <span className="font-mono">{t("statusConnected")}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── 3. SECTION: BENTO GRID ("POURQUOI NOUS REJOINDRE ?") ───────────────────

function BentoCard({ title, description, badge, icon, className = "" }: BentoCardProps) {
  const t = useTranslations("infos.joinUsPage");
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between group transition-all duration-300 hover:border-slate-300 hover:shadow-lg ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-400 group-hover:text-slate-600 flex items-center gap-1 transition-colors">
        {t("learnMore")} <span className="transform group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );
}

function BentoGridSection() {
  const tt = useTranslations("infos.joinUsPage");
  const t = useTranslations("infos.joinUsPage");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {t("whyChooseJoinUs")}
          </h2>
          <p className="text-base text-slate-500">
            {t("joinEcosystemDesigned")}
          </p>
        </div>

        <div
          ref={ref}
          className={`grid gap-6 md:grid-cols-3 transition-all duration-1000 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <BentoCard
            icon={<Brain className="w-6 h-6 text-slate-600" />}
            badge={tt("aiPredictive")}
            title={t("aiServingPeople")}
            description={t("workComplexPredictive")}
          />
          <BentoCard
            icon={<Globe className="w-6 h-6 text-slate-600" />}
            badge={tt("panAfricanScale")}
            title={t("continentalReach")}
            description={t("joinMajorTechnologySolution")}
          />
          <BentoCard
            icon={<Sparkles className="w-6 h-6 text-slate-600" />}
            badge={tt("b2cUxSaas")}
            title={t("b2cExperienceBusiness")}
            description={t("firmlyBelieveProfessional")}
          />
        </div>
      </div>
    </section>
  );
}

// ─── 4. SECTION: COMMENT SOUHAITONS-NOUS CONTRIBUER ? ───────────────────────

function ContributionCard({ number, title, description, tag }: ContributionCardProps) {
  return (
    <div className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors">
            {number}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md border border-indigo-100">
            {tag}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function ContributionSection() {
  const tt = useTranslations("infos.joinUsPage");
  const t = useTranslations("infos.joinUsPage");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="text-xs font-bold tracking-wider text-[#6366F1] uppercase">
              {t("impactManifesto")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t("howDoWantContribute")}
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              {t("beyondLinesCodeShape")}
            </p>
          </div>

          <div 
            ref={ref}
            className={`lg:col-span-8 grid gap-6 sm:grid-cols-2 transition-all duration-1000 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <ContributionCard 
              number="01"
              tag={tt("localEconomy")}
              title={t("supportingGrowthAfrican")}
              description={t("automatingComplexProcesses")}
            />
            <ContributionCard 
              number="02"
              tag={tt("socialInclusion")}
              title={t("democratizingEmployee")}
              description={t("giveEmployeesFairAccess")}
            />
            <ContributionCard 
              number="03"
              tag={tt("modernization")}
              title={t("raisingStandardsHrExperience")}
              description={t("turnTraditionallyAustere")}
            />
            <ContributionCard 
              number="04"
              tag={tt("responsibility")}
              title={t("guaranteeingAbsolute")}
              description={t("aiEnsuresPerfectCompliance")}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── 5. SECTION: VISION & VALEURS ────────────────────────────────────────────

function ValuesSection() {
  const t = useTranslations("infos.joinUsPage");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  const corporateValues: Value[] = [
    {
      icon: <Lightbulb className="w-6 h-6 text-slate-600" />,
      title: t("innovation"),
      description: t("constantlyPushingBoundaries"),
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-slate-600" />,
      title: t("trust"),
      description: t("guaranteeingAbsolute2"),
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-slate-600" />,
      title: t("performance"),
      description: t("combiningAlgorithmicRigor"),
    },
  ];

  return (
    <section className="bg-slate-50 py-20 text-slate-900 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="text-xs font-bold tracking-wider text-[#6366F1] uppercase mb-2">
            {t("engineeringDna")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t("coreValues")}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            {t("whatGovernsEachTechnical")}
          </p>
        </div>

        <div
          ref={ref}
          className={`grid gap-8 sm:grid-cols-3 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {corporateValues.map((val, i) => (
            <div
              key={val.title}
              className="relative group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">{t("secure")}</span>
              </div>

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                {val.icon}
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">
                {val.title}
              </h3>
              
              <p className="text-sm text-slate-500 leading-relaxed">
                {val.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 6. PAGE COMPLETE ────────────────────────────────────────────────────────

export default function JoinUsPage() {
  return (
    <main className="min-h-screen font-sans antialiased bg-white text-slate-800">
      <HeroSection />
      <DualMissionSection />
      <BentoGridSection />
      <ContributionSection />
      <ValuesSection />
    </main>
  );
}