![Project Thumbnail](thumbnail.png)

# Gmail Phishing Detector

A powerful Chrome Extension that provides real-time phishing analysis for Gmail users. It inspects email content, links, and sender details to calculate a risk score and alert users of potential threats.

## 🚀 Features

*   **Real-time Analysis**: Automatically scans emails when you open them.
*   **Risk Scoring**: Calculates a risk score (0-100) and assigns a level (Low, Medium, High).
*   **Smart Heuristics**: Detects mismatched links, suspicious sender domains, and urgency keywords.
*   **Scan History**: Maintains a local history of past scans for transparency.
*   **Privacy-First**: Only stores metadata (sender, risk level, timestamp). **Email body content is NEVER stored.**
*   **Visual Alerts**: Clear, color-coded badges to indicate safety status.

## 🛠️ Tech Stack

*   **Frontend**: HTML, CSS, Vanilla JavaScript (Chrome Extension API)
*   **Backend**: Node.js, Express.js
*   **Database**: SQLite3 (for scan history)

## 📦 Installation

### 1. Backend Setup
The backend is required for logging scans and viewing history.

1.  Navigate to the project directory:
    ```bash
    cd Gmail-Phishing-Detector
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    node server/index.js
    ```
    *The server will run on `http://localhost:3000`.*

### 2. Extension Setup
1.  Open Chrome and go to `chrome://extensions/`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the `Gmail-Phishing-Detector` folder (the root of this repository).

## 📖 Usage

1.  **Open Gmail**: Go to simple email view.
2.  **Click the Extension**: Click the shield icon in your Chrome toolbar.
3.  **Analyze**: Click the **"Analyze Email"** button.
    *   The extension will scan the visible email.
    *   You will see a Risk Level (Low/Medium/High) and a list of specific "Flags" (e.g., "Mismatched Link").
4.  **View History**: Click **"View Scan History"** in the popup to see a log of your recent scans.

## 🔒 Privacy Notice
This tool runs analysis locally in your browser. When communicating with the backend to save history, **NO sensitive content** (email body, subject, or recipient lists) is transmitted or stored. Only the following metadata is saved:
*   Sender Domain
*   Risk Score & Level
*   Timestamp

## 📂 Project Structure
*   `content.js`: The script that runs on the Gmail page to extract data.
*   `popup/`: Contains the UI for the extension (`popup.html`, `popup.js`, `styles.css`).
*   `server/`: Contains the Node.js backend and SQLite database logic.
*   `manifest.json`: Configuration file for the Chrome Extension.
