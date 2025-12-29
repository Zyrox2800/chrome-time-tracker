document.addEventListener("DOMContentLoaded", () => {
    const container = document.createElement("div");
    container.style.fontSize = "14px";
    document.body.appendChild(container);

    // Request time data from background
    chrome.runtime.sendMessage({ action: "getTimes" }, (response) => {
        container.innerHTML = "<h4>Time spent per site (seconds):</h4>";
        for (const domain in response) {
            container.innerHTML += `<p>${domain}: ${response[domain]}s</p>`;
        }
    });
});
