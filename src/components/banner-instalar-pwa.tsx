"use client";

import { useEventoInstalacion } from "@/hooks/usar-evento-instalacion";

/**
 * Solo para la landing: reemplaza al BotonInstalarPwa de ahí (el resto de
 * la app lo sigue usando tal cual, en el header chico). Fijo arriba de
 * todo, pero angosto — no le tapa al título "Maresa" grande y centrado que
 * vive más abajo, en el flujo normal de la página.
 */
export function BannerInstalarPwa() {
  const { disponible, instalar } = useEventoInstalacion();
  if (!disponible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-center gap-3 bg-luna px-4 py-2 text-abismo shadow-md">
      <span className="text-sm font-medium">Instalá Maresa en tu celular</span>
      <button
        type="button"
        onClick={instalar}
        className="shrink-0 rounded-full bg-abismo px-3 py-1 text-xs font-semibold text-espuma transition-opacity hover:opacity-90"
      >
        Instalar
      </button>
    </div>
  );
}
