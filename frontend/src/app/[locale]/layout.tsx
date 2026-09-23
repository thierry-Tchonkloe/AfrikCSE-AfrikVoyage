import type { Metadata, Viewport } from "next";
import { Inter, Raleway } from "next/font/google";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SerwistProvider } from "@serwist/next/react";
import { ThemeProvider } from "@/hooks/useTheme";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { routing } from "@/i18n/routing";
import { getOgLocales, getSiteUrl, SITE_NAME } from "@/i18n/seo";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-raleway", display: "swap" });

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: getSiteUrl(),
    title,
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      ...getOgLocales(locale),
    },
    applicationName: "AfrikCSE",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "AfrikCSE",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#6366F1",
};

// Ce layout est le layout racine de l'app : `<html lang>` et le provider i18n
// vivent ici (et non au-dessus de [locale]) pour être re-rendus quand la langue change.
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${raleway.variable}`}>
      <body>
        <SerwistProvider swUrl="/sw.js">
          <NextIntlClientProvider>
            <ThemeProvider>
              {children}
              <Toaster position="top-right" richColors />
              <CookieConsentBanner />
            </ThemeProvider>
          </NextIntlClientProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
