"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Link } from "@/i18n/navigation";
import {
    Rocket, Building2, Landmark, ShieldCheck, Smartphone, Users,
    Settings, Link2, TrendingUp, ChevronDown, ChevronLeft, ChevronRight,
    Check
} from "lucide-react";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.benefitsAndTrust">>;

// ── TYPES & CONFIGURATIONS DATA ───────────────────────────────────────

interface Testimonial {
    id: number;
    name: string;
    role: string;
    company: string;
    avatar: string;
    avatarBg: string;
    metric: string;
    metricLabel: string;
    text: string;
    rating: number;
    date: string;
}

interface PricingPlan {
    id: number;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonVariant: "primary" | "secondary" | "outline";
    popular?: boolean;
    icon: string;
}

interface FAQItem {
    question: string;
    answer: string;
}

// Tableau comparatif
const getComparisons = (t: Translator) => ([
    {
        criterion: t("receiptExpenseManagement"),
        old: t("lostPaperExpenseReports"),
        new: t("instantAiScanningAutomatic"),
        status: "bad"
    },
    {
        criterion: t("expenseApproval"),
        old: t("endlessEmailChains"),
        new: t("dynamicApprovalWorkflows"),
        status: "good"
    },
    {
        criterion: t("travelBooking"),
        old: t("employeesPayingUpfront"),
        new: t("centralizedInventoryFlights"),
        status: "good"
    },
    {
        criterion: t("cseBenefitsCredits"),
        old: t("physicalGiftVouchersExpired"),
        new: t("singleDigitalAccountUsable"),
        status: "good"
    },
    {
        criterion: t("carbonTrackingCsr"),
        old: t("noTrackingEnvironmental"),
        new: t("builtCarbonBudgetCo"),
        status: "good"
    },
    {
        criterion: t("handlingDisruptionsCancelled"),
        old: t("stressManualHandlingHours"),
        new: t("predictiveAiAutomatically"),
        status: "good"
    }
]);

// Processus d'intégration en 4 étapes
const getIntegrationSteps = (t: Translator) => ([
    {
        num: "01",
        title: t("smartConfiguration"),
        desc: t("analysisTravelPolicyTailor"),
        tag: t("setupExpress"),
        color: "from-teal-500 to-emerald-500",
        Icon: Settings,
        label: t("smartConfiguration2")
    },
    {
        num: "02",
        title: t("erpSynchronization"),
        desc: t("secureApiConnectionTools"),
        tag: t("nativeIntegration"),
        color: "from-indigo-500 to-blue-600",
        Icon: Link2,
        label: t("erpSynchronization2")
    },
    {
        num: "03",
        title: t("guidedDeployment"),
        desc: t("administratorTrainingMobile"),
        tag: t("onboarding"),
        color: "from-purple-500 to-pink-600",
        Icon: Rocket,
        label: t("guidedDeployment2")
    },
    {
        num: "04",
        title: t("continuousOptimization"),
        desc: t("analysisExpenseReports"),
        tag: t("systemHealth"),
        color: "from-amber-500 to-orange-600",
        Icon: TrendingUp,
        label: t("continuousOptimization2")
    }
]);

// Plans tarifaires - BOUTONS HARMONISÉS
const getPricingPlans = (t: Translator): PricingPlan[] => ([
    {
        id: 1,
        name: t("startup"),
        price: "..€",
        period: t("month"),
        description: t("perfectGrowingSmes"),
        features: [
            t("up25Users"),
            t("unlimitedTravelBookings"),
            t("basicExpenseReportManagement"),
            t("emailSupport5Days"),
            t("analyticsDashboard")
        ],
        buttonText: t("getStarted"),
        buttonVariant: "outline",
        icon: "rocket"
    },
    {
        id: 2,
        name: t("business"),
        price: "..€",
        period: t("month"),
        description: t("completeSolutionMidSized"),
        features: [
            t("up150Users"),
            t("allTravelFeatures"),
            t("predictiveAiAdvanced"),
            t("prioritySupport7Days"),
            t("nativeErpIntegrations"),
            t("fullCseManagement")
        ],
        buttonText: t("getStarted"),
        buttonVariant: "primary",
        popular: true,
        icon: "building"
    },
    {
        id: 3,
        name: t("enterprise"),
        price: t("custom"),
        period: "",
        description: t("largeGroups"),
        features: [
            t("unlimitedUsers"),
            t("dedicatedApiCustomization"),
            t("guaranteed999Sla"),
            t("dedicatedAccountManager"),
            t("siteTraining"),
            t("csrAuditOptimization")
        ],
        buttonText: t("contactUs"),
        buttonVariant: "outline",
        icon: "landmark"
    }
]);

