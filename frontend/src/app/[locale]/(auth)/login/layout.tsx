import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("login.title");
  const description = t("login.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "login", title, description }),
  };
}

// Layout minimal pour les pages auth — pas de navbar
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}