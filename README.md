# Lockb0x Codex Forge — Chrome Extension

## Overview

Lockb0x Codex Forge is a Chrome Extension that streamlines the creation of secure, verifiable Lockb0x Codex Entries (v0.0.2) from web content or user-uploaded files. It leverages Chrome's built-in AI for automated metadata generation and supports both mock and Google anchor flows for robust protocol compliance.

## Unique Features

- **Manifest V3 Architecture:** Secure, modern Chrome extension design.
- **AI-Assisted Metadata:** Uses Chrome AI APIs to summarize content and generate process tags and certificate summaries.
- **Protocol Engine:** Implements Lockb0x v0.0.2 features—UUID generation, SHA-256 hashing, ni-URI encoding, RFC 8785 canonicalization, and ECDSA signing.
- **Anchor Flexibility:** Supports both mock anchors and Google anchor integration (Google adapter is stubbed; UI and error feedback are implemented. Next step: integrate real Google API calls for anchor creation).
- **Schema Validation:** Ensures all entries conform to Lockb0x protocol standards.
- **User-Friendly UI:** Simple popup for file upload, page extraction, anchor selection, and export/copy of entries.

## Why Use Lockb0x Codex Forge?

- **Security & Verifiability:** Create cryptographically signed, canonical entries for digital assets, research, or compliance.
- **Automation:** Let AI generate human-readable summaries and tags, saving time and reducing manual errors.
- **Google Integration:** For users with Google accounts, anchor entries to Google Drive or Cloud for enhanced provenance and sharing.
- **Hackathon-Ready:** Designed for rapid prototyping, demo, and real-world use.

## When & How to Use

### When
- You need to create verifiable records of files, web content, or research.
- You want to automate metadata and certificate generation.
- You require Google-based anchoring for compliance or sharing.
- You’re participating in a hackathon or want to demo protocol features quickly.

### How
1. **Install the Extension:** Load it in Chrome via `chrome://extensions` (Developer Mode > Load Unpacked).
2. **Open the Popup:** Click the extension icon.
3. **Upload a File or Extract Page Content:** Use the popup to select your source data.
4. **Select Anchor Type:** Choose between mock or Google anchor (Google account required for Google anchor).
5. **Generate Entry:** The extension will hash, canonicalize, sign, and anchor your entry, using AI to generate metadata.
6. **Export or Copy:** Download the JSON entry or copy it to your clipboard for use in Lockb0x workflows.

## Implementation Details

- **Protocol Logic:** Modularized in `lib/protocol.js` and `background.js`.
- **AI Integration:** In `lib/ai.js`, using Chrome AI APIs.
- **Google Anchor:** Uses Chrome Identity API for authentication and Google APIs for anchor creation (adapter is stubbed; UI and error feedback are implemented. See docs/GoogleCloudAnchor.md for status and next steps).
- **Schema Validation:** Ensures all entries are compliant before export; validation runs before export and feedback is shown in the popup UI.

## Documentation & Support

- See `docs/DEVELOPMENT-PLAN.md` for the full implementation roadmap and current build status.
- See `docs/GoogleCloudAnchor.md` for Google anchor integration status and next steps.

## Contributing

Pull requests and feedback are welcome! See the docs for contribution guidelines.

---

Lockb0x Codex Forge — Secure, AI-powered, and ready for the future of digital provenance.

## Current Build Status (as of 2025-10-14)

- Protocol core and AI metadata integration are complete and working.
- Google anchor integration is in progress (adapter stubbed, UI/auth logic present; UI feedback and error handling improved).
- Schema validation and export polish are implemented and working in the popup.
- Unit testing for protocol, AI, and validation modules is implemented.

## Troubleshooting & Error Handling

### Common Issues

- **Unchecked runtime.lastError: Cannot access a chrome:// URL**
	- This occurs if you try to extract content from a Chrome internal page (chrome://). Only extract from regular web pages.

- **Uncaught SyntaxError: Cannot use import statement outside a module**
	- Ensure popup.js is loaded with `<script type="module">` in popup.html. All imports should use correct relative paths.

- **Google Sign-In Not Working**
	- Make sure you have the "identity" permission in manifest.json and are signed into Chrome with a Google account.

- **Service Worker Registration Failed**
	- Confirm that background.js is declared as a module in manifest.json (`type: "module"`).

### Debugging Tips

- Use Chrome DevTools (F12) on the popup and background pages for console logs and error messages.
- Check the extension's background page for logs and errors in chrome://extensions > Details > Inspect views.
- Review status and error messages in the popup UI for feedback on user actions.
- For anchor and signing errors, see the console logs in background.js for detailed error traces.

For more help, see `docs/AGENTS.md` for a full action plan and debugging checklist.