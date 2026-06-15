import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Connexion — AfrikCSE & AfrikVoyage",
    description: "Connectez-vous à votre espace AfrikCSE & AfrikVoyage pour gérer vos avantages salariés et vos voyages d'affaires.",
};

// Layout minimal pour les pages auth — pas de navbar
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}