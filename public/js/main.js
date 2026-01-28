// --- SYSTEM STARTUP ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if(e.keyCode == 123) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
}

// --- SCRAMJET CONFIG ---
self.scramjet = {
    prefix: '/service/',
    bare: '/bare/',
    config: '/scramjet/scramjet.config.js',
    bundle: '/scramjet/scramjet.bundle.js',
    worker: '/sw.js',
    client: '/scramjet/scramjet.client.js',
    codecs: '/scramjet/scramjet.codecs.js'
};

async function registerSW() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js', { scope: '/service/' });
            console.log("✅ Scramjet Active");
        } catch (err) { console.error("❌ SW Fail:", err); }
    }
}

// --- MAIN INIT ---
window.addEventListener('load', () => {
    registerSW();
    
    // User Settings Restore
    const savedEngine = localStorage.getItem('hunters_search_engine') || 'brave';
    window.updateSearchUI(savedEngine);
    
    const savedPanic = localStorage.getItem('hunters_panic_preset') || 'classroom';
    const panicSelect = document.getElementById('panic-preset');
    if(panicSelect) { 
        panicSelect.value = savedPanic; 
        window.togglePanicInput(savedPanic); 
    }
    const savedCustom = localStorage.getItem('hunters_panic_custom_url') || '';
    if(document.getElementById('panic-custom-input')) document.getElementById('panic-custom-input').value = savedCustom;
    
    // --- LOADERS ---
    initGameLibrary(); 
    renderApps();      
    initMusicPlayer();
    startRotator();    
    checkUpdateLog(); // Runs every time
    
    // User ID
    if(!localStorage.getItem('hunters_userid')) {
        localStorage.setItem('hunters_userid', 'USR-'+Math.random().toString(36).substr(2,6).toUpperCase());
    }
    document.getElementById('user-uid').innerText = localStorage.getItem('hunters_userid');
    
    // Cursor
    if(localStorage.getItem('hunters_cursor_default') === 'true') {
        document.body.classList.add('default-cursor');
    }
    
    // Proxy Input Listener
    const pInput = document.getElementById('proxy-input');
    if(pInput) {
        pInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.openGame(pInput.value, "Browsing");
        });
    }
});

// --- GLOBAL UTILS ---
window.setSearchEngine = function(engine) {
    localStorage.setItem('hunters_search_engine', engine);
    window.updateSearchUI(engine);
}

window.updateSearchUI = function(engine) {
    const name = engine.charAt(0).toUpperCase() + engine.slice(1);
    const input = document.getElementById('proxy-input');
    if(input) input.placeholder = `Search or enter a link...`;
    
    document.querySelectorAll('.engine-btn').forEach(btn => btn.classList.remove('selected'));
    const activeBtn = document.getElementById(`btn-${engine}`);
    if(activeBtn) activeBtn.classList.add('selected');
}

// FIXED: Intelligent URL vs Search detection
function getProxyUrl(input) {
    let target = input.trim();
    const engine = localStorage.getItem('hunters_search_engine') || 'brave';
    const searchEngines = {
        'brave': 'https://search.brave.com/search?q=',
        'bing': 'https://www.bing.com/search?q=',
        'google': 'https://www.google.com/search?q=',
        'duckduckgo': 'https://duckduckgo.com/?q='
    };
    const searchBase = searchEngines[engine];

    // If it has spaces OR no dots, treat as search query
    if (target.includes(' ') || !target.includes('.')) {
        target = searchBase + encodeURIComponent(target);
    } else {
        // Assume URL, add protocol if missing
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
            target = 'https://' + target;
        }
    }
    
    // Use Scramjet's codec to encode the URL
    if (self.__scramjet$codecs && self.__scramjet$config) {
        const codec = self.__scramjet$codecs.plain;
        const encodedUrl = codec.encode(target);
        return self.__scramjet$config.prefix + encodedUrl;
    }
    
    // Fallback: just encode and prefix
    return '/service/' + encodeURIComponent(target);
}

