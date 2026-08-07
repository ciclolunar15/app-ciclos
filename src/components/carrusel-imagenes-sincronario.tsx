"use client";

import { useEffect, useRef, useState } from "react";

import { ImagenContenida } from "@/components/imagen-contenida";

/** Por debajo de esto se asume un toque normal (tap), no un deslizamiento. */
const UMBRAL_PX = 48;

function LightboxImagen({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-abismo/95 p-4"
      onClick={onCerrar}
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-espuma/10 text-2xl leading-none text-espuma transition-colors hover:bg-espuma/20"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/imagen-sincronario/${id}`}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

export function CarruselImagenesSincronario({
  imagenes,
}: {
  imagenes: { id: string }[];
}) {
  const [indice, setIndice] = useState(0);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const inicioX = useRef<number | null>(null);
  const inicioY = useRef<number | null>(null);

  if (imagenes.length === 0) return null;

  if (imagenes.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setImagenAmpliada(imagenes[0].id)}
          aria-label="Ver imagen en grande"
          className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-luna/50"
        >
          <ImagenContenida src={`/api/imagen-sincronario/${imagenes[0].id}`} />
        </button>
        {imagenAmpliada && (
          <LightboxImagen id={imagenAmpliada} onCerrar={() => setImagenAmpliada(null)} />
        )}
      </>
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

    // Un toque sin desplazamiento en ningún eje: abre la imagen en grande.
    if (Math.abs(deltaX) < UMBRAL_PX && Math.abs(deltaY) < UMBRAL_PX) {
      setImagenAmpliada(imagenes[indice].id);
      return;
    }
    // Un desliz vertical (scroll de la página) no debe cambiar de imagen.
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

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
              <ImagenContenida src={`/api/imagen-sincronario/${imagen.id}`} />
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

      {imagenAmpliada && (
        <LightboxImagen id={imagenAmpliada} onCerrar={() => setImagenAmpliada(null)} />
      )}
    </div>
  );
}
