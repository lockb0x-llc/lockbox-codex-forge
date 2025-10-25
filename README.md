# Lockb0x Codex Forge — Chrome Extension

## Overview
Lockb0x Codex Forge is a Chrome Extension that streamlines the creation of secure, verifiable Lockb0x Codex Entries (v0.0.2) from web content or user-uploaded files. It leverages Chrome's built-in AI for automated metadata generation and supports both mock and Google anchor flows for robust protocol compliance.

**Current Capabilities (2025-10-24):**
- The extension now saves the uploaded or extracted payload directly to the authenticated user's Google Drive account (when using Google anchor).
- The user can download the generated Codex entry record as a JSON file from the popup UI.
- The extension validates payload existence in Drive before export, and provides a download link for the payload if validated.

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
### Codex Entry Generation & Google Drive Integration

- **Upload File or Extract Page Content:** Select a file (text, PDF, JSON, etc.) or extract content from the current web page.
- **Anchor Selection:** Choose between mock or Google anchor. Sign in with Google for Drive integration.
- **Payload Storage:** Uploaded files or extracted content are saved to your Google Drive account (if Google anchor is selected) and referenced in the Codex entry.
- **Codex Entry Generation:** The extension hashes, canonicalizes, signs, and anchors your entry, using AI to generate metadata.
- **Export & Verification:** Before export, the extension validates payload existence in Drive. You can download the Codex entry as a JSON file, copy it to clipboard, and verify schema/signature in the popup. The payload download link is shown if existence is validated.

## Verification Instructions
- Download the payload from the Drive link in the Codex entry (only if existence is validated)
- Compute SHA-256 hash and compare to integrity_proof
- Confirm anchor file exists and matches metadata
- Validate ES256 signature using the JWK in kid
- Use provided verification script or tool for automated checks

## Roadmap & Hackathon Readiness
- All major improvements for robust, user-friendly release are now implemented:
	- Binary file upload support
	- Reliable Google auth token persistence
	- Improved error handling and UI feedback
	- Consistent workflow and file references
	- Download link for payload files
	- Enhanced schema validation and export polish
- Ready for hackathon/demo/production submission
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

## Secure Manifest & OAuth Client ID Handling

Chrome extensions must not expose secrets (such as Google OAuth client IDs) in source control. This project uses a secure build process:

1. **manifest.template.json** — Contains a placeholder `${CHROME_OAUTH_CLIENT_ID}` for the OAuth client ID.
2. **.env** — Store your actual client ID here. This file is NOT committed to source control.
3. **.env.example** — Public template for contributors, with instructions for adding secrets.
4. **build-manifest.js** — Node.js script that reads `.env` and generates `manifest.json` with the real client ID.
5. **manifest.json** — Generated file, used by Chrome. Do NOT edit directly.

### Workflow for Contributors
- Edit `manifest.template.json` for manifest changes. Use `${CHROME_OAUTH_CLIENT_ID}` for the client ID.
- Add your real client ID to `.env` (see `.env.example` for format).
- Run `npm run build-manifest` to generate `manifest.json` before packaging or loading the extension.
- Do NOT commit `.env` or `manifest.json` to source control.
- Only commit `manifest.template.json`, `.env.example`, and the build script.

### Example .env
```
CHROME_OAUTH_CLIENT_ID=your-google-oauth-client-id-here
```

### Example manifest.template.json
```
"oauth2": {
  "client_id": "${CHROME_OAUTH_CLIENT_ID}",
  "scopes": [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

### Build Command
```
npm run build-manifest
```

This ensures secrets are never exposed in source control and the extension is packaged securely.