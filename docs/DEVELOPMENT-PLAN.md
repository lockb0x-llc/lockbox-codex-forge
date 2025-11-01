
# Lockb0x Codex Forge — Development Plan

## Project Goal

Create a Chrome Extension (Manifest V3) for secure, verifiable Codex Entries from web content or user-uploaded files, leveraging Chrome's built-in AI for automated metadata generation and supporting both mock and Google anchor flows.

## Current Status & Milestones

### Major Features (Complete)

- Binary file upload support for all payloads (text, PDF, JSON, binary)
- Google authentication and Drive integration: user can sign in, upload payloads, and validate existence
- Codex entry generation: hashes, canonicalizes, signs, anchors, and validates entries
- Robust schema validation and export polish: validation runs before export, feedback shown in popup
- Download and copy Codex entry as JSON from popup UI
- Reliable Google auth token persistence in chrome.storage
- UI feedback for all workflow steps, including incremental stepper and error messages
- Payload existence validation in Drive before export, with download link shown if validated

### In Progress / Next Steps

- UI/UX polish: improve layout, accessibility, and feedback clarity
- Error handling: further refine messages and recovery instructions for all user actions
- Documentation: expand contributor guides, troubleshooting, and verification instructions
- Finalize for hackathon/demo/production submission

## Roadmap & Remaining Gaps

1. **UI/UX Polish**
   - Refine popup layout, stepper visuals, and feedback clarity
   - Improve accessibility and user guidance
2. **Error Handling Enhancements**
   - Ensure all error states provide actionable recovery instructions
   - Test and document edge cases (auth failures, upload errors, schema issues)
3. **Documentation & Contributor Guide**
   - Update README, AGENTS.md, and GoogleCloudAnchor.md with latest features, troubleshooting, and usage
   - Add verification instructions and sample scripts for users
4. **Production-Grade Google Anchor Integration**
   - Ensure Drive API calls are robust and production-ready
   - Document and test token refresh, error states, and user feedback

## Unified Implementation Checklist

- [x] File upload & payload storage improvements
- [x] Google auth token persistence
- [x] Codex entry generation, schema validation, and export polish
- [x] Payload existence validation and download link
- [ ] UI/UX polish and accessibility
- [ ] Error handling enhancements
- [ ] Expanded documentation and contributor guides
- [ ] Final QA and hackathon/demo submission

## Technical Milestones

- Manifest V3 setup with all required permissions
- Protocol core: UUID, SHA-256, ni-URI, canonicalization, signing
- Mock anchor and Google anchor selection (Google Drive integration complete)
- Chrome AI metadata generation (summarization, process tag, certificate summary)
- Schema validation before export, with feedback in popup
- Robust error handling and UI feedback for all user actions

## Team Assignments

See AGENTS.md for current roles and responsibilities. Assign each deliverable to a specific agent or contributor. Update roles as new features and polish are added.

## Progress Tracking

Update this checklist and milestone status regularly to ensure alignment and readiness for hackathon submission.

---

Lockb0x Codex Forge is now functionally complete for core features. The final milestone is production-grade polish, comprehensive testing, and documentation for a robust, user-friendly release.

## Technical Milestones

- Manifest V3 setup with all required permissions
- Protocol core: UUID, SHA-256, ni-URI, canonicalization, signing
- Mock anchor and Google anchor selection (Google Drive integration complete)
- Chrome AI metadata generation (summarization, process tag, certificate summary)
- Schema validation before export, with feedback in popup
- Robust error handling and UI feedback for all user actions
- Unit tests for protocol, AI, validation, anchor, and payload modules

## Team Assignments

See AGENTS.md for current roles and responsibilities. Assign each deliverable to a specific agent or contributor. Update roles as new features and polish are added.

## Progress Tracking

Update this checklist and milestone status regularly to ensure alignment and readiness for hackathon submission.

---

Lockb0x Codex Forge is now functionally complete for core features. The final milestone is production-grade polish, comprehensive testing, and documentation for a robust, user-friendly release.