// --- APPS LIST ---
const appsList = [
    {name: "Google", url: "https://google.com", icon: "fa-google"},
    {name: "Discord", url: "https://discord.com", icon: "fa-discord"},
    {name: "Coolmath Games", url: "https://www.coolmathgames.com", icon: "fa-gamepad"},
    {name: "ChatGPT", url: "https://chatgpt.com", icon: "fa-robot"},
    {name: "YouTube", url: "https://youtube.com", icon: "fa-youtube"},
    {name: "TikTok", url: "https://tiktok.com", icon: "fa-tiktok"},
    {name: "Spotify", url: "https://spotify.com", icon: "fa-spotify"},
    {name: "GitHub", url: "https://github.com", icon: "fa-github"},
    {name: "Twitch", url: "https://twitch.tv", icon: "fa-twitch"},
    {name: "Reddit", url: "https://reddit.com", icon: "fa-reddit"},
    {name: "X (Twitter)", url: "https://x.com", icon: "fa-twitter"},
    {name: "Instagram", url: "https://instagram.com", icon: "fa-instagram"},
    {name: "GeForce Now", url: "https://play.geforcenow.com", icon: "fa-bolt"},
    {name: "now.gg", url: "https://now.gg/", icon: "fa-gamepad"},
    {name: "Crunchyroll", url: "https://crunchyroll.com", icon: "fa-play-circle"}
];

function renderApps() {
    const grid = document.getElementById('apps-grid-container');
    if(!grid) return;
    grid.innerHTML = ''; 
    appsList.forEach(a => {
        const d = document.createElement('div');
        d.className = 'game-card';
        d.onclick = () => window.openGame(a.url, a.name);
        d.innerHTML = `<i class="fab ${a.icon} ${a.icon.startsWith('fa-') ? 'fas' : ''}"></i><span>${a.name}</span>`;
        grid.appendChild(d);
    });
}

function startRotator() {
    const msgs = ["hello person with a low gpa!", "don't get caught", "searching for answers?", "school wifi sucks lol"];
    let msgIdx = 0;
    const rotator = document.getElementById('rotator');
    if(!rotator) return;
    setInterval(() => {
        rotator.style.opacity = 0;
        setTimeout(() => {
            msgIdx = (msgIdx + 1) % msgs.length;
            rotator.innerText = msgs[msgIdx];
            rotator.style.opacity = 0.8;
        }, 500);
    }, 4000);
}

