// Scramjet Service Worker - Force correct configuration
importScripts('/scramjet/scramjet.codecs.js');
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.bundle.js'); // IMPORTANT: provides __scramjet$bundle
importScripts('/scramjet/scramjet.worker.js');

// Load BareMux for service worker
importScripts('/baremux/bare.cjs');

// Load Bare-as-module3 (BareMod) from local server
importScripts('/baremod/index.js');

// Configure BareMux transport in service worker context
try {
    BareMux.SetTransport("BareMod.BareClient", self.location.origin + "/bare/");
    console.log('✅ SW: BareMux transport configured');
} catch (e) {
    console.error('❌ SW: Failed to configure transport:', e);
}

// CRITICAL: Override the prefix AFTER imports
self.__scramjet$config.prefix = '/service/';
console.log('🔧 Scramjet config overridden - prefix is now:', self.__scramjet$config.prefix);

// Initialize Scramjet with the corrected config
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

// Fetch event - handle all requests under /service/
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only handle requests under /service/ scope
    if (url.pathname.startsWith('/service/')) {
        console.log('🌐 Scramjet handling:', url.pathname);
        event.respondWith(scramjet.fetch(event));
    }
});
