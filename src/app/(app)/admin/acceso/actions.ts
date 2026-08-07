"use server";

import { revalidatePath } from "next/cache";

import { generarCodigo } from "@/lib/dal/acceso";

export async function accionGenerarCodigo(): Promise<void> {
  await generarCodigo();
  revalidatePath("/admin/acceso");
}
