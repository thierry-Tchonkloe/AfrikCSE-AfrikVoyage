import { Metadata } from "next";
import JoinUsPage from "@/components/infos-pages/JoinUsPage";

export const metadata: Metadata = {
    title: "Rejoignez-nous — AfrikCSE & AfrikVoyage",
    description: "Inscrivez votre entreprise sur AfrikCSE & AfrikVoyage et offrez à vos salariés des avantages CSE et des voyages d'affaires simplifiés.",
};

export default function JoinUs() {
    return <JoinUsPage />;
}