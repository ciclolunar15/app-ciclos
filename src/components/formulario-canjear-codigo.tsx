"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { accionCanjearCodigo, type EstadoCanjearCodigo } from "@/app/canjear-codigo/actions";

const ESTADO_INICIAL: EstadoCanjearCodigo = {};

function BotonCanjear() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-luna px-4 py-2.5 text-sm font-semibold text-abismo transition-colors hover:bg-luna/90 disabled:opacity-60"
    >
      {pending ? "Verificando…" : "Ingresar"}
    </button>
  );
}

export function FormularioCanjearCodigo() {
  const [estado, accion] = useActionState(accionCanjearCodigo, ESTADO_INICIAL);

  return (
    <form action={accion} className="mt-2 flex flex-col gap-2">
      <input
        type="text"
        name="codigo"
        required
        maxLength={5}
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="Código de 5 caracteres"
        className="rounded-lg border border-borde bg-fondo px-3 py-2 text-center text-lg font-semibold uppercase tracking-[0.3em] text-texto outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-tenue/60 focus:border-oceano"
      />
      {estado.error && (
        <p role="alert" className="text-sm text-fase-menstrual">
          {estado.error}
        </p>
      )}
      <BotonCanjear />
    </form>
  );
}
