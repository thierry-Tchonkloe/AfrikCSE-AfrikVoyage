import { Metadata } from "next";
import HeroSection from "@/components/infos-pages/HeroSection";
import ChallengesAndSolutions from "@/components/infos-pages/ChallengesAndSolutions";
import PartnerMarquee from "@/components/infos-pages/PartnerMarquee";
import BenefitsAndTrust from "@/components/infos-pages/BenefitsAndTrust";

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
            <BenefitsAndTrust />
        </div>
    );
}