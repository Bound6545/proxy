import { createBareServer } from "@tomphttp/bare-server-node";
import ScramjetPkg from "@mercuryworkshop/scramjet";
import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";

// --- DEBUG: This will show in your Railway/PM2 logs ---
console.log('--- SCRAMJET DEBUG START ---');
console.log('ScramjetPkg Type:', typeof ScramjetPkg);
console.log('ScramjetPkg Keys:', Object.keys(ScramjetPkg));
if (ScramjetPkg.default) console.log('Default Keys:', Object.keys(ScramjetPkg.default));
console.log('--- SCRAMJET DEBUG END ---');

// --- THE CONSTRUCTOR FIX ---
// This checks every possible place the constructor could be hiding
const Scramjet = ScramjetPkg.Scramjet || 
                 ScramjetPkg.default?.Scramjet || 
                 ScramjetPkg.default || 
                 ScramjetPkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer();

// --- 1. SETUP ENGINES (Scramjet + Bare) ---
const bare = createBareServer("/bare/");

let sj;
try {
    sj = new Scramjet({
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
    console.log("✅ Scramjet initialized successfully.");
} catch (err) {
    console.error("❌ CRITICAL: Scramjet failed to initialize. Error:", err.message);
}

// --- 2. SERVE PUBLIC FOLDER ---
app.use(express.static(join(__dirname, "public")));

/* --- 3. RESTORED SOUNDCLOUD LOGIC --- */
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
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });
        const cid = await getClientId();
        const response = await axios.get(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${cid}&limit=20`);
        res.json(response.data.collection.map(t => ({
            id: t.id, title: t.title, artist: t.user?.username || "Unknown", 
            thumbnail: t.artwork_url?.replace('large', 't500x500'),
            duration: Math.floor(t.duration / 1000), url: t.permalink_url
        })));
    } catch (e) { res.status(500).json({ error: 'Search failed' }); }
});

// --- 4. ROUTER ENGINE ---
server.on("request", (req, res) => {
    if (bare.shouldRoute(req)) bare.routeRequest(req, res);
    else if (sj && sj.shouldRoute(req)) sj.routeRequest(req, res);
    else app(req, res);
});

server.on("upgrade", (req, socket, head) => {
    if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
    else if (sj && sj.shouldRoute(req)) sj.routeUpgrade(req, socket, head);
    else socket.end();
});

// --- 5. START SERVER ---
server.listen(8080, "0.0.0.0", () => {
    console.log("🚀 Server running at http://0.0.0.0:8080");
});
