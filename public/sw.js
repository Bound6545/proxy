// Scramjet Service Worker
importScripts('/scramjet/scramjet.codecs.js');
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.worker.js');

// Override the config prefix to ensure it's correct
self.__scramjet$config.prefix = '/service/';

console.log('🔧 Scramjet SW loaded with prefix:', self.__scramjet$config.prefix);

// Initialize Scramjet
const scramjet = new ScramjetServiceWorker(self.__scramjet$config);

// Install event
self.addEventListener('install', (event) => {
    console.log('✅ Scramjet SW installed');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('✅ Scramjet SW activated');
    event.waitUntil(self.clients.claim());
});

// Fetch event - handle all requests
self.addEventListener('fetch', (event) => {
    if (scramjet.route(event)) {
        event.respondWith(scramjet.fetch(event));
    }
});
