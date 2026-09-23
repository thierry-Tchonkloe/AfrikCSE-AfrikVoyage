import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function CompaniesRootPage() {
    redirect({ href: "/companies/AfrikVoyage/dashboard", locale: await getLocale() });
}