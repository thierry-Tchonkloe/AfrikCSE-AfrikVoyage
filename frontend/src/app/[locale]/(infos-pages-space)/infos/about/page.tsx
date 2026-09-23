import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import AboutPage from "@/components/infos-pages/AboutPage";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("about.title");
  const description = t("about.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "about", title, description }),
  };
}

export default function About() {
    return <AboutPage />;
}