"use client";

import { useEffect, useState } from "react";

import { accionGuardarSuscripcionPush } from "@/app/(app)/acciones-notificaciones";

type Estado = "cargando" | "no-soportado" | "inactivo" | "activando" | "activado" | "denegado" | "error";

/** VAPID pública viene en base64url; pushManager.subscribe() pide un Uint8Array. */
function base64UrlAUint8Array(base64Url: string): Uint8Array {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

export function ActivadorNotificaciones() {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    let cancelado = false;

    async function verificar(): Promise<Estado> {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        return "no-soportado";
      }
      if (Notification.permission === "denied") return "denegado";

      try {
        const registro = await navigator.serviceWorker.ready;
        const suscripcion = await registro.pushManager.getSubscription();
        return suscripcion ? "activado" : "inactivo";
      } catch {
        return "error";
      }
    }

    verificar().then((resultado) => {
      if (!cancelado) setEstado(resultado);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  async function activar() {
    const clavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!clavePublica) {
      setEstado("error");
      return;
    }

    setEstado("activando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "denegado" : "inactivo");
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        // TS (lib.dom desde 5.7) tipa Uint8Array como genérico sobre
        // ArrayBufferLike, más estricto de lo que exige BufferSource en
        // runtime: es un problema de tipos, no de datos.
        applicationServerKey: base64UrlAUint8Array(clavePublica) as BufferSource,
      });
      const json = suscripcion.toJSON();

      const resultado = await accionGuardarSuscripcionPush({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });

      setEstado(resultado.ok ? "activado" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "cargando" || estado === "activado" || estado === "no-soportado") return null;

  if (estado === "denegado") {
    return (
      <p className="text-xs text-tenue">
        Bloqueaste las notificaciones para esta app — activalas desde la configuración del
        navegador si querés que te avise cuando te respondan.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={activar}
        disabled={estado === "activando"}
        className="w-fit rounded-full bg-luna px-3 py-1.5 text-xs font-semibold text-abismo transition-colors hover:bg-luna/90 disabled:opacity-60"
      >
        {estado === "activando" ? "Activando…" : "🔔 Avisarme cuando me respondan"}
      </button>
      {estado === "error" && (
        <p className="text-xs text-fase-menstrual">
          No se pudo activar. En iPhone, primero instalá la app en la pantalla de inicio.
        </p>
      )}
    </div>
  );
}
