# Lockb0x Codex Forge — Chrome Extension

## Overview

Lockb0x Codex Forge is a Chrome Extension (Manifest V3) for creating secure, verifiable Codex Entries from web content or user-uploaded files. It implements the lockb0x protocol with robust hashing, signing, and anchoring capabilities, supporting both mock and Google Drive anchor flows for protocol compliance. The latest evolutionary release introduces zip archiving for payloads and the Lockb0x Codex Receipt and Proof Primitive file format, paving the way for a final release on the Google Marketplace. After launch, the project will be forked to support Microsoft Edge and OneDrive integration.

**Note on AI Features:** The extension currently uses fallback text extraction for metadata generation. Chrome Built-In AI features (e.g., `chrome.ai.summarizer`, `chrome.ai.prompt`) are referenced in the codebase but not yet implemented with the actual Chrome AI APIs, as these APIs are still experimental and not widely available. Consequently thesse features are de-prioritized.

## Features

### Implemented and Validated
 - **Lockb0x Protocol Core:** Complete implementation of UUID generation, SHA-256 hashing, ni-URI encoding, JSON canonicalization (RFC 8785), and ES256 signing
- **File Upload Support:** Upload and anchor any file type (text, PDF, JSON, binary) to Google Drive or mock storage
- **Zip Archive Workflow:** Payload and codex entry are packaged together in an encrypted, verifiable zip archive (see docs/ZIP-ARCHIVE.md)
- **Google Drive Integration:** Secure zip archive storage, authentication, and token persistence in chrome.storage
- **Dual Anchor Support:** Both mock (local) and Google Drive anchor flows fully functional
- **Codex Entry Generation:** Complete workflow for hashing, canonicalizing, signing, anchoring, and validating entries
- **Schema Validation:** Validation against lockb0x schema v0.0.2 runs before export, with feedback shown in popup
- **Export Options:** Download codex entry and zip archive as JSON from popup UI
- **Zip Archive Validation:** Existence validation in Drive before export, with download link shown if validated
- **UI/UX:** Incremental stepper feedback, error messages, and recovery instructions for all workflow steps

### Not Yet Implemented
- **Chrome Built-In AI:** Chrome AI APIs (summarizer, prompt) are still experimental and not widely available. Currently using fallback text extraction for metadata generation.

## Current Status

### Validated and Working ✓
- **Lockb0x Protocol Implementation:** All core protocol features (UUID, hashing, ni-URI, signing, canonicalization) are complete and validated
- **Zip Archive Workflow:** Payload and codex entry are packaged together in an encrypted, verifiable zip archive with dual signatures
- **Google Drive Integration:** Zip archive storage, anchor creation, and existence validation are robust and working
- **Mock Anchor Flow:** Local/offline anchor generation is fully functional
- **Schema Validation:** Codex entries validate against schema v0.0.2
- **UI/UX:** Complete workflow with incremental feedback, error handling, stepper status, and zip download capability

### Known Gaps
- **Chrome Built-In AI:** Chrome AI APIs (summarizer, prompt) are still experimental and not widely available. Currently using fallback text extraction for metadata generation.

### Proof of Concept Status
The extension successfully demonstrates:
- ✓ Lockb0x protocol compliance (hashing, signing, anchoring, validation)
- ✓ Google Drive as a storage and anchor backend
- ✓ Codex entry creation, export, and schema validationlemented)

## Installation & Usage

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Add your Google OAuth client ID to `.env` (see `.env.example` for format).
4. Run `npm run build-manifest` to generate `manifest.json`.
5. Load the extension in Chrome via `chrome://extensions` (Developer Mode > Load unpacked).
6. Use the popup to upload files, generate Codex entries, and export or validate as needed.

## Secure Manifest & OAuth Client ID Handling

- `manifest.template.json` contains a placeholder `${CHROME_OAUTH_CLIENT_ID}`.
- Store your actual client ID in `.env` (not committed to source control).
- Run `npm run build-manifest` to generate `manifest.json` before packaging or loading the extension.

## Contributor Guide

- When adding new anchor/storage types, ensure existence validation is implemented and tested.
- Expand contributor guides and troubleshooting as new features are added.


