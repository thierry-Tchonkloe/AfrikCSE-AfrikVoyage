import { Metadata } from "next";
import AboutPage from "@/components/infos-pages/AboutPage";

export const metadata: Metadata = {
    title: "À propos — AfrikCSE & AfrikVoyage",
    description: "Découvrez la mission, l'équipe et les valeurs derrière AfrikCSE & AfrikVoyage, la plateforme de gestion CSE et voyages d'affaires en Afrique.",
};

export default function About() {
    return <AboutPage />;
}