# Chrome Time Tracker Extension

## Overview
The **Chrome Time Tracker** is a lightweight Chrome extension designed to track the time users spend on active browser tabs. It calculates cumulative time per website domain, displays the results in a clean popup, and allows users to reset the tracked data. This project demonstrates practical experience with **JavaScript**, **Chrome Extension APIs**, and **active tab management**.

---

## Features
- Tracks active tab time and associates it with website domains.
- Displays cumulative time in **hh:mm:ss** format in a popup.
- Includes a **Reset button** to clear all tracked data.
- Optional filtering to track only selected domains (e.g., productivity sites like GitHub or StackOverflow).
- Real-time tracking without external storage requirements.

---

## Technical Details

### Architecture
- **background.js**: Tracks active tab changes, calculates elapsed time per domain, and responds to popup requests.
- **popup.html + popup.js**: Provides the user interface, displays tracked times, and handles reset functionality.
- **manifest.json**: Defines extension metadata, permissions, and connections between background and popup scripts.

### Permissions
- `tabs`: Required to detect the active tab and read its URL.

### Key Functions
- **Active Tab Detection**: Uses `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` to monitor tab focus and URL changes.
- **Time Tracking**: Stores cumulative time in memory, updates on tab changes.
- **Popup Communication**: Uses `chrome.runtime.sendMessage` to fetch and display time data.
- **Reset Functionality**: Allows users to clear tracked times with a single click.

---

## Installation & Usage
1. Clone or download the repository.
2. Open **Chrome**, navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. Click the extension icon to view tracked times.
6. Switch between tabs to record time automatically.
7. Use the **Reset** button in the popup to clear data.

---

## Future Improvements
- **Persistent storage**: Save tracked data using `chrome.storage.local` for browser restarts.
- **Graphical visualization**: Display time spent per domain using charts.
- **Custom domain tracking**: Allow users to choose which websites to track.
- **Notifications**: Alert users after spending a certain amount of time on a website.

---

## Learning Outcomes
- Gained practical experience with **Chrome Extension APIs**.
- Implemented **real-time event tracking** for active tabs.
- Developed a structured, modular codebase with **background scripts, popups, and messaging**.
- Practiced **project authentication and version control** using Git and GitHub.

---

## License
This project is open-source and available under the MIT License.
