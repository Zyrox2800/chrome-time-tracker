# Development Log — Chrome Time Tracker Extension

## Day 1 — Project Setup
- Created GitHub repository and defined project scope.
- Planned extension architecture: background script for tracking, popup for UI.
- Set up initial file structure and committed first setup.

## Day 2 — Manifest & Extension Loading
- Wrote `manifest.json` with permissions and connections.
- Created placeholder popup and background scripts.
- Loaded extension in Chrome and verified background logging.

## Day 3 — Active Tab Tracking
- Implemented tab activation detection (`chrome.tabs.onActivated`) and URL update listener (`chrome.tabs.onUpdated`).
- Calculated elapsed time per domain and stored in memory.
- Verified active tab tracking and committed MVP code.

## Day 4 — Popup & Display
- Developed `popup.js` to display times in popup.
- Displayed cumulative time in **seconds**.
- Verified multi-tab tracking and committed popup functionality.

## Day 5 — Enhancements
- Converted time display to **hh:mm:ss format**.
- Added **Reset button** with instant feedback.
- Introduced optional domain filtering for productivity sites.
- Committed enhancements and updated README.

## Day 6 — Polished UI & Real-Time Tracking
- Created **card-based popup UI** with progress bars using `style.css`.
- Implemented **live updates** every second in popup.
- Integrated **persistent storage** with `chrome.storage.local`.
- Tested full functionality: live tracking, reset, UI, and storage.
- Updated README and devlog to reflect final polished version.
- Project is now **resume-ready** and fully functional.
