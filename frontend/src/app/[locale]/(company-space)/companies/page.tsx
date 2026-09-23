import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function CompaniesRootPage() {
    redirect({ href: "/companies/dashboard", locale: await getLocale() });
}