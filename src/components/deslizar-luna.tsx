"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

/** Por debajo de esto se asume un toque normal (tap en un día), no un swipe. */
const UMBRAL_PX = 48;

export function DeslizarLuna({
  hrefAnterior,
  hrefSiguiente,
  children,
}: {
  hrefAnterior: string;
  hrefSiguiente: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const inicioX = useRef<number | null>(null);
  const inicioY = useRef<number | null>(null);

  function alTocar(e: React.TouchEvent) {
    inicioX.current = e.touches[0].clientX;
    inicioY.current = e.touches[0].clientY;
  }

  function alSoltar(e: React.TouchEvent) {
    if (inicioX.current === null || inicioY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - inicioX.current;
    const deltaY = e.changedTouches[0].clientY - inicioY.current;
    inicioX.current = null;
    inicioY.current = null;

    // Un desliz vertical (scroll de la página) no debe navegar de luna.
    if (Math.abs(deltaX) < UMBRAL_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }
    // Deslizar hacia la izquierda avanza (como pasar de página); hacia la
    // derecha retrocede.
    router.push(deltaX < 0 ? hrefSiguiente : hrefAnterior);
  }

  return (
    <div onTouchStart={alTocar} onTouchEnd={alSoltar}>
      {children}
    </div>
  );
}
