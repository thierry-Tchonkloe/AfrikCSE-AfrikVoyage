import type { Metadata } from "next";
import { Inter, Raleway } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { ThemeProvider } from "@/hooks/useTheme";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-raleway", display: "swap" });

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
    <html lang={locale} className={`${inter.variable} ${raleway.variable}`}>
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
