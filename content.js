// Constants
const GOOGLE_SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/vtapi/v2/url/report';
const URLHAUS_API_URL = 'https://urlhaus-api.abuse.ch/v1/';
const WARNING_MODAL_ID = 'quickphish-warning-modal';
const API_KEY = 'AIzaSyA2in_859ALxHRK-kfehFEKROyhX4S_IG0'; // Replace with your actual API key
const VIRUSTOTAL_API_KEY = 'e033325a9e93d94929fc7beed48d3850335b20613ad723b2250f1abea5d915c3'; // Replace with your VirusTotal API key

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
            <div class="quickphish-icon">⚠️</div>
            <h2>Potential Phishing Link Detected</h2>
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

// Check SSL certificate
async function checkSSLCertificate(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        debugLog('SSL certificate check failed:', error);
        return false;
    }
}

// Check URL patterns with improved accuracy
function checkSuspiciousPatterns(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // List of trusted domains
        const trustedDomains = [
            'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
            'github.com', 'linkedin.com', 'twitter.com', 'instagram.com', 'youtube.com',
            'netflix.com', 'spotify.com', 'paypal.com', 'ebay.com', 'wikipedia.org',
            'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'protonmail.com'
        ];

        // Check if domain is trusted
        if (trustedDomains.some(trusted => domain.endsWith(trusted))) {
            return false;
        }

        // More precise suspicious patterns
        const suspiciousPatterns = [
            // IP address without domain
            /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/,
            // Suspicious subdomains
            /(?:login|signin|account|secure|verify|confirm|update|password|bank|paypal|amazon|ebay|apple|google|microsoft)\.(?!com|org|net|edu|gov)[a-zA-Z]{2,}$/i,
            // Free domain TLDs
            /\.(tk|ml|ga|cf|gq|xyz|club|top|site|online|tech|website|space|site|pw|icu|cyou|buzz|click|link|live|stream|gdn|life|live|men|pro|red|rip|rocks|run|sale|services|site|space|store|studio|support|systems|team|today|top|trade|video|website|win|work|xyz)$/i
        ];

        // Check for suspicious patterns
        const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(url));
        
        if (hasSuspiciousPattern) {
            debugLog('URL has suspicious pattern:', url);
            return true;
        }

        return false;
    } catch (error) {
        debugLog('Error checking URL patterns:', error);
        return false;
    }
}

// Check domain reputation using VirusTotal
async function checkDomainReputation(url) {
    try {
        const response = await fetch(`${VIRUSTOTAL_API_URL}?apikey=${VIRUSTOTAL_API_KEY}&resource=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.positives > 0) {
            debugLog('Domain flagged by VirusTotal:', data);
            return true;
        }
        return false;
    } catch (error) {
        debugLog('Error checking domain reputation:', error);
        return false;
    }
}

// Check URL against URLhaus
async function checkURLhaus(url) {
    try {
        debugLog('Checking URL with URLhaus:', url);
        
        const response = await fetch(URLHAUS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `url=${encodeURIComponent(url)}`
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        debugLog('URLhaus API response:', data);

        // URLhaus returns query_status and query_result
        if (data.query_status === 'ok' && data.query_result === 'online') {
            debugLog('URL flagged by URLhaus as malicious');
            return true;
        }

        return false;
    } catch (error) {
        debugLog('Error checking URL with URLhaus:', error);
        return false;
    }
}

// Enhanced URL checking
async function checkPhishingUrl(url) {
    try {
        debugLog('Starting URL check:', url);
        
        // First check for suspicious patterns
        const hasSuspiciousPatterns = checkSuspiciousPatterns(url);
        
        if (hasSuspiciousPatterns) {
            debugLog('URL flagged due to suspicious patterns');
            return true;
        }

        return false;
    } catch (error) {
        debugLog('Error in URL check:', error);
        return false;
    }
}

// Original Google Safe Browsing check (renamed)
async function checkGoogleSafeBrowsing(url) {
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
        
        return !(data.matches && data.matches.length > 0);
    } catch (error) {
        debugLog('Error checking URL with Google Safe Browsing:', error);
        return false;
    }
}

// Handle link clicks
function handleLinkClick(event) {
    const link = event.target.closest('a');
    if (!link) return;

    const url = link.href;
    if (!url) return;

    // Don't check internal links
    if (url.startsWith(window.location.origin)) {
        return;
    }

    // Check if URL is suspicious
    checkPhishingUrl(url).then(isPhishing => {
        if (isPhishing) {
            event.preventDefault();
            showWarningModal(url);
        }
    });
}

// Initialize the extension
function initialize() {
    debugLog('Initializing QuickPhish extension');
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    document.addEventListener('click', handleLinkClick, true);
}

// Start the extension
initialize(); 