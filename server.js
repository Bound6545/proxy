import { createBareServer } from "@tomphttp/bare-server-node";
import ScramjetPkg from "@mercuryworkshop/scramjet";
const { Scramjet } = ScramjetPkg;
import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer();

// --- 1. SETUP ENGINES (Scramjet + Bare) ---
const bare = createBareServer("/bare/");
const sj = new Scramjet({
    prefix: "/scramjet/",
    config: { 
        prefix: "/scramjet/", 
        bare: true,
        // CRITICAL FIX: Delete security headers to prevent "Refused to Connect"
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

/* --- 3. RESTORED SOUNDCLOUD LOGIC --- */
let clientId = null;

async function getClientId() {
    if (clientId) return clientId;
    try {
        const home = await axios.get('https://soundcloud.com');
        const scriptUrls = home.data.match(/<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)"/g);
        if (!scriptUrls) throw new Error('No scripts found');
        for (const tag of scriptUrls) {
            const url = tag.match(/src="([^"]+)"/)[1];
            const script = await axios.get(url);
            const match = script.data.match(/client_id:"([^"]+)"/);
            if (match) {
                clientId = match[1];
                console.log('✅ Fetched Client ID:', clientId);
                return clientId;
            }
        }
    } catch (e) {
        console.error('Failed to get Client ID:', e.message);
        return 'a3e059563d7fd3372b49b37f00a00bcf'; 
    }
}

async function resolveUrl(url, cid) {
    try {
        const page = await axios.get(url);
        const iosUrlMatch = page.data.match(/content="soundcloud:\/\/([a-z]+):(\d+)"/);
        if (iosUrlMatch) return { type: iosUrlMatch[1], id: iosUrlMatch[2] };
        return null;
    } catch (e) { return null; }
}

app.get('/api/music/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });
        const cid = await getClientId();
        let apiTarget = q.startsWith('http') 
            ? `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(q)}&client_id=${cid}`
            : `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${cid}&limit=20`;

        const response = await axios.get(apiTarget);
        let rawTracks = response.data.collection || (Array.isArray(response.data) ? response.data : [response.data]);
        res.json(rawTracks.map(mapTrack).filter(t => t !== null));
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

function mapTrack(t) {
    if (!t || !t.title) return null;
    return {
        id: t.id,
        title: t.title,
        artist: t.user ? t.user.username : "Unknown",
        thumbnail: t.artwork_url ? t.artwork_url.replace('large', 't500x500') : '',
        duration: Math.floor(t.duration / 1000),
        url: t.permalink_url
    };
}

app.get('/api/music/stream', async (req, res) => {
    try {
        const url = req.query.url;
        const cid = await getClientId();
        const resolve = await axios.get(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${cid}`);
        const transcoding = resolve.data.media.transcodings.find(t => t.format.protocol === 'progressive');
        const streamUrlReq = await axios.get(`${transcoding.url}?client_id=${cid}`);
        const stream = await axios({ url: streamUrlReq.data.url, method: 'GET', responseType: 'stream' });
        res.setHeader('Content-Type', 'audio/mpeg');
        stream.data.pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Stream failed' });
    }
});

// --- 4. ROUTER LOGIC ---
server.on("request", (req, res) => {
    if (bare.shouldRoute(req)) bare.routeRequest(req, res);
    else if (sj.shouldRoute(req)) sj.routeRequest(req, res);
    else app(req, res);
});

server.on("upgrade", (req, socket, head) => {
    if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
    else if (sj.shouldRoute(req)) sj.routeUpgrade(req, socket, head);
    else socket.end();
});

// --- 5. START SERVER ---
server.listen(8080, "0.0.0.0", () => {
    console.log("🚀 Server running at http://0.0.0.0:8080");
});
