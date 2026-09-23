// /src/components/infos-pages/FAQSection.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  MessageCircle, 
  Phone, 
  Mail, 
  Send,
  Sparkles,
  Check,
  Clock,
  ShieldCheck,
  Users,
  Globe,
  Zap,
  FileText,
  Plane,
  Gift,
  Building2,
  User,
  PhoneCall,
  ArrowRight,
  HelpCircle,
  Headphones,
  Calendar,
  MapPin,
  Briefcase,
  Award
} from "lucide-react";
import { fadeInUp, scaleIn, slideInLeft, slideInRight } from "../styles/animations";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.faqSection">>;

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
  icon?: React.ReactNode;
  popular?: boolean;
}

const getFaqItems = (t: Translator): FAQItem[] => ([
  { id: 1, question: t("faq1Question"), answer: t("faq1Answer"), category: "integration", icon: <ShieldCheck className="w-4 h-4" />, popular: true },
  { id: 2, question: t("faq2Question"), answer: t("faq2Answer"), category: "deployment", icon: <Clock className="w-4 h-4" />, popular: true },
  { id: 3, question: t("faq3Question"), answer: t("faq3Answer"), category: "security", icon: <Globe className="w-4 h-4" /> },
  { id: 4, question: t("faq4Question"), answer: t("faq4Answer"), category: "compliance", icon: <FileText className="w-4 h-4" /> },
  { id: 5, question: t("faq5Question"), answer: t("faq5Answer"), category: "mobile", icon: <Zap className="w-4 h-4" />, popular: true },
  { id: 6, question: t("faq6Question"), answer: t("faq6Answer"), category: "support", icon: <Users className="w-4 h-4" /> },
  { id: 7, question: t("faq7Question"), answer: t("faq7Answer"), category: "customization", icon: <Check className="w-4 h-4" /> },
  { id: 8, question: t("faq8Question"), answer: t("faq8Answer"), category: "security", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 9, question: t("faq9Question"), answer: t("faq9Answer"), category: "cse", icon: <Gift className="w-4 h-4" /> },
  { id: 10, question: t("faq10Question"), answer: t("faq10Answer"), category: "travel", icon: <Plane className="w-4 h-4" /> },
]);

const getCategoryLabels = (t: Translator): Record<string, string> => ({
  integration: t("categoryIntegration"),
  deployment: t("categoryDeployment"),
  security: t("categorySecurity"),
  compliance: t("categoryCompliance"),
  mobile: t("categoryMobile"),
  support: t("categorySupport"),
  customization: t("categoryCustomization"),
  cse: t("categoryCse"),
  travel: t("categoryTravel"),
  other: t("categoryOther"),
});

