import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import PrivacyPage from "@/components/infos-pages/PrivacyPage";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("privacy.title");
  const description = t("privacy.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "privacy", title, description }),
  };
}

export default function Privacy() {
    return <PrivacyPage />;
}
