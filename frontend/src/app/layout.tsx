import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { ThemeProvider } from "@/hooks/useTheme";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfrikCSE & AfrikVoyage",
  description: "Plateforme de gestion interne(CSE & Voyages) des entreprise propre à l'Afrique",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale   = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors />
            <CookieConsentBanner />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