// --- DYNAMIC GAME LIBRARY ---
let fetchedGames = [];
async function initGameLibrary() {
    const container = document.getElementById('games-render-area');
    container.innerHTML = '<div style="width:100%; text-align:center; padding:40px; color:#888;">Fetching Library...</div>';
    try {
        const response = await fetch(GN_CONFIG.catalog);
        if (!response.ok) throw new Error("Catalog fetch failed");
        fetchedGames = await response.json();
        renderGameLibrary(fetchedGames);
        
        const notif = document.getElementById('load-notification');
        const notifText = document.getElementById('load-notif-text');
        if(notif) {
            notifText.innerText = `Loaded ${fetchedGames.length + appsList.length} Games & Apps`;
            setTimeout(() => notif.classList.add('show'), 500);
            setTimeout(() => notif.classList.remove('show'), 5000);
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div style="color:red; text-align:center;">Failed to load library.</div>';
    }
}

function renderGameLibrary(games) {
    if(!games) return;
    const container = document.getElementById('games-render-area');
    container.innerHTML = ''; 
    const favorites = JSON.parse(localStorage.getItem('hunters_favorites') || '[]');
    const recents = JSON.parse(localStorage.getItem('hunters_recents') || '[]');

    function buildGrid(title, list) {
        if(list.length === 0) return '';
        let html = `<div class="section-title">${title}</div><div class="games-grid">`;
        list.forEach(g => {
            const title = g.title || g.name || "Unknown";
            const id = g.file || g.slug || g.id;
            const img = `${GN_CONFIG.covers}${id}.png`;
            const isFav = favorites.includes(id);
            const favClass = isFav ? 'active' : '';
            
            html += `
            <div class="game-card" onclick="window.launchGNGame('${id}', '${title.replace(/'/g, "\\'")}')">
                <i class="fas fa-star fav-btn ${favClass}" onclick="window.toggleFavorite(event, '${id}')"></i>
                <img src="${img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'" style="width:100%; height:120px; object-fit:cover; border-radius:15px 15px 0 0; margin-bottom:5px;">
                <i class="fas fa-gamepad game-icon" style="display:none; margin-bottom:10px; font-size:3rem; color:#444;"></i>
                <span>${title}</span>
            </div>`;
        });
        html += `</div>`;
        return html;
    }

    const favGames = games.filter(g => favorites.includes(g.file || g.slug || g.id));
    if(favGames.length > 0) container.innerHTML += buildGrid('Favorites', favGames);
    if(recents.length > 0) container.innerHTML += buildGrid('Recently Played', recents);
    container.innerHTML += buildGrid('All Games', games);
}

// --- LAUNCHERS ---
window.launchGNGame = async function(gameId, title) {
    window.setView('active-game-view');
    const tabId = createNewTabUI(title, "Loading...");
    const wrapper = document.getElementById('iframe-wrapper');
    const loader = document.getElementById('loading-overlay');
    loader.classList.add('visible');
    
    wrapper.querySelectorAll('iframe').forEach(f => f.style.display = 'none');

    try {
        const res = await fetch(`${GN_CONFIG.html}${gameId}.html`);
        if(!res.ok) throw new Error("Game file missing");
        const html = await res.text();

        const iframe = document.createElement('iframe');
        iframe.id = `frame-${tabId}`;
        iframe.className = 'active';
        iframe.style.cssText = "border:none; width:100%; height:100%;";
        // Sandbox blocks redirects, popups allow logins
        iframe.sandbox = "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-orientation-lock allow-popups";
        wrapper.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open(); doc.write(html); doc.close();

        if(document.getElementById('browser-address-bar')) {
            document.getElementById('browser-address-bar').value = `game://${gameId}`;
        }
        window.addToRecents({title: title, id: gameId, file: gameId});
        setTimeout(() => loader.classList.remove('visible'), 500);
    } catch (err) {
        alert("Load Error: " + err.message);
        window.closeTab(null, tabId);
    }
}

// --- FIXED UNIFIED LAUNCHER ---
window.openGame = function(url, name) {
    // 1. If we are "Browsing", force proxy mode.
    // 2. If it's NOT browsing, check if it looks like a game ID (no http, no dots).
    const isBrowsing = (name === "Browsing" || name === "New Tab");
    const isGameId = !url.includes('http') && !url.includes('.');

    if (!isBrowsing && isGameId) { 
        window.launchGNGame(url, name); 
        return; 
    }
    
    const finalUrl = getProxyUrl(url);
    window.setView('active-game-view'); 
    const tabId = createNewTabUI(name, url);
    
    const wrapper = document.getElementById('iframe-wrapper');
    const loader = document.getElementById('loading-overlay');
    loader.classList.add('visible');
    
    const iframe = document.createElement('iframe');
    iframe.id = `frame-${tabId}`;
    iframe.src = finalUrl;
    iframe.className = 'active';
    iframe.style.cssText = "border:none; width:100%; height:100%;";
    // Sandbox blocks redirects
    iframe.sandbox = "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-orientation-lock allow-popups";
    
    iframe.onload = () => { setTimeout(() => loader.classList.remove('visible'), 500); };
    wrapper.querySelectorAll('iframe').forEach(f => f.style.display = 'none');
    wrapper.appendChild(iframe);
    
    if(document.getElementById('browser-address-bar')) {
        document.getElementById('browser-address-bar').value = url;
    }
    
    if(!isBrowsing) window.addToRecents({url: url, title: name, name: name});
}

// --- MUSIC PLAYER ---
const musicHeader = document.getElementById("player-drag-handle");
const musicPlayer = document.getElementById("music-player");

function initMusicPlayer() {
    const search = document.getElementById("music-search-bar");
    const container = document.getElementById("audio-controls");
    const results = document.getElementById("music-results");
    const player = document.getElementById("native-audio-player");
    const nowPlayingText = document.getElementById("now-playing");

    search.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const query = search.value;
            if(!query) return;
            results.innerHTML = '<div style="text-align:center; color:#aaa; margin-top:20px;">Searching...</div>';
            try {
                const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                results.innerHTML = ''; 
                if(data.length === 0) { results.innerHTML = '<div style="text-align:center; color:#aaa;">No results found.</div>'; return; }
                data.forEach(song => {
                    const el = document.createElement('div');
                    el.className = 'song-result';
                    el.style.cssText = `display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; transition: 0.2s;`;
                    el.innerHTML = `<img src="${song.thumbnail || 'https://via.placeholder.com/40'}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;"><div style="flex:1;"><div style="font-size:0.85rem; color:#fff;">${song.title}</div><div style="font-size:0.75rem; color:#aaa;">${song.artist}</div></div><i class="fas fa-play" style="color:#aaa;"></i>`;
                    el.onmouseover = () => el.style.background = 'rgba(255,255,255,0.1)';
                    el.onmouseout = () => el.style.background = 'rgba(255,255,255,0.05)';
                    el.onclick = () => {
                        container.style.display = 'block';
                        nowPlayingText.innerText = "Playing: " + song.title;
                        player.src = `/api/music/stream?url=${encodeURIComponent(song.url)}`;
                        player.play();
                    };
                    results.appendChild(el);
                });
            } catch (err) { results.innerHTML = '<div style="text-align:center; color:red;">Error fetching songs.</div>'; }
        }
    });
}

