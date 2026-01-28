// Scramjet configuration
self.$scramjet = {
    version: {
        build: "latest",
        type: "service"
    },
    config: {
        prefix: "/service/",
        files: {
            wasm: "/scramjet/scramjet.wasm",
            worker: "/scramjet/scramjet.worker.js",
            client: "/scramjet/scramjet.client.js",
            sync: "/scramjet/scramjet.sync.js"
        }
    }
};
