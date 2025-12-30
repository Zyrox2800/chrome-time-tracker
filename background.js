// Time Tracker Pro - Background Service Worker
let activeTabId = null;
let activeDomain = null;
let startTime = null;
let domainTimes = {};
let sessionStart = Date.now();

// Load saved times when the extension starts
chrome.runtime.onInstalled.addListener(() => {
    console.log("Time Tracker Pro extension installed");
    chrome.storage.local.get(["domainTimes", "totalTime"], (result) => {
        domainTimes = result.domainTimes || {};
        console.log("Loaded saved times for", Object.keys(domainTimes).length, "domains");
    });
});

// Load when Chrome starts
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["domainTimes"], (result) => {
        domainTimes = result.domainTimes || {};
    });
});

// Extract domain from URL
function getDomain(url) {
    if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        return null;
    }
    try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname.replace("www.", "");
        // Clean up domain further
        domain = domain.split('.').slice(-2).join('.');
        return domain;
    } catch {
        return null;
    }
}

// Calculate productivity score
function calculateProductivity(domain) {
    const productiveDomains = [
        "github.com", "stackoverflow.com", "docs.google.com", 
        "notion.so", "figma.com", "code.visualstudio.com",
        "developer.mozilla.org", "chat.openai.com"
    ];
    
    const distractingDomains = [
        "youtube.com", "netflix.com", "facebook.com", "twitter.com",
        "instagram.com", "tiktok.com", "reddit.com", "twitch.tv"
    ];
    
    if (productiveDomains.some(d => domain.includes(d))) return 2;
    if (distractingDomains.some(d => domain.includes(d))) return 0;
    return 1; // neutral
}

// Update tracking when switching tabs
function updateActiveTab(tabId, urlOverride = null) {
    // Save time from previous tab if tracking
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        if (elapsed > 0) {
            if (!domainTimes[activeDomain]) {
                domainTimes[activeDomain] = {
                    total: 0,
                    sessions: 0,
                    lastVisited: Date.now(),
                    productivity: calculateProductivity(activeDomain)
                };
            }
            
            domainTimes[activeDomain].total += elapsed;
            domainTimes[activeDomain].sessions += 1;
            domainTimes[activeDomain].lastVisited = Date.now();
            
            // Save to storage
            chrome.storage.local.set({ domainTimes }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error saving time:", chrome.runtime.lastError);
                }
            });
            
            console.log(`Saved ${elapsed}s to ${activeDomain}`);
        }
    }

    // Start tracking new tab
    activeTabId = tabId;
    
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            activeTabId = null;
            activeDomain = null;
            return;
        }
        
        const url = urlOverride || tab.url;
        const newDomain = getDomain(url);
        
        if (newDomain) {
            activeDomain = newDomain;
            startTime = Date.now();
        } else {
            activeDomain = null;
            startTime = null;
        }
    });
}

// Listeners for tab activity
chrome.tabs.onActivated.addListener((activeInfo) => {
    updateActiveTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        updateActiveTab(tabId, changeInfo.url);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        updateActiveTab(tabId);
        activeTabId = null;
        activeDomain = null;
        startTime = null;
    }
});

// Save data every minute
setInterval(() => {
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed > 10) {
            if (!domainTimes[activeDomain]) {
                domainTimes[activeDomain] = {
                    total: 0,
                    sessions: 0,
                    lastVisited: Date.now(),
                    productivity: calculateProductivity(activeDomain)
                };
            }
            
            domainTimes[activeDomain].total += elapsed;
            domainTimes[activeDomain].sessions += 1;
            chrome.storage.local.set({ domainTimes });
            startTime = Date.now();
        }
    }
}, 60000);

// Message listener for reset and other commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "reset") {
        domainTimes = {};
        chrome.storage.local.set({ domainTimes: {} }, () => {
            console.log("All tracking data reset");
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (message.action === "getData") {
        sendResponse({ domainTimes });
    }
});
