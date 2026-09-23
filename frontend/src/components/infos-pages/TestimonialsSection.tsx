// components/CSEPage/TestimonialsSection.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Play, 
  Volume2, 
  VolumeX,
  Sparkles,
  User,
  Quote
} from "lucide-react";
import { fadeInUp, scaleIn } from "../styles/animations";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.testimonialsSection">>;

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  avatarBg: string;
  text: string;
  rating: number;
  date: string;
  videoUrl?: string;
}

interface VideoTestimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  thumbnail: string;
  duration: string;
}

const getTextTestimonials = (t: Translator): Testimonial[] => ([
  {
    id: 1,
    name: t("marieDubois"),
    role: t("hrDirector"),
    company: t("techafrik"),
    avatar: "MD",
    avatarBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
    text: t("cseSolutionRevolutionized"),
    rating: 5,
    date: t("text2MonthsAgo")
  },
  {
    id: 2,
    name: t("jeanPaulKouassi"),
    role: "CFO",
    company: t("innovcorp"),
    avatar: "JK",
    avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
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
    avatarBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    text: t("digitalBenefitsCatalogWorks"),
    rating: 4,
    date: t("text3DaysAgo")
  },
  {
    id: 4,
    name: t("thomasMartin"),
    role: "DG",
    company: t("afrilogistics"),
    avatar: "TM",
    avatarBg: "bg-gradient-to-br from-purple-500 to-pink-600",
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
    avatarBg: "bg-gradient-to-br from-rose-500 to-red-600",
    text: t("employeesDelightedNoMore"),
    rating: 5,
    date: t("text1MonthAgo")
  }
]);

const getVideoTestimonials = (t: Translator): VideoTestimonial[] => ([
  {
    id: 1,
    name: t("davidK"),
    role: "CEO",
    company: t("afriktech"),
    thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop",
    duration: "2:34"
  },
  {
    id: 2,
    name: t("sophieL"),
    role: "DRH",
    company: t("ecosolutions"),
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    duration: "1:48"
  },
  {
    id: 3,
    name: t("mohamed"),
    role: "COO",
    company: t("logiafrica"),
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    duration: "3:12"
  }
]);

// Composant étoiles
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
    ))}
  </div>
);

export default function TestimonialsSection() {
  const tr = useTranslations("infos.testimonialsSection");
  const t = useTranslations("infos.testimonialsSection");
  const TEXT_TESTIMONIALS = useMemo(() => getTextTestimonials(t), [t]);
  const VIDEO_TESTIMONIALS = useMemo(() => getVideoTestimonials(t), [t]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalItems = TEXT_TESTIMONIALS.length;

  // Auto-play
  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % totalItems);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, totalItems]);

  const nextTestimonial = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % totalItems);
  };

  const prevTestimonial = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
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

  const currentTestimonial = TEXT_TESTIMONIALS[activeIndex];

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-600 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] mb-4">
            <Sparkles className="w-4 h-4" />
            {t("whatTheySay")}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            {tr.rich("moreThan500Companies", { span1: (chunks) => <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{chunks}</span> })}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche : Témoignages textes */}
          <motion.div 
            variants={scaleIn}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 relative overflow-hidden"
          >
            {/* Contrôles */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <StarRating rating={4.7} />
                  <span className="text-2xl font-black text-slate-800">4.7</span>
                  <span className="text-slate-400 text-sm">/5</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{t("basedReviews", { length: TEXT_TESTIMONIALS.length })}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={prevTestimonial}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-indigo-100" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full ${currentTestimonial.avatarBg} text-white font-black flex items-center justify-center shadow-md`}>
                      {currentTestimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{currentTestimonial.name}</h4>
                      <p className="text-slate-400 text-xs">{currentTestimonial.role} · {currentTestimonial.company}</p>
                    </div>
                  </div>
                  <StarRating rating={currentTestimonial.rating} />
                  <p className="text-slate-600 mt-4 leading-relaxed text-lg">
                    &quot;{currentTestimonial.text}&quot;
                  </p>
                  <p className="text-slate-400 text-xs mt-4">{currentTestimonial.date}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Indicateurs */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {TEXT_TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > activeIndex ? 1 : -1);
                    setActiveIndex(i);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    i === activeIndex 
                      ? 'w-6 h-1.5 bg-indigo-600' 
                      : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Colonne droite : Témoignages vidéo */}
          <motion.div 
            variants={scaleIn}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-500" />
                {t("videoTestimonials")}
              </h3>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {autoPlay ? t("pause") : t("autoPlay")}
              </button>
            </div>

            {VIDEO_TESTIMONIALS.map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                    <img
                      src={video.thumbnail}
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{video.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{video.role} · {video.company}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        {t("testimonial")}
                      </span>
                    </div>
                  </div>

                  {/* Bouton lecture */}
                  <button
                    onClick={() => setIsPlaying(isPlaying === video.id ? null : video.id)}
                    className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    {isPlaying === video.id ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Zone de lecture */}
                <AnimatePresence>
                  {isPlaying === video.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 p-4 bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" />
                        </div>
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-slate-600" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                        <span className="text-xs font-medium text-slate-500">1:32 / 2:34</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}