window.toggleMusic = function() {
    if (musicPlayer.style.display === "flex") {
        musicPlayer.classList.add('closing');
        setTimeout(() => { musicPlayer.style.display = "none"; musicPlayer.classList.remove('closing'); }, 280);
    } else {
        musicPlayer.style.display = "flex";
        musicPlayer.classList.remove('closing');
    }
}

let isDragging = false;
let startX, startY, initialLeft, initialTop;
if(musicHeader) {
    musicHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        initialLeft = musicPlayer.offsetLeft; initialTop = musicPlayer.offsetTop;
        document.body.classList.add('clicking');
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        musicPlayer.style.left = `${initialLeft + dx}px`;
        musicPlayer.style.top = `${initialTop + dy}px`;
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.classList.remove('clicking');
    });
}

// --- TABS & UI ---
let tabs = [];
let activeTabId = null;

function createNewTabUI(name, url) {
    const id = Date.now();
    tabs.push({id, name, url});
    const btn = document.createElement('div');
    btn.className = 'tab active';
    btn.id = `tab-btn-${id}`;
    btn.onclick = () => switchTab(id);
    btn.innerHTML = `<i class="fas fa-globe"></i> <span class="tab-title">${name}</span> <i class="fas fa-times tab-close" onclick="closeTab(event, ${id})"></i>`;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tabs-list').appendChild(btn);
    activeTabId = id;
    return id;
}

