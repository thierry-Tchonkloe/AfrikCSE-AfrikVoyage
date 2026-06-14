import { Metadata } from "next";
import ContactPage from "@/components/infos-pages/ContactPage";

export const metadata: Metadata = {
    title: "Contact — AfrikCSE & AfrikVoyage",
    description: "Contactez l'équipe AfrikCSE & AfrikVoyage pour toute question sur nos offres CSE et voyages d'affaires.",
};

export default function Contact() {
    return <ContactPage />;
}