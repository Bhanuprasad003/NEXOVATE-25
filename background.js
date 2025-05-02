// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('QuickPhish extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PHISHING_CHECK') {
        // Handle any background phishing checks if needed
        sendResponse({ success: true });
    }
    return true;
}); 