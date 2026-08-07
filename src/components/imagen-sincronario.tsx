import { listarImagenesSincronario } from "@/lib/dal/sincronario-imagen";
import { CarruselImagenesSincronario } from "@/components/carrusel-imagenes-sincronario";

/**
 * Conjunto de imágenes genéricas del sincronario, subidas por la
 * administradora desde /admin/consejos. No depende de la etapa del ciclo ni
 * de la fase lunar de quien mira — es el mismo para todas.
 */
export async function ImagenSincronario() {
  const imagenes = await listarImagenesSincronario();
  if (imagenes.length === 0) return null;

  return <CarruselImagenesSincronario imagenes={imagenes} />;
}
