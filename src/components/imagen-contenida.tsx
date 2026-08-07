import Image from "next/image";

/**
 * Muestra una imagen SIEMPRE completa (nunca recortada), sin importar su
 * proporción original, dentro de un contenedor de proporción fija. De
 * fondo va la misma imagen agrandada y difuminada (para no dejar una franja
 * vacía en los bordes que sobran) y encima la imagen real, encogida para
 * entrar entera. El contenedor (`relative`, con alto/ancho definidos, p. ej.
 * `aspect-[4/3]`) lo pone quien use este componente.
 */
export function ImagenContenida({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        unoptimized
        className="scale-110 object-cover opacity-40 blur-2xl"
      />
      <Image src={src} alt={alt} fill unoptimized className="object-contain" draggable={false} />
    </>
  );
}
