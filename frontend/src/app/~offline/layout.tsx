import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AfrikCSE · Hors ligne / Offline",
};

export const viewport: Viewport = {
  themeColor: "#6366F1",
};

// Page hors-ligne de la PWA : servie par le service worker, hors du routage par
// langue (middleware exclu) — layout racine autonome et texte bilingue.
export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
