"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion, useAnimation, useInView } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.demoPage">>;

// ─── SCHÉMA DE VALIDATION ──────────────────────────────────────────────────────

const getSchema = (t: Translator) => (z.object({
    interest: z.enum(["voyage", "cse", "both"]),
    fullName: z.string().min(2, t("fullNameRequired")),
    email: z.string().email(t("invalidEmail")),
    company: z.string().min(2, t("companyNameRequired")),
    role: z.string().min(1, t("roleRequired")),
    phone: z.string().optional(),
    preferredTime: z.string().optional(),
    message: z.string().optional(),
}));

type FormData = z.infer<ReturnType<typeof getSchema>>;

// ─── DONNÉES ──────────────────────────────────────────────────────────────────

const getRoles = (t: Translator) => ([
    { value: "rh", label: t("humanResources"), icon: "👥" },
    { value: "cfo", label: t("financeCfo"), icon: "📊" },
    { value: "travel", label: t("travelManagement"), icon: "✈️" },
    { value: "manager", label: t("managementManager"), icon: "🎯" },
    { value: "other", label: t("other"), icon: "💼" },
]);

const getTimeSlots = (t: Translator) => ([
    t("morning9am12pm"),
    t("afternoon2pm5pm"),
    t("lateDay5pm7pm"),
    t("iDonTKnow")
]);

// Images pour le carrousel de fond
const getBackgroundImages = (t: Translator) => ([
    {
        src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format",
        alt: t("airplaneSky"),
    },
    {
        src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format",
        alt: t("teamMeeting"),
    },
    {
        src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format",
        alt: t("employeeWork"),
    },
    {
        src: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2074&auto=format",
        alt: t("employeeBenefits"),
    }
]);

// ─── COMPOSANT CARROUSSEL D'IMAGES ─────────────────────────────────────────────

