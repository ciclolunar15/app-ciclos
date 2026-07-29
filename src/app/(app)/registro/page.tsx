import type { Metadata } from "next";

import { listarCiclosDetallados, perfilActual } from "@/lib/dal/cycles";
import { diasEntre, hoy } from "@/lib/cycle";
import { capitalizar, fechaLarga, paraInput } from "@/lib/format";
import { FormularioCiclo } from "@/components/formulario-ciclo";
import { accionBorrarCiclo } from "./actions";

export const metadata: Metadata = {
  title: "Registro",
};

export default async function PaginaRegistro() {
  const [perfil, ciclos] = await Promise.all([
    perfilActual(),
    listarCiclosDetallados(),
  ]);

  const fechaDeHoy = hoy(perfil.timezone);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold tracking-tight">Registro</h1>

      <FormularioCiclo maxFecha={paraInput(fechaDeHoy)} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-tenue">
          Historial
        </h2>

        {ciclos.length === 0 ? (
          <p className="rounded-2xl border border-borde bg-superficie p-5 text-sm text-tenue">
            Todavía no has registrado ningún periodo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ciclos.map((ciclo, i) => {
              const anterior = ciclos[i + 1];
              const duracionCiclo = anterior
                ? diasEntre(anterior.startDate, ciclo.startDate)
                : null;
              const diasSangrado = ciclo.endDate
                ? diasEntre(ciclo.startDate, ciclo.endDate) + 1
                : null;

              return (
                <li
                  key={ciclo.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-borde bg-superficie p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {capitalizar(fechaLarga.format(ciclo.startDate))}
                    </p>
                    <p className="mt-0.5 text-sm text-tenue">
                      {diasSangrado
                        ? `${diasSangrado} ${diasSangrado === 1 ? "día" : "días"} de sangrado`
                        : "Sin fecha de fin"}
                      {duracionCiclo !== null &&
                        ` · ciclo de ${duracionCiclo} días`}
                    </p>
                    {ciclo.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-tenue">
                        {ciclo.notes}
                      </p>
                    )}
                  </div>

                  <form action={accionBorrarCiclo}>
                    <input type="hidden" name="id" value={ciclo.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-borde px-3 py-1.5 text-xs text-tenue transition-colors hover:border-fase-menstrual hover:text-fase-menstrual"
                    >
                      Borrar
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
