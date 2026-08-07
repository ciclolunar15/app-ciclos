"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/** Por debajo de esto se asume un toque normal (tap), no un deslizamiento. */
const UMBRAL_PX = 48;

export function CarruselImagenesSincronario({
  imagenes,
}: {
  imagenes: { id: string }[];
}) {
  const [indice, setIndice] = useState(0);
  const inicioX = useRef<number | null>(null);
  const inicioY = useRef<number | null>(null);

  if (imagenes.length === 0) return null;

  if (imagenes.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-luna/50">
        <Image src={`/api/imagen-sincronario/${imagenes[0].id}`} alt="" fill unoptimized className="object-cover" />
      </div>
    );
  }

  function alBajarPuntero(e: React.PointerEvent) {
    inicioX.current = e.clientX;
    inicioY.current = e.clientY;
  }

  function alSoltarPuntero(e: React.PointerEvent) {
    if (inicioX.current === null || inicioY.current === null) return;
    const deltaX = e.clientX - inicioX.current;
    const deltaY = e.clientY - inicioY.current;
    inicioX.current = null;
    inicioY.current = null;

    // Un desliz vertical (scroll de la página) no debe cambiar de imagen.
    if (Math.abs(deltaX) < UMBRAL_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }
    // Deslizar hacia la izquierda avanza; hacia la derecha retrocede. Sin
    // loop: en las puntas, un delta de más no hace nada.
    setIndice((actual) => {
      const siguiente = deltaX < 0 ? actual + 1 : actual - 1;
      return Math.min(Math.max(siguiente, 0), imagenes.length - 1);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-2xl border-2 border-luna/50"
        onPointerDown={alBajarPuntero}
        onPointerUp={alSoltarPuntero}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {imagenes.map((imagen) => (
            <div key={imagen.id} className="relative h-full w-full shrink-0">
              <Image
                src={`/api/imagen-sincronario/${imagen.id}`}
                alt=""
                fill
                unoptimized
                className="object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {imagenes.map((imagen, i) => (
          <button
            key={imagen.id}
            type="button"
            aria-label={`Ir a la imagen ${i + 1}`}
            onClick={() => setIndice(i)}
            className={`size-2 rounded-full transition-colors ${
              i === indice ? "bg-luna" : "bg-luna/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
