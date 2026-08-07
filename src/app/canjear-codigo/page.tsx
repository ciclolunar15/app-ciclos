import type { Metadata } from "next";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { tieneAcceso } from "@/lib/dal/acceso";
import { FormularioCanjearCodigo } from "@/components/formulario-canjear-codigo";
import { BotonVolver } from "@/components/boton-volver";
import { BotonCopiar } from "@/components/boton-copiar";

const ALIAS = "Mente.universal";

export const metadata: Metadata = {
  title: "Acceso",
};

const MENSAJE_WHATSAPP = "¡Buenas! Te dejo la factura del pago por el uso de la aplicación.";
// Formato argentino para wa.me: 54 (país) + 9 (móvil) + el número tal cual.
const ENLACE_WHATSAPP = `https://wa.me/5492804632189?text=${encodeURIComponent(MENSAJE_WHATSAPP)}`;

export default async function PaginaCanjearCodigo() {
  // Fuera de (app) a propósito: si viviera adentro, el propio layout que
  // hace este mismo chequeo la volvería a mandar acá y quedaría en loop.
  await auth.protect();
  if (await tieneAcceso()) redirect("/hoy");

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-marea px-4 py-12">
      <BotonVolver className="absolute top-6 left-6 z-20 text-espuma hover:bg-espuma/10" />
      <div className="absolute top-6 right-6 z-20">
        <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <span className="font-tangerine text-3xl font-bold tracking-tight text-espuma">
          Maresa
        </span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-luna/40 bg-superficie p-6 text-texto shadow-xl">
        <h1 className="font-serif text-xl font-semibold tracking-tight">Acceso exclusivo</h1>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          Maresa es una app de acceso pago. Para entrar necesitás un código de único uso,
          que te pasa la administradora después de recibir el comprobante de tu pago.
        </p>

        <div className="mt-5 rounded-xl bg-fondo p-4 text-sm">
          <p className="font-medium text-texto">1. Hacé la transferencia (pago único)</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-tenue">
            Alias: <span className="font-semibold text-texto">{ALIAS}</span>
            <BotonCopiar texto={ALIAS} className="bg-borde text-texto hover:bg-luna/30" />
          </p>
          <p className="mt-1 text-tenue">
            Monto: <span className="font-semibold text-texto">$8.000</span>
          </p>
        </div>

        <a
          href={ENLACE_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-abismo transition-opacity hover:opacity-90"
        >
          💬 Mandar comprobante por WhatsApp
        </a>

        <div className="mt-6 border-t border-borde pt-5">
          <p className="text-sm font-medium text-texto">2. Ingresá el código</p>
          <FormularioCanjearCodigo />
        </div>
      </div>
    </div>
  );
}
