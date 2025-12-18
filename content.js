(() => {
    // 1. Initialization Guard
    if (window.__GMAIL_PHISHING_DETECTOR_LOADED__) {
        console.log("Gmail Phishing Detector already loaded. Skipping double-initialization.");
        return;
    }

    window.__GMAIL_PHISHING_DETECTOR_LOADED__ = true;
    console.log("Gmail Phishing Detector initialized");

    // 2. Gmail UI Ready Detection
    const waitForGmailToLoad = () => {
        // We look for a persistent element. 'document.body' is always there, 
        // but let's check for 'div[role="main"]' which usually signifies the app is somewhat ready,
        // or fall back to body if we just want to ensure DOM exists.
        // User requested "Gmail UI ready" message shortly after load.
        const appRoot = document.querySelector('div[role="main"]') || document.body;

        if (appRoot) {
            console.log("Gmail UI ready");
            // Navigation detection logic will be initialized here in the next step
        } else {
            // Check again in 500ms
            setTimeout(waitForGmailToLoad, 500);
        }
    };

    waitForGmailToLoad();

})();
