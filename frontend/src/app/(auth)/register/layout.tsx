import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inscription — AfrikCSE & AfrikVoyage",
    description: "Créez votre compte et inscrivez votre entreprise sur AfrikCSE & AfrikVoyage en quelques minutes.",
};

// Layout minimal pour les pages auth — pas de navbar
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
