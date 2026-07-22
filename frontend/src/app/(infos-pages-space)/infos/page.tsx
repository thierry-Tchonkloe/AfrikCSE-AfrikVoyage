// /src/app/infos/page.tsx (ou /src/pages/infos/index.tsx selon votre structure)
import { Metadata } from "next";
import HeroSection from "@/components/infos-pages/HeroSection";
import ChallengesAndSolutions from "@/components/infos-pages/ChallengesAndSolutions";
import PartnerMarquee from "@/components/infos-pages/PartnerMarquee";
import AdvantagesSection from "@/components/infos-pages/AdvantagesSection";
import OffersMapSection from "@/components/infos-pages/OffersMapSection";
import ServicesSection from "@/components/infos-pages/ServicesSection";
import IntegrationProcessSection from "@/components/infos-pages/IntegrationProcessSection";
import PricingSection from "@/components/infos-pages/PricingSection";
import TestimonialsSection from "@/components/infos-pages/TestimonialsSection";
import FAQSection from "@/components/infos-pages/FAQSection";

export const metadata: Metadata = {
    title: "AfrikCSE & AfrikVoyage — Gestion CSE et voyages d'affaires en Afrique",
    description: "La plateforme tout-en-un pour gérer les avantages salariés (CSE) et les voyages d'affaires de votre entreprise en Afrique.",
};

export default function InfosPage() {
    return (
        <div className="bg-white">
            <HeroSection />
            <ChallengesAndSolutions />
            <PartnerMarquee />
            
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
        </div>
    );
}