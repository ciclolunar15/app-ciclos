import Link from "next/link";

import {
  COLOR_SELLO,
  SELLOS,
  TONOS,
  fueraDelTiempoDe,
  type CeldaSincronario,
} from "@/lib/sincronario";
import { faseLunar } from "@/lib/moon";
import type { FaseCiclo } from "@/lib/cycle";
import { mesAbreviado } from "@/lib/format";
import { Hemisphere } from "lunarphase-js";

/**
 * El color del marcador es la fase real del ciclo (la misma que colorea los
 * puntos en la vista Ciclo), no el sello del Tzolkin: colorear por sello
 * hacía parecer que la mujer pasa por las 4 etapas de la menstruación cada
 * 4 días, algo sin relación con su ciclo real.
 */
const FILL_FASE: Record<FaseCiclo, string> = {
  menstrual: "fill-fase-menstrual",
  folicular: "fill-fase-folicular",
  ovulatoria: "fill-fase-ovulatoria",
  lutea: "fill-fase-lutea",
};
const FILL_SIN_FASE = "fill-borde";

const CENTRO = 170;
const RADIO_EXTERIOR = 160;
const RADIO_INTERIOR = 95;
const RADIO_MARCADORES = (RADIO_EXTERIOR + RADIO_INTERIOR) / 2;
const RADIO_MARCADOR = 15;
const TOTAL_DIAS = 28;
const ANGULO_INICIAL = -90;
const PASO = 360 / TOTAL_DIAS;

function punto(radio: number, anguloGrados: number) {
  const rad = (anguloGrados * Math.PI) / 180;
  return { x: CENTRO + radio * Math.cos(rad), y: CENTRO + radio * Math.sin(rad) };
}

