import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/hooks/useTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfrikCSE & AfrikVoyage",
  description: "Plateforme de gestion interne(CSE & Voyages) des entreprise propre à l'Afrique",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
