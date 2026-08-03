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
import { COLOR_FASE } from "@/components/punto-fase";
import { Hemisphere } from "lunarphase-js";

const SIN_FASE = "bg-borde";

function Celda({
  fecha,
  href,
  etiqueta,
  esHoy,
  esSeleccionado,
  contenido,
  colSpan7 = false,
}: {
  fecha: Date;
  href: string;
  etiqueta: string;
  esHoy: boolean;
  esSeleccionado: boolean;
  contenido: React.ReactNode;
  colSpan7?: boolean;
}) {
  return (
    <Link
      href={href}
      title={etiqueta}
      aria-label={etiqueta}
      className={`relative flex flex-col items-center justify-center rounded-lg text-sm transition-colors hover:bg-fondo ${
        colSpan7 ? "col-span-7 py-2" : "aspect-square"
      } ${
        esHoy
          ? "ring-2 ring-luna ring-offset-1 ring-offset-superficie"
          : esSeleccionado
            ? "ring-2 ring-tenue ring-offset-1 ring-offset-superficie"
            : ""
      }`}
      data-fecha={fecha.toISOString().slice(0, 10)}
    >
      {contenido}
    </Link>
  );
}

export function GridSincronario({
  celdas,
  luna,
  inicio,
  fechaDeHoy,
  diaSeleccionado,
  hrefParaDia,
  faseDe,
  hemisferio,
}: {
  celdas: CeldaSincronario[];
  luna: number;
  inicio: Date;
  fechaDeHoy: Date;
  diaSeleccionado: Date;
  hrefParaDia: (iso: string) => string;
  faseDe: (fecha: Date) => FaseCiclo | null;
  hemisferio: Hemisphere;
}) {
  const isoHoy = fechaDeHoy.toISOString().slice(0, 10);
  const isoSeleccionado = diaSeleccionado.toISOString().slice(0, 10);
  const fueraDelTiempo = luna === 13 ? fueraDelTiempoDe(inicio) : null;

  return (
    <div className="rounded-2xl border-2 border-luna/50 bg-superficie p-2 sm:p-4">
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((celda) => {
          const iso = celda.fecha.toISOString().slice(0, 10);
          const esHoy = iso === isoHoy;
          const sello = SELLOS[celda.sello - 1];
          const colorSello = COLOR_SELLO[(celda.sello - 1) % 4];
          const tono = TONOS[celda.tono - 1];
          const lunaDelDia = faseLunar(celda.fecha, hemisferio);
          const fase = faseDe(celda.fecha);

          const esSeleccionado = iso === isoSeleccionado;

          if (celda.tipo === "hunab-ku") {
            const etiqueta = `Hunab Ku, día intercalar — Kin ${celda.kin} ${sello} ${colorSello}, tono ${tono}`;
            return (
              <Celda
                key={iso}
                fecha={celda.fecha}
                href={hrefParaDia(iso)}
                etiqueta={etiqueta}
                esHoy={esHoy}
                esSeleccionado={esSeleccionado}
                colSpan7
                contenido={
                  <span className="text-center text-xs font-medium text-luna">
                    ✦ Hunab Ku — día intercalar ✦
                  </span>
                }
              />
            );
          }

          const etiqueta = `Día ${celda.diaEnLuna}, Kin ${celda.kin}: ${sello} ${colorSello}, tono ${tono}`;

          return (
            <Celda
              key={iso}
              fecha={celda.fecha}
              href={hrefParaDia(iso)}
              etiqueta={etiqueta}
              esHoy={esHoy}
              esSeleccionado={esSeleccionado}
              contenido={
                <>
                  <span className="leading-none">{celda.diaEnLuna}</span>
                  <span
                    aria-hidden
                    className={`mt-1 size-1.5 rounded-full ${fase ? COLOR_FASE[fase] : SIN_FASE}`}
                  />
                  <span aria-hidden className="mt-0.5 text-[9px] leading-none">
                    {lunaDelDia.emoji}
                  </span>
                </>
              }
            />
          );
        })}

        {fueraDelTiempo &&
          (() => {
            const iso = fueraDelTiempo.toISOString().slice(0, 10);
            return (
              <Celda
                key={iso}
                fecha={fueraDelTiempo}
                href={hrefParaDia(iso)}
                etiqueta="Día Fuera del Tiempo, 25 de julio"
                esHoy={iso === isoHoy}
                esSeleccionado={iso === isoSeleccionado}
                colSpan7
                contenido={
                  <span className="text-center text-xs font-medium text-turquesa">
                    ✧ Día Fuera del Tiempo — 25 de julio ✧
                  </span>
                }
              />
            );
          })()}
      </div>
    </div>
  );
}
