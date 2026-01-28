// Import Scramjet service worker
importScripts('/scramjet/scramjet.codecs.js');
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.worker.js');

// Initialize Scramjet
const scramjet = new ScramjetServiceWorker();

// Handle fetch events
self.addEventListener('fetch', (event) => {
    if (scramjet.route(event)) {
        event.respondWith(scramjet.fetch(event));
    }
});
