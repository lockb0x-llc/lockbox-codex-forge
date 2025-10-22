# Lockb0x Codex Forge — Chrome Extension

## Overview
Lockb0x Codex Forge is a Chrome Extension that streamlines the creation of secure, verifiable Lockb0x Codex Entries (v0.0.2) from web content or user-uploaded files. It leverages Chrome's built-in AI for automated metadata generation and supports both mock and Google anchor flows for robust protocol compliance.

## Comprehensive Improvement Plan (2025-10-20)
- Binary file upload support for all payloads
- Reliable Google auth token persistence
- Improved error handling and UI feedback
- Consistent workflow and file references
- Download link for payload files
- Enhanced schema validation and export polish
- Expanded unit tests for anchor, payload, and edge cases
- Updated documentation and contributor guides

## Workflow & Features
### Codex Entry Reference Consistency & Payload Existence Validation

- **artifact**: The original filename of the uploaded payload. Stored in `identity.artifact` and required for all entries.
- **storage.location**: The URL or path where the payload is stored. For Google Drive anchors, this is the Drive file URL; for local/mock anchors, it may be the filename or a local path. Must always reference the actual payload file.
- **Validation**: The extension ensures `artifact` and `storage.location` are set and consistent for every Codex entry. The schema validator checks both fields. For Drive payloads, the extension validates existence before export using the Drive API (see background.js: checkDriveFileExists). If the file is missing or trashed, export is blocked and the UI displays a clear error.

Workflow Steps:
1. **Upload File or Extract Page Content:** Select a file (text, PDF, JSON, etc.) or extract content from the current web page.
2. **Anchor Selection:** Choose between mock or Google anchor. Sign in with Google for Drive integration.
3. **Payload Storage:** Uploaded files are stored in Google Drive (for Google anchor) and referenced in the Codex entry.
4. **Codex Entry Generation:** The extension hashes, canonicalizes, signs, and anchors your entry, using AI to generate metadata.
5. **Export & Verification:** Before export, the extension validates payload existence (Drive API metadata check). Download the Codex entry, copy to clipboard, and verify schema/signature in the popup. Download the original payload from Drive (if validated).

## Verification Instructions
- Download the payload from the Drive link in the Codex entry (only if existence is validated)
- Compute SHA-256 hash and compare to integrity_proof
- Confirm anchor file exists and matches metadata
- Validate ES256 signature using the JWK in kid
- Use provided verification script or tool for automated checks

## Roadmap & Hackathon Readiness
- Complete all improvements for robust, user-friendly release
- Finalize for hackathon/demo/production submission
- See DEVELOPMENT-PLAN.md for full checklist and technical milestones

## Contributor Guide
- When adding new anchor/storage types, ensure existence validation is implemented and tested. See background.js and background.test.js for patterns.
- Document new validation logic and update tests as needed.

## Troubleshooting & Support
- See AGENTS.md and GoogleCloudAnchor.md for action plans, debugging, and integration status
- Use Chrome DevTools for logs and error messages
- Review status and error messages in the popup UI for feedback
- For anchor and signing errors, see background.js logs

## Documentation & Contribution
- See DEVELOPMENT-PLAN.md for implementation roadmap
- See GoogleCloudAnchor.md for integration status and next steps
- See AGENTS.md for team roles and assignments
- Pull requests and feedback are welcome!

---
Lockb0x Codex Forge — Secure, AI-powered, and ready for the future of digital provenance.

## Submission Checklist
- README includes elevator pitch, impact, competitive analysis, personas, use cases, demo, technical overview, and roadmap
- Demo assets (screenshots, GIFs, video) are present
- User feedback and testing summary included
- Competitive analysis section completed
- Roadmap for future development included
- All hackathon requirements mapped and documented
- Documentation is organized and accessible for judges

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