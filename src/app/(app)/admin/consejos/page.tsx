import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoAutorizada, listarTodosLosConsejos } from "@/lib/dal/consejos";
import { LIMITE_IMAGENES, listarImagenesSincronario } from "@/lib/dal/sincronario-imagen";
import { FormularioConsejo } from "@/components/formulario-consejo";
import { FormularioImagenSincronario } from "@/components/formulario-imagen-sincronario";
import { ImagenContenida } from "@/components/imagen-contenida";
import { accionBorrarConsejo, accionEliminarImagenSincronario } from "./actions";

export const metadata: Metadata = {
  title: "Admin · Consejos",
};

const ETIQUETA_FASE_CICLO: Record<string, string> = {
  MENSTRUAL: "Menstrual",
  PRE_OVULACION: "Pre ovulación",
  OVULACION: "Ovulación",
  PRE_MENSTRUAL: "Pre menstrual",
};

const ETIQUETA_FASE_LUNAR: Record<string, string> = {
  NUEVA: "Nueva 🌑",
  CRECIENTE: "Creciente 🌒",
  LLENA: "Llena 🌕",
  MENGUANTE: "Menguante 🌗",
};

export default async function PaginaAdminConsejos() {
  // requerirAdmin() (dentro de listarTodosLosConsejos) es el límite de
  // seguridad real; si no es admin, la página ni siquiera se renderiza.
  let consejos;
  try {
    consejos = await listarTodosLosConsejos();
  } catch (error) {
    if (error instanceof NoAutorizada) notFound();
    throw error;
  }

  // Ya se confirmó que es admin arriba, así que acá alcanza con pedirla.
  const imagenes = await listarImagenesSincronario();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold tracking-tight">
        Admin · Consejos
      </h1>

      <FormularioConsejo />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-tenue">
          Consejos cargados
        </h2>

        {consejos.length === 0 ? (
          <p className="rounded-2xl border border-borde bg-superficie p-5 text-sm text-tenue">
            Todavía no cargaste ningún consejo.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consejos.map((consejo) => (
              <li
                key={consejo.id}
                className="flex flex-col gap-2 rounded-2xl border border-borde bg-superficie p-4"
              >
                <span className="w-fit rounded-full bg-fondo px-2.5 py-1 text-xs font-medium text-tenue">
                  {ETIQUETA_FASE_CICLO[consejo.faseCiclo]} ·{" "}
                  {ETIQUETA_FASE_LUNAR[consejo.faseLunar]}
                </span>
                <p className="text-sm leading-relaxed">{consejo.texto}</p>
                <form action={accionBorrarConsejo} className="flex justify-end">
                  <input type="hidden" name="id" value={consejo.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-fase-menstrual hover:underline"
                  >
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-tenue">
          Imágenes del sincronario
        </h2>
        {imagenes.length === 0 ? (
          <p className="rounded-2xl border border-borde bg-superficie p-5 text-sm text-tenue">
            Todavía no subiste ninguna imagen.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {imagenes.map((imagen) => (
              <li
                key={imagen.id}
                className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-4"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <ImagenContenida
                    src={`/api/imagen-sincronario/${imagen.id}`}
                    alt="Imagen del sincronario"
                  />
                </div>
                <form action={accionEliminarImagenSincronario} className="flex justify-end">
                  <input type="hidden" name="id" value={imagen.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-fase-menstrual hover:underline"
                  >
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {imagenes.length < LIMITE_IMAGENES ? (
          <FormularioImagenSincronario cantidadActual={imagenes.length} limite={LIMITE_IMAGENES} />
        ) : (
          <p className="rounded-2xl border border-borde bg-superficie p-4 text-sm text-tenue">
            Llegaste al máximo de {LIMITE_IMAGENES} imágenes. Eliminá alguna para poder
            subir otra.
          </p>
        )}
      </section>
    </div>
  );
}
