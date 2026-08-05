/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/sin-conexion",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Notificaciones push: Serwist no las maneja, son eventos estándar de
// Service Worker. Ver lib/dal/notificaciones.ts (servidor) para el envío.
self.addEventListener("push", (event) => {
  let datos: { title?: string; body?: string; url?: string } = {};
  try {
    datos = event.data?.json() ?? {};
  } catch {
    datos = { body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(datos.title ?? "Maresa", {
      body: datos.body,
      icon: "/centro_sincro.png",
      badge: "/centro_sincro.png",
      data: { url: datos.url ?? "/" },
    }),
  );
});

// Al tocar la notificación: si ya hay una pestaña de la app abierta, la
// enfoca en vez de abrir una nueva.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((listaClientes) => {
      for (const cliente of listaClientes) {
        if (cliente.url.includes(url) && "focus" in cliente) return cliente.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
