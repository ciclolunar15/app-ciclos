import { ETIQUETAS_FASE, type FaseCiclo } from "@/lib/cycle";

/** Clases fijas y no interpoladas: Tailwind necesita ver el nombre completo. */
const COLOR: Record<FaseCiclo, string> = {
  menstrual: "bg-fase-menstrual",
  folicular: "bg-fase-folicular",
  ovulatoria: "bg-fase-ovulatoria",
  lutea: "bg-fase-lutea",
};

export function PuntoFase({ fase }: { fase: FaseCiclo }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-3 shrink-0 rounded-full ${COLOR[fase]}`}
    />
  );
}

/** Leyenda de periodo registrado/previsto + las 4 fases. Igual en Ciclo y Sincronario. */
export function LeyendaFases() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-2xl bg-turquesa/35 p-4 text-xs text-white">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full ring-2 ring-espuma ring-offset-1 ring-offset-superficie" />{" "}
        Hoy
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-fase-menstrual" /> Periodo registrado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded border-2 border-dashed border-fase-menstrual" />{" "}
        Previsto
      </span>
      {(Object.keys(ETIQUETAS_FASE) as FaseCiclo[]).map((f) => (
        <span key={f} className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${COLOR[f]}`} />
          {ETIQUETAS_FASE[f]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-borde" />
        Sin registro
      </span>
    </div>
  );
}

export { COLOR as COLOR_FASE };