export function RuedaSincronario({
  celdas,
  luna,
  nombreLuna,
  inicio,
  fechaDeHoy,
  diaSeleccionado,
  hrefParaDia,
  faseDe,
  esRegistrado,
  hemisferio,
}: {
  celdas: CeldaSincronario[];
  luna: number;
  nombreLuna: string;
  inicio: Date;
  fechaDeHoy: Date;
  diaSeleccionado: Date;
  hrefParaDia: (iso: string) => string;
  faseDe: (fecha: Date) => FaseCiclo | null;
  esRegistrado: (fecha: Date) => boolean;
  hemisferio: Hemisphere;
}) {
  const isoHoy = fechaDeHoy.toISOString().slice(0, 10);
  const isoSeleccionado = diaSeleccionado.toISOString().slice(0, 10);
  const diasNormales = celdas.filter((c) => c.tipo === "normal");
  const hunabKu = celdas.find((c) => c.tipo === "hunab-ku") ?? null;
  const fueraDelTiempo = luna === 13 ? fueraDelTiempoDe(inicio) : null;

  return (
    <div className="rounded-2xl border-2 border-luna/50 bg-superficie p-2 sm:p-4">
      <svg
        viewBox="0 0 340 340"
        className="mx-auto aspect-square w-full max-w-sm overflow-visible"
      >
        <circle
          cx={CENTRO}
          cy={CENTRO}
          r={RADIO_EXTERIOR}
          className="fill-none stroke-borde"
          strokeWidth={1}
        />
        <circle
          cx={CENTRO}
          cy={CENTRO}
          r={RADIO_INTERIOR}
          className="fill-none stroke-borde"
          strokeWidth={1}
        />

        {/* Líneas radiales entre cada día, puramente decorativas. */}
        {Array.from({ length: TOTAL_DIAS }, (_, i) => {
          const angulo = ANGULO_INICIAL + i * PASO;
          const desde = punto(RADIO_INTERIOR, angulo);
          const hasta = punto(RADIO_EXTERIOR, angulo);
          return (
            <line
              key={i}
              x1={desde.x}
              y1={desde.y}
              x2={hasta.x}
              y2={hasta.y}
              className="stroke-borde"
              strokeWidth={1}
            />
          );
        })}

        {/* Centro: luna y nombre. */}
        <text
          x={CENTRO}
          y={CENTRO - 6}
          textAnchor="middle"
          className="fill-texto font-serif text-[15px] font-semibold"
        >
          Luna {luna}
        </text>
        <text
          x={CENTRO}
          y={CENTRO + 14}
          textAnchor="middle"
          className="fill-tenue font-serif text-[13px]"
        >
          {nombreLuna}
        </text>

        {diasNormales.map((celda) => {
          if (celda.tipo !== "normal") return null;
          const iso = celda.fecha.toISOString().slice(0, 10);
          const esHoy = iso === isoHoy;
          const esSeleccionado = iso === isoSeleccionado;
          const sello = SELLOS[celda.sello - 1];
          const colorSello = COLOR_SELLO[(celda.sello - 1) % 4];
          const tono = TONOS[celda.tono - 1];
          const lunaDelDia = faseLunar(celda.fecha, hemisferio);
          const fase = faseDe(celda.fecha);
          const previsto = fase === "menstrual" && !esRegistrado(celda.fecha);
          const etiqueta = `${celda.fecha.getUTCDate()} de ${mesAbreviado(celda.fecha)} — Día ${celda.diaEnLuna}, Kin ${celda.kin}: ${sello} ${colorSello}, tono ${tono}${
            fase === "menstrual" ? ` — periodo ${previsto ? "previsto" : "registrado"}` : ""
          }`;

          const angulo = ANGULO_INICIAL + (celda.diaEnLuna - 1 + 0.5) * PASO;
          const centroMarcador = punto(RADIO_MARCADORES, angulo);
          // El emoji va un poco más afuera que el marcador, como etiqueta.
          const puntoEmoji = punto(RADIO_EXTERIOR + 14, angulo);

          return (
            <Link key={iso} href={hrefParaDia(iso)} aria-label={etiqueta}>
              <title>{etiqueta}</title>
              {(esHoy || esSeleccionado) && (
                <circle
                  cx={centroMarcador.x}
                  cy={centroMarcador.y}
                  r={RADIO_MARCADOR + 4}
                  className={`fill-none ${esHoy ? "stroke-espuma" : "stroke-tenue"}`}
                  strokeWidth={2}
                />
              )}
              {previsto ? (
                <circle
                  cx={centroMarcador.x}
                  cy={centroMarcador.y}
                  r={RADIO_MARCADOR}
                  className="fill-fase-menstrual/25 stroke-fase-menstrual"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              ) : (
                <circle
                  cx={centroMarcador.x}
                  cy={centroMarcador.y}
                  r={RADIO_MARCADOR}
                  className={fase ? FILL_FASE[fase] : FILL_SIN_FASE}
                />
              )}
              <text
                x={centroMarcador.x}
                y={centroMarcador.y - 3}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-espuma text-[10px] font-semibold"
              >
                {celda.diaEnLuna}
              </text>
              {/* Fecha real (calendario común) en chico, debajo del número
                  de día del sincronario: por sí solo ese número no deja ver
                  a simple vista qué día es cada marcador. */}
              <text
                x={centroMarcador.x}
                y={centroMarcador.y + 7}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-espuma/70 text-[6px]"
              >
                {celda.fecha.getUTCDate()} {mesAbreviado(celda.fecha)}
              </text>
              <text
                x={puntoEmoji.x}
                y={puntoEmoji.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[13px]"
              >
                {lunaDelDia.emoji}
              </text>
            </Link>
          );
        })}
      </svg>

      {hunabKu && (
        <Link
          href={hrefParaDia(hunabKu.fecha.toISOString().slice(0, 10))}
          className="mt-3 flex items-center justify-center rounded-xl border border-luna/50 py-2 text-center text-xs font-medium text-luna"
        >
          ✦ Hunab Ku — día intercalar ✦
        </Link>
      )}

      {fueraDelTiempo && (
        <Link
          href={hrefParaDia(fueraDelTiempo.toISOString().slice(0, 10))}
          className="mt-3 flex items-center justify-center rounded-xl border border-turquesa/50 py-2 text-center text-xs font-medium text-turquesa"
        >
          ✧ Día Fuera del Tiempo — 25 de julio ✧
        </Link>
      )}
    </div>
  );
}
