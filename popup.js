function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

const container = document.getElementById("time-container");

function renderTimes(domainTimes) {
  container.innerHTML = "";
  for (const domain in domainTimes) {
    const seconds = domainTimes[domain];
    const card = document.createElement("div");
    card.className = "domain-card";
    card.innerHTML = `
      <h4>${domain}</h4>
      <p>${formatTime(seconds)}</p>
      <div class="progress-bar" style="width:${Math.min((seconds/3600)*100,100)}%"></div>
    `;
    container.appendChild(card);
  }
}

// Fetch from storage every second for live updates
function updatePopup() {
  chrome.storage.local.get(["domainTimes"], result => {
    renderTimes(result.domainTimes || {});
  });
}

setInterval(updatePopup, 1000); // live every second

// Reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  chrome.storage.local.set({ domainTimes: {} }, () => {
    updatePopup();
  });
});

// Initial render
updatePopup();
