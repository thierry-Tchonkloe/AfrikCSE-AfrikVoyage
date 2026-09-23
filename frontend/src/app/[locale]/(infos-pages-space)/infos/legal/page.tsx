import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import LegalPage from "@/components/infos-pages/LegalPage";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("legal.title");
  const description = t("legal.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "legal", title, description }),
  };
}

export default function Legal() {
    return <LegalPage />;
}
