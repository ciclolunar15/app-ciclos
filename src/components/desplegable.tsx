"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Desplegable({
  titulo,
  children,
  claseBorde = "border border-borde",
}: {
  titulo: string;
  children: React.ReactNode;
  /** Ej. "border-2 border-luna/50" para el acento dorado del sincronario. */
  claseBorde?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={`rounded-2xl ${claseBorde} bg-superficie p-4 text-sm text-tenue`}>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-center gap-2 text-center font-medium text-texto"
      >
        {titulo}
        <span
          aria-hidden
          className={`transition-transform duration-300 ${abierto ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-3 text-center leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
