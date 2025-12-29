let activeTabId = null;
let activeDomain = null;
let startTime = null;

let domainTimes = {};

// Load stored data
chrome.storage.local.get(["domainTimes"], result => {
  domainTimes = result.domainTimes || {};
});

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function updateActiveTab(tabId, urlOverride) {
  if (activeTabId !== null && activeDomain !== null && startTime !== null) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    domainTimes[activeDomain] = (domainTimes[activeDomain] || 0) + elapsed;

    // Save to storage
    chrome.storage.local.set({ domainTimes });
  }

  activeTabId = tabId;

  chrome.tabs.get(tabId, tab => {
    const url = urlOverride || tab.url;
    activeDomain = getDomain(url);
    startTime = Date.now();
  });
}

chrome.tabs.onActivated.addListener(activeInfo => {
  updateActiveTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    updateActiveTab(tabId, changeInfo.url);
  }
});
