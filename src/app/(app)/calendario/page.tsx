import Link from "next/link";
import type { Metadata } from "next";

import { listarCiclos, perfilActual } from "@/lib/dal/cycles";
import {
  DIAS_SANGRADO_POR_DEFECTO,
  DURACION_CICLO_POR_DEFECTO,
  type FaseCiclo,
  diasEntre,
  duracionUltimoSangrado,
  faseDelCiclo,
  hoy,
  resumenCiclos,
  ultimoCiclo,
} from "@/lib/cycle";
import { aHemisferio, faseLunar, faseLunarAmplia } from "@/lib/moon";
import {
  LUNAS,
  calcularSincronario,
  diasDeLuna,
  inicioAnioLunar,
} from "@/lib/sincronario";
import { capitalizar } from "@/lib/format";
import { LeyendaFases } from "@/components/punto-fase";
import { RuedaSincronario } from "@/components/rueda-sincronario";
import { GridSincronario } from "@/components/grid-sincronario";
import { Desplegable } from "@/components/desplegable";
import { SeccionConsejos } from "@/components/seccion-consejos";
import { DeslizarLuna } from "@/components/deslizar-luna";

export const metadata: Metadata = {
  title: "Calendario",
};

type Props = {
  searchParams: Promise<{ vista?: string; luna?: string; dia?: string }>;
};

const CLASE_FLECHA =
  "rounded-full bg-slate-300 px-3 py-1.5 text-sm font-semibold text-abismo transition-colors hover:bg-slate-400";

/** Fecha civil indicada por "YYYY-MM-DD" si es válida, o null. */
function diaMostrado(parametro: string | undefined): Date | null {
  if (!parametro || !/^\d{4}-\d{2}-\d{2}$/.test(parametro)) return null;
  const [anio, mes, numeroDia] = parametro.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, numeroDia));
  return fecha.toISOString().slice(0, 10) === parametro ? fecha : null;
}

type LunaMostrada = { inicio: Date; luna: number };

/** Año/luna indicados por "YYYY-N" (N: 1-13), o la luna actual. */
function lunaMostrada(parametro: string | undefined, fechaDeHoy: Date): LunaMostrada {
  if (parametro && /^\d{4}-(1[0-3]|[1-9])$/.test(parametro)) {
    const [anio, luna] = parametro.split("-").map(Number);
    return { inicio: new Date(Date.UTC(anio, 6, 26)), luna };
  }
  const inicio = inicioAnioLunar(fechaDeHoy);
  const resultado = calcularSincronario(fechaDeHoy);
  return { inicio, luna: resultado.tipo === "normal" ? resultado.luna : 1 };
}

function claveLuna(inicio: Date, luna: number): string {
  return `${inicio.getUTCFullYear()}-${luna}`;
}

function lunaAnterior({ inicio, luna }: LunaMostrada): LunaMostrada {
  if (luna > 1) return { inicio, luna: luna - 1 };
  return { inicio: new Date(Date.UTC(inicio.getUTCFullYear() - 1, 6, 26)), luna: 13 };
}

function lunaSiguiente({ inicio, luna }: LunaMostrada): LunaMostrada {
  if (luna < 13) return { inicio, luna: luna + 1 };
  return { inicio: new Date(Date.UTC(inicio.getUTCFullYear() + 1, 6, 26)), luna: 1 };
}