// Témoignages
const getReviews = (t: Translator): Testimonial[] => ([
    {
        id: 1,
        name: t("marieDubois"),
        role: t("hrDirector"),
        company: t("techafrik"),
        avatar: "MD",
        avatarBg: "bg-teal-600",
        metric: "-30%",
        metricLabel: t("travelCosts"),
        text: t("afrikvoyageRevolutionized"),
        rating: 5,
        date: t("text2MonthsAgo")
    },
    {
        id: 2,
        name: t("jeanPaulKouassi"),
        role: "CFO",
        company: t("innovcorp"),
        avatar: "JK",
        avatarBg: "bg-blue-600",
        metric: "100%",
        metricLabel: t("auditCompliance"),
        text: t("taxPeaceMindPlatform"),
        rating: 5,
        date: t("text1WeekAgo")
    },
    {
        id: 3,
        name: t("aminaDiop"),
        role: t("headPeople"),
        company: t("baobabDigital"),
        avatar: "AD",
        avatarBg: "bg-amber-500",
        metric: "+45%",
        metricLabel: t("cseEngagement"),
        text: t("digitalBenefitsCatalogWorks"),
        rating: 4,
        date: t("text3DaysAgo")
    },
    {
        id: 4,
        name: t("thomasMartin"),
        role: t("generalManager"),
        company: t("afrilogistics"),
        avatar: "TM",
        avatarBg: "bg-indigo-600",
        metric: "-25%",
        metricLabel: t("administrativeTime"),
        text: t("reducedTimeSpentExpense"),
        rating: 5,
        date: t("text2WeeksAgo")
    },
    {
        id: 5,
        name: t("sarahKone"),
        role: t("officeManager"),
        company: t("digitalAfrica"),
        avatar: "SK",
        avatarBg: "bg-rose-500",
        metric: "+60%",
        metricLabel: t("employeeSatisfaction"),
        text: t("employeesDelightedHowSimple"),
        rating: 5,
        date: t("text1MonthAgo")
    }
]);

// FAQ
const getFaqItems = (t: Translator): FAQItem[] => ([
    {
        question: t("howDoesIntegrationExisting"),
        answer: t("technicalTeamHelpsConnect")
    },
    {
        question: t("whatSetupTimes"),
        answer: t("platformCanOperational48")
    },
    {
        question: t("dataHostedAfrica"),
        answer: t("yesOfferLocalHosting")
    },
    {
        question: t("howDoHandleMulti"),
        answer: t("rulesEngineAutomatically")
    },
    {
        question: t("doOfferMobileApp"),
        answer: t("yesIosAndroidApps")
    },
    {
        question: t("whatSupportIncluded"),
        answer: t("supportIncluded247")
    },
    {
        question: t("canCustomizeTravelPolicies"),
        answer: t("absolutelyPlatformLets")
    },
    {
        question: t("howDataPrivacyManaged"),
        answer: t("applyPrincipleData")
    }
]);

// ── COMPOSANTS INTERNES ───────────────────────────────────────────────────────

const MarkerHighlight = ({ children, color = "rgba(99, 102, 241, 0.15)" }: { children: React.ReactNode, color?: string }) => (
    <span className="relative inline-block px-1 z-10">
        <span className="relative z-10">{children}</span>
        <svg className="absolute left-0 bottom-1 w-full h-[50%] -z-10 pointer-events-none transform scale-x-105" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,5 Q20,2 40,6 T80,3 T100,5 L100,9 Q80,7 50,9 T15,7 Z" fill={color} />
        </svg>
    </span>
);

