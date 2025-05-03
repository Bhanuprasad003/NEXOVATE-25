# QuickPhish Browser Extension

A browser extension that provides instant phishing link detection for Gmail and Outlook webmail users.

## Features

- Real-time phishing link detection in Gmail and Outlook webmail
- Instant warning modal for suspicious links
- Powered by PhishTank's free API
- Works on both Chrome and Edge browsers
- No backend server required
- Minimal performance impact

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### Edge

1. Download or clone this repository
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" in the left sidebar
4. Click "Load unpacked" and select the extension directory

## Usage

1. Once installed, the extension will automatically start monitoring links in Gmail and Outlook webmail
2. When you click a link, the extension will check it against PhishTank's database
3. If a phishing link is detected, a warning modal will appear
4. You can choose to proceed anyway or cancel the navigation

## How It Works

1. The extension intercepts link clicks in Gmail and Outlook webmail
2. Before navigation, it sends the URL to PhishTank's API
3. If the URL is flagged as malicious, a warning modal is displayed
4. The user can then make an informed decision about proceeding

## Security

- The extension only monitors links in Gmail and Outlook webmail
- No data is stored or transmitted except for the URL being checked
- Uses PhishTank's free API for threat detection
- No backend server required

## Development

### Project Structure

```
quickphish/
├── manifest.json
├── content.js
├── background.js
├── popup.html
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Building from Source

1. Clone the repository
2. Make your changes
3. Load the extension in developer mode as described in the installation section

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details 