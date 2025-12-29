# Development Log — Chrome Time Tracker Extension

## Day 1 — Project Setup
- Created GitHub repository `chrome-time-tracker`.
- Defined project scope and learning goals.
- Planned extension architecture: background script for tracking, popup for UI.
- Created initial file structure:
  - `manifest.json`
  - `background.js`
  - `popup.html`
  - `popup.js`
  - `README.md`
  - `devlog.md`
- Committed initial setup to GitHub.

## Day 2 — Manifest & Extension Loading
- Wrote `manifest.json` (manifest_version 3, permissions, background service worker, popup).
- Created placeholder `popup.html` and `background.js`.
- Loaded extension in Chrome (`chrome://extensions`) and confirmed no errors.
- Verified background script logging in DevTools.
- Committed working extension structure.

## Day 3 — Active Tab Tracking
- Implemented tab activation detection (`chrome.tabs.onActivated`) and URL update listener (`chrome.tabs.onUpdated`).
- Calculated elapsed time for each domain.
- Stored cumulative seconds per domain in memory.
- Added message listener for popup requests.
- Verified active tab time tracking functionality.
- Committed working MVP code.

## Day 4 — Popup & Display
- Developed `popup.js` to fetch domain times from background script.
- Displayed times in popup in **seconds** format.
- Verified accurate tracking across multiple tabs.
- Committed popup functionality.

## Day 5 — Enhancements
- Formatted time in `hh:mm:ss`.
- Added **Reset button** in popup to clear tracked data.
- Implemented optional domain filtering for productivity sites.
- Updated README to reflect full feature set.
- Tested extension functionality end-to-end.
- Committed enhancements and documentation updates.

## Day 6 — Polishing & Finalization
- Added screenshots for README.
- Reviewed code and devlog for clarity and authenticity.
- Pushed final version to GitHub.
- Project is now **resume-ready** and fully functional.
