# Lockb0x Codex Forge — Chrome Extension

## Overview

Lockb0x Codex Forge is a Chrome Extension (Manifest V3) for creating secure, verifiable Codex Entries from web content or user-uploaded files. It implements the lockb0x protocol with robust hashing, signing, and anchoring capabilities, supporting both mock and Google Drive anchor flows for protocol compliance.

**Note on AI Features:** The extension currently uses fallback text extraction for metadata generation. Chrome Built-In AI features (e.g., `chrome.ai.summarizer`, `chrome.ai.prompt`) are referenced in the codebase but not yet implemented with the actual Chrome AI APIs, as these APIs are still experimental and not widely available.

## Features

### Implemented and Validated
- **Lockb0x Protocol Core:** Complete implementation of UUID generation, SHA-256 hashing, ni-URI encoding, JSON canonicalization (RFC 8785), and ES256 signing
- **File Upload Support:** Upload and anchor any file type (text, PDF, JSON, binary) to Google Drive or mock storage
- **Google Drive Integration:** Secure payload storage, authentication, and token persistence in chrome.storage
- **Dual Anchor Support:** Both mock (local) and Google Drive anchor flows fully functional
- **Codex Entry Generation:** Complete workflow for hashing, canonicalizing, signing, anchoring, and validating entries
- **Schema Validation:** Validation against lockb0x schema v0.0.2 runs before export, with feedback shown in popup
- **Export Options:** Download and copy Codex entry as JSON from popup UI
- **Payload Validation:** Existence validation in Drive before export, with download link shown if validated
- **UI/UX:** Incremental stepper feedback, error messages, and recovery instructions for all workflow steps

### Not Yet Implemented
- **Chrome Built-In AI Integration:** The codebase includes references to Chrome AI APIs (`chrome.ai.summarizer`, `chrome.ai.prompt`) for automated metadata generation, but these are not yet implemented. Currently, the extension uses simple text truncation fallbacks:
  - AI summarization for content → Falls back to first 100 characters
  - Process tag generation → Falls back to static tags ("AI-Summarized-Web-Page" or "File-Upload-Hashed")
  - Certificate summary generation → Falls back to basic template strings

## Current Status

### Validated and Working ✓
- **Lockb0x Protocol Implementation:** All core protocol features (UUID, hashing, ni-URI, signing, canonicalization) are complete and validated
- **Google Drive Integration:** Payload storage, anchor creation, and existence validation are robust and working
- **Mock Anchor Flow:** Local/offline anchor generation is fully functional
- **Schema Validation:** Codex entries validate against schema v0.0.2
- **UI/UX:** Complete workflow with incremental feedback, error handling, and stepper status

### Known Gaps
- **Chrome Built-In AI:** Not implemented; currently using fallback text extraction
  - No integration with experimental Chrome AI APIs
  - Metadata generation uses simple text truncation instead of AI summarization
  - Process tags and certificate summaries use static fallbacks
- **Testing Infrastructure:** Test files exist, test script added to package.json, but vitest needs to be installed
  - To enable testing: `npm install --save-dev vitest jsdom`
  - Then run: `npm test`
- **Code Quality:** All linting warnings have been fixed

### Proof of Concept Status
The extension successfully demonstrates:
- ✓ Lockb0x protocol compliance (hashing, signing, anchoring, validation)
- ✓ Google Drive as a storage and anchor backend
- ✓ Codex entry creation, export, and schema validation
- ✗ Chrome Built-In AI integration (planned but not implemented)

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
- Document new validation logic and update tests as needed.
- Expand contributor guides and troubleshooting as new features are added.

## Troubleshooting

- Use Chrome DevTools for logs and error messages.
- Review status and error messages in the popup UI for feedback.
- For anchor and signing errors, see background.js logs.
- Common issues and solutions are documented in the README and AGENTS.md.

## Roadmap

### Completed
- ✓ Binary file upload support for all payloads
- ✓ Reliable Google auth token persistence
- ✓ Improved error handling and UI feedback
- ✓ Consistent workflow and file references
- ✓ Download link for payload files
- ✓ Enhanced schema validation and export polish
- ✓ Lockb0x protocol core implementation
- ✓ Google Drive integration and payload validation

### Planned / In Progress
- **Chrome Built-In AI Integration:**
  - Implement actual Chrome AI APIs (when stable/available)
  - Replace fallback text extraction with AI-powered summarization
  - Integrate AI-generated process tags and certificate summaries
  - Add feature detection and graceful fallback for browsers without AI support
