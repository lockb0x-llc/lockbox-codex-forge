# Lockb0x Codex Forge — Chrome Extension

## Overview
Lockb0x Codex Forge is a Chrome Extension (Manifest V3) for creating secure, verifiable Lockb0x Codex Entries (v0.0.2) from web content or user-uploaded files. It leverages Chrome's built-in AI for automated metadata generation and supports both mock and Google anchor flows for robust protocol compliance.

**Current Capabilities (2025-10-24):**
- Binary file upload support for all payloads (text, PDF, JSON, binary)
- Google authentication and Drive integration: user can sign in, upload payloads, and validate existence
- Codex entry generation: hashes, canonicalizes, signs, anchors, and validates entries
- Robust schema validation and export polish: validation runs before export, feedback shown in popup
- Download and copy Codex entry as JSON from popup UI
- Reliable Google auth token persistence in chrome.storage
- UI feedback for all workflow steps, including incremental stepper and error messages
- Payload existence validation in Drive before export, with download link shown if validated
- Unit tests for protocol, AI, validation, anchor logic, and payload existence

**Recent Progress:**
- All core features are now functionally complete and validated
- Google Drive integration and payload existence validation are robust
- UI/UX provides incremental feedback and error handling for all workflow steps
- Documentation and contributor guides are being expanded

**Remaining Gaps & Next Steps:**
- UI/UX polish: improve layout, accessibility, and feedback clarity
- Error handling: further refine messages and recovery instructions for all user actions
- Documentation: expand contributor guides, troubleshooting, and verification instructions
- Edge case and anchor testing: expand unit tests for Google anchor and payload validation
- Finalize for hackathon/demo/production submission

See DEVELOPMENT-PLAN.md for full checklist and technical milestones.

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
- **Codex Entry Generation:** The extension hashes, canonicalizes, signs, and anchors your entry, using AI to generate metadata.
- **Export & Verification:** Before export, the extension validates payload existence in Drive. You can download the Codex entry as a JSON file, copy it to clipboard, and verify schema/signature in the popup. The payload download link is shown if existence is validated.

## Verification Instructions
- Download the payload from the Drive link in the Codex entry (only if existence is validated)
- Compute SHA-256 hash and compare to integrity_proof
- Confirm anchor file exists and matches metadata
- Validate ES256 signature using the JWK in kid
- Use provided verification script or tool for automated checks

## Roadmap & Hackathon Readiness

All major improvements for a robust, user-friendly release are now implemented:
- Binary file upload support
- Reliable Google auth token persistence
- Improved error handling and UI feedback
- Consistent workflow and file references
- Download link for payload files
- Enhanced schema validation and export polish

**Current Status:**
- Core features are complete and validated
- UI/UX polish, error handling, and documentation expansion are in progress
- Ready for hackathon/demo/production submission after final polish

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

## Current Build Status (as of 2025-10-14)

## Current Build Status (as of 2025-10-24)
- Protocol core, AI metadata integration, and Google anchor integration are complete and working.
- Binary file upload, Google Drive integration, and payload existence validation are robust and validated.
- Schema validation and export polish are implemented and working in the popup.
- UI/UX feedback, stepper status, and error handling are robust and incremental.
- Unit testing for protocol, AI, validation, anchor logic, and payload existence is implemented.

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

Refer to DEVELOPMENT-PLAN.md and AGENTS.md for current gaps, team assignments, and next steps.

For more help, see `docs/AGENTS.md` for a full action plan and debugging checklist.