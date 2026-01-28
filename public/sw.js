// Service Worker - Simplified Scramjet without Bare-Mux
importScripts('/scramjet/scramjet.codecs.js');
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.worker.js');

// Force correct prefix
self.__scramjet$config.prefix = '/service/';

console.log('🔧 Scramjet SW loaded');

// Initialize Scramjet
const scramjet = new ScramjetServiceWorker(self.__scramjet$config);

self.addEventListener('install', (event) => {
    console.log('✅ Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (scramjet.route(event)) {
        console.log('🌐 Scramjet handling:', new URL(event.request.url).pathname);
        event.respondWith(scramjet.fetch(event));
    }
});
