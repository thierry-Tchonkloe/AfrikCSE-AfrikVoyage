import { Metadata } from "next";
import DemoPage from '@/components/infos-pages/DemoPage';

export const metadata: Metadata = {
    title: "Demander une démo — AfrikCSE & AfrikVoyage",
    description: "Découvrez en 15 minutes comment AfrikCSE & AfrikVoyage transforme la gestion de vos avantages salariés et voyages d'affaires. Démonstration personnalisée par nos experts.",
    keywords: "démo AfrikVoyage, démonstration AfrikCSE, plateforme voyages d'affaires, avantages salariés, démo gratuite",
    openGraph: {
        title: "Demander une démo — AfrikCSE & AfrikVoyage",
        description: "Découvrez en 15 minutes comment notre plateforme unifiée peut réduire vos coûts de 30% et booster l'engagement de vos équipes.",
        type: "website",
        siteName: "AfrikWorkspace",
    },
    twitter: {
        card: "summary_large_image",
        title: "Demander une démo — AfrikCSE & AfrikVoyage",
        description: "Découvrez en 15 minutes comment notre plateforme unifiée peut réduire vos coûts de 30%.",
    },
};

export default function DemoRequestPage() {
    return <DemoPage />;
}