"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { accionCrearPost, type EstadoFormularioPost } from "@/app/(app)/foro/actions";

const ESTADO_INICIAL: EstadoFormularioPost = {};

function BotonPublicar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-oceano px-6 py-2.5 font-medium text-espuma transition-colors hover:bg-marea disabled:opacity-60"
    >
      {pending ? "Publicando…" : "Publicar"}
    </button>
  );
}

export function FormularioPostForo({
  respuestaAId,
  compacto = false,
  placeholder = "Compartí lo que quieras con la comunidad…",
  alPublicar,
}: {
  /** Si viene, el post se cuelga de ese hilo en vez de ser uno nuevo. */
  respuestaAId?: string;
  /** Versión chica para responder inline debajo de un post. */
  compacto?: boolean;
  placeholder?: string;
  alPublicar?: () => void;
}) {
  const [estado, accion] = useActionState(accionCrearPost, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) {
      formulario.current?.reset();
      alPublicar?.();
    }
    // alPublicar puede no ser estable entre renders (suele ser un callback
    // inline); lo que importa disparar es el cambio de estado.ok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.ok]);

  return (
    <form
      ref={formulario}
      action={accion}
      className={
        compacto
          ? "flex flex-col gap-3"
          : "flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5"
      }
    >
      {respuestaAId && <input type="hidden" name="respuestaAId" value={respuestaAId} />}

      <label className="flex flex-col gap-1.5 text-sm">
        {!compacto && <span className="font-medium">¿Qué estás pensando?</span>}
        <textarea
          name="contenido"
          required
          rows={compacto ? 2 : 3}
          maxLength={2000}
          placeholder={placeholder}
          autoFocus={compacto}
          className="resize-y rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto outline-none placeholder:text-tenue/60 focus:border-oceano"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        {/* Interruptor Anónimo/No anónimo: checkbox real (accesible, sin JS
            propio) con el aspecto de un switch armado solo con Tailwind. */}
        <label className="relative flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="esAnonimo" className="peer sr-only" />
          <span className="h-6 w-11 shrink-0 rounded-full bg-fondo transition-colors peer-checked:bg-luna" />
          <span className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-superficie shadow transition-transform peer-checked:translate-x-5" />
          <span className="font-medium">Publicar como anónima</span>
        </label>

        <BotonPublicar />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-fase-menstrual">
          {estado.error}
        </p>
      )}
    </form>
  );
}
