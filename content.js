// Constants
const GOOGLE_SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const WARNING_MODAL_ID = 'quickphish-warning-modal';
const API_KEY = ''; // Replace with your actual API key

// Debug logging
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[QuickPhish ${timestamp}] ${message}`, data);
    } else {
        console.log(`[QuickPhish ${timestamp}] ${message}`);
    }
}

// Create and inject warning modal
function createWarningModal() {
    if (document.getElementById(WARNING_MODAL_ID)) {
        debugLog('Warning modal already exists');
        return;
    }
    
    debugLog('Creating warning modal');
    const modal = document.createElement('div');
    modal.id = WARNING_MODAL_ID;
    modal.innerHTML = `
        <div class="quickphish-modal-content">
            <h2>⚠️ Potential Phishing Link Detected</h2>
            <p>The link you're about to visit has been flagged as potentially malicious.</p>
            <div class="quickphish-buttons">
                <button id="quickphish-proceed">Proceed Anyway</button>
                <button id="quickphish-cancel">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    debugLog('Warning modal created and injected');
}

// Show warning modal
function showWarningModal(url) {
    debugLog('Showing warning modal for URL:', url);
    const modal = document.getElementById(WARNING_MODAL_ID);
    if (!modal) {
        debugLog('Modal not found, creating new one');
        createWarningModal();
    }
    modal.style.display = 'block';
    
    // Add event listeners to buttons
    document.getElementById('quickphish-proceed').onclick = () => {
        debugLog('User chose to proceed to URL:', url);
        modal.style.display = 'none';
        window.location.href = url;
    };
    
    document.getElementById('quickphish-cancel').onclick = () => {
        debugLog('User cancelled navigation to URL:', url);
        modal.style.display = 'none';
    };
}

// Check URL against Google Safe Browsing API
async function checkPhishingUrl(url) {
    try {
        debugLog('Checking URL with Google Safe Browsing:', url);
        
        const requestBody = {
            client: {
                clientId: "quickphish-extension",
                clientVersion: "1.0.0"
            },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: url }]
            }
        };

        const response = await fetch(`${GOOGLE_SAFE_BROWSING_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('Google Safe Browsing API response:', data);
        
        // If there are matches, the URL is considered unsafe
        if (data.matches && data.matches.length > 0) {
            debugLog('URL flagged as unsafe:', url);
            return true;
        }
        
        debugLog('URL appears safe:', url);
        return false;
    } catch (error) {
        debugLog('Error checking URL with Google Safe Browsing:', error);
        return false;
    }
}

// Handle link clicks
async function handleLinkClick(event) {
    debugLog('Link click detected');
    
    // Check if the click is from a link
    const link = event.target.closest('a');
    if (!link) {
        debugLog('Click was not on a link');
        return;
    }

    // Get the URL and validate it
    const url = link.href;
    if (!url || url.startsWith('javascript:') || url.startsWith('mailto:')) {
        debugLog('Ignoring special link:', url);
        return;
    }

    debugLog('Processing link:', url);

    // Prevent default navigation
    event.preventDefault();
    event.stopPropagation();

    try {
        debugLog('Processing link click:', url);
        
        // Check if URL is phishing
        const isPhishing = await checkPhishingUrl(url);
        
        if (isPhishing) {
            debugLog('Showing warning modal for phishing URL:', url);
            showWarningModal(url);
        } else {
            debugLog('Proceeding to safe URL:', url);
            window.location.href = url;
        }
    } catch (error) {
        debugLog('Error in handleLinkClick:', error);
        // If there's an error, allow the link to work normally
        window.location.href = url;
    }
}

// Initialize
function initialize() {
    debugLog('QuickPhish extension initializing...');
    
    // Wait for the page to be fully loaded
    if (document.readyState === 'loading') {
        debugLog('Document still loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        debugLog('Document already loaded, setting up listeners immediately');
        setupEventListeners();
    }
}

// Setup event listeners
function setupEventListeners() {
    debugLog('Setting up event listeners...');
    
    // Remove any existing listeners to prevent duplicates
    document.removeEventListener('click', handleLinkClick, true);
    
    // Add click event listener to document
    document.addEventListener('click', handleLinkClick, true);
    
    // Create warning modal
    createWarningModal();
    
    debugLog('QuickPhish extension initialized successfully');
}

// Start the extension
initialize(); 