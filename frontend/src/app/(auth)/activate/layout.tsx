import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Activation du compte — AfrikCSE & AfrikVoyage",
    description: "Activez votre compte AfrikCSE & AfrikVoyage et définissez votre mot de passe pour accéder à votre espace.",
};

// Layout minimal pour les pages auth — pas de navbar
export default function ActivateLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
