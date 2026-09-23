import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
export default async function EmployesRootPage() {
    redirect({ href: "/employes/dashboard", locale: await getLocale() });
}