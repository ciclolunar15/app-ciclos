"use client";

import { useRouter } from "next/navigation";

/**
 * "Atrás" genérico (history.back() vía el router), no una ruta fija: estas
 * pantallas (landing, login/registro, canjear código) se puede llegar a
 * ellas desde varios lugares distintos, así que no hay un único "anterior"
 * correcto para codificar a mano.
 */
export function BotonVolver({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Volver"
      className={`flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${className}`}
    >
      <span aria-hidden>‹</span>
      Volver
    </button>
  );
}
