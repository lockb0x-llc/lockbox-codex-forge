
# Lockb0x Codex Forge — Development Plan

## Project Goal

Create a Chrome Extension (Manifest V3) for secure, verifiable Codex Entries from web content or user-uploaded files, implementing the lockb0x protocol with robust hashing, signing, and anchoring capabilities, supporting both mock and Google Drive anchor flows.


## Current Status & Milestones (Updated 2025-11-01)

### Completed Features ✓
- **Lockb0x Protocol Core:**
  - UUIDv4 generation (RFC 9562)
  - SHA-256 hashing for content integrity
  - ni-URI encoding (RFC 6920)
  - JSON canonicalization (RFC 8785)
  - ES256 signing with WebCrypto API
  - Schema validation (codex entry v0.0.2)
  - Dual signature workflow (before and after zip upload)

- **Zip Archive Workflow:**
  - Encrypted zip archive creation with AES-256
  - No compression (STORE mode) for integrity preservation
  - Archive-level comment with full codex entry
  - Exclusion of storage.location, anchor.tx, anchor.url from zip's codex-entry.json
  - Password-based encryption (Google email or 'mock')
  - Upload to Google Drive
  - Dual signature appending after zip upload

- **Storage & Anchoring:**
  - Binary file upload support (all file types: text, PDF, JSON, binary, etc.)
  - Google Drive integration (authentication, upload, existence validation)
  - Mock anchor flow (local/offline testing)
  - Google anchor flow (Drive-based anchoring)
  - Zip archive existence validation before export

- **UI/UX:**
  - Popup interface with file upload and page extraction
  - Incremental stepper feedback (7 steps + error state)
  - Error handling with recovery instructions
  - Export as JSON (download and clipboard copy)
  - Zip archive download (local and from Drive)
  - Download Zip Archive button in popup

- **Security & Validation:**
  - Schema validation before export
  - OAuth2 integration with Google (secure token storage)
  - Dual signature generation and verification structure
  - AES-256 encrypted zip archives


### Not Implemented ✗

- **Chrome Built-In AI:** Chrome AI APIs are still experimental and not widely available. Currently using fallback text extraction for metadata generation.


### In Progress / Next Steps

1. **Testing Infrastructure:**
   - Verify test runner script to package.json
   - Run existing tests and document results
   - Fix any failing tests unrelated to zip archive feature
   - Expand test coverage as needed

2. **Code Quality Improvements:**
   - Remove unused variables and imports
   - Add JSDoc comments for public APIs
   - Standardize error handling

3. **Final Polish for Marketplace:**
   - Performance optimization
   - Security audit
   - Expanded documentation and tutorials
   - Demo video and assets

## Roadmap & Remaining Gaps

### Phase 1: Zip Archive Implementation (COMPLETE ✓)
- ✓ Complete zip archive workflow and validate integration
- ✓ Update extension operations to use zip archive for payload and codex entry packaging
- ✓ Update all documentation and user guidance to reflect zip archive workflow
- ✓ Implement dual signature workflow
- ✓ Add encryption support with user email or 'mock' password

### Phase 2: Code Quality & Testing (Current)
- Run and validate existing tests
- Improve error handling consistency
- Add JSDoc documentation as needed

### Phase 3: Production Polish (Next)
- Performance optimization
- Security audit
- Expanded documentation and tutorials
- Demo video and assets
- Marketplace submission

## Unified Implementation Checklist

### Core Features (Complete ✓)
- [x] File upload & payload storage improvements
- [x] Google auth token persistence
- [x] Codex entry generation, schema validation, and export
- [x] Zip archive creation with encryption
- [x] Dual signature workflow (before and after zip upload)
- [x] Zip archive upload to Google Drive
- [x] Zip archive existence validation and download link
- [x] Binary file support for all types
- [x] Mock and Google anchor flows
- [x] ES256 signing with WebCrypto
- [x] ni-URI encoding and integrity proofs

### Documentation (Complete ✓)
- [x] README.md accuracy update
- [x] AGENTS.md status correction
- [x] DEVELOPMENT-PLAN.md roadmap revision
- [x] ZIP-ARCHIVE.md workflow documentation

### Code Quality (In Progress)
- [x] Add test runner to package.json
- [x] Run existing tests
- [ ] Add JSDoc comments
- [ ] Standardize error handling


## Technical Milestones

### Completed ✓
- Manifest V3 setup with all required permissions
- Protocol core: UUID, SHA-256, ni-URI, canonicalization, signing
- Mock anchor and Google anchor selection
- Google Drive integration (upload, auth, validation)
- Schema validation before export, with feedback in popup
- Robust error handling and UI feedback for user actions
- Binary file upload support
- **Zip Archive Workflow:** Complete implementation with encryption, dual signatures, and Drive integration

### Pending ✗
- None - all core features are implemented and working

## Team Assignments

See AGENTS.md for current roles and responsibilities. Key updates:
- **Zip Archive Implementation role** is now marked as TOP PRIORITY
- **Documentation role** is actively updating all docs for accuracy
- **QA & Testing role** needs to configure test runner

## Progress Tracking

**This document now reflects the complete state of the project as of implementation date.**

Key takeaway: The lockb0x protocol implementation is solid and working. The Zip Archive workflow is fully implemented with encryption, dual signatures, and Google Drive integration. The extension is ready for final testing and marketplace submission.

---

Lockb0x Codex Forge has a strong foundation in protocol implementation, zip archive workflow, and Google Drive integration. The next major milestone is final polish and marketplace publication.