function switchTab(id) {
    activeTabId = id;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-btn-${id}`).classList.add('active');
    document.querySelectorAll('iframe').forEach(f => {
        f.style.display = (f.id === `frame-${id}`) ? 'block' : 'none';
        if(f.id === `frame-${id}`) f.classList.add('active');
    });
    const tabData = tabs.find(t => t.id === id);
    if(tabData && document.getElementById('browser-address-bar')) {
        document.getElementById('browser-address-bar').value = tabData.url || "";
    }
}

window.closeTab = function(e, id) {
    if(e) e.stopPropagation();
    tabs = tabs.filter(t => t.id !== id);
    document.getElementById(`tab-btn-${id}`).remove();
    const f = document.getElementById(`frame-${id}`);
    if(f) f.remove();
    if(tabs.length === 0) window.closeGame(); else switchTab(tabs[tabs.length-1].id);
}

window.closeGame = function() {
    document.getElementById('tabs-list').innerHTML = '';
    const wrapper = document.getElementById('iframe-wrapper');
    const loader = wrapper.querySelector('#loading-overlay');
    wrapper.innerHTML = '';
    if(loader) wrapper.appendChild(loader);
    window.setView('home');
}

window.setView = function(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if(btn) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // Toggle custom cursor: Hide in active game view
    if (id === 'active-game-view') {
        document.body.classList.add('native-cursor');
    } else {
        document.body.classList.remove('native-cursor');
    }
}

window.askNewTab = function() { window.openGame("https://search.brave.com", "New Tab"); }
window.navBack = function() { const f = document.getElementById(`frame-${activeTabId}`); if(f && f.contentWindow) f.contentWindow.history.back(); }
window.navForward = function() { const f = document.getElementById(`frame-${activeTabId}`); if(f && f.contentWindow) f.contentWindow.history.forward(); }
window.navReload = function() { const f = document.getElementById(`frame-${activeTabId}`); if(f) f.src = f.src; }
window.popOut = function() { const t = tabs.find(x => x.id === activeTabId); if(t) window.open(t.url); }
window.toggleFullscreen = function() { const e = document.getElementById('iframe-wrapper'); if(!document.fullscreenElement) e.requestFullscreen().catch(err=>{}); else document.exitFullscreen(); }

// --- HELPERS (FIXED: ALWAYS SHOWS & UPDATES TEXT) ---
function checkUpdateLog() {
    // 1. Update text content explicitly
    if(document.getElementById('up-ver')) document.getElementById('up-ver').innerText = "v" + UPDATE_CONFIG.version;
    if(document.getElementById('up-date')) document.getElementById('up-date').innerText = UPDATE_CONFIG.date;
    if(document.getElementById('up-title')) document.getElementById('up-title').innerText = UPDATE_CONFIG.title;
    if(document.getElementById('up-list')) document.getElementById('up-list').innerHTML = UPDATE_CONFIG.changelog;

    // 2. Show Modal (Removed Check)
    setTimeout(() => document.getElementById('update-modal').classList.add('visible'), 600);
}

window.closeUpdateLog = function() {
    const m = document.getElementById('update-modal');
    m.classList.add('closing');
    setTimeout(() => { m.classList.remove('visible'); m.classList.remove('closing'); }, 300);
}

// Visuals
const cursor = document.getElementById("custom-cursor");
const trail = document.getElementById("cursor-trail");
window.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
    trail.animate({ left: e.clientX + 'px', top: e.clientY + 'px' }, { duration: 400, fill: "forwards" });
});
document.addEventListener("mousedown", () => document.body.classList.add('clicking'));
document.addEventListener("mouseup", () => document.body.classList.remove('clicking'));

const starContainer = document.getElementById('star-container');
for(let i=0; i<100; i++) {
    let s = document.createElement('div'); s.className='star';
    s.style.left = Math.random()*100+'vw'; s.style.top = Math.random()*100+'vh';
    s.style.width = Math.random()*2.5+'px'; s.style.height = s.style.width;
    s.style.animationDuration = (Math.random()*5+5)+'s';
    starContainer.appendChild(s);
}
window.toggleParticles = function() { starContainer.style.display = starContainer.style.display === 'none' ? 'block' : 'none'; }

// Utilities
window.togglePanicInput = function(v) { document.getElementById('panic-custom-input').style.display = v === 'custom' ? 'block' : 'none'; }
window.updatePanicSettings = function() { localStorage.setItem('hunters_panic_preset', document.getElementById('panic-preset').value); window.togglePanicInput(document.getElementById('panic-preset').value); }
window.saveCustomPanic = function() { localStorage.setItem('hunters_panic_custom_url', document.getElementById('panic-custom-input').value); }
window.triggerPanic = function() { 
    const p = localStorage.getItem('hunters_panic_preset') || 'classroom';
    const c = localStorage.getItem('hunters_panic_custom_url') || "https://google.com";
    window.location.replace(p === 'custom' ? c : (p === 'drive' ? "https://drive.google.com" : "https://classroom.google.com")); 
}
window.copyUid = function() { navigator.clipboard.writeText(localStorage.getItem('hunters_userid')); alert("ID Copied"); }
window.toggleFavorite = function(e, id) { 
    e.stopPropagation(); 
    let favs = JSON.parse(localStorage.getItem('hunters_favorites') || '[]');
    if(favs.includes(id)) favs = favs.filter(x => x !== id); else favs.push(id);
    localStorage.setItem('hunters_favorites', JSON.stringify(favs));
    renderGameLibrary(fetchedGames || []); 
}
window.addToRecents = function(g) {
    let recents = JSON.parse(localStorage.getItem('hunters_recents') || '[]');
    recents = recents.filter(r => (g.id && r.id !== g.id) || (g.url && r.url !== g.url));
    recents.unshift(g);
    if(recents.length > 5) recents.pop();
    localStorage.setItem('hunters_recents', JSON.stringify(recents));
}
window.filterGameLibrary = function() {
    const q = document.getElementById('game-search').value.toLowerCase();
    document.querySelectorAll('#games-render-area .game-card').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
    });
}
window.exportSave = function() {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hunters_proxy_save.json'; a.click();
    URL.revokeObjectURL(url);
}
window.importSave = function() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                alert('Data Restored! Reloading...');
                location.reload();
            } catch(err) { alert('Invalid Save File'); }
        };
        reader.readAsText(file);
    };
    input.click();
}
window.openAboutBlank = function() {
    var win = window.open();
    win.document.body.style.margin = '0'; win.document.body.style.height = '100vh';
    var iframe = win.document.createElement('iframe');
    iframe.style.border = 'none'; iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.margin = '0';
    iframe.src = window.location.href;
    win.document.body.appendChild(iframe);
}
window.toggleCursor = function() {
    document.body.classList.toggle('default-cursor');
    const isDefault = document.body.classList.contains('default-cursor');
    localStorage.setItem('hunters_cursor_default', isDefault);
}
