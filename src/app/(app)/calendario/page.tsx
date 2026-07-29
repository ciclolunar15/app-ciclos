import Link from "next/link";
import type { Metadata } from "next";

import { listarCiclos, perfilActual } from "@/lib/dal/cycles";
import {
  DIAS_SANGRADO_POR_DEFECTO,
  DURACION_CICLO_POR_DEFECTO,
  ETIQUETAS_FASE,
  type CicloRegistrado,
  type FaseCiclo,
  diasEntre,
  faseDelCiclo,
  hoy,
  predecir,
  resumenCiclos,
  sumarDias,
  ultimoCiclo,
} from "@/lib/cycle";
import { aHemisferio, faseLunar } from "@/lib/moon";
import { capitalizar, mesYAnio } from "@/lib/format";
import { COLOR_FASE } from "@/components/punto-fase";

export const metadata: Metadata = {
  title: "Calendario",
};

type Props = {
  searchParams: Promise<{ mes?: string }>;
};

/** Primer día del mes indicado por "YYYY-MM", o el mes actual. */
function mesMostrado(parametro: string | undefined, fechaDeHoy: Date): Date {
  if (parametro && /^\d{4}-\d{2}$/.test(parametro)) {
    const [anio, mes] = parametro.split("-").map(Number);
    if (mes >= 1 && mes <= 12) return new Date(Date.UTC(anio, mes - 1, 1));
  }
  return new Date(
    Date.UTC(fechaDeHoy.getUTCFullYear(), fechaDeHoy.getUTCMonth(), 1),
  );
}

function claveMes(fecha: Date): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Días de sangrado registrados, como conjunto de "YYYY-MM-DD". */
function diasDeSangrado(ciclos: CicloRegistrado[]): Set<string> {
  const dias = new Set<string>();
  for (const ciclo of ciclos) {
    const fin = ciclo.endDate ?? ciclo.startDate;
    const total = Math.min(diasEntre(ciclo.startDate, fin), 30);
    for (let i = 0; i <= total; i++) {
      dias.add(sumarDias(ciclo.startDate, i).toISOString().slice(0, 10));
    }
  }
  return dias;
}

export default async function PaginaCalendario({ searchParams }: Props) {
  const { mes } = await searchParams;
  const [perfil, ciclos] = await Promise.all([perfilActual(), listarCiclos()]);

  const hemisferio = aHemisferio(perfil.hemisphere);
  const fechaDeHoy = hoy(perfil.timezone);
  const primerDia = mesMostrado(mes, fechaDeHoy);

  const resumen = resumenCiclos(ciclos);
  const duracionCiclo = resumen.duracionMedia
    ? Math.round(resumen.duracionMedia)
    : DURACION_CICLO_POR_DEFECTO;
  const ultimo = ultimoCiclo(ciclos);
  const prediccion = predecir(ciclos);
  const sangrado = diasDeSangrado(ciclos);

  // Rejilla que empieza en lunes.
  const diasEnMes = new Date(
    Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const huecoInicial = (primerDia.getUTCDay() + 6) % 7;

  const celdas: (Date | null)[] = [
    ...Array<null>(huecoInicial).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => sumarDias(primerDia, i)),
  ];

  const mesAnterior = new Date(
    Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth() - 1, 1),
  );
  const mesSiguiente = new Date(
    Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth() + 1, 1),
  );

  /** Fase estimada de un día, o null si cae fuera del historial conocido. */
  function faseDe(dia: Date): FaseCiclo | null {
    if (!ultimo) return null;

    const desdeUltimo = diasEntre(ultimo.startDate, dia);
    if (desdeUltimo < 0) {
      // Día anterior al último periodo: se busca el ciclo que lo contiene.
      const contenedor = ciclos
        .filter((c) => c.startDate.getTime() <= dia.getTime())
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];
      if (!contenedor) return null;
      const dentro = diasEntre(contenedor.startDate, dia);
      if (dentro >= duracionCiclo + 15) return null;
      return faseDelCiclo(dentro + 1, duracionCiclo, DIAS_SANGRADO_POR_DEFECTO);
    }

    // No proyectar indefinidamente hacia el futuro.
    if (desdeUltimo > duracionCiclo + 10) return null;
    return faseDelCiclo(desdeUltimo + 1, duracionCiclo, DIAS_SANGRADO_POR_DEFECTO);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <Link
          href={`/calendario?mes=${claveMes(mesAnterior)}`}
          aria-label="Mes anterior"
          className="rounded-full border border-borde px-3 py-1.5 text-sm text-tenue transition-colors hover:bg-superficie hover:text-texto"
        >
          ‹
        </Link>
        <h1 className="font-serif text-lg font-semibold tracking-tight">
          {capitalizar(mesYAnio.format(primerDia))}
        </h1>
        <Link
          href={`/calendario?mes=${claveMes(mesSiguiente)}`}
          aria-label="Mes siguiente"
          className="rounded-full border border-borde px-3 py-1.5 text-sm text-tenue transition-colors hover:bg-superficie hover:text-texto"
        >
          ›
        </Link>
      </header>

      <div className="rounded-2xl border border-borde bg-superficie p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-medium text-tenue">
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={`hueco-${i}`} />;

            const iso = dia.toISOString().slice(0, 10);
            const esHoy = iso === fechaDeHoy.toISOString().slice(0, 10);
            const registrado = sangrado.has(iso);
            const fase = faseDe(dia);
            const luna = faseLunar(dia, hemisferio);
            const esPrevisto =
              prediccion.proximoPeriodo !== null &&
              dia.getTime() >= prediccion.proximoPeriodo.getTime() &&
              diasEntre(prediccion.proximoPeriodo, dia) <
                DIAS_SANGRADO_POR_DEFECTO;

            const etiqueta = [
              `${dia.getUTCDate()}`,
              fase ? ETIQUETAS_FASE[fase] : null,
              registrado ? "periodo registrado" : null,
              esPrevisto ? "periodo previsto" : null,
              luna.nombre,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={iso}
                title={etiqueta}
                aria-label={etiqueta}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  registrado
                    ? "bg-fase-menstrual font-semibold text-espuma"
                    : esPrevisto
                      ? "border-2 border-dashed border-fase-menstrual text-texto"
                      : "hover:bg-fondo"
                } ${esHoy ? "ring-2 ring-oceano ring-offset-1 ring-offset-superficie" : ""}`}
              >
                <span className="leading-none">{dia.getUTCDate()}</span>
                <span aria-hidden className="mt-0.5 text-[10px] leading-none">
                  {luna.emoji}
                </span>
                {fase && !registrado && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1.5 rounded-full ${COLOR_FASE[fase]}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-tenue">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-fase-menstrual" /> Periodo registrado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-dashed border-fase-menstrual" />{" "}
          Previsto
        </span>
        {(Object.keys(ETIQUETAS_FASE) as FaseCiclo[]).map((f) => (
          <span key={f} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${COLOR_FASE[f]}`} />
            {ETIQUETAS_FASE[f]}
          </span>
        ))}
      </div>

      {ciclos.length === 0 && (
        <p className="rounded-2xl border border-borde bg-superficie p-5 text-sm text-tenue">
          El calendario ya muestra las fases lunares. Cuando registres tu primer
          periodo empezará a mostrar también tu ciclo.{" "}
          <Link href="/registro" className="font-medium text-oceano underline">
            Registrar uno
          </Link>
          .
        </p>
      )}
    </div>
  );
}
