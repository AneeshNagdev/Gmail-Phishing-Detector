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
                    const senderDomain = extractSenderDomain();
                    const replyToDomain = extractReplyToDomain();
                    const links = extractLinks();
                    analyzeRisk({
                        senderDomain,
                        replyToDomain,
                        links
                    });
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
                    const senderElement = document.querySelector('span.gD');
                    if (senderElement) {
                        const emailAddress = senderElement.getAttribute('email');
                        if (emailAddress) {
                            const domain = emailAddress.split('@')[1];
                            if (domain) {
                                console.log(`Sender domain detected: ${domain}`);
                                return domain;
                            }
                        }
                    }
                    console.log("Sender domain extraction failed");
                    return null;
                } catch (error) {
                    console.error("Error extracting sender domain:", error);
                    return null;
                }
            };

            const extractReplyToDomain = () => {
                try {
                    const openEmailContainer = document.querySelector('.MainContent') || document.body;
                    const headerRows = Array.from(openEmailContainer.querySelectorAll('tr, div'));

                    for (const row of headerRows) {
                        if (row.innerText && row.innerText.includes('Reply-to:')) {
                            const emailMatch = row.innerText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
                            if (emailMatch) {
                                const email = emailMatch[0];
                                const domain = email.split('@')[1];
                                console.log(`Reply-to domain detected: ${domain}`);
                                return domain;
                            }
                        }
                    }
                    console.log("No reply-to domain found");
                    return null;
                } catch (error) {
                    console.log("Error extracting reply-to domain");
                    return null;
                }
            };

            const extractLinks = () => {
                const extractedLinks = [];
                try {
                    const emailBodies = document.querySelectorAll('.a3s');
                    if (emailBodies.length > 0) {
                        emailBodies.forEach((body) => {
                            const links = body.querySelectorAll('a');
                            links.forEach(link => {
                                const href = link.getAttribute('href');
                                if (href && !href.startsWith('mailto:')) {
                                    extractedLinks.push(href);
                                    console.log(`Link found: ${href}`);
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.error("Error extracting links:", error);
                }
                return extractedLinks;
            };

            const analyzeRisk = (metadata) => {
                console.log("--- Starting Risk Analysis ---");
                const { senderDomain, replyToDomain, links } = metadata;
                let riskScore = 0;
                let flags = [];

                // Check A: Sender vs Reply-to mismatch
                // "if both exist and domains differ add +25 flag"
                if (senderDomain && replyToDomain) {
                    if (senderDomain.toLowerCase() !== replyToDomain.toLowerCase()) {
                        riskScore += 25;
                        flags.push({
                            description: "Sender domain mismatch with Reply-To",
                            evidence: `sender=${senderDomain} replyTo=${replyToDomain}`,
                            points: 25
                        });
                    }
                }

                // Check B: Sensitive Domain Mismatch (e.g. PayPal)
                // "links that don't match sender domain if domain is paypal.com but links are mostly outside add +10"
                const sensitiveDomains = ['paypal.com'];
                if (senderDomain && sensitiveDomains.includes(senderDomain.toLowerCase())) {
                    let suspiciousLinkFound = false;
                    for (const link of links) {
                        try {
                            const url = new URL(link);
                            // If link domain is different from sender domain 
                            // (and not subdomain specific, though usually paypal links are paypal.com)
                            // Strict check for now: must end with senderDomain
                            if (!url.hostname.endsWith(senderDomain)) {
                                suspiciousLinkFound = true;
                                break;
                            }
                        } catch (e) {
                            // Invalid URL, potential risk
                        }
                    }

                    if (suspiciousLinkFound) {
                        riskScore += 10;
                        flags.push({
                            description: `Suspicious links for sensitive sender (${senderDomain})`,
                            evidence: "Email contains links not matching the sender domain",
                            points: 10
                        });
                    }
                }

                // Check C: Link Analysis
                let suspiciousPatternFound = false;
                let urlShortenerFound = false;
                let ipLinkFound = false;
                let nonHttpsFound = false;

                // Keywords often used in phishing
                const suspiciousKeywords = ['verify', 'login', 'secure', 'update', 'account', 'support', 'unlock'];
                const urlShorteners = ['bit.ly', 'goo.gl', 'tinyurl.com', 'ow.ly', 't.co', 'is.gd', 'buff.ly'];

                links.forEach(link => {
                    try {
                        const url = new URL(link);
                        const hostname = url.hostname.toLowerCase();

                        // C1: Suspicious Patterns (Keywords)
                        // "if a link domain contains sender branch name but not excat domain or common scam patterns like: verify, login..."
                        // We check if the hostname contains any of the suspicious keywords
                        if (!suspiciousPatternFound) {
                            for (const keyword of suspiciousKeywords) {
                                if (hostname.includes(keyword)) {
                                    suspiciousPatternFound = true;
                                    flags.push({
                                        description: "Suspicious keyword in link domain",
                                        evidence: `Link '${hostname}' contains '${keyword}'`,
                                        points: 15
                                    });
                                    riskScore += 15;
                                    break;
                                }
                            }
                        }

                        // C2: URL Shorteners
                        // "for url shorteners add +20"
                        if (!urlShortenerFound) {
                            // Use the already parsed 'hostname' from line 186
                            // Check against list or common "short" pattern
                            if (urlShorteners.includes(hostname)) {
                                urlShortenerFound = true;
                                flags.push({
                                    description: "URL Shortener detected",
                                    evidence: `Link uses shortener ${hostname}`,
                                    points: 20
                                });
                                riskScore += 20;
                            }
                        }

                        // C3: IP Address Links
                        // "for IP address links add +30"
                        if (!ipLinkFound) {
                            // Regex for IP address (IPv4)
                            // Basic check: 4 groups of 1-3 digits separated by dots
                            if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
                                ipLinkFound = true;
                                flags.push({
                                    description: "Link uses IP address instead of domain",
                                    evidence: link,
                                    points: 30
                                });
                                riskScore += 30;
                            }
                        }

                        // C4: Non-HTTPS Links (TODO)

                    } catch (e) {
                        // Invalid URL
                    }
                });

                // C5: Excessive Links (TODO)

                // Calculate Risk Level (Removed for now as per user request)
                // console.log(`Risk Level: ${riskLevel} (${riskScore}/100)`);

                console.log("Current Risk Score:", riskScore);
                console.log("Flags:", flags);
                console.log("--- Risk Analysis Partial End ---");
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
