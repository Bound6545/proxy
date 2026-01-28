// ==========================================
//       HUNTERS "BACKEND" CONFIG
// ==========================================
const UPDATE_CONFIG = {
    version: "2.0", 
    date: "Jan 27, 2026",
    title: "Major Backend Update", 
    changelog: `
        <li><strong>Proxy Overhaul:</strong> Switched from UV to Scramjet for faster browsing.</li>
        <li><strong>Game Library:</strong> Integrated GN-Math for dynamic game loading.</li>
        <li><strong>Music:</strong> Added custom SoundCloud API implementation.</li>
        <li><strong>System:</strong> Complete backend code restoration.</li>
    `
};

// --- GN-MATH CONFIG ---
// Used for dynamic game loading
const GN_CONFIG = {
    catalog: "https://cdn.jsdelivr.net/gh/gn-math/assets@master/zones.json",
    assets: "https://cdn.jsdelivr.net/gh/gn-math/assets@main/",
    html: "https://cdn.jsdelivr.net/gh/gn-math/html@main/",
    covers: "https://cdn.jsdelivr.net/gh/gn-math/covers@main/"
};