import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import HowItWorksPage from "@/components/infos-pages/HowItWorksPage";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("howItWorks.title");
  const description = t("howItWorks.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "howItWorks", title, description }),
  };
}

export default function HowItWorks() {
    return <HowItWorksPage />;
}