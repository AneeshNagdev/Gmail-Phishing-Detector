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
                    extractSenderDomain(); // Trigger extraction once on open
                } else if (!isEmailView && isEmailOpen) {
                    // Double check: sometimes DOM updates are partial. 
                    // Verify we are definitely NOT in an email view (e.g., back in inbox)
                    // or just trust the absence of the specific email marker '.hP'
                    isEmailOpen = false;
                    console.log("Email closed");
                }
            };

            // --- Module 4: Metadata Extraction ---
            const extractSenderDomain = () => {
                try {
                    // Gmail sender name/email is usually in a span with class 'gD'
                    // It often has an 'email' attribute: <span class="gD" email="sender@example.com">...</span>
                    const senderElement = document.querySelector('span.gD');

                    if (senderElement) {
                        const emailAddress = senderElement.getAttribute('email');
                        if (emailAddress) {
                            const domain = emailAddress.split('@')[1];
                            if (domain) {
                                console.log(`Sender domain detected: ${domain}`);
                            } else {
                                console.log("Sender domain extraction failed: Invalid email format");
                            }
                        } else {
                            console.log("Sender domain extraction failed: No email attribute found on sender element");
                        }
                    } else {
                        console.log("Sender domain extraction failed: Sender element (.gD) not found");
                    }
                    extractReplyToDomain();
                } catch (error) {
                    console.error("Error extracting sender domain:", error);
                }
            };

            const extractReplyToDomain = () => {
                try {
                    const openEmailContainer = document.querySelector('.MainContent') || document.body;
                    const headerRows = Array.from(openEmailContainer.querySelectorAll('tr, div'));

                    let replyToFound = false;

                    for (const row of headerRows) {
                        if (row.innerText && row.innerText.includes('Reply-to:')) {
                            const emailMatch = row.innerText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
                            if (emailMatch) {
                                const email = emailMatch[0];
                                const domain = email.split('@')[1];
                                console.log(`Reply-to domain detected: ${domain}`);
                                replyToFound = true;
                                break;
                            }
                        }
                    }

                    if (!replyToFound) {
                        console.log("No reply-to domain found (or field not visible)");
                    }
                    extractLinks();
                } catch (error) {
                    console.log("No reply-to domain found (error during search)");
                }
            };

            const extractLinks = () => {
                try {
                    // Gmail email body is typically in a div with class 'a3s'
                    // There might be multiple 'a3s' elements (e.g. in conversation threads), 
                    // usually the last one or all should be checked.
                    // For "open email", we can scan all recognizable body containers.
                    const emailBodies = document.querySelectorAll('.a3s');

                    if (emailBodies.length > 0) {
                        emailBodies.forEach((body) => {
                            // Find all anchor tags
                            const links = body.querySelectorAll('a');
                            links.forEach(link => {
                                const href = link.getAttribute('href');
                                if (href && !href.startsWith('mailto:')) { // Filter out mailto links if desired, or keep them. 
                                    // Requirement: "extract visible links (href only)"
                                    // "visible" usually means in the body, which .a3s covers.
                                    console.log(`Links found in email: ${href}`);
                                }
                            });
                        });
                    } else {
                        console.log("No email body container (.a3s) found");
                    }
                } catch (error) {
                    console.error("Error extracting links:", error);
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
