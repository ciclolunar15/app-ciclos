"use client";

import { useEventoInstalacion } from "@/hooks/usar-evento-instalacion";

export function BotonInstalarPwa() {
  const { disponible, instalar } = useEventoInstalacion();
  if (!disponible) return null;

  return (
    <button
      type="button"
      onClick={instalar}
      className="flex items-center gap-1 rounded-full bg-luna px-3 py-1 text-xs font-semibold text-abismo shadow-sm transition-colors hover:bg-luna/90"
    >
      <span aria-hidden>⬇</span>
      Instalar
    </button>
  );
}
