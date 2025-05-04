# QuickPhish - Browser Extension for Instant Phishing Link Warnings

## Overview

QuickPhish is a browser extension designed to provide real-time protection against phishing attacks in webmail platforms. It instantly detects and warns users about suspicious links in Gmail and Outlook web interfaces, helping prevent credential theft and other phishing-related attacks.

## Features

- **Real-time Link Analysis**: Instantly checks clicked links against known phishing databases
- **Cross-Browser Support**: Works seamlessly on both Chrome and Edge browsers
- **Minimal Performance Impact**: Quick checks (< 1 second) with no noticeable browsing slowdown
- **No Backend Required**: Operates entirely client-side using free threat intelligence APIs
- **User-Friendly Warnings**: Clear, non-intrusive warning modals for suspicious links
- **Privacy-Focused**: Only checks clicked links, no data collection or storage

## Project Structure

```
QuickPhish/
├── extension/              # Browser extension code
│   ├── manifest.json      # Extension configuration
│   ├── content.js         # Main content script for link detection
│   ├── background.js      # Background service worker
│   ├── popup.html         # Extension popup interface
│   ├── styles.css         # Styling for popup and warnings
│   └── icons/             # Extension icons
└── website/               # Project website
    ├── server.py         # Flask server for the website
    ├── requirements.txt  # Python dependencies
    ├── templates/        # Website templates
    └── static/          # Static assets
```

## How It Works

1. **Link Interception**: The extension monitors link clicks in Gmail and Outlook webmail interfaces
2. **Threat Analysis**: Before navigation, the clicked URL is checked against PhishTank's API
3. **Warning System**: If a link is flagged as malicious, a warning modal appears
4. **User Decision**: Users can choose to proceed or cancel the navigation

## Installation

### Chrome
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` directory

### Edge
1. Download or clone this repository
2. Open Edge and go to `edge://extensions/`
3. Enable "Developer mode" in the left sidebar
4. Click "Load unpacked" and select the `extension` directory

## Development

### Extension Development
1. Clone the repository
2. Make changes to the extension files
3. Load the extension in developer mode to test changes
4. The extension uses:
   - Manifest V3 for Chrome/Edge compatibility
   - Content scripts for link detection
   - Service workers for background tasks
   - PhishTank API for threat detection

### Website Development
1. Install Python dependencies:
   ```bash
   pip install -r website/requirements.txt
   ```
2. Run the Flask server:
   ```bash
   python website/server.py
   ```
3. Access the website at `http://localhost:5000`

## Security Features

- **Selective Monitoring**: Only monitors links in specified webmail platforms
- **Minimal Permissions**: Requires only necessary browser permissions
- **No Data Storage**: Does not store or transmit user data
- **Secure API Integration**: Uses HTTPS for all API communications
- **Content Security Policy**: Implements strict CSP for extension security

## Contributing

We welcome contributions! Please feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, feature requests, or bug reports, please open an issue in the repository. 