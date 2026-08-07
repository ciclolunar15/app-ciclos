import { NextResponse } from "next/server";

import { NoAutenticada, obtenerBytesImagenSincronario } from "@/lib/dal/sincronario-imagen";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let imagen;
  try {
    imagen = await obtenerBytesImagenSincronario(id);
  } catch (error) {
    if (error instanceof NoAutenticada) return new NextResponse(null, { status: 401 });
    throw error;
  }

  if (!imagen) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(imagen.datos), {
    headers: {
      "Content-Type": imagen.tipoMime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
