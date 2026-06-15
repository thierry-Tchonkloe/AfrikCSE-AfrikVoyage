import { Metadata } from "next";
import PricingPage from "@/components/infos-pages/PricingPage";

export const metadata: Metadata = {
    title: "Tarifs — AfrikCSE & AfrikVoyage",
    description: "Découvrez nos plans tarifaires Starter, Business et Enterprise pour la gestion CSE et voyages d'affaires.",
};

export default function Pricing() {
    return <PricingPage />;
}
