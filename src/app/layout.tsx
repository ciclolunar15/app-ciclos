import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { SerwistProvider } from "@serwist/turbopack/react";
import { Geist_Mono, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif de títulos: le da el tono cálido/espiritual a la capa de bienestar.
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

// Fuente base del resto de la app (cuerpo, formularios, datos).
const cinzel = Cinzel({
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ciclos",
    template: "%s · Ciclos",
  },
  description:
    "Registra tu ciclo menstrual y descubre cómo se acompasa con las fases de la luna.",
  applicationName: "Ciclos",
  // Mismo ícono que usa el manifiesto (src/app/manifest.ts) para la
  // instalación como PWA: la pestaña del navegador y el ícono instalado
  // muestran así el mismo dibujo.
  icons: {
    icon: "/icono-512.png",
    apple: "/icono-512.png",
  },
  appleWebApp: {
    capable: true,
    title: "Ciclos",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a4489",
  // La app es una rejilla de calendario: el zoom del navegador debe seguir
  // disponible, así que no se restringe userScalable.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html
        lang="es"
        className={`${cinzel.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          {/* El service worker se sirve desde la ruta /serwist, que lo compila
              a partir de src/app/sw.ts. */}
          <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
