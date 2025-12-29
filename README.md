# Chrome Time Tracker Extension

## Overview
The **Chrome Time Tracker** is a lightweight, real-time Chrome extension that monitors the time users spend on active browser tabs. It calculates cumulative time per website domain, updates in real-time, and stores data persistently. The extension features a clean card-based UI and actionable controls, providing a professional and user-friendly experience.

---

## Features
- Tracks active tab time **in real-time**, updating every second.
- Displays cumulative time per website in **hh:mm:ss** format.
- **Card-based UI** with progress bars for visual representation of time usage.
- **Reset button** to clear tracked data.
- Persistent storage using `chrome.storage.local` — tracked data survives browser restarts.
- Optional filtering to track only selected domains (e.g., productivity sites).
- Fully responsive and modern design for enhanced UX.

---

## Technical Details

### Architecture
- **background.js**: Tracks active tab changes, calculates elapsed time per domain, and updates storage.
- **popup.html + popup.js**: Displays tracked times with live updates, reset button, and visual progress bars.
- **style.css**: Modern card-based styling for improved user experience.
- **manifest.json**: Defines extension metadata, permissions, and connections between background and popup scripts.

### Permissions
- `tabs`: Required to detect active tabs and read URLs.
- `storage`: Required for persistent storage of tracked times.

### Key Features Implemented
- Real-time tracking using `setInterval` and background script communication.
- Persistent storage with Chrome Storage API.
- User interface: card-based design, progress bars, and live updating timer.
- Reset functionality with instant feedback.

---

## Installation & Usage
1. Clone or download the repository.
2. Open **Chrome** and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. Click the extension icon to view tracked times.
6. Switch between tabs to record time automatically.
7. Use the **Reset** button to clear data.

---

## Future Improvements
- Graphical charts for time analysis (e.g., Chart.js integration)
- Notifications for excessive time on specific sites
- Weekly/daily summaries and statistics
- Custom domain selection for advanced tracking

---

## Learning Outcomes
- Gained expertise in **Chrome Extension APIs**.
- Developed **real-time event handling** for active tabs.
- Designed a **polished and responsive UI/UX**.
- Implemented **persistent storage** for continuous user tracking.
- Demonstrated clean **Git workflow and project documentation**.

---

## License
MIT License
