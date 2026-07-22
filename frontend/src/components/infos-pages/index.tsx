// /src/components/infos-pages/index.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import AdvantagesSection from "./AdvantagesSection";
import OffersMapSection from "./OffersMapSection";
import ServicesSection from "./ServicesSection";
import IntegrationProcessSection from "./IntegrationProcessSection";
import PricingSection from "./PricingSection";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";
import { staggerContainer } from "../styles/animations";

export default function CSEPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <div 
      ref={sectionRef} 
      className="relative w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 overflow-x-hidden"
      style={{ fontFamily: "'Sanomat', 'Inter', system-ui, sans-serif" }}
    >
      <motion.div
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
        className="relative"
      >
        {/* Section 1: Avantages CSE - Comme sur la capture */}
        <AdvantagesSection />

        {/* Section 2: Carte des offres Afrique */}
        <OffersMapSection />

        {/* Section 3: Nos Services */}
        <ServicesSection />

        {/* Section 4: Processus d'intégration */}
        <IntegrationProcessSection />

        {/* Section 5: Tarifs et tableau comparatif */}
        <PricingSection />

        {/* Section 6: Témoignages avec vidéos */}
        <TestimonialsSection />

        {/* Section 7: FAQ et Contact */}
        <FAQSection />
      </motion.div>
    </div>
  );
}