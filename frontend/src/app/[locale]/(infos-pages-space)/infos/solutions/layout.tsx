import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";

// La page est un composant client ("use client") : ses métadonnées passent par ce layout serveur.
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("solutions.title");
  const description = t("solutions.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "solutions", title, description }),
  };
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
