// Definimos la versión actual de la app. Cambiar esto (ej: "v2") permite actualizar los archivos en los celulares.
const VERSION = "v1";

// Lista con todos los archivos esenciales que la app necesita para funcionar sin internet.
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png"
];

// 1. EVENTO INSTALL: Se ejecuta la primera vez que el navegador lee el Service Worker.
self.addEventListener("install", evento => {
  evento.waitUntil(
    // Abrimos el contenedor de la caché con el nombre de la versión
    caches.open(VERSION).then(cache => {
      // Guardamos (copiamos) todos los archivos de la lista en la memoria del celular
      return cache.addAll(ARCHIVOS);
    }).then(() => self.skipWaiting()) // Forzamos a que el SW se active de inmediato
  );
});

// 2. EVENTO ACTIVATE: Se ejecuta cuando el Service Worker toma el control de la app y limpia versiones viejas.
self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          // Si encontramos una caché antigua que no coincide con la versión actual, la borramos
          if (key !== VERSION) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. EVENTO FETCH: Se intercala entre tu app y la red cada vez que se solicita un archivo ("estrategia primero la caché").
self.addEventListener("fetch", evento => {
  evento.respondWith(
    caches.match(evento.request).then(respuestaEnCache => {
      // Si el archivo está guardado en la caché, lo devolvemos de inmediato (incluso sin internet).
      // Si no está en la caché, intentamos buscarlo en internet mediante fetch().
      return respuestaEnCache || fetch(evento.request);
    })
  );
});