function BackgroundCarousel() {
    const t = useTranslations("infos.demoPage");
    const BACKGROUND_IMAGES = useMemo(() => getBackgroundImages(t), [t]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {BACKGROUND_IMAGES.map((image, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: currentIndex === index ? 1 : 0 }}
                >
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/60" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
            ))}
        </div>
    );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function HeroSection() {
    const tr = useTranslations("infos.demoPage");
    const t = useTranslations("infos.demoPage");
    return (
        <section className="relative overflow-hidden min-h-[85vh] flex items-center">
            <BackgroundCarousel />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 mb-6">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-xs font-semibold text-indigo-200">{t("personalizedDemo")}</span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                            {tr.rich("discoverFutureBusiness", { p1: t("text15Minutes"), span1: (chunks) => <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">{chunks}</span>, br: () => <br /> })}
                        </h1>
                        
                        <p className="mt-4 text-lg text-slate-200 leading-relaxed">
                            {tr.rich("join500CompaniesHave", { span1: (chunks) => <span className="font-bold text-emerald-400">{chunks}</span> })}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                                <span className="text-emerald-400 text-sm">✓</span>
                                <span className="text-xs text-white/80">{t("text30Costs")}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                                <span className="text-indigo-400 text-sm">✓</span>
                                <span className="text-xs text-white/80">{t("text95Adoption")}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                                <span className="text-emerald-400 text-sm">✓</span>
                                <span className="text-xs text-white/80">{t("text54CountriesCovered")}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ─── FORMULAIRE DE DEMO ───────────────────────────────────────────────────────

function DemoForm() {
    const tr = useTranslations("infos.demoPage");
    const t = useTranslations("infos.demoPage");
    const schema = useMemo(() => getSchema(t), [t]);
    const ROLES = useMemo(() => getRoles(t), [t]);
    const TIME_SLOTS = useMemo(() => getTimeSlots(t), [t]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            interest: "both",
            role: "",
        }
    });

    const selectedInterest = watch("interest");

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log("Form data:", data);
            toast.success(t("requestSentExpertWill"));
            setSubmitted(true);
            reset();
            setTimeout(() => setSubmitted(false), 3000);
        } catch {
            toast.error(t("errorPleaseTryAgain"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputGlass = "w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/50 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 px-4 py-3 text-sm";

    return (
        <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            {t("personalizedRequest")}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                            {tr.rich("tailorMadeDemo", { span1: (chunks) => <span className="bg-linear-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">{chunks}</span> })}
                        </h2>
                        <p className="mt-3 text-slate-500 leading-relaxed">
                            {t("fillFormExpertWill")}
                        </p>
                        
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 text-sm">✓</span>
                                </div>
                                <span className="text-sm text-slate-600">{t("replyWithin24h")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 text-sm">✓</span>
                                </div>
                                <span className="text-sm text-slate-600">{t("demoTailoredNeeds")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 text-sm">✓</span>
                                </div>
                                <span className="text-sm text-slate-600">{t("text14DayTestAccess")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">{t("bookDemo")}</h3>
                        
                        {submitted ? (
                            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                                <div className="text-4xl mb-3">🎉</div>
                                <p className="text-white font-semibold">{t("requestSent")}</p>
                                <p className="text-indigo-200 text-sm mt-2">{t("expertWillContactWithin")}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-indigo-200 mb-2 uppercase tracking-wider">
                                        {t("iAmMainlyInterested")}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => register("interest").onChange({ target: { value: "voyage" } })}
                                            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                                                selectedInterest === "voyage"
                                                    ? "bg-white text-indigo-700 shadow-md"
                                                    : "bg-white/10 text-indigo-200 hover:bg-white/20"
                                            }`}
                                        >
                                            {t("travel")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => register("interest").onChange({ target: { value: "cse" } })}
                                            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                                                selectedInterest === "cse"
                                                    ? "bg-white text-indigo-700 shadow-md"
                                                    : "bg-white/10 text-indigo-200 hover:bg-white/20"
                                            }`}
                                        >
                                            {t("benefits")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => register("interest").onChange({ target: { value: "both" } })}
                                            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                                                selectedInterest === "both"
                                                    ? "bg-white text-indigo-700 shadow-md"
                                                    : "bg-white/10 text-indigo-200 hover:bg-white/20"
                                            }`}
                                        >
                                            {t("both")}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <input
                                        {...register("fullName")}
                                        type="text"
                                        placeholder={t("fullName")}
                                        className={inputGlass}
                                    />
                                    {errors.fullName && (
                                        <p className="text-xs text-rose-300 mt-1">{errors.fullName.message}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        {...register("email")}
                                        type="email"
                                        placeholder={t("businessEmail")}
                                        className={inputGlass}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-rose-300 mt-1">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        {...register("company")}
                                        type="text"
                                        placeholder={t("companyName")}
                                        className={inputGlass}
                                    />
                                    {errors.company && (
                                        <p className="text-xs text-rose-300 mt-1">{errors.company.message}</p>
                                    )}
                                </div>

                                <div>
                                    <select
                                        {...register("role")}
                                        className={`${inputGlass} appearance-none`}
                                    >
                                        <option value="" className="text-slate-800">{t("role")}</option>
                                        {ROLES.map((role) => (
                                            <option key={role.value} value={role.value} className="text-slate-800">
                                                {role.icon} {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && (
                                        <p className="text-xs text-rose-300 mt-1">{errors.role.message}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        {...register("phone")}
                                        type="tel"
                                        placeholder={t("phoneOptional")}
                                        className={inputGlass}
                                    />
                                </div>

                                <div>
                                    <select
                                        {...register("preferredTime")}
                                        className={`${inputGlass} appearance-none`}
                                    >
                                        <option value="">{t("callbackPreference")}</option>
                                        {TIME_SLOTS.map((slot) => (
                                            <option key={slot} value={slot} className="text-slate-800">{slot}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <textarea
                                        {...register("message")}
                                        rows={3}
                                        placeholder={t("messageSpecificNeedsOptional")}
                                        className={`${inputGlass} resize-none`}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="relative w-full py-3.5 rounded-xl bg-white text-indigo-700 font-bold text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            {t("sending")}
                                        </>
                                    ) : (
                                        <>
                                            {t("scheduleMyDemo")}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                
                                <p className="text-center text-[10px] text-indigo-300 mt-3">
                                    {t("noCommitmentReplyWithin")}
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// Section "Pourquoi une démo ?"
function WhyDemoSection() {
    const tr = useTranslations("infos.demoPage");
    const t = useTranslations("infos.demoPage");
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    const cards = [
        {
            icon: "🤖",
            title: t("samAi"),
            description: t("discoverAiEngineCapable"),
            color: "indigo",
            badge: t("aiActive")
        },
        {
            icon: "📉",
            title: t("immediateRoi"),
            description: t("seeHowRealTime"),
            color: "emerald",
            badge: t("text30Savings")
        },
        {
            icon: "🎯",
            title: t("wellBeingCsr"),
            description: t("exploreNetflixStyleService"),
            color: "purple",
            badge: t("integratedCsr")
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.5 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section ref={ref} className="py-20 bg-slate-50 border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                        {t("whatWillDiscover")}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                        {tr.rich("whyDemoChangesEverything", { span1: (chunks) => <span className="text-indigo-600">{chunks}</span> })}
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {cards.map((card, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 duration-300"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-${card.color}-100 flex items-center justify-center text-2xl mb-4`}>
                                {card.icon}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-slate-800">{card.title}</h3>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-${card.color}-100 text-${card.color}-600`}>
                                    {card.badge}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Section Certifications
function TrustSection() {
    const t = useTranslations("infos.demoPage");
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    return (
        <section ref={ref} className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Témoignage */}
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                        <div className="flex justify-center mb-4">
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-600 text-lg italic">
                            {t("afrikworkspaceAllowedUs")}
                        </p>
                        <div className="mt-4">
                            <p className="font-bold text-slate-800">{t("marieDubois")}</p>
                            <p className="text-sm text-slate-500">{t("hrDirectorTechafrik")}</p>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 bg-emerald-100 rounded-full px-3 py-1">
                            <span className="text-emerald-600 font-bold text-sm">-30%</span>
                            <span className="text-xs text-emerald-700">{t("travelCosts")}</span>
                        </div>
                    </div>
                </div>

                {/* Certifications */}
                <div className="flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100">
                        <span className="text-green-600 text-lg">🔒</span>
                        <span className="text-sm font-medium text-slate-700">{t("gdprCompliant")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100">
                        <span className="text-indigo-600 text-lg">📄</span>
                        <span className="text-sm font-medium text-slate-700">{t("zeroPaperEvidentiaryValue")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100">
                        <span className="text-emerald-600 text-lg">🛡️</span>
                        <span className="text-sm font-medium text-slate-700">{t("aes256Security")}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Section Processus améliorée
function ProcessSection() {
    const tt = useTranslations("infos.demoPage");
    const tr = useTranslations("infos.demoPage");
    const t = useTranslations("infos.demoPage");
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) controls.start("visible");
    }, [isInView, controls]);

    const steps = [
        { 
            number: "01", 
            title: t("text15MinuteExchange"), 
            description: t("expertAnalyzesSpecificNeeds"),
            icon: "🎯",
            duration: "15 min",
            color: "indigo"
        },
        { 
            number: "02", 
            title: t("personalizedDemo"), 
            description: t("showPlatformConfigured"),
            icon: "✨",
            duration: "30 min",
            color: "emerald"
        },
        { 
            number: "03", 
            title: t("testAccess"), 
            description: t("receiveCredentialsTest"),
            icon: "🔓",
            duration: tt("text14Days"),
            color: "purple"
        }
    ];

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
        hidden: { opacity: 0, y: 40 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    return (
        <section ref={ref} className="py-24 bg-linear-to-b from-white to-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-0 w-72 h-72 rounded-full bg-indigo-50/30 blur-[80px]" />
                <div className="absolute bottom-1/3 right-0 w-72 h-72 rounded-full bg-emerald-50/30 blur-[80px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        {t("simplifiedProcess")}
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                        {tr.rich("whatHappensNext", { span1: (chunks) => <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{chunks}</span> })}
                    </h2>
                    <div className="w-24 h-1 bg-linear-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mt-4" />
                    <p className="mt-5 text-slate-500 text-lg max-w-2xl mx-auto">
                        {t("text3SimpleStepsDiscover")}
                    </p>
                </div>

                <div className="relative">
                    <div className="hidden lg:block absolute top-32 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-200 via-emerald-200 to-purple-200 rounded-full" />
                    
                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className="relative group"
                            >
                                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative z-10">
                                    <div className="absolute -top-3 right-6">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-${step.color}-100 text-${step.color}-600 shadow-sm`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {step.duration}
                                        </span>
                                    </div>

                                    <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 flex items-center justify-center text-3xl mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                                        {step.icon}
                                    </div>

                                    <div className={`text-5xl font-black text-${step.color}-100 text-center mb-2`}>
                                        {step.number}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 text-center mb-3">
                                        {step.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                                        {step.description}
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-center gap-1">
                                            {[...Array(3)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        i <= idx 
                                                            ? `w-4 bg-${step.color}-500` 
                                                            : "w-1.5 bg-slate-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {idx < steps.length - 1 && (
                                    <div className="lg:hidden flex justify-center my-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            ↓
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md border border-slate-200">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">AD</div>
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">FB</div>
                                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">KA</div>
                            </div>
                            <p className="text-sm text-slate-600">
                                {tr.rich("text50ExpertsReadyListen", { span1: (chunks) => <span className="font-bold text-slate-800">{chunks}</span> })}
                            </p>
                            <div className="w-px h-6 bg-slate-200" />
                            <p className="text-sm text-emerald-600 font-semibold">
                                {t("customerSatisfaction96")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bg-indigo-500 { background-color: #6366F1; }
                .bg-indigo-600 { background-color: #4F46E5; }
                .bg-indigo-100 { background-color: #E0E7FF; }
                .text-indigo-600 { color: #4F46E5; }
                .text-indigo-100 { color: #E0E7FF; }
                .from-indigo-500 { --tw-gradient-from: #6366F1; }
                .to-indigo-600 { --tw-gradient-to: #4F46E5; }
                
                .bg-emerald-500 { background-color: #10B981; }
                .bg-emerald-600 { background-color: #059669; }
                .bg-emerald-100 { background-color: #D1FAE5; }
                .text-emerald-600 { color: #059669; }
                .text-emerald-100 { color: #D1FAE5; }
                .from-emerald-500 { --tw-gradient-from: #10B981; }
                .to-emerald-600 { --tw-gradient-to: #059669; }
                
                .bg-purple-500 { background-color: #8B5CF6; }
                .bg-purple-600 { background-color: #7C3AED; }
                .bg-purple-100 { background-color: #EDE9FE; }
                .text-purple-600 { color: #7C3AED; }
                .text-purple-100 { color: #EDE9FE; }
                .from-purple-500 { --tw-gradient-from: #8B5CF6; }
                .to-purple-600 { --tw-gradient-to: #7C3AED; }
            `}</style>
        </section>
    );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function DemoPage() {
    return (
        <main className="min-h-screen bg-white font-sans antialiased">
            <HeroSection />
            <DemoForm />
            <WhyDemoSection />
            <TrustSection />
            <ProcessSection />
        </main>
    );
}