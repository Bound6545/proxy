// PATCH FOR main.js - Add this RIGHT AFTER the getProxyUrl function

// Replace the broken getProxyUrl function
window.getProxyUrl = function(input) {
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
        const codec = self.__scramjet$codecs.plain; // Use plain codec
        const encodedUrl = codec.encode(target);
        return self.__scramjet$config.prefix + encodedUrl;
    }
    
    // Fallback: just return the prefixed URL
    return '/service/' + encodeURIComponent(target);
};
