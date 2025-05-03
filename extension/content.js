// Constants
const GOOGLE_SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/vtapi/v2/url/report';
const URLHAUS_API_URL = 'https://urlhaus-api.abuse.ch/v1/';
const WARNING_MODAL_ID = 'quickphish-warning-modal';
const API_KEY = 'AIzaSyCngttbVh6iytjtuEGMVLzO0md87PtLKCQ'; // Replace with your actual API key
const VIRUSTOTAL_API_KEY = 'f942fa105f8cf2d0fc011a93c5f7f04bc90db7edb0159c112334c749dedfe02b'; // Replace with your VirusTotal API key

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

// Check URL patterns
function checkSuspiciousPatterns(url) {
    const suspiciousPatterns = [
        /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/, // Only exact IP address matches
        /[^a-zA-Z0-9\-\.\/\?\=\&]/, // Allow common URL characters
        /(?:login|signin|account|secure|verify|confirm|update|password|bank|paypal|amazon|ebay|apple|google|microsoft)(?:[^a-zA-Z0-9]|$)/i, // More precise keyword matching
        /[a-zA-Z0-9-]+\.(tk|ml|ga|cf|gq)(?:[^a-zA-Z0-9]|$)/, // Free domain TLDs with boundary check
    ];

    // Don't flag if it's a well-known domain
    const trustedDomains = [
        'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
        'github.com', 'linkedin.com', 'twitter.com', 'instagram.com', 'youtube.com',
        'netflix.com', 'spotify.com', 'paypal.com', 'ebay.com', 'wikipedia.org'
    ];

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // If it's a trusted domain, skip pattern checking
    if (trustedDomains.some(trusted => domain.endsWith(trusted))) {
        return false;
    }

    return suspiciousPatterns.some(pattern => pattern.test(url));
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
        debugLog('Starting comprehensive URL check:', url);
        
        // Run all checks in parallel
        const [isGoogleSafe, isSSLSafe, hasSuspiciousPatterns, isDomainMalicious, isURLhausMalicious] = await Promise.all([
            checkGoogleSafeBrowsing(url),
            checkSSLCertificate(url),
            Promise.resolve(checkSuspiciousPatterns(url)),
            checkDomainReputation(url),
            checkURLhaus(url)
        ]);

        // Log results
        debugLog('Security check results:', {
            isGoogleSafe,
            isSSLSafe,
            hasSuspiciousPatterns,
            isDomainMalicious,
            isURLhausMalicious
        });

        // More nuanced decision making
        if (!isGoogleSafe) {
            debugLog('URL flagged by Google Safe Browsing');
            return true;
        }

        if (isDomainMalicious) {
            debugLog('URL flagged by VirusTotal');
            return true;
        }

        if (isURLhausMalicious) {
            debugLog('URL flagged by URLhaus');
            return true;
        }

        // Only consider SSL and patterns if other checks pass
        if (!isSSLSafe && hasSuspiciousPatterns) {
            debugLog('URL has both SSL and pattern issues');
            return true;
        }

        // If only one of SSL or patterns is an issue, log but don't block
        if (!isSSLSafe) {
            debugLog('Warning: URL has SSL issues but proceeding');
        }
        if (hasSuspiciousPatterns) {
            debugLog('Warning: URL has suspicious patterns but proceeding');
        }

        return false;
    } catch (error) {
        debugLog('Error in comprehensive URL check:', error);
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