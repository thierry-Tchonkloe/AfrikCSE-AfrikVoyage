import { Metadata } from "next";
import LegalPage from "@/components/infos-pages/LegalPage";

export const metadata: Metadata = {
    title: "Mentions légales — AfrikCSE & AfrikVoyage",
    description: "Mentions légales de la plateforme AfrikCSE & AfrikVoyage éditée par Waxeho.",
};

export default function Legal() {
    return <LegalPage />;
}
