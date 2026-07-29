"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  accionCrearCiclo,
  type EstadoFormulario,
} from "@/app/(app)/registro/actions";

const ESTADO_INICIAL: EstadoFormulario = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-oceano px-6 py-2.5 font-medium text-espuma transition-colors hover:bg-marea disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar periodo"}
    </button>
  );
}

export function FormularioCiclo({ maxFecha }: { maxFecha: string }) {
  const [estado, accion] = useActionState(accionCrearCiclo, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  // Vacía los campos tras un alta correcta para poder encadenar registros.
  useEffect(() => {
    if (estado.ok) formulario.current?.reset();
  }, [estado.ok]);

  return (
    <form
      ref={formulario}
      action={accion}
      className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5"
    >
      <h2 className="font-serif font-semibold">Registrar un periodo</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Primer día de sangrado</span>
          <input
            type="date"
            name="startDate"
            required
            max={maxFecha}
            className="rounded-lg border border-borde bg-fondo px-3 py-2 text-texto outline-none focus:border-oceano"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">
            Último día <span className="font-normal text-tenue">(opcional)</span>
          </span>
          <input
            type="date"
            name="endDate"
            max={maxFecha}
            className="rounded-lg border border-borde bg-fondo px-3 py-2 text-texto outline-none focus:border-oceano"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">
          Notas <span className="font-normal text-tenue">(opcional)</span>
        </span>
        <textarea
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Cómo te has sentido, síntomas…"
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
          Periodo guardado.
        </p>
      )}

      <div className="flex justify-end">
        <BotonGuardar />
      </div>
    </form>
  );
}
