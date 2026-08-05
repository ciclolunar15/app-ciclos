"use client";

import { useState } from "react";

import { FormularioPostForo } from "@/components/formulario-post-foro";

export function BotonResponder({ postId }: { postId: string }) {
  const [mostrar, setMostrar] = useState(false);

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="w-fit text-xs font-medium text-tenue hover:text-oceano hover:underline"
      >
        Responder
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <FormularioPostForo
        respuestaAId={postId}
        compacto
        placeholder="Escribí tu respuesta…"
        alPublicar={() => setMostrar(false)}
      />
      <button
        type="button"
        onClick={() => setMostrar(false)}
        className="w-fit text-xs text-tenue hover:underline"
      >
        Cancelar
      </button>
    </div>
  );
}
