import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getInternationalTags, type LocaleParams } from "@/i18n/seo";
import DemoPage from '@/components/infos-pages/DemoPage';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("demo.title");
  const description = t("demo.description");
  const tags = getInternationalTags({ locale, page: "demo", title, description });

  return {
    title,
    description,
    keywords: t("demo.keywords"),
    ...tags,
    openGraph: { ...tags.openGraph, description: t("demo.ogDescription"), siteName: "AfrikWorkspace" },
    twitter: {
      card: "summary_large_image",
      title,
      description: t("demo.twitterDescription"),
    },
  };
}

export default function DemoRequestPage() {
    return <DemoPage />;
}