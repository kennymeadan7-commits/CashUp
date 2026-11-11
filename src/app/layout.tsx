import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Cashup — Le cashback du Bénin, en FCFA",
    template: "%s · Cashup",
  },
  description:
    "Cashup vous rembourse une partie de vos achats chez les commerces partenaires du Bénin : supermarchés, pharmacies, restaurants, électronique… Retrait Mobile Money (MTN MoMo, Moov Money, Celtiis Cash) et points de fidélité convertibles en bons d'achat.",
  applicationName: "Cashup",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cashup",
  },
  openGraph: {
    title: "Cashup — Le cashback du Bénin, en FCFA",
    description:
      "Achetez chez vos commerces habituels et encaissez votre cashback sur Mobile Money. 100 % béninois, en FCFA.",
    locale: "fr_BJ",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8fd",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await getCurrentUser();

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <a href="#contenu" className="skip-link">
          Aller au contenu principal
        </a>
        <SiteHeader />
        <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