export default async function PaginaCalendario({ searchParams }: Props) {
  const { vista, luna: parametroLuna, dia } = await searchParams;
  const esGrilla = vista === "grilla";
  const [perfil, ciclos] = await Promise.all([perfilActual(), listarCiclos()]);

  const hemisferio = aHemisferio(perfil.hemisphere);
  const fechaDeHoy = hoy(perfil.timezone);
  const diaSeleccionado = diaMostrado(dia) ?? fechaDeHoy;
  const isoSeleccionado = diaSeleccionado.toISOString().slice(0, 10);
  const isoHoy = fechaDeHoy.toISOString().slice(0, 10);

  const lunaActual = lunaMostrada(parametroLuna, fechaDeHoy);
  const nombreLuna = LUNAS[lunaActual.luna - 1];

  const resumen = resumenCiclos(ciclos);
  const duracionCiclo = resumen.duracionMedia
    ? Math.round(resumen.duracionMedia)
    : DURACION_CICLO_POR_DEFECTO;
  const ultimo = ultimoCiclo(ciclos);

  /**
   * Fase real del ciclo para un día dado, o null si cae fuera del historial
   * conocido. Es la misma fuente de verdad para las dos vistas del
   * sincronario (grilla y rueda): el color de cada día refleja la fase real
   * de la usuaria, nunca el sello del Tzolkin (eso insinuaba falsamente que
   * se pasa por las 4 etapas de la menstruación cada 4 días).
   */
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
      return faseDelCiclo(
        dentro + 1,
        duracionCiclo,
        duracionUltimoSangrado(contenedor) ?? DIAS_SANGRADO_POR_DEFECTO,
      );
    }

    // No proyectar indefinidamente hacia el futuro.
    if (desdeUltimo > duracionCiclo + 10) return null;
    // Pasada la duración del ciclo, se asume que arrancó uno nuevo en la
    // fecha prevista: el conteo se envuelve para que ese día sea el 1
    // (menstrual) en vez de seguir contando como si fuera el final del
    // ciclo anterior (lútea).
    const diaDelCiclo =
      desdeUltimo >= duracionCiclo
        ? (desdeUltimo % duracionCiclo) + 1
        : desdeUltimo + 1;
    return faseDelCiclo(
      diaDelCiclo,
      duracionCiclo,
      duracionUltimoSangrado(ultimo) ?? DIAS_SANGRADO_POR_DEFECTO,
    );
  }

  /**
   * Un día de sangrado es "registrado" cuando cae dentro del rango real de
   * algún ciclo guardado (startDate..endDate, o hasta hoy si aún no se cerró
   * el sangrado). Cualquier otro día que la fase marque como "menstrual"
   * -sea la cola de un sangrado en curso o un ciclo futuro/pasado
   * extrapolado- es "previsto": una estimación, no un dato real.
   */
  function esRegistrado(dia: Date): boolean {
    if (dia.getTime() > fechaDeHoy.getTime()) return false;
    return ciclos.some((c) => {
      const inicio = c.startDate.getTime();
      const fin = (c.endDate ?? fechaDeHoy).getTime();
      return dia.getTime() >= inicio && dia.getTime() <= fin;
    });
  }

  const lunaPrevia = lunaAnterior(lunaActual);
  const lunaPosterior = lunaSiguiente(lunaActual);

  const faseSeleccionada = faseDe(diaSeleccionado);
  const faseLunarSeleccionada = faseLunarAmplia(
    faseLunar(diaSeleccionado, hemisferio).clave,
  );

  const hrefParaDia = (iso: string) =>
    `/calendario?${esGrilla ? "vista=grilla&" : ""}luna=${claveLuna(lunaActual.inicio, lunaActual.luna)}&dia=${iso}`;

  const hrefLunaAnterior = `/calendario?${esGrilla ? "vista=grilla&" : ""}luna=${claveLuna(lunaPrevia.inicio, lunaPrevia.luna)}`;
  const hrefLunaSiguiente = `/calendario?${esGrilla ? "vista=grilla&" : ""}luna=${claveLuna(lunaPosterior.inicio, lunaPosterior.luna)}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Selector Grilla/Rueda: dos formas de ver el mismo sincronario
          (contenido simbólico/espiritual, ver lib/sincronario.ts). Ya no
          hay calendario Gregoriano/médico en esta pantalla. */}
      <div className="flex gap-1 rounded-full border border-borde bg-superficie p-1 text-sm">
        <Link
          href={`/calendario?vista=grilla&luna=${claveLuna(lunaActual.inicio, lunaActual.luna)}&dia=${isoSeleccionado}`}
          className={`flex-1 rounded-full py-1.5 text-center font-medium transition-colors ${
            esGrilla ? "bg-luna text-abismo" : "text-tenue hover:text-texto"
          }`}
        >
          Grilla
        </Link>
        <Link
          href={`/calendario?luna=${claveLuna(lunaActual.inicio, lunaActual.luna)}&dia=${isoSeleccionado}`}
          className={`flex-1 rounded-full py-1.5 text-center font-medium transition-colors ${
            !esGrilla ? "bg-luna text-abismo" : "text-tenue hover:text-texto"
          }`}
        >
          Mi ciclo
        </Link>
      </div>

      <header className="flex items-center justify-between gap-2">
        <Link
          href={hrefLunaAnterior}
          aria-label="Luna anterior"
          className={CLASE_FLECHA}
        >
          ‹
        </Link>
        <h1 className="font-serif text-lg font-semibold tracking-tight">
          Luna {lunaActual.luna} · {capitalizar(nombreLuna)}
        </h1>
        <Link
          href={hrefLunaSiguiente}
          aria-label="Luna siguiente"
          className={CLASE_FLECHA}
        >
          ›
        </Link>
      </header>

      {/* Además de las flechas, se puede deslizar el dedo hacia los costados
          para cambiar de luna (móvil). Cada celda/marcador de día muestra
          además su fecha real (día + mes abreviado), porque el sincronario
          por sí solo no deja ver a simple vista qué día del calendario común
          es cada uno. */}
      <DeslizarLuna hrefAnterior={hrefLunaAnterior} hrefSiguiente={hrefLunaSiguiente}>
        {esGrilla ? (
          <GridSincronario
            celdas={diasDeLuna(lunaActual.inicio, lunaActual.luna)}
            luna={lunaActual.luna}
            inicio={lunaActual.inicio}
            fechaDeHoy={fechaDeHoy}
            diaSeleccionado={diaSeleccionado}
            hrefParaDia={hrefParaDia}
            faseDe={faseDe}
            esRegistrado={esRegistrado}
            hemisferio={hemisferio}
          />
        ) : (
          <RuedaSincronario
            celdas={diasDeLuna(lunaActual.inicio, lunaActual.luna)}
            luna={lunaActual.luna}
            inicio={lunaActual.inicio}
            fechaDeHoy={fechaDeHoy}
            diaSeleccionado={diaSeleccionado}
            hrefParaDia={hrefParaDia}
            faseDe={faseDe}
            esRegistrado={esRegistrado}
            hemisferio={hemisferio}
          />
        )}
      </DeslizarLuna>

      <LeyendaFases />

      <SeccionConsejos
        faseCiclo={faseSeleccionada}
        faseLunar={faseLunarSeleccionada}
        fecha={diaSeleccionado}
        esHoy={isoSeleccionado === isoHoy}
      />

      <Desplegable
        titulo="¿Qué es el sincronario?"
        claseBorde="border-2 border-luna/50"
      >
        <p>
          «Sincronario» viene de <em>syn-</em> (junto) + <em>cronos</em>{" "}
          (tiempo): estar en sintonía con el tiempo. Es el calendario de 13
          lunas de José y Lloydine Argüelles: 13 lunas de 28 días (364 días)
          más el 25 de julio, el Día Fuera del Tiempo — en total, 365 días.
        </p>
        <p>
          Cada ser vivo tiene su propio ritmo — los animales, las plantas,
          los árboles, las mareas — y el sincronario invita a seguir ese
          ritmo interno. Como dice su propia filosofía: el tiempo es arte.
        </p>
      </Desplegable>
    </div>
  );
}
