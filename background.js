let activeTabId = null;
let activeDomain = null;
let startTime = null;

// Store total time per domain (in seconds)
let domainTimes = {};

// Function to get domain from URL
function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return null;
    }
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(activeInfo => {
    updateActiveTab(activeInfo.tabId);
});

// Listen for tab updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        updateActiveTab(tabId, changeInfo.url);
    }
});

// Update the active tab and log time
function updateActiveTab(tabId, urlOverride) {
    // Save time for previous tab
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const endTime = Date.now();
        const elapsed = Math.floor((endTime - startTime) / 1000);
        domainTimes[activeDomain] = (domainTimes[activeDomain] || 0) + elapsed;
    }

    // Update active tab info
    activeTabId = tabId;

    chrome.tabs.get(tabId, tab => {
        const url = urlOverride || tab.url;
        const domain = getDomain(url);
        activeDomain = domain;
        startTime = Date.now();
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimes") {
        sendResponse(domainTimes);
    }
});
