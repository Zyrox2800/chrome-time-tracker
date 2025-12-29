// Website Time Tracker - Background Service Worker
// This runs in the background to track your tab activity

let activeTabId = null;
let activeDomain = null;
let startTime = null;
let domainTimes = {};

// Load saved times when the extension starts
chrome.runtime.onInstalled.addListener(() => {
    console.log("Time Tracker extension installed/updated");
    chrome.storage.local.get(["domainTimes"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading storage:", chrome.runtime.lastError);
            domainTimes = {};
        } else {
            domainTimes = result.domainTimes || {};
            console.log("Loaded saved times for", Object.keys(domainTimes).length, "domains");
        }
    });
});

// Also load when Chrome starts (in case service worker was asleep)
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["domainTimes"], (result) => {
        domainTimes = result.domainTimes || {};
    });
});

// Extract just the domain name from a URL
function getDomain(url) {
    if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        return null; // Ignore Chrome internal pages
    }
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace("www.", ""); // Remove "www." for cleaner display
    } catch {
        return null;
    }
}

// Update tracking when switching tabs or URLs
function updateActiveTab(tabId, urlOverride = null) {
    // Save time from previous tab if we were tracking one
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        if (elapsed > 0) { // Only save if time has passed
            domainTimes[activeDomain] = (domainTimes[activeDomain] || 0) + elapsed;
            
            // Save to Chrome's storage
            chrome.storage.local.set({ domainTimes }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error saving time:", chrome.runtime.lastError);
                }
            });
            
            console.log(`Saved ${elapsed}s to ${activeDomain}, total: ${domainTimes[activeDomain]}s`);
        }
    }

    // Start tracking new tab
    activeTabId = tabId;
    
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            // Tab might have been closed
            activeTabId = null;
            activeDomain = null;
            return;
        }
        
        const url = urlOverride || tab.url;
        const newDomain = getDomain(url);
        
        if (newDomain) {
            activeDomain = newDomain;
            startTime = Date.now();
            console.log(`Now tracking: ${activeDomain}`);
        } else {
            activeDomain = null; // Don't track Chrome pages
            startTime = null;
        }
    });
}

// Listeners for tab activity

// When user switches to a different tab
chrome.tabs.onActivated.addListener((activeInfo) => {
    updateActiveTab(activeInfo.tabId);
});

// When a tab's URL changes (clicking links, typing URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        updateActiveTab(tabId, changeInfo.url);
    }
});

// When a tab is closed, save its time
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        updateActiveTab(tabId);
        activeTabId = null;
        activeDomain = null;
        startTime = null;
    }
});

// Optional: Save data every minute in case Chrome crashes
setInterval(() => {
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed > 10) { // Only save if at least 10 seconds passed
            domainTimes[activeDomain] = (domainTimes[activeDomain] || 0) + elapsed;
            chrome.storage.local.set({ domainTimes });
            startTime = Date.now(); // Reset timer
        }
    }
}, 60000); // Every minute

// Export for debugging (optional)
window.domainTimes = domainTimes;
