import type { MetadataRoute } from "next";

/**
 * Manifiesto nativo de Next: es lo que hace la app instalable en el móvil,
 * sin depender de ningún paquete externo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maresa — tu ciclo y la luna",
    short_name: "Maresa",
    description:
      "Registra tu ciclo menstrual y observa cómo se acompasa con las fases de la luna.",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    background_color: "#5c2a6b",
    theme_color: "#7a4489",
    categories: ["health", "lifestyle"],
    icons: [
      {
        src: "/icono_definitivo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono_definitivo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
