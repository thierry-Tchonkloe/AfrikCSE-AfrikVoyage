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
  FileText
} from "lucide-react";
import { fadeInUp, scaleIn } from "../styles/animations";

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
  icon?: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Comment se passe l'intégration avec nos outils existants ?",
    answer: "Notre équipe technique vous accompagne pour connecter votre ERP (SAP, Odoo, Salesforce) via notre API sécurisée. L'intégration se fait en moyenne en 2 semaines avec un support dédié.",
    category: "Intégration",
    icon: <ShieldCheck className="w-4 h-4" />
  },
  {
    question: "Quels sont les délais de mise en place ?",
    answer: "La plateforme peut être opérationnelle en 48h pour les fonctionnalités de base. L'intégration complète avec vos politiques voyage prend généralement 1 à 2 semaines.",
    category: "Déploiement",
    icon: <Clock className="w-4 h-4" />
  },
  {
    question: "Les données sont-elles hébergées en Afrique ?",
    answer: "Oui, nous proposons un hébergement local en Afrique (région Ouest ou Est selon votre préférence) avec une conformité RGPD et aux réglementations locales.",
    category: "Sécurité",
    icon: <Globe className="w-4 h-4" />
  },
  {
    question: "Comment gérez-vous la conformité fiscale multi-pays ?",
    answer: "Notre moteur de règles intègre automatiquement les spécificités fiscales de chaque pays (TVA, taxes locales, seuils d'exonération). Les politiques sont mises à jour en temps réel.",
    category: "Conformité",
    icon: <FileText className="w-4 h-4" />
  },
  {
    question: "Proposez-vous une application mobile ?",
    answer: "Oui, nos applications iOS et Android permettent aux employés de gérer leurs réservations, notes de frais et avantages CSE en mobilité complète.",
    category: "Mobile",
    icon: <Zap className="w-4 h-4" />
  },
  {
    question: "Quel est le support inclus ?",
    answer: "Le support est inclus 24/7 par chat et email. Les clients Enterprise bénéficient d'un account manager dédié et d'un SLA de 99.9%.",
    category: "Support",
    icon: <Users className="w-4 h-4" />
  },
  {
    question: "Pouvons-nous personnaliser les politiques de voyage ?",
    answer: "Absolument. Notre plateforme permet de configurer des politiques de voyage par département, par région ou par type de collaborateur, avec des niveaux d'approbation personnalisables.",
    category: "Personnalisation",
    icon: <Check className="w-4 h-4" />
  },
  {
    question: "Comment est gérée la confidentialité des données ?",
    answer: "Nous appliquons le principe de minimisation des données avec un chiffrement AES-256 au repos et TLS 1.3 en transit. L'accès aux données est strictement contrôlé par des rôles et permissions.",
    category: "Sécurité",
    icon: <ShieldCheck className="w-4 h-4" />
  }
];

// Group FAQs par catégorie
const groupedFAQs = FAQ_ITEMS.reduce((acc, item) => {
  const category = item.category || "Autre";
  if (!acc[category]) acc[category] = [];
  acc[category].push(item);
  return acc;
}, {} as Record<string, FAQItem[]>);

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = Object.keys(groupedFAQs);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const filteredFAQs = activeCategory 
    ? groupedFAQs[activeCategory] || []
    : FAQ_ITEMS;

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] mb-4">
            <Sparkles className="w-4 h-4" />
            Questions fréquentes
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            Tout ce que vous
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              devez savoir
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            Trouvez rapidement une réponse, ou contactez notre équipe
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Filtres par catégorie */}
          <motion.div 
            variants={scaleIn}
            className="lg:col-span-1"
          >
            <div className="sticky top-8 bg-white rounded-3xl border border-slate-200 shadow-xl p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Catégories</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeCategory === null
                      ? "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600"
                      : "hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Toutes les questions
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeCategory === category
                        ? "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600"
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    {groupedFAQs[category][0]?.icon}
                    {category}
                    <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                      {groupedFAQs[category].length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Contact rapide */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-3">Contact direct</p>
                <div className="space-y-2">
                  <a
                    href="https://wa.me/33123456789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-600">WhatsApp</div>
                      <div className="text-[10px] text-slate-500">Réponse en 5 min</div>
                    </div>
                  </a>
                  <a
                    href="tel:+33123456789"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-600">Téléphone</div>
                      <div className="text-[10px] text-slate-500">+33 1 23 45 67 89</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Colonne droite : FAQ + Formulaire */}
          <motion.div 
            variants={scaleIn}
            className="lg:col-span-2 space-y-6"
          >
            {/* FAQ Accordéon */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredFAQs.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        {item.icon && (
                          <span className="text-indigo-500">{item.icon}</span>
                        )}
                        {item.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ml-4 shrink-0 ${
                        openFAQ === idx ? "rotate-180 text-indigo-500" : ""
                      }`} />
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      openFAQ === idx ? "max-h-48 border-t border-slate-100" : "max-h-0"
                    }`}>
                      <div className="px-6 py-4 text-sm leading-relaxed text-slate-500">
                        {item.answer}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Formulaire de contact */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Vous avez une question ?</h3>
                  <p className="text-xs text-slate-500">Notre équipe vous répond sous 24h</p>
                </div>
              </div>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-emerald-600">Message envoyé !</p>
                  <p className="text-sm text-emerald-500/80">Nous vous répondrons rapidement</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Votre email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                  <textarea
                    name="message"
                    placeholder="Votre message..."
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-emerald-500 text-white py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}