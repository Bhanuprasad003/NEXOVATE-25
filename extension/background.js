chrome.runtime.onInstalled.addListener(() => {
    console.log('QuickPhish extension installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https?:/.test(tab.url)) {
        // Inject CSS
        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['styles.css']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('CSS injection failed:', chrome.runtime.lastError);
            } else {
                console.log('QuickPhish CSS injected into tab:', tab.url);
            }
        });

        // Inject JS
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Script injection failed:', chrome.runtime.lastError);
            } else {
                console.log('QuickPhish script injected into tab:', tab.url);
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PHISHING_CHECK') {
        // Handle phishing check logic
        sendResponse({ success: true });
    }
    return true;
});