export default function FAQSection() {
  const tr = useTranslations("infos.faqSection");
  const t = useTranslations("infos.faqSection");
  const FAQ_ITEMS = useMemo(() => getFaqItems(t), [t]);
  const CATEGORY_LABELS = useMemo(() => getCategoryLabels(t), [t]);
  const groupedFAQs = useMemo(() => FAQ_ITEMS.reduce((acc, item) => {
    const category = item.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>), [FAQ_ITEMS]);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    civilite: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    besoin: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = ["all", ...Object.keys(groupedFAQs)];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({
      civilite: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      besoin: ""
    });
    setFormStep(1);
  };

  const nextStep = () => setFormStep(Math.min(formStep + 1, 4));
  const prevStep = () => setFormStep(Math.max(formStep - 1, 1));

  const filteredFAQs = activeCategory && activeCategory !== "all"
    ? groupedFAQs[activeCategory] || []
    : FAQ_ITEMS;

  const renderFormStep = () => {
    switch(formStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t("who")} <span className="text-red-500">*</span>
              </label>
              <select
                name="civilite"
                value={formData.civilite}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white appearance-none"
                required
              >
                <option value="">{t("pleaseSelect")}</option>
                <option value="entreprise">{t("company")}</option>
                <option value="salarie">{t("employee")}</option>
                <option value="rh">{t("hrManager")}</option>
                <option value="cse">{t("cseMember")}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t("firstName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder={t("firstName2")}
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t("lastName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder={t("lastName2")}
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t("email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t("phone")} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+33 7 73 22 21 08"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t("company2")}
              </label>
              <input
                type="text"
                name="company"
                placeholder={t("companyName")}
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t("describeNeeds")} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="besoin"
                placeholder={t("tellUsAboutCse")}
                rows={5}
                value={formData.besoin}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                required
              />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t("verification")}</h3>
            <p className="text-slate-500 mb-6">{t("confirmInformationBefore")}</p>
            <div className="text-left bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p><span className="font-bold">{t("title")}</span> {formData.civilite || t("notSpecified")}</p>
              <p><span className="font-bold">{t("name")}</span> {formData.firstName} {formData.lastName}</p>
              <p><span className="font-bold">{t("email2")}</span> {formData.email}</p>
              <p><span className="font-bold">{t("phone2")}</span> {formData.phone}</p>
              <p><span className="font-bold">{t("company3")}</span> {formData.company || t("notSpecified")}</p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <motion.span 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              {t("assistanceSupport")}
            </span>
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            {tr.rich("questionAboutClubEmployes", { span1: (chunks) => <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">{chunks}</span> })}
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            {t("quicklyFindAnswerContact")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* FAQ Section - 3 colonnes */}
          <motion.div 
            variants={slideInLeft}
            className="lg:col-span-3 space-y-6"
          >
            {/* Categories Filter */}
            <div className="flex flex-wrap gap-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category === "all" ? null : category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    (activeCategory === null && category === "all") || activeCategory === category
                      ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-200/50"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {category === "all" ? t("all") : CATEGORY_LABELS[category] ?? category}
                  {category !== "all" && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      ({groupedFAQs[category]?.length || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* FAQ Accordéon */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredFAQs.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-slate-800 hover:bg-indigo-50/50 transition-colors group"
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <span className="text-indigo-500 shrink-0">{item.icon}</span>
                        <span>{item.question}</span>
                        {item.popular && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {t("popular")}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ml-4 shrink-0 ${
                        openFAQ === item.id ? "rotate-180 text-indigo-500" : ""
                      }`} />
                    </button>
                    <motion.div 
                      className="overflow-hidden"
                      initial={{ height: 0 }}
                      animate={{ height: openFAQ === item.id ? "auto" : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 py-4 text-sm leading-relaxed text-slate-500 border-t border-slate-100 bg-slate-50/50">
                        {item.answer}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Contact rapide */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://wa.me/33123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 text-sm font-medium text-emerald-700"
              >
                <MessageCircle className="w-5 h-5" />
                {t("whatsapp")}
              </a>
              <a
                href="tel:+33773222108"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200 text-sm font-medium text-indigo-700"
              >
                <Phone className="w-5 h-5" />
                +33 7 73 22 21 08
              </a>
              <a
                href="mailto:contact@club-employes.fr"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 text-sm font-medium text-slate-700"
              >
                <Mail className="w-5 h-5" />
                {t("contactClubEmployesFr")}
              </a>
            </div>
          </motion.div>

          {/* Formulaire de contact - 2 colonnes */}
          <motion.div 
            variants={slideInRight}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 sticky top-8">
              {/* En-tête du formulaire */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1 text-xs font-bold text-indigo-600 mb-2">
                  <Mail className="w-3 h-3" />
                  {t("contactUs")}
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {t("letSTalkAbout")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t("fillFormWillReply")}
                </p>
              </div>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-emerald-600">{t("messageSent")}</h4>
                  <p className="text-sm text-emerald-500/80 mt-1">
                    {t("teamWillGetBack")}
                  </p>
                  <div className="mt-4 text-xs text-slate-400">
                    {t("confirmationEmailHasBeen")}
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {renderFormStep()}
                  </AnimatePresence>

                  {/* Navigation du formulaire */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            step <= formStep ? 'bg-indigo-600' : 'bg-slate-200'
                          } ${step === formStep ? 'scale-125' : ''}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {formStep > 1 && formStep < 4 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {t("back")}
                        </button>
                      )}
                      {formStep < 4 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-sm font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                        >
                          {t("next")}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-sm font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {t("send")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mention légale */}
                  <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                    <p>
                      {t("respondRequestDataProcessed")}
                    </p>
                    <p className="mt-0.5">
                      {t("rights")} <a href="mailto:dpo@club-employes.fr" className="text-indigo-500 hover:underline">{t("dpoClubEmployesFr")}</a> · 
                      <a href="#" className="text-indigo-500 hover:underline ml-1">{t("privacyPolicy")}</a>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>

        {/* Section de confiance */}
        <motion.div 
          variants={fadeInUp}
          className="mt-16 flex flex-wrap justify-center gap-6"
        >
          {[
            { icon: <Headphones className="w-4 h-4" />, label: t("text247Support") },
            { icon: <Clock className="w-4 h-4" />, label: t("replyWithin24h") },
            { icon: <ShieldCheck className="w-4 h-4" />, label: t("secureData") },
            { icon: <Award className="w-4 h-4" />, label: t("recognizedExpertise") }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm text-slate-600"
            >
              <span className="text-indigo-500">{item.icon}</span>
              {item.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}