- **Testing Infrastructure:**
  - Add test runner script to package.json
  - Expand test coverage for all modules
  - Add integration tests for end-to-end workflows
- **Code Quality:**
  - Fix linting warnings (unused variables)
  - Improve error handling consistency
  - Add JSDoc comments for better code documentation
- **UI/UX Polish:**
  - Further refine layout, accessibility, and feedback clarity
  - Improve stepper visuals and status indicators
  - Add tooltips and help text for complex features
- **Documentation:**
  - Expand contributor guides with setup instructions
  - Create video tutorials and demos
  - Add API documentation for developers

## Team Roles

- **Project Lead:** Oversees development, documentation, roadmap, and hackathon strategy.
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
- All hackathon requirements mapped and documented.
- Documentation is organized and accessible for judges.

---

For more details, see:
- `docs/DEVELOPMENT-PLAN.md` for technical milestones and roadmap.
- `docs/AGENTS.md` for team roles and assignments.
- `docs/GoogleCloudAnchor.md` for integration status and next steps.

Lockb0x Codex Forge — Secure, AI-powered, and ready for the future of digital provenance.

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

- **Upload File or Extract Page Content:** Select a file (text, PDF, JSON, binary, etc.) or extract content from the current web page.
- **Anchor Selection:** Choose between mock or Google anchor. Sign in with Google for Drive integration.
- **Payload Storage:** Uploaded files or extracted content are saved to your Google Drive account (if Google anchor is selected) and referenced in the Codex entry.
- **Codex Entry Generation:** The extension hashes, canonicalizes, signs, and anchors your entry. 
  - **Note:** AI metadata generation (summarization, process tags) currently uses simple text fallbacks rather than Chrome Built-In AI APIs.
- **Export & Verification:** Before export, the extension validates payload existence in Drive. You can download the Codex entry as a JSON file, copy it to clipboard, and verify schema/signature in the popup. The payload download link is shown if existence is validated.

## Verification Instructions

- Download the payload from the Drive link in the Codex entry (only if existence is validated)
- Compute SHA-256 hash and compare to integrity_proof
- Confirm anchor file exists and matches metadata
- Validate ES256 signature using the JWK in kid
- Use provided verification script or tool for automated checks

## Roadmap & Hackathon Readiness

### What's Working
- ✓ Binary file upload support
- ✓ Reliable Google auth token persistence
- ✓ Improved error handling and UI feedback
- ✓ Consistent workflow and file references
- ✓ Download link for payload files
- ✓ Enhanced schema validation and export polish
- ✓ Core lockb0x protocol implementation

### What's Not Yet Implemented
- ✗ Chrome Built-In AI integration (currently using fallbacks)
- ✗ Test runner configuration
- ✗ Some code quality improvements (linting warnings)

**Current Status:**

- Core features are complete and validated
- Lockb0x protocol and Google Drive integration are robust and working
- Chrome AI features are planned but use fallback implementations
- Ready for demo/testing, but AI features require additional implementation

See DEVELOPMENT-PLAN.md for full checklist and technical milestones

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

## Submission Checklist

README includes elevator pitch, impact, competitive analysis, personas, use cases, demo, technical overview, and roadmap
Demo assets (screenshots, GIFs, video) are present
User feedback and testing summary included
Competitive analysis section completed
Roadmap for future development included
All hackathon requirements mapped and documented
Documentation is organized and accessible for judges

## Current Build Status (as of 2025-11-01)

### Implemented and Validated ✓
- Protocol core (UUID, SHA-256, ni-URI, canonicalization, signing)
- Google Drive integration for payload storage and anchoring
- Mock anchor flow for local/offline testing
- Binary file upload support for all file types
- Schema validation (lockb0x codex v0.0.2)
- Export and download functionality
- Payload existence validation
- UI/UX feedback with stepper status and error handling

### Not Implemented ✗
- Chrome Built-In AI integration
  - No `chrome.ai.summarizer` implementation
  - No `chrome.ai.prompt` implementation
  - Currently using text truncation fallbacks
- Test runner (test files exist but no npm test script)
- Various code quality improvements (unused variables, etc.)

### Known Issues
- Linting warnings for unused variables in multiple files
- Schema allows "gdrive" protocol but official schema template uses "gcs"
- AI functions always fall back to non-AI implementations

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
