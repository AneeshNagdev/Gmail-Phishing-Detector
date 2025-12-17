document.addEventListener('DOMContentLoaded', function () {
    const analyzeBtn = document.getElementById('analyze-btn');
    const statusText = document.getElementById('status');

    analyzeBtn.addEventListener('click', function () {
        statusText.textContent = "Analyzing...";
        // Logic to send message to content script or backend will go here
        setTimeout(() => {
            statusText.textContent = "Analysis complete (Mock).";
        }, 1000);
    });
});
