// Service Worker - Properly initialize Scramjet
importScripts('/scramjet/scramjet.all.js');

console.log('🔧 Loading Scramjet...');

// Get Scramjet from the bundle
const scramjetBundle = $scramjetLoadWorker();
console.log('📦 Scramjet bundle:', scramjetBundle ? 'loaded' : 'failed');

// Initialize with correct config
const config = {
    prefix: "/service/",
    codec: "plain",
    files: {
        wasm: "/scramjet/scramjet.wasm",
        worker: "/scramjet/scramjet.worker.js", 
        client: "/scramjet/scramjet.client.js",
        sync: "/scramjet/scramjet.sync.js"
    }
};

const scramjet = new scramjetBundle.ScramjetServiceWorker(config);

self.addEventListener('install', (event) => {
    console.log('✅ SW installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('✅ SW activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/service/')) {
        console.log('🌐 Handling:', event.request.url);
        event.respondWith(
            (async () => {
                try {
                    await scramjet.loadConfig();
                    return await scramjet.fetch(event);
                } catch (err) {
                    console.error('Scramjet error:', err);
                    return new Response('Proxy Error: ' + err.message, { status: 500 });
                }
            })()
        );
    }
});
