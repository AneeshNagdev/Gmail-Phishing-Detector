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

            // 3. Navigation Detection
            let lastUrl = location.href;
            let isEmailOpen = false;

            const checkEmailOpenStatus = () => {
                // Simple heuristic: 
                // 1. URL check: commonly /mail/u/0/#inbox/FMfcgz... (long ID) vs /#inbox
                // 2. DOM check: existence of '.hP' (subject header) or '.a3s' (email body)

                // We'll rely primarily on the DOM because URLs update before content loads.
                // '.hP' is the subject line in the conversation view.
                const isEmailView = !!document.querySelector('.hP');

                if (isEmailView && !isEmailOpen) {
                    isEmailOpen = true;
                    console.log("Email opened");
                } else if (!isEmailView && isEmailOpen) {
                    // Double check: sometimes DOM updates are partial. 
                    // Verify we are definitely NOT in an email view (e.g., back in inbox)
                    // or just trust the absence of the specific email marker '.hP'
                    isEmailOpen = false;
                    console.log("Email closed");
                }
            };

            // Observer to watch for URL changes
            // Gmail is an SPA, so the URL changes via History API, which doesn't always trigger standard events.
            // A MutationObserver on the body is a reliable way to catch changes as the DOM updates significantly on nav.
            const observer = new MutationObserver(() => {
                const currentUrl = location.href;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    console.log("Gmail URL changed:", currentUrl);
                }
                // Also check view status on every mutation (throttling might be needed if perf issues arise, but for now it's fine)
                checkEmailOpenStatus();
            });

            observer.observe(document.body, {
                subtree: true,
                childList: true
            });
        } else {
            // Check again in 500ms
            setTimeout(waitForGmailToLoad, 500);
        }
    };

    waitForGmailToLoad();

})();
