"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  accionCrearConsejo,
  type EstadoFormularioConsejo,
} from "@/app/(app)/admin/consejos/actions";

const ESTADO_INICIAL: EstadoFormularioConsejo = {};

const FASES_CICLO = [
  { valor: "MENSTRUAL", etiqueta: "Menstrual" },
  { valor: "PRE_OVULACION", etiqueta: "Pre ovulación" },
  { valor: "OVULACION", etiqueta: "Ovulación" },
  { valor: "PRE_MENSTRUAL", etiqueta: "Pre menstrual" },
] as const;

const FASES_LUNAR = [
  { valor: "NUEVA", etiqueta: "Nueva 🌑" },
  { valor: "CRECIENTE", etiqueta: "Creciente 🌒" },
  { valor: "LLENA", etiqueta: "Llena 🌕" },
  { valor: "MENGUANTE", etiqueta: "Menguante 🌗" },
] as const;

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-oceano px-6 py-2.5 font-medium text-espuma transition-colors hover:bg-marea disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar consejo"}
    </button>
  );
}

export function FormularioConsejo() {
  const [estado, accion] = useActionState(accionCrearConsejo, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formulario.current?.reset();
  }, [estado.ok]);

  return (
    <form
      ref={formulario}
      action={accion}
      className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5"
    >
      <h2 className="font-serif font-semibold">Nuevo consejo</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Fase del ciclo</span>
          <select
            name="faseCiclo"
            required
            defaultValue=""
            className="rounded-lg border border-borde bg-fondo px-3 py-2 text-texto outline-none focus:border-oceano"
          >
            <option value="" disabled>
              Elegí una fase
            </option>
            {FASES_CICLO.map(({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Fase lunar</span>
          <select
            name="faseLunar"
            required
            defaultValue=""
            className="rounded-lg border border-borde bg-fondo px-3 py-2 text-texto outline-none focus:border-oceano"
          >
            <option value="" disabled>
              Elegí una fase
            </option>
            {FASES_LUNAR.map(({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Texto del consejo</span>
        <textarea
          name="texto"
          required
          rows={3}
          maxLength={1000}
          placeholder="Escribí el consejo para esta combinación…"
          className="resize-y rounded-lg border border-borde bg-fondo px-3 py-2 text-texto outline-none placeholder:text-tenue/60 focus:border-oceano"
        />
      </label>

      {estado.error && (
        <p role="alert" className="text-sm text-fase-menstrual">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="text-sm text-fase-folicular">
          Consejo guardado.
        </p>
      )}

      <div className="flex justify-end">
        <BotonGuardar />
      </div>
    </form>
  );
}