## Google Authentication Token Lifecycle & Usage

- The extension uses a single Google OAuth token for all Drive and profile operations.
- Token is stored in `chrome.storage.local` under the key `googleAuthToken`.
- Before any Google API call, the extension checks for a valid token and refreshes it if expired or missing.
- If a 401 error is returned by the Drive API, the token is removed and a new one is requested automatically, with the operation retried once.
- All token management logic is centralized in `lib/google-auth-utils.js`.
- UI elements and workflow steps always reflect the current authentication state.

### Inline Code Comments

// In lib/google-auth-utils.js:
// getGoogleAuthToken() — retrieves token from chrome.storage.local
// setGoogleAuthToken(token) — stores token
// removeGoogleAuthToken() — removes token
// getValidGoogleAuthToken() — ensures a valid token, refreshing if needed

// In background.js and popup.js:
// Always use getValidGoogleAuthToken() before Google API calls
// On 401 errors, remove and refresh token, then retry once

Refer to these utilities and patterns for any future Google API integration or troubleshooting.

## Troubleshooting

- Use Chrome DevTools for logs and error messages.
- Review status and error messages in the popup UI for feedback.
- For anchor and signing errors, see background.js logs.
- Common issues and solutions are documented in the README and AGENTS.md.

## Roadmap

### Next Milestone: Production Release
The Zip Archive workflow is now fully implemented and validated. The extension is ready for final testing and marketplace publication.
- ✓ Zip archiving for payloads (encrypted with user email or 'mock' password)
- ✓ Dual signature workflow (before and after zip upload)
- ✓ Lockb0x Codex Receipt and Proof Primitive file format
- ✓ Binary file upload support for all payloads
- ✓ Reliable Google auth token persistence
- ✓ Improved error handling and UI feedback
- ✓ Consistent workflow and file references
- ✓ Download link for zip archive files
- ✓ Enhanced schema validation and export polish
- ✓ Lockb0x protocol core implementation
- ✓ Google Drive integration and zip archive validation

### Planned / In Progress
 - Final release and publication on Google Marketplace
 - Fork for Microsoft Edge and OneDrive integration
- **Testing Infrastructure:**
  - Verify test runner script to package.json
  - Verify test coverage for all modules and enhance or add as needed
  - Add integration tests for end-to-end workflows
- **Code Quality:**
  - Improve error handling consistency
  - Add JSDoc comments for better code documentation
- **UI/UX Locked:**
  - No further refinements or changes
- **Documentation:**
  - Expand contributor guides with setup instructions
  - Create video tutorials and demos
  - Add API documentation for developers

## Team Roles

**Project Lead:** Oversees development, documentation, roadmap, and release strategy.
- **AI Integration (PENDING):** Will implement and test Chrome Built-In AI APIs when available, including metadata generation and fallback logic.
- **Protocol Engineer:** Develops and tests protocol logic, anchor flows, and schema validation.
- **UI/UX Designer:** Designs popup UI, stepper, and user flows; improves accessibility and error feedback.
- **Google Cloud Integration:** Handles Google anchor API, Drive integration, authentication, and token persistence.
- **QA & Testing:** Conducts user testing, feedback collection, and maintains test infrastructure.
- **Documentation:** Updates README, contributor guides, troubleshooting, and verification instructions.

## Submission Checklist

- README includes elevator pitch, impact, competitive analysis, personas, use cases, demo, technical overview, and roadmap.
- Demo assets (screenshots, GIFs, video) are present.
- User feedback and testing summary included.
- Competitive analysis section completed.
- Roadmap for future development included.
  
- Documentation is organized and accessible for public.

---

For more details, see:
- `docs/ZIP-ARCHIVE.md` for zip archive workflow and implementation details.
- `docs/DEVELOPMENT-PLAN.md` for technical milestones and roadmap.
- `docs/AGENTS.md` for team roles and assignments.
- `docs/GoogleCloudAnchor.md` for integration status and next steps.

## Workflow & Features

### Codex Entry Generation & Google Drive Integration

