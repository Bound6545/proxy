import { createBareServer } from "@tomphttp/bare-server-node";
import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer();
const bare = createBareServer("/bare/");

// Use an async function to handle the tricky Scramjet import
(async () => {
    let Scramjet;
    try {
        const ScramjetModule = await import("@mercuryworkshop/scramjet");
        // This digs through the layers to find the actual constructor
        Scramjet = ScramjetModule.Scramjet || 
                   ScramjetModule.default?.Scramjet || 
                   ScramjetModule.default || 
                   ScramjetModule;

        if (typeof Scramjet !== 'function') {
            throw new Error("Scramjet is still not a function/constructor");
        }
    } catch (e) {
        console.error("❌ Failed to load Scramjet:", e.message);
        process.exit(1);
    }

    // --- 1. SETUP ENGINE ---
    const sj = new Scramjet({
        prefix: "/scramjet/",
        config: { 
            prefix: "/scramjet/", 
            bare: true,
            rewrite: {
                headers: (headers) => {
                    delete headers['x-frame-options'];
                    delete headers['content-security-policy'];
                    delete headers['content-security-policy-report-only'];
                    return headers;
                }
            }
        }
    });

    // --- 2. SERVE PUBLIC FOLDER ---
    app.use(express.static(join(__dirname, "public")));

    /* --- 3. SOUNDCLOUD LOGIC --- */
    let clientId = null;
    async function getClientId() {
        if (clientId) return clientId;
        try {
            const home = await axios.get('https://soundcloud.com');
            const scriptUrls = home.data.match(/<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)"/g);
            for (const tag of scriptUrls) {
                const url = tag.match(/src="([^"]+)"/)[1];
                const script = await axios.get(url);
                const match = script.data.match(/client_id:"([^"]+)"/);
                if (match) { clientId = match[1]; return clientId; }
            }
        } catch (e) { return 'a3e059563d7fd3372b49b37f00a00bcf'; }
    }

    app.get('/api/music/search', async (req, res) => {
        try {
            const cid = await getClientId();
            const response = await axios.get(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(req.query.q)}&client_id=${cid}&limit=20`);
            res.json(response.data.collection.map(t => ({
                id: t.id, title: t.title, artist: t.user.username, 
                thumbnail: t.artwork_url?.replace('large', 't500x500'),
                duration: Math.floor(t.duration / 1000), url: t.permalink_url
            })));
        } catch (e) { res.status(500).send(); }
    });

    // --- 4. ROUTER ---
    server.on("request", (req, res) => {
        if (req.url.startsWith('/api/music')) {
            app(req, res);
        } else if (bare.shouldRoute(req)) {
            bare.routeRequest(req, res);
        } else if (sj.shouldRoute(req)) {
            sj.routeRequest(req, res);
        } else {
            app(req, res);
        }
    });

    server.on("upgrade", (req, socket, head) => {
        if (bare.shouldRoute(req)) {
            bare.routeUpgrade(req, socket, head);
        } else if (sj.shouldRoute(req)) {
            sj.routeUpgrade(req, socket, head);
        } else {
            socket.end();
        }
    });

    server.listen(process.env.PORT || 8080, "0.0.0.0", () => {
        console.log("🚀 Server Live - Scramjet Connected");
    });
})();
