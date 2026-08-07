"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  accionSubirImagenSincronario,
  type EstadoImagenSincronario,
} from "@/app/(app)/admin/consejos/actions";

const ESTADO_INICIAL: EstadoImagenSincronario = {};

function BotonSubir({ deshabilitado }: { deshabilitado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || deshabilitado}
      className="rounded-full bg-oceano px-6 py-2.5 font-medium text-espuma transition-colors hover:bg-marea disabled:opacity-60"
    >
      {pending ? "Subiendo…" : "Subir imágenes"}
    </button>
  );
}

type Seleccionada = { archivo: File; url: string };

export function FormularioImagenSincronario({
  cantidadActual,
  limite,
}: {
  cantidadActual: number;
  limite: number;
}) {
  const [estado, accion] = useActionState(accionSubirImagenSincronario, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [seleccionadas, setSeleccionadas] = useState<Seleccionada[]>([]);

  const espacioRestante = limite - cantidadActual - seleccionadas.length;

  function limpiarSeleccion() {
    setSeleccionadas((actuales) => {
      actuales.forEach((sel) => URL.revokeObjectURL(sel.url));
      return [];
    });
  }

  useEffect(() => {
    if (!estado.ok) return;
    formulario.current?.reset();
    // Diferido a un microtask: el rule react-hooks/set-state-in-effect no
    // permite un setState síncrono dentro del cuerpo del efecto.
    Promise.resolve().then(() => limpiarSeleccion());
    // Depende del objeto entero, no de estado.ok: useActionState devuelve un
    // objeto nuevo en cada envío, pero "ok" se queda en `true` de una subida
    // exitosa a la siguiente — si el efecto dependiera solo de estado.ok,
    // React no lo volvería a disparar en la segunda subida (mismo valor).
  }, [estado]);

  // El input real de <input type="file"> solo puede reflejar UNA elección de
  // diálogo a la vez (cada vez que se abre el selector, reemplaza lo que
  // tenía). Para poder ir "agregando" fotos en sucesivas aperturas, el
  // estado acumulado (seleccionadas) es la fuente de la verdad, y este
  // efecto reconstruye el FileList real del input con un DataTransfer cada
  // vez que cambia — así el envío del formulario sí manda todos los
  // archivos juntos.
  useEffect(() => {
    if (!input.current) return;
    const datos = new DataTransfer();
    seleccionadas.forEach((sel) => datos.items.add(sel.archivo));
    input.current.files = datos.files;
  }, [seleccionadas]);

  function alElegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? []);
    if (nuevos.length === 0) return;

    setSeleccionadas((actuales) => {
      const disponibles = Math.max(limite - cantidadActual - actuales.length, 0);
      const agregar = nuevos.slice(0, disponibles).map((archivo) => ({
        archivo,
        url: URL.createObjectURL(archivo),
      }));
      return [...actuales, ...agregar];
    });
  }

  function quitarUna(indice: number) {
    setSeleccionadas((actuales) => {
      const objetivo = actuales[indice];
      if (objetivo) URL.revokeObjectURL(objetivo.url);
      return actuales.filter((_, i) => i !== indice);
    });
  }

  return (
    <form
      ref={formulario}
      action={accion}
      className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5"
    >
      <span className="text-sm font-medium">Elegir fotos</span>

      <div className="flex flex-wrap gap-3">
        {seleccionadas.map((sel, i) => (
          <div
            key={sel.url}
            className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl border border-borde"
          >
            <Image src={sel.url} alt="Vista previa" fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={() => quitarUna(i)}
              aria-label="Quitar esta imagen"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-abismo/70 text-sm leading-none text-espuma transition-colors hover:bg-abismo/90"
            >
              ×
            </button>
          </div>
        ))}

        {espacioRestante > 0 && (
          <label
            htmlFor="archivo-imagen-sincronario"
            className="flex aspect-[4/3] w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-borde text-tenue transition-colors hover:border-oceano hover:text-oceano"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-center text-xs font-medium">
              {seleccionadas.length === 0 ? "Elegir fotos" : "Agregar más"}
            </span>
          </label>
        )}
      </div>

      <input
        ref={input}
        id="archivo-imagen-sincronario"
        type="file"
        name="archivo"
        accept="image/*,.heic,.heif"
        multiple
        onChange={alElegirArchivos}
        className="hidden"
      />

      {estado.error && (
        <p role="alert" className="text-sm text-fase-menstrual">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="text-sm text-fase-folicular">
          Imágenes actualizadas.
        </p>
      )}

      <div className="flex justify-end">
        <BotonSubir deshabilitado={seleccionadas.length === 0} />
      </div>
    </form>
  );
}
