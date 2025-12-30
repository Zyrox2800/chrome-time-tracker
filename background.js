// Time Tracker Pro - Background Service Worker
let activeTabId = null;
let activeDomain = null;
let startTime = null;
let domainTimes = {};
let sessionStart = Date.now();
let isTracking = true;

// Productivity classifications
const PRODUCTIVE_DOMAINS = [
    "github.com", "stackoverflow.com", "docs.google.com", 
    "notion.so", "figma.com", "code.visualstudio.com",
    "developer.mozilla.org", "chat.openai.com", "coursera.org",
    "udemy.com", "khanacademy.org", "edx.org", "codecademy.com",
    "leetcode.com", "hackerrank.com", "freecodecamp.org",
    "w3schools.com", "medium.com", "dev.to", "gitlab.com",
    "bitbucket.org", "atlassian.com", "trello.com", "asana.com"
];

const DISTRACTING_DOMAINS = [
    "youtube.com", "netflix.com", "facebook.com", "twitter.com",
    "instagram.com", "tiktok.com", "reddit.com", "twitch.tv",
    "pinterest.com", "tumblr.com", "9gag.com", "buzzfeed.com",
    "dailymotion.com", "vimeo.com", "imdb.com", "rottentomatoes.com"
];

// Load saved times when the extension starts
chrome.runtime.onInstalled.addListener(() => {
    console.log("Time Tracker Pro extension installed");
    loadSavedData();
    checkAndUpdateStreak();
});

// Load when Chrome starts
chrome.runtime.onStartup.addListener(() => {
    loadSavedData();
    checkAndUpdateStreak();
});

async function loadSavedData() {
    return new Promise((resolve) => {
        chrome.storage.local.get([
            "domainTimes", 
            "trackingPaused",
            "streak",
            "lastTrackedDate"
        ], (result) => {
            domainTimes = result.domainTimes || {};
            isTracking = !(result.trackingPaused || false);
            
            console.log("Loaded saved times for", Object.keys(domainTimes).length, "domains");
            resolve();
        });
    });
}

// Extract domain from URL
function getDomain(url) {
    if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        return null;
    }
    try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname.replace("www.", "");
        
        // Remove subdomains if there are more than 2 parts
        const parts = domain.split('.');
        if (parts.length > 2) {
            // Keep only the last two parts (e.g., example.co.uk)
            domain = parts.slice(-2).join('.');
        }
        
        return domain.toLowerCase();
    } catch {
        return null;
    }
}

// Calculate productivity score
function calculateProductivity(domain) {
    if (!domain) return 1;
    
    // Check productive domains
    if (PRODUCTIVE_DOMAINS.some(d => domain.includes(d.replace('www.', '')))) {
        return 2; // Productive
    }
    
    // Check distracting domains
    if (DISTRACTING_DOMAINS.some(d => domain.includes(d.replace('www.', '')))) {
        return 0; // Distracting
    }
    
    return 1; // Neutral
}

// Update tracking when switching tabs
function updateActiveTab(tabId, urlOverride = null) {
    if (!isTracking) return;
    
    // Save time from previous tab if tracking
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        if (elapsed > 0 && elapsed < 3600) { // Prevent saving if > 1 hour (likely idle)
            saveTimeToDomain(activeDomain, elapsed);
            console.log(`Saved ${elapsed}s to ${activeDomain}`);
        }
    }

    // Start tracking new tab
    activeTabId = tabId;
    
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            activeTabId = null;
            activeDomain = null;
            startTime = null;
            return;
        }
        
        const url = urlOverride || tab.url;
        const newDomain = getDomain(url);
        
        if (newDomain) {
            activeDomain = newDomain;
            startTime = Date.now();
            
            // Initialize domain if not exists
            if (!domainTimes[activeDomain]) {
                domainTimes[activeDomain] = {
                    total: 0,
                    sessions: 0,
                    lastVisited: Date.now(),
                    productivity: calculateProductivity(activeDomain)
                };
            }
        } else {
            activeDomain = null;
            startTime = null;
        }
    });
}

