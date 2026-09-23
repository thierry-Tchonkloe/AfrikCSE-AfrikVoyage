import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

// La racine redirige vers login
export default async function Home() {
    redirect({ href: "/admin/dashboard", locale: await getLocale() });
}