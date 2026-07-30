// /src/components/infos-pages/FAQSection.tsx
"use client";

import React, { useState } from "react";
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

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
  icon?: React.ReactNode;
  popular?: boolean;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: "Comment se passe l'intégration avec nos outils existants ?",
    answer: "Notre équipe technique vous accompagne pour connecter votre ERP (SAP, Odoo, Salesforce) via notre API sécurisée. L'intégration se fait en moyenne en 2 semaines avec un support dédié.",
    category: "Intégration",
    icon: <ShieldCheck className="w-4 h-4" />,
    popular: true
  },
  {
    id: 2,
    question: "Quels sont les délais de mise en place de la plateforme CSE ?",
    answer: "La plateforme peut être opérationnelle en 48h pour les fonctionnalités de base. L'intégration complète avec vos politiques voyage et CSE prend généralement 1 à 2 semaines.",
    category: "Déploiement",
    icon: <Clock className="w-4 h-4" />,
    popular: true
  },
  {
    id: 3,
    question: "Les données sont-elles hébergées en Afrique ?",
    answer: "Oui, nous proposons un hébergement local en Afrique (région Ouest ou Est selon votre préférence) avec une conformité RGPD et aux réglementations locales.",
    category: "Sécurité",
    icon: <Globe className="w-4 h-4" />
  },
  {
    id: 4,
    question: "Comment gérez-vous la conformité fiscale multi-pays pour les voyages ?",
    answer: "Notre moteur de règles intègre automatiquement les spécificités fiscales de chaque pays (TVA, taxes locales, seuils d'exonération). Les politiques sont mises à jour en temps réel.",
    category: "Conformité",
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: 5,
    question: "Proposez-vous une application mobile pour les avantages CSE ?",
    answer: "Oui, nos applications iOS et Android permettent aux employés de gérer leurs réservations, notes de frais et avantages CSE en mobilité complète.",
    category: "Mobile",
    icon: <Zap className="w-4 h-4" />,
    popular: true
  },
  {
    id: 6,
    question: "Quel est le support inclus pour les voyages d'affaires ?",
    answer: "Le support est inclus 24/7 par chat et email. Les clients Enterprise bénéficient d'un account manager dédié et d'un SLA de 99.9%.",
    category: "Support",
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 7,
    question: "Pouvons-nous personnaliser les politiques de voyage et CSE ?",
    answer: "Absolument. Notre plateforme permet de configurer des politiques par département, par région ou par type de collaborateur, avec des niveaux d'approbation personnalisables.",
    category: "Personnalisation",
    icon: <Check className="w-4 h-4" />
  },
  {
    id: 8,
    question: "Comment est gérée la confidentialité des données des salariés ?",
    answer: "Nous appliquons le principe de minimisation des données avec un chiffrement AES-256 au repos et TLS 1.3 en transit. L'accès aux données est strictement contrôlé par des rôles et permissions.",
    category: "Sécurité",
    icon: <ShieldCheck className="w-4 h-4" />
  },
  {
    id: 9,
    question: "Quels types d'avantages CSE sont disponibles ?",
    answer: "Nous proposons un catalogue complet : cartes cadeaux digitales, billetterie loisirs et culture, offres de réduction locales, chèques vacances, et bien plus encore.",
    category: "CSE",
    icon: <Gift className="w-4 h-4" />
  },
  {
    id: 10,
    question: "Comment gérer les réservations de voyages en groupe ?",
    answer: "Notre plateforme permet de gérer facilement les voyages en groupe avec des fonctionnalités dédiées : réservations groupées, suivi des participants, gestion des budgets.",
    category: "Voyages",
    icon: <Plane className="w-4 h-4" />
  }
];

// Group FAQs par catégorie
const groupedFAQs = FAQ_ITEMS.reduce((acc, item) => {
  const category = item.category || "Autre";
  if (!acc[category]) acc[category] = [];
  acc[category].push(item);
  return acc;
}, {} as Record<string, FAQItem[]>);

// Questions populaires
const popularFAQs = FAQ_ITEMS.filter(item => item.popular);

export default function FAQSection() {
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

  const categories = ["Toutes", ...Object.keys(groupedFAQs)];

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

  const filteredFAQs = activeCategory && activeCategory !== "Toutes"
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
                Vous êtes ? <span className="text-red-500">*</span>
              </label>
              <select
                name="civilite"
                value={formData.civilite}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white appearance-none"
                required
              >
                <option value="">Veuillez sélectionner</option>
                <option value="entreprise">Entreprise</option>
                <option value="salarie">Salarié</option>
                <option value="rh">Responsable RH</option>
                <option value="cse">Membre CSE</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Votre prénom"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Votre nom"
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
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Téléphone <span className="text-red-500">*</span>
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
                Société
              </label>
              <input
                type="text"
                name="company"
                placeholder="Nom de votre entreprise"
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
                Décrivez votre besoin <span className="text-red-500">*</span>
              </label>
              <textarea
                name="besoin"
                placeholder="Parlez-nous de votre projet CSE ou de voyages d'affaires..."
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
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Vérification</h3>
            <p className="text-slate-500 mb-6">Confirmez vos informations avant l'envoi</p>
            <div className="text-left bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p><span className="font-bold">Civilité :</span> {formData.civilite || "Non spécifié"}</p>
              <p><span className="font-bold">Nom :</span> {formData.firstName} {formData.lastName}</p>
              <p><span className="font-bold">Email :</span> {formData.email}</p>
              <p><span className="font-bold">Téléphone :</span> {formData.phone}</p>
              <p><span className="font-bold">Société :</span> {formData.company || "Non spécifié"}</p>
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
              Assistance & Support
            </span>
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            Une question sur l'offre
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500">
              Club Employés ?
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            Trouvez rapidement une réponse ou contactez notre équipe dédiée
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
                  onClick={() => setActiveCategory(category === "Toutes" ? null : category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    (activeCategory === null && category === "Toutes") || activeCategory === category
                      ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-200/50"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {category === "Toutes" ? "📋 Toutes" : category}
                  {category !== "Toutes" && (
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
                            POPULAIRE
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
                WhatsApp
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
                contact@club-employes.fr
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
                  Contactez-nous
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Parlons de votre projet
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Remplissez le formulaire, nous vous répondrons sous 24h
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
                  <h4 className="text-xl font-bold text-emerald-600">Message envoyé !</h4>
                  <p className="text-sm text-emerald-500/80 mt-1">
                    Notre équipe vous répondra dans les meilleurs délais.
                  </p>
                  <div className="mt-4 text-xs text-slate-400">
                    📧 Un email de confirmation vous a été envoyé
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
                          Retour
                        </button>
                      )}
                      {formStep < 4 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-sm font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                        >
                          Suivant
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-sm font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Envoyer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mention légale */}
                  <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                    <p>
                      Pour répondre à votre demande, vos données sont traitées par Club Employés 
                      et sont conservées 3 ans.
                    </p>
                    <p className="mt-0.5">
                      Vos droits : <a href="mailto:dpo@club-employes.fr" className="text-indigo-500 hover:underline">dpo@club-employes.fr</a> · 
                      <a href="#" className="text-indigo-500 hover:underline ml-1">Politique de confidentialité</a>
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
            { icon: <Headphones className="w-4 h-4" />, label: "Support 24/7" },
            { icon: <Clock className="w-4 h-4" />, label: "Réponse sous 24h" },
            { icon: <ShieldCheck className="w-4 h-4" />, label: "Données sécurisées" },
            { icon: <Award className="w-4 h-4" />, label: "Expertise reconnue" }
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