import { Metadata } from "next";
import PrivacyPage from "@/components/infos-pages/PrivacyPage";

export const metadata: Metadata = {
    title: "Politique de confidentialité — AfrikCSE & AfrikVoyage",
    description: "Politique de confidentialité et protection des données personnelles (RGPD) d'AfrikCSE & AfrikVoyage.",
};

export default function Privacy() {
    return <PrivacyPage />;
}
