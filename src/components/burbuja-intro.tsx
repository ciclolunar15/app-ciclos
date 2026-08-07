"use client";

import { motion } from "framer-motion";

/**
 * Panel tipo "media burbuja": el borde de afuera (hacia el filo de la
 * pantalla) queda recto y fuera de vista, como si la forma siguiera de
 * largo fuera del viewport; el de adentro (hacia el centro) muy redondeado.
 *
 * El wrapper w-screen + left-1/2 -translate-x-1/2 es la técnica estándar
 * para estirar un elemento al ancho real del viewport sin importar el
 * contenedor centrado (max-w-3xl) de la página — más confiable que jugar
 * con márgenes negativos asimétricos para anclar al borde derecho.
 */
export function BurbujaIntro({
  children,
  lado,
}: {
  children: React.ReactNode;
  lado: "izquierda" | "derecha";
}) {
  const esIzquierda = lado === "izquierda";
  return (
    <div
      className={`relative left-1/2 w-screen -translate-x-1/2 flex ${
        esIzquierda ? "justify-start" : "justify-end"
      }`}
    >
      <motion.div
        initial={{ x: esIzquierda ? -120 : 120, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className={`w-[88%] border border-luna/20 bg-abismo/85 py-10 shadow-2xl backdrop-blur-md sm:w-[62%] sm:py-14 ${
          esIzquierda
            ? "rounded-r-[3rem] pl-8 pr-6 sm:rounded-r-[8rem] sm:pl-16 sm:pr-10"
            : "rounded-l-[3rem] pl-6 pr-8 sm:rounded-l-[8rem] sm:pl-10 sm:pr-16"
        }`}
      >
        {children}
      </motion.div>
    </div>
  );
}
