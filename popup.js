function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.createElement("div");
    container.style.fontSize = "14px";
    document.body.appendChild(container);

    chrome.runtime.sendMessage({ action: "getTimes" }, (response) => {
        container.innerHTML = "<h4>Time spent per site:</h4>";
        for (const domain in response) {
            container.innerHTML += `<p>${domain}: ${formatTime(response[domain])}</p>`;
        }
    });
});

document.getElementById("resetBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "resetTimes" }, () => {
        location.reload(); // refresh popup
    });
});