- **Upload File or Extract Page Content:** Select a file (text, PDF, JSON, binary, etc.) or extract content from the current web page.
- **Anchor Selection:** Choose between mock or Google anchor. Sign in with Google for Drive integration.
- **Zip Archive Creation:** The extension creates an encrypted zip archive containing:
  - Your uploaded file or extracted content (original filename preserved)
  - A codex-entry.json file with metadata (excluding storage location and anchor details until after upload)
  - Archive-level comment with full codex entry for provenance
- **Encryption:** Zip archive is encrypted with your Google email (if using Google anchor) or with 'mock' password (if using mock anchor)
- **Codex Entry Generation:** The extension hashes, canonicalizes, signs, and anchors your entry twice:
  - Initial signature before zip creation
  - Updated signature after zip upload with storage metadata
  - **Note:** AI metadata generation (summarization, process tags) currently uses simple text fallbacks rather than Chrome Built-In AI APIs.
- **Export & Verification:** Before export, the extension validates zip archive existence in Drive. You can download:
  - The final Codex entry as a JSON file
  - The encrypted zip archive (locally or from Drive)
  - Copy the codex entry to clipboard
  - View schema and signature validation results in the popup

## Verification Instructions

- Download the encrypted zip archive from the Drive link in the Codex entry (or download locally from popup)
- Extract the zip archive using the password (your Google email or 'mock')
- Verify the payload file matches the original
- Compare the codex-entry.json in the zip with the final codex entry (should match except for storage.location, anchor.tx, anchor.url)
- Verify the archive-level comment contains the full final codex entry
- Compute SHA-256 hash of the payload and compare to integrity_proof in the codex entry
- Confirm anchor file exists and matches metadata
- Validate ES256 signatures using the JWK in kid
- Use provided verification script or tool for automated checks


## Contributor Guide

When adding new anchor/storage types, ensure existence validation is implemented and tested. See background.js and background.test.js for patterns.
Document new validation logic and update tests as needed.
Expand contributor guides and troubleshooting as new features are added.

## Troubleshooting & Support

See AGENTS.md and GoogleCloudAnchor.md for action plans, debugging, and integration status
Use Chrome DevTools for logs and error messages
Review status and error messages in the popup UI for feedback
For anchor and signing errors, see background.js logs
Refer to DEVELOPMENT-PLAN.md for current gaps and next steps

## Documentation & Contribution

See DEVELOPMENT-PLAN.md for implementation roadmap
See GoogleCloudAnchor.md for integration status and next steps
See AGENTS.md for team roles and assignments
Pull requests and feedback are welcome!

---

Lockb0x Codex Forge — Secure, AI-powered, and ready for the future of digital provenance.


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

## Manual Testing Instructions

To manually test the Lockb0x Codex Forge Chrome Extension:

1. **Install the Extension**
   - Build the manifest: `npm run build-manifest`
   - Load the extension in Chrome via `chrome://extensions` (Developer Mode > Load unpacked)
   - Select the project folder containing `manifest.json`

2. **Test Popup UI and Workflow**
   - Click the extension icon to open the popup
   - Upload a file (text, PDF, JSON, binary)
   - Verify that the file is processed and a Codex entry is generated
   - Check that hashes, canonicalization, signing, and anchoring steps complete with feedback
   - Export the Codex entry as JSON and validate its contents

3. **Google Drive Integration**
   - Authenticate with Google when prompted
   - Upload a file and ensure it is anchored to Google Drive
   - Confirm that the payload existence check works and a download link is shown if validated

4. **Error Handling**
   - Try uploading unsupported file types or invalid data
   - Confirm that error messages are shown in the popup UI
   - Check Chrome DevTools (background and popup) for logs and error details

5. **Schema Validation**
   - Export a Codex entry and validate it using the popup
   - Confirm that validation feedback is shown before export

6. **General UI/UX**
   - Test stepper navigation, incremental feedback, and error recovery
   - Ensure accessibility features (keyboard navigation, screen reader labels) work as expected

7. **Troubleshooting**
   - If issues arise, reload the extension and check for errors in Chrome DevTools
   - Review logs in `background.js` and popup for workflow details

---

For advanced testing scenarios, see `docs/DEVELOPMENT-PLAN.md` and `docs/AGENTS.md`.
