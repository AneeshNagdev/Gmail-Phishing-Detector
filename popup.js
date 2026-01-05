document.addEventListener('DOMContentLoaded', function () {
    const analyzeBtn = document.getElementById('analyze-btn');
    const statusText = document.getElementById('status');

    analyzeBtn.addEventListener('click', function () {
        statusText.textContent = "Analyzing...";
        statusText.style.color = "#666"; // Reset color

        // Hide results if previously shown
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) resultsContainer.classList.add('hidden');

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) {
                renderError("No active tab found.");
                return;
            }

            const activeTab = tabs[0];

            chrome.tabs.sendMessage(activeTab.id, { type: "ANALYZE_CURRENT_EMAIL" }, function (response) {
                if (chrome.runtime.lastError) {
                    renderError("Could not connect to page. Make sure you are on a Gmail tab and try refreshing.");
                    console.error("Runtime Error:", chrome.runtime.lastError);
                    return;
                }

                if (response && response.ok) {
                    renderResults(response.data);
                } else {
                    renderError(response ? response.error : "Unknown error occurred.");
                }
            });
        });
    });

    function renderResults(data) {
        statusText.textContent = "Analysis complete.";
        statusText.style.color = "green";

        const resultsContainer = document.getElementById('results-container');
        const riskBadge = document.getElementById('risk-badge');
        const riskScore = document.getElementById('risk-score');
        const flagsList = document.getElementById('flags-list');
        const disclaimer = document.getElementById('disclaimer');

        if (!resultsContainer) {
            console.warn("Results container not found in DOM (waiting for HTML update). Data:", data);
            return;
        }

        // 1. Risk Badge
        riskBadge.textContent = data.riskLevel;
        riskBadge.className = ''; // Reset classes
        if (data.riskLevel === 'HIGH') riskBadge.classList.add('risk-high');
        else if (data.riskLevel === 'MEDIUM') riskBadge.classList.add('risk-medium');
        else riskBadge.classList.add('risk-low');

        // 2. Score
        riskScore.textContent = `Risk Score: ${data.riskScore}/100`;

        // 3. Flags
        flagsList.innerHTML = '';
        if (data.flags.length > 0) {
            data.flags.forEach(flag => {
                const li = document.createElement('li');
                li.className = 'flag-item';
                li.textContent = `${flag.description} (+${flag.points})`;
                flagsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No suspicious flags detected.";
            flagsList.appendChild(li);
        }

        // 4. Disclaimer
        if (disclaimer) {
            disclaimer.textContent = "Disclaimer: This is a heuristic check, not 100% accurate. If you trust the sender, verify using official channels.";
        }

        // Show results
        resultsContainer.classList.remove('hidden');
    }

    function renderError(errorMessage) {
        statusText.textContent = errorMessage;
        statusText.style.color = "red";

        // Ensure results are hidden on error
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) resultsContainer.classList.add('hidden');
    }

    // --- History Feature Logic ---
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyContainer = document.getElementById('history-container');
    const historyList = document.getElementById('history-list');
    const historyStatus = document.getElementById('history-status');

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', function () {
            // Toggle visibility
            if (!historyContainer.classList.contains('hidden')) {
                historyContainer.classList.add('hidden');
                viewHistoryBtn.textContent = "View Scan History";
                return;
            }

            // Show container and fetch data
            historyContainer.classList.remove('hidden');
            viewHistoryBtn.textContent = "Hide Scan History";
            fetchHistory();
        });
    }

    function fetchHistory() {
        historyList.innerHTML = ''; // Clear list
        historyStatus.textContent = "Loading history...";
        historyStatus.classList.remove('hidden');
        historyStatus.style.color = "#666";

        fetch('http://localhost:3000/scans')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Backend unavailable');
                }
                return response.json();
            })
            .then(data => {
                historyStatus.classList.add('hidden');
                renderHistoryList(data);
            })
            .catch(err => {
                console.error("History fetch error:", err);
                historyStatus.textContent = "No scan history available (backend offline).";
                historyStatus.style.color = "red";
                historyStatus.classList.remove('hidden');
            });
    }

    function renderHistoryList(scans) {
        if (!scans || scans.length === 0) {
            historyStatus.textContent = "No past scans found.";
            historyStatus.classList.remove('hidden');
            return;
        }

        scans.forEach(scan => {
            const li = document.createElement('li');
            li.className = 'history-item';

            // Determine risk class
            let riskClass = 'risk-low';
            if (scan.risk_level === 'HIGH') riskClass = 'risk-high';
            else if (scan.risk_level === 'MEDIUM') riskClass = 'risk-medium';

            // Format date
            const date = new Date(scan.created_at).toLocaleString();

            li.innerHTML = `
                <div class="history-details">
                    <span class="history-domain">${scan.sender_domain}</span>
                    <span class="history-date">${date}</span>
                </div>
                <span class="history-risk ${riskClass}">${scan.risk_level}</span>
            `;
            historyList.appendChild(li);
        });
    }
});
