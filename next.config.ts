import path from "node:path";

import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Hay un package-lock.json en el directorio personal del usuario, y sin
    // esto Turbopack lo toma como raíz del espacio de trabajo.
    root: path.resolve(import.meta.dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

// withSerwist añade esbuild a serverExternalPackages, necesario para que el
// service worker se compile en tiempo de ejecución de la ruta /serwist.
export default withSerwist(nextConfig);
