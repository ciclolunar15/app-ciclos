"use client";

import { useState } from "react";

export function BotonCopiar({
  texto,
  className = "",
}: {
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sin permiso de portapapeles o navegador sin soporte: no rompe nada,
      // simplemente no hay feedback de "copiado".
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar ${texto}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${className}`}
    >
      {copiado ? "✓ Copiado" : "📋 Copiar"}
    </button>
  );
}
