import { listarConsejosPara } from "@/lib/dal/consejos";
import type { FaseCiclo } from "@/lib/cycle";
import type { FaseLunarAmplia } from "@/lib/moon";
import { capitalizar, fechaLarga } from "@/lib/format";

const ETIQUETA_FASE_CICLO: Record<FaseCiclo, string> = {
  menstrual: "Menstrual",
  folicular: "Pre ovulación",
  ovulatoria: "Ovulación",
  lutea: "Pre menstrual",
};

const ETIQUETA_FASE_LUNAR: Record<FaseLunarAmplia, string> = {
  nueva: "Nueva 🌑",
  creciente: "Creciente 🌒",
  llena: "Llena 🌕",
  menguante: "Menguante 🌗",
};

export async function SeccionConsejos({
  faseCiclo,
  faseLunar,
  fecha,
  esHoy,
}: {
  faseCiclo: FaseCiclo | null;
  faseLunar: FaseLunarAmplia;
  fecha: Date;
  esHoy: boolean;
}) {
  const consejos = await listarConsejosPara(faseCiclo, faseLunar);

  return (
    <div className="rounded-2xl border border-borde bg-superficie p-4">
      <h2 className="font-serif font-semibold">
        {esHoy ? "Consejos para hoy" : `Consejos para el ${fechaLarga.format(fecha)}`}
      </h2>

      {faseCiclo ? (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-tenue">
          {ETIQUETA_FASE_CICLO[faseCiclo]} · {ETIQUETA_FASE_LUNAR[faseLunar]}
        </p>
      ) : (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-tenue">
          {capitalizar(ETIQUETA_FASE_LUNAR[faseLunar])}
        </p>
      )}

      {!faseCiclo ? (
        <p className="mt-3 text-sm text-tenue">
          Registrá tu ciclo para ver consejos personalizados de este momento.
        </p>
      ) : consejos.length === 0 ? (
        <p className="mt-3 text-sm text-tenue">
          Todavía no hay consejos para este momento.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-borde">
          {consejos.map((consejo) => (
            <li key={consejo.id} className="py-3 text-sm leading-relaxed first:pt-0 last:pb-0">
              {consejo.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
