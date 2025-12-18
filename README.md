# Gmail Phishing Detector

## Overview
This project is a Chrome extension designed to analyze Gmail emails for potential phishing risks. It aims to provide users with a clear warning and explanation if an email is suspected to be malicious.

## Current Progress
**Status:** In Development

### Features Implemented
- **Extension Structure:** Basic Manifest V3 setup.
- **Permissions:** Configured for `activeTab` and `storage`, with host permissions for `mail.google.com`.
- **UI:** Basic popup interface with an "Analyze Email" button.
- **Scripts:**
    - `content.js`: Loaded on Gmail, currently logs a confirmation message.
    - `background.js`: Service worker registered.
- **Backend:** Initial server structure set up with `index.js` and `database.js` (SQLite).
- **SPA Robustness (Module 2):**
    - **Initialization Guard:** Ensures content script runs exactly once per page load.
    - **Navigation Detection:** Monitors Gmail's internal URL changes (Inbox -> Email -> Sent) without page reloads.

### Next Steps
- Implement email content extraction logic.
- Connect the extension to the backend server.
- Develop the phishing analysis logic.
- Enhance the UI/UX.

## Setup
(Will be added as we progress)
