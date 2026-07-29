import Link from "next/link";
import type { Metadata } from "next";

import { listarCiclos, perfilActual } from "@/lib/dal/cycles";
import {
  ETIQUETAS_FASE,
  ETIQUETAS_FIABILIDAD,
  diasEntre,
  estadoActual,
  hoy,
  predecir,
  resumenCiclos,
} from "@/lib/cycle";
import { aHemisferio, faseLunar } from "@/lib/moon";
import { capitalizar, enDias, fechaConDiaSemana, fechaLarga } from "@/lib/format";
import { PuntoFase } from "@/components/punto-fase";

export const metadata: Metadata = {
  title: "Hoy",
};

export default async function PaginaHoy() {
  const [perfil, ciclos] = await Promise.all([perfilActual(), listarCiclos()]);

  const fechaDeHoy = hoy(perfil.timezone);
  const luna = faseLunar(fechaDeHoy, aHemisferio(perfil.hemisphere));
  const estado = estadoActual(ciclos, fechaDeHoy);
  const prediccion = predecir(ciclos);
  const resumen = resumenCiclos(ciclos);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-tenue">
          {capitalizar(fechaConDiaSemana.format(fechaDeHoy))}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
          {estado.diaDelCiclo
            ? `Día ${estado.diaDelCiclo} de tu ciclo`
            : "Aún no hay ciclos registrados"}
        </h1>
      </header>

      {/* Fase del ciclo y fase lunar, lado a lado: es la relación que da
          sentido a la app. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-tenue">
            Tu fase
          </h2>
          {estado.fase ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-xl font-semibold">
                <PuntoFase fase={estado.fase} />
                {ETIQUETAS_FASE[estado.fase]}
              </p>
              <p className="mt-2 text-sm text-tenue">
                Desde el {fechaLarga.format(estado.ultimoInicio!)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-tenue">
              Registra tu último periodo para verla.
            </p>
          )}
        </section>

        <section className="degradado-ola rounded-2xl p-5 text-espuma">
          <h2 className="text-xs font-medium uppercase tracking-wide text-espuma/70">
            La luna hoy
          </h2>
          <p className="mt-2 flex items-center gap-2 text-xl font-semibold">
            <span aria-hidden className="text-2xl">
              {luna.emoji}
            </span>
            {luna.nombre}
          </p>
          <p className="mt-2 text-sm text-espuma/70">
            Día {Math.floor(luna.edad)} del ciclo lunar ·{" "}
            {luna.creciente ? "creciendo" : "menguando"}
          </p>
        </section>
      </div>

      {/* Predicción */}
      <section className="rounded-2xl border border-borde bg-superficie p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-tenue">
            Próximo periodo
          </h2>
          <span className="text-xs text-tenue">
            {ETIQUETAS_FIABILIDAD[prediccion.fiabilidad]}
          </span>
        </div>

        {prediccion.proximoPeriodo ? (
          <>
            <p className="mt-2 text-xl font-semibold">
              {capitalizar(fechaLarga.format(prediccion.proximoPeriodo))}
            </p>
            <p className="mt-1 text-sm text-tenue">
              {capitalizar(
                enDias(diasEntre(fechaDeHoy, prediccion.proximoPeriodo)),
              )}
              {prediccion.ventanaProximoPeriodo && (
                <>
                  {" · margen del "}
                  {fechaLarga.format(prediccion.ventanaProximoPeriodo.inicio)}
                  {" al "}
                  {fechaLarga.format(prediccion.ventanaProximoPeriodo.fin)}
                </>
              )}
            </p>

            {prediccion.ventanaFertil && (
              <p className="mt-4 border-t border-borde pt-4 text-sm text-tenue">
                <span className="font-medium text-texto">Ventana fértil estimada:</span>{" "}
                del {fechaLarga.format(prediccion.ventanaFertil.inicio)} al{" "}
                {fechaLarga.format(prediccion.ventanaFertil.fin)}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-tenue">
            Hacen falta al menos dos periodos registrados para estimar el
            siguiente.
          </p>
        )}
      </section>

      {/* Resumen del historial */}
      {resumen.duracionMedia !== null && (
        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-tenue">
            Tu historial
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-tenue">Ciclo medio</dt>
              <dd className="text-lg font-semibold">
                {Math.round(resumen.duracionMedia)} días
              </dd>
            </div>
            <div>
              <dt className="text-tenue">Ciclos medidos</dt>
              <dd className="text-lg font-semibold">{resumen.intervalos}</dd>
            </div>
            <div>
              <dt className="text-tenue">Regularidad</dt>
              <dd className="text-lg font-semibold">
                {resumen.irregular ? "Irregular" : "Regular"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <Link
        href="/registro"
        className="rounded-full bg-oceano px-6 py-3 text-center font-medium text-espuma transition-colors hover:bg-marea"
      >
        Registrar un periodo
      </Link>

      <p className="text-xs leading-relaxed text-tenue">
        Todas las fechas futuras son estimaciones basadas en tu historial. No
        sustituyen el criterio médico y la ventana fértil no es un método
        anticonceptivo.
      </p>
    </div>
  );
}
