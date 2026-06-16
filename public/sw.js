/* Self-destructing MedFlow Service Worker to clean client cache */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW] Self-destructed and cleared all caches successfully.');
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          if (client.navigate) {
            client.navigate(client.url);
          }
        });
      });
    })
  );
});
