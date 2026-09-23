import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import ContactPage from "@/components/infos-pages/ContactPage";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("contact.title");
  const description = t("contact.description");

  return {
    title,
    description,
    ...getInternationalTags({ locale, page: "contact", title, description }),
  };
}

export default function Contact() {
    return <ContactPage />;
}