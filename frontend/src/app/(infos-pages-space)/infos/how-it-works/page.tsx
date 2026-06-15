import { Metadata } from "next";
import HowItWorksPage from "@/components/infos-pages/HowItWorksPage";

export const metadata: Metadata = {
    title: "Comment ça marche — AfrikCSE & AfrikVoyage",
    description: "Découvrez comment AfrikCSE & AfrikVoyage simplifie la gestion des avantages salariés et des voyages d'affaires pour votre entreprise.",
};

export default function HowItWorks() {
    return <HowItWorksPage />;
}