function saveTimeToDomain(domain, elapsed) {
    if (!domainTimes[domain]) {
        domainTimes[domain] = {
            total: 0,
            sessions: 0,
            lastVisited: Date.now(),
            productivity: calculateProductivity(domain)
        };
    }
    
    domainTimes[domain].total += elapsed;
    domainTimes[domain].sessions += 1;
    domainTimes[domain].lastVisited = Date.now();
    
    // Save to storage
    chrome.storage.local.set({ domainTimes }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving time:", chrome.runtime.lastError);
        }
    });
}

// Check and update streak
function checkAndUpdateStreak() {
    chrome.storage.local.get(["lastTrackedDate", "streak"], (result) => {
        const today = new Date().toDateString();
        const lastTracked = result.lastTrackedDate || null;
        let streak = result.streak || 0;
        
        if (lastTracked !== today) {
            const lastTrackedDate = lastTracked ? new Date(lastTracked) : null;
            const todayDate = new Date();
            
            if (lastTrackedDate) {
                const diffDays = Math.floor((todayDate - lastTrackedDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    streak += 1;
                } else if (diffDays > 1) {
                    streak = 1; // Reset streak
                }
            } else {
                streak = 1;
            }
            
            chrome.storage.local.set({
                lastTrackedDate: today,
                streak: streak
            });
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

// Save data every minute and check for night sessions
setInterval(() => {
    if (!isTracking) return;
    
    if (activeTabId !== null && activeDomain !== null && startTime !== null) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed > 10 && elapsed < 3600) { // Only save reasonable time intervals
            saveTimeToDomain(activeDomain, elapsed);
            startTime = Date.now();
        }
    }
    
    // Check for night session (10 PM - 5 AM)
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
        chrome.storage.local.get(["nightSessions"], (result) => {
            const nightSessions = result.nightSessions || 0;
            if (activeTabId !== null && nightSessions === 0) {
                chrome.storage.local.set({ nightSessions: 1 });
            }
        });
    }
}, 60000);

// Check for weekend tracking
setInterval(() => {
    const day = new Date().getDay();
    if (day === 0 || day === 6) { // Saturday or Sunday
        chrome.storage.local.get(["weekendTracking"], (result) => {
            if (!result.weekendTracking && activeTabId !== null) {
                chrome.storage.local.set({ weekendTracking: true });
            }
        });
    }
}, 300000); // Check every 5 minutes

// Message listener for commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch(message.action) {
        case "reset":
            domainTimes = {};
            chrome.storage.local.set({ 
                domainTimes: {},
                goals: [],
                achievements: [],
                focusSessions: 0,
                streak: 0,
                nightSessions: 0,
                completedGoals: 0,
                weekendTracking: false
            }, () => {
                console.log("All tracking data reset");
                sendResponse({ success: true });
            });
            return true;
            
        case "getData":
            sendResponse({ 
                domainTimes,
                isTracking 
            });
            break;
            
        case "toggleTracking":
            isTracking = message.tracking;
            chrome.storage.local.set({ trackingPaused: !isTracking });
            sendResponse({ success: true });
            break;
            
        case "getStats":
            const productiveCount = Object.values(domainTimes).filter(d => d.productivity === 2).length;
            const distractingCount = Object.values(domainTimes).filter(d => d.productivity === 0).length;
            const neutralCount = Object.values(domainTimes).filter(d => d.productivity === 1).length;
            
            sendResponse({
                totalDomains: Object.keys(domainTimes).length,
                productiveCount,
                distractingCount,
                neutralCount,
                isTracking
            });
            break;
    }
});

// Create alarm for daily summary
chrome.alarms.create('dailySummary', { periodInMinutes: 1440 }); // 24 hours

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailySummary') {
        // Could send daily summary notification here
        checkAndUpdateStreak();
    }
});
