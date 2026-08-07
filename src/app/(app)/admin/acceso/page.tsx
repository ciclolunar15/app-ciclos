import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoAutorizada, codigoVigente } from "@/lib/dal/acceso";
import { accionGenerarCodigo } from "./actions";
import { BotonCopiar } from "@/components/boton-copiar";

export const metadata: Metadata = {
  title: "Admin · Acceso",
};

export default async function PaginaAdminAcceso() {
  // requerirAdmin() (dentro de codigoVigente()) es el límite de seguridad
  // real; si no es admin, la página ni siquiera se renderiza.
  let vigente;
  try {
    vigente = await codigoVigente();
  } catch (error) {
    if (error instanceof NoAutorizada) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold tracking-tight">Admin · Acceso</h1>
      <p className="rounded-2xl bg-turquesa/15 p-4 text-sm text-tenue">
        Generá un código de único uso después de confirmar el comprobante de pago por
        WhatsApp, y pasáselo a esa persona por el mismo chat.
      </p>

      <div className="rounded-2xl border border-borde bg-superficie p-6 text-center">
        {vigente ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-tenue">
              Código vigente
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <p className="font-mono text-4xl font-bold tracking-[0.3em] text-luna">
                {vigente.codigo}
              </p>
              <BotonCopiar texto={vigente.codigo} className="bg-fondo text-texto hover:bg-borde" />
            </div>
          </>
        ) : (
          <p className="text-sm text-tenue">Todavía no generaste ningún código.</p>
        )}

        <form action={accionGenerarCodigo} className="mt-5">
          <button
            type="submit"
            className="rounded-full bg-oceano px-6 py-2.5 font-medium text-espuma transition-colors hover:bg-marea"
          >
            Generar código nuevo
          </button>
        </form>

        {vigente && (
          <p className="mt-3 text-xs text-tenue">
            Generar uno nuevo deja sin efecto a este — no afecta a quienes ya entraron con
            códigos anteriores.
          </p>
        )}
      </div>
    </div>
  );
}
