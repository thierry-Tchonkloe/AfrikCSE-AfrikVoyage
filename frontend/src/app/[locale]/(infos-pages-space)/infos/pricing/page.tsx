import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import PricingPage from "@/components/infos-pages/PricingPage";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("pricing.title");
  const description = t("pricing.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "pricing", title, description }),
  };
}

export default function Pricing() {
    return <PricingPage />;
}