// Composant étoiles de notation
const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

// Badge de confiance
const TrustBadge = ({ children, icon, color }: { children: React.ReactNode; icon: React.ReactNode; color: string }) => {
    const colorClasses = {
        indigo: "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50",
        emerald: "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50",
        purple: "border-purple-200 bg-purple-50/50 hover:bg-purple-50"
    };

    const iconColorClasses = {
        indigo: "bg-indigo-100 text-indigo-600",
        emerald: "bg-emerald-100 text-emerald-600",
        purple: "bg-purple-100 text-purple-600"
    };

    return (
        <div className={`flex items-start gap-4 p-5 rounded-2xl border transition-all hover:shadow-md ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className={`w-10 h-10 rounded-xl ${iconColorClasses[color as keyof typeof iconColorClasses]} flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-slate-700 text-sm font-medium leading-relaxed">{children}</p>
            </div>
        </div>
    );
};

// Carrousel d'avis
function ReviewsCarousel() {
    const t = useTranslations("infos.benefitsAndTrust");
    const REVIEWS = useMemo(() => getReviews(t), [t]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const nextReview = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % REVIEWS.length);
        setTimeout(() => setIsAnimating(false), 400);
    };

    const prevReview = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
        setTimeout(() => setIsAnimating(false), 400);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0
        })
    };

    const currentReview = REVIEWS[activeIndex];
    const averageRating = (REVIEWS.reduce((acc, r) => acc + r.rating, 0) / REVIEWS.length).toFixed(1);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-2xl font-black text-slate-800">{averageRating}</span>
                        <span className="text-slate-400">/5</span>
                    </div>
                    <p className="text-slate-500 text-sm">{t("basedCustomerReviews", { length: REVIEWS.length })}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevReview} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-all" aria-label={t("previousReview")}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextReview} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-all" aria-label={t("nextReview")}>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
            >
                <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full ${currentReview.avatarBg} text-white font-black flex items-center justify-center shadow-md`}>
                            {currentReview.avatar}
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900">{currentReview.name}</h4>
                            <p className="text-slate-400 text-xs">{currentReview.role} at {currentReview.company}</p>
                        </div>
                    </div>
                    <StarRating rating={currentReview.rating} />
                    <p className="text-slate-600 mt-4 leading-relaxed">"{currentReview.text}"</p>
                    <p className="text-slate-400 text-xs mt-4">{currentReview.date}</p>
                </div>
            </motion.div>

            <div className="flex items-center justify-center gap-2 mt-6">
                {REVIEWS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            if (isAnimating) return;
                            setIsAnimating(true);
                            setDirection(i > activeIndex ? 1 : -1);
                            setActiveIndex(i);
                            setTimeout(() => setIsAnimating(false), 400);
                        }}
                        className={`transition-all duration-300 rounded-full ${i === activeIndex ? 'w-6 h-1.5 bg-indigo-600' : 'w-1.5 h-1.5 bg-slate-300'}`}
                    />
                ))}
            </div>
        </div>
    );
}

// ── FORMULAIRE DE CONTACT RAPIDE ─────────────────────────────────────────────
const QuickContactForm = () => {
    const t = useTranslations("infos.benefitsAndTrust");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: ""
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulation d'envoi
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
        setFormData({ name: "", email: "", message: "" });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="bg-indigo-600 rounded-2xl p-6 md:p-8 text-white">
            <div className="text-center mb-6">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-xl font-black mb-1">{t("specificQuestion")}</h3>
                <p className="text-indigo-200 text-sm">
                    {t("teamAvailableSupportProject")}
                </p>
            </div>

            {isSubmitted ? (
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-4 text-center">
                    <p className="text-emerald-300 font-semibold">{t("messageSent")}</p>
                    <p className="text-emerald-200/70 text-sm mt-1">{t("willGetBackAs")}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            name="name"
                            placeholder={t("name")}
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder={t("email")}
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                        />
                    </div>
                    <div>
                        <textarea
                            name="message"
                            placeholder={t("message")}
                            rows={3}
                            value={formData.message}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
                    >
                        {t("sendMessage")}
                    </button>
                </form>
            )}

            <div className="mt-6 pt-6 border-t border-indigo-500/30 text-center">
                <p className="text-indigo-200 text-xs mb-2">{t("contactUsDirectly")}</p>
                <a href="tel:+33123456789" className="text-lg font-black hover:text-white transition-colors">
                    +33 1 23 45 67 89
                </a>
            </div>
        </div>
    );
};

export default function BenefitsTrustAndProcess() {
    const tt = useTranslations("infos.benefitsAndTrust");
    const tr = useTranslations("infos.benefitsAndTrust");
    const t = useTranslations("infos.benefitsAndTrust");
    const COMPARISONS = useMemo(() => getComparisons(t), [t]);
    const INTEGRATION_STEPS = useMemo(() => getIntegrationSteps(t), [t]);
    const PRICING_PLANS = useMemo(() => getPricingPlans(t), [t]);
    const FAQ_ITEMS = useMemo(() => getFaqItems(t), [t]);
    const [activeStep, setActiveStep] = useState(0);
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    // Auto-advance pour la section "Comment ça marche"
    useEffect(() => {
        stepIntervalRef.current = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % INTEGRATION_STEPS.length);
        }, 6000);
        return () => {
            if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
        };
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                duration: 0.5
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const getPlanIcon = (icon: string) => {
        const cls = "w-8 h-8";
        if (icon === "rocket") return <Rocket className={cls} />;
        if (icon === "building") return <Building2 className={cls} />;
        return <Landmark className={cls} />;
    };

    // Style de bouton harmonisé : outline pour les plans non-featured, primary pour le plan mis en avant
    const getButtonStyles = (variant: "primary" | "secondary" | "outline") => {
        const baseStyles = "block w-full text-center py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]";
        switch(variant) {
            case "primary":
                return `${baseStyles} bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 hover:scale-[1.02]`;
            case "secondary":
                return `${baseStyles} bg-slate-800 text-white hover:bg-slate-700 hover:scale-[1.02]`;
            case "outline":
                return `${baseStyles} border-2 border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 hover:scale-[1.02]`;
            default:
                return baseStyles;
        }
    };

    return (
        <div ref={sectionRef} className="relative w-full bg-white text-slate-900 overflow-hidden">
            
            {/* ── SECTION TARIFICATION (EN HAUT) ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                            {t("pricingTailoredNeeds")}
                        </span>
                        <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-6">
                            {tr.rich("offersFlexibleTransparent", { markerhighlight1: (chunks) => <MarkerHighlight color="rgba(99,102,241,0.12)">{chunks}</MarkerHighlight> })}
                        </h2>
                        <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
                            {t("choosePlanMatchesCompany")}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {PRICING_PLANS.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl flex flex-col ${
                                    plan.popular 
                                        ? "border-indigo-300 bg-indigo-50/30 shadow-lg scale-[1.02]" 
                                        : "border-slate-200 bg-white hover:border-indigo-200"
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                        {t("mostPopular")}
                                    </div>
                                )}
                                
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
                                    {getPlanIcon(plan.icon)}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-3xl font-black text-indigo-600">{plan.price}</span>
                                    <span className="text-slate-400 text-sm">{plan.period}</span>
                                </div>
                                <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                                
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                
                                {/* BOUTON HARMONISÉ - Même style pour tous les plans */}
                                <Link
                                    href="#"
                                    className={getButtonStyles(plan.buttonVariant)}
                                >
                                    {plan.buttonText}
                                </Link>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ── 1. TABLEAU COMPARATIF ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-100">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                            {t("oldParadigmOver")}
                        </span>
                        <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-6">
                            {tr.rich("whyLeadersChangingTheir", { markerhighlight1: (chunks) => <MarkerHighlight color="rgba(16, 185, 129, 0.12)">{chunks}</MarkerHighlight> })}
                        </h2>
                        <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
                            {t("compareHeavinessTraditional")}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-900 text-white font-bold p-5 text-sm tracking-wide border-b border-slate-800">
                            <div className="hidden md:block">{t("criterion")}</div>
                            <div className="opacity-60 flex items-center gap-2">
                                <span className="text-amber-400 text-lg">✕</span> {t("beforeOldMethods")}
                            </div>
                            <div className="text-emerald-400 flex items-center gap-2">
                                <span className="text-emerald-400 text-lg">✓</span> {t("nowAfrik")}
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                            </div>
                        </div>
                        
                        <div className="divide-y divide-slate-100">
                            {COMPARISONS.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 gap-4 text-sm items-center hover:bg-slate-50/60 transition-colors">
                                    <div className="font-black text-slate-900 text-base md:text-sm">{item.criterion}</div>
                                    <div className="text-slate-400 font-medium md:pr-4 flex items-start gap-2">
                                        <span className="text-amber-500 text-lg leading-none">✕</span> {item.old}
                                    </div>
                                    <div className="text-slate-700 font-semibold bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2 shadow-sm">
                                        <span className="text-emerald-500 text-lg leading-none">✓</span> {item.new}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── 2. PROCESSUS D'INTÉGRATION ── */}
            <section className="bg-slate-50 text-slate-900 py-28 relative border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    
                    <motion.div
                        initial="hidden"
                        animate={controls}
                        variants={containerVariants}
                    >
                        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">{t("agileDeployment")}</span>
                            <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-6">
                                {tr.rich("integrationFourKeyStages", { span1: (chunks) => <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-emerald-600">{chunks}</span> })}
                            </h2>
                            <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
                                {t("fromSetupContinuous")}
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                            {INTEGRATION_STEPS.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                                        activeStep === idx 
                                        ? "bg-white border-indigo-300 shadow-xl scale-[1.02]" 
                                        : "bg-white/80 border-slate-200 hover:shadow-md"
                                    }`}
                                >
                                    {idx === 3 && (
                                        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-emerald-500/30">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[9px] font-semibold text-emerald-600">{t("systemHealth")}</span>
                                        </div>
                                    )}
                                    
                                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg text-white`}>
                                        <step.Icon className="w-6 h-6" />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl font-black text-slate-400">{step.num}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                            {step.tag}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-black text-lg text-slate-800 mb-2">{step.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg">
                            <div className="bg-slate-50 rounded-2xl overflow-hidden p-6 min-h-100 flex flex-col justify-between">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-[11px] text-slate-500 font-bold ml-2">{t("afrikWorkspaceCoreSystem")}</span>
                                    </div>
                                    <div className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 px-3 py-1 rounded-full">
                                        {t("liveSandbox")}
                                    </div>
                                </div>

                                <div className="py-8 flex-1 flex flex-col justify-center">
                                    {activeStep === 0 && (
                                        <div className="space-y-4">
                                            <div className="text-xs font-bold text-indigo-600 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> {t("smartConfiguration2")}</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[tt("travelPolicy"), t("budgetCaps"), tt("approvalWorkflows"), tt("userProfiles")].map((item, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700">{item}</span>
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black">{t("configured")}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {activeStep === 1 && (
                                        <div className="space-y-4">
                                            <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> {t("erpSynchronization2")}</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {["SAP", "Odoo", "Salesforce", "Sage"].map((erp, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700">{erp}</span>
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black">{t("connected")}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-[11px] text-slate-500 text-center mt-2">{t("secureApiNoDouble")}</div>
                                        </div>
                                    )}
                                    {activeStep === 2 && (
                                        <div className="space-y-4">
                                            <div className="text-xs font-bold text-purple-600 flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" /> {t("guidedDeployment2")}</div>
                                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-black text-slate-700">{t("administratorTraining")}</span>
                                                    <span className="text-xs font-black text-white bg-indigo-600 px-2 py-1 rounded">{t("completed")}</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                                    <div className="w-full h-full bg-linear-to-r from-emerald-500 to-indigo-500" />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                                    <span>{t("mobileActivation98")}</span>
                                                    <span>{t("text245ActiveUsers")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeStep === 3 && (
                                        <div className="space-y-4">
                                            <div className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {t("continuousOptimization2")}</div>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-700">{t("savingsAchieved")}</span>
                                                    <span className="text-xl font-black text-emerald-600">-30%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="w-[30%] h-full bg-emerald-500 rounded-full" />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                    <span>{t("q32026Target")}</span>
                                                    <span className="text-emerald-600">{t("achieved")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                    <span>{t("securityAes256Encryption")}</span>
                                    <span>{t("realTimeUpdate")}</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── 3. SOCLE DE CONFIANCE ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                            {t("empiricalValidation")}
                        </span>
                        <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-5">
                            {tr.rich("trustThroughProof", { markerhighlight1: (chunks) => <MarkerHighlight color="rgba(59,130,246,0.12)">{chunks}</MarkerHighlight> })}
                        </h2>
                        <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
                            {t("findOutWhyMore")}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                        <TrustBadge icon={<ShieldCheck className="w-5 h-5" />} color="indigo">
                            <span className="font-bold text-indigo-600">{t("builtComplianceCompliance")}</span><br />
                            {t("travelPoliciesTaxRules")}
                        </TrustBadge>

                        <TrustBadge icon={<Smartphone className="w-5 h-5" />} color="emerald">
                            <span className="font-bold text-emerald-600">{t("mobileProofZeroEntry")}</span><br />
                            {t("aiScansCategorizesReceipts")}
                        </TrustBadge>

                        <TrustBadge icon={<Users className="w-5 h-5" />} color="purple">
                            <span className="font-bold text-purple-600">{t("text247HumanExpertise")}</span><br />
                            {t("multichannelAssistanceBased")}
                        </TrustBadge>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── 4. CARROUSSEL D'AVIS ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                            {t("whatTheySay")}
                        </span>
                        <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-6">
                            {tr.rich("moreThan500Companies", { markerhighlight1: (chunks) => <MarkerHighlight color="rgba(245,158,11,0.12)">{chunks}</MarkerHighlight> })}
                        </h2>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <ReviewsCarousel />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── 5. FAQ + FORMULAIRE DE CONTACT RAPIDE ── */}
            <section className="bg-slate-50 border-t border-slate-200 py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        animate={controls}
                        variants={containerVariants}
                    >
                        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-full">
                                {t("needHelp")}
                            </span>
                            <h2 style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }} className="text-3xl md:text-5xl text-[rgb(21,0,44)] tracking-tight mt-4 mb-6">
                                {tr.rich("frequentlyAskedQuestions", { markerhighlight1: (chunks) => <MarkerHighlight color="rgba(99,102,241,0.12)">{chunks}</MarkerHighlight> })}
                            </h2>
                            <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
                                {t("quicklyFindAnswerQuestions")}
                            </p>
                        </motion.div>

                        <div className=" gap-8">
                            {/* FAQ Accordéon - Colonne principale */}
                            <div className="lg:col-span-2 space-y-4">
                                {FAQ_ITEMS.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        variants={itemVariants}
                                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <button
                                            onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                                            className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors"
                                        >
                                            <span>{item.question}</span>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ml-4 shrink-0 ${openFAQ === idx ? "rotate-180 text-indigo-500" : ""}`} />
                                        </button>
                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openFAQ === idx ? "max-h-48 border-t border-slate-100" : "max-h-0"}`}>
                                            <div className="px-6 py-4 text-sm leading-relaxed text-slate-500">
                                                {item.answer}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Formulaire de contact rapide - Colonne de droite */}
                            {/* <motion.div variants={itemVariants}>
                                <QuickContactForm />
                            </motion.div> */}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}