// Wait for the HTML to fully load before running our code
document.addEventListener("DOMContentLoaded", () => {
    console.log("Popup loaded");
    
    const container = document.getElementById("time-container");
    const resetBtn = document.getElementById("resetBtn");
    
    // Format seconds into HH:MM:SS
    function formatTime(seconds) {
        if (!seconds) return "00:00:00";
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Format for display (more user-friendly)
    function formatDisplayTime(seconds) {
        if (seconds < 60) {
            return `${seconds} seconds`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${mins} minute${mins !== 1 ? 's' : ''}`;
        } else {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            if (mins === 0) {
                return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
            }
            return `${hrs}h ${mins}m`;
        }
    }
    
    // Display times in the popup
    function renderTimes(domainTimes) {
        container.innerHTML = "";
        
        if (Object.keys(domainTimes).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No data yet. Start browsing!</p>
                    <p class="small">Switch between tabs to track time.</p>
                </div>
            `;
            return;
        }
        
        // Sort domains by time (highest first)
        const sortedDomains = Object.entries(domainTimes)
            .sort((a, b) => b[1] - a[1]);
        
        sortedDomains.forEach(([domain, seconds]) => {
            const card = document.createElement("div");
            card.className = "domain-card";
            
            // Calculate percentage for progress bar (max 4 hours for 100%)
            const maxSeconds = 4 * 3600; // 4 hours
            const percentage = Math.min((seconds / maxSeconds) * 100, 100);
            
            card.innerHTML = `
                <div class="domain-header">
                    <h4 title="${domain}">${domain.length > 20 ? domain.substring(0, 20) + '...' : domain}</h4>
                    <span class="time-badge">${formatTime(seconds)}</span>
                </div>
                <p class="time-text">${formatDisplayTime(seconds)}</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    // Update the popup display
    function updatePopup() {
        chrome.storage.local.get(["domainTimes"], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting times:", chrome.runtime.lastError);
                container.innerHTML = '<p class="error">Error loading data</p>';
                return;
            }
            renderTimes(result.domainTimes || {});
        });
    }
    
    // Add click event to reset button
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset all tracking data? This cannot be undone.")) {
                chrome.storage.local.set({ domainTimes: {} }, () => {
                    updatePopup();
                    // Notify background script
                    chrome.runtime.sendMessage({ action: "reset" });
                });
            }
        });
        
        // Add hover effect
        resetBtn.addEventListener("mouseover", () => {
            resetBtn.style.backgroundColor = "#dc3545";
        });
        
        resetBtn.addEventListener("mouseout", () => {
            resetBtn.style.backgroundColor = "#007bff";
        });
    }
    
    // Update every second for live time
    setInterval(updatePopup, 1000);
    
    // Add a refresh button
    const refreshBtn = document.createElement("button");
    refreshBtn.id = "refreshBtn";
    refreshBtn.textContent = "↻ Refresh";
    refreshBtn.style.marginLeft = "10px";
    refreshBtn.style.padding = "5px 10px";
    refreshBtn.style.fontSize = "12px";
    
    refreshBtn.addEventListener("click", updatePopup);
    
    // Add refresh button next to reset button
    if (resetBtn && resetBtn.parentNode) {
        resetBtn.parentNode.insertBefore(refreshBtn, resetBtn.nextSibling);
    }
    
    // Initial render
    updatePopup();
    
    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "update") {
            updatePopup();
        }
    });
});
