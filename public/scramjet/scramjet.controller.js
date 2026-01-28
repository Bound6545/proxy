/**
 * Scramjet Controller
 * Handles the logic between the UI and the Service Worker
 */
class ScramjetController {
    constructor() {
        this.config = window.__scramjet$config;
        this.codec = window.__scramjet$codecs.xor;
    }

    // Encodes a URL for the proxy
    encodeUrl(url) {
        if (!url) return url;
        return this.config.prefix + this.codec.encode(url);
    }

    // Decodes a proxied URL
    decodeUrl(url) {
        if (!url || !url.startsWith(this.config.prefix)) return url;
        return this.codec.decode(url.slice(this.config.prefix.length));
    }
}

window.ScramjetController = ScramjetController;