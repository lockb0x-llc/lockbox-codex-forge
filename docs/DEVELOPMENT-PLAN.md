
# Lockb0x Codex Forge — Development Plan

## Project Goal

Create a Chrome Extension (Manifest V3) for secure, verifiable Codex Entries from web content or user-uploaded files, implementing the lockb0x protocol with robust hashing, signing, and anchoring capabilities, supporting both mock and Google Drive anchor flows.

**Original Vision:** Leverage Chrome's Built-In AI for automated metadata generation.

**Current Reality:** Chrome Built-In AI features are referenced but not yet implemented. The extension uses text extraction fallbacks instead.

## Current Status & Milestones (Updated 2025-11-01)

### Completed Features ✓

- **Lockb0x Protocol Core:**
  - UUIDv4 generation (RFC 9562)
  - SHA-256 hashing for content integrity
  - ni-URI encoding (RFC 6920)
  - JSON canonicalization (RFC 8785)
  - ES256 signing with WebCrypto API
  - Schema validation (codex entry v0.0.2)

- **Storage & Anchoring:**
  - Binary file upload support (all file types: text, PDF, JSON, binary, etc.)
  - Google Drive integration (authentication, upload, existence validation)
  - Mock anchor flow (local/offline testing)
  - Google anchor flow (Drive-based anchoring)
  - Payload existence validation before export

- **UI/UX:**
  - Popup interface with file upload and page extraction
  - Incremental stepper feedback (7 steps + error state)
  - Error handling with recovery instructions
  - Export as JSON (download and clipboard copy)
  - Payload download links (for validated Drive files)

- **Security & Validation:**
  - Schema validation before export
  - OAuth2 integration with Google (secure token storage)
  - Signature generation and verification structure

### Not Implemented ✗

- **Chrome Built-In AI Integration:**
  - Current status: References exist in code, but NOT connected to real Chrome AI APIs
  - `lib/ai.js` has conditional checks for `chrome.ai.summarizer` and `chrome.ai.prompt`
  - These APIs are either experimental or don't exist in the expected namespace
  - All AI functions fall back to simple text operations:
    - `summarizeContent()`: Returns first 100 characters with "AI Summary" prefix
    - `generateProcessTag()`: Returns static tags based on content length
    - `generateCertificateSummary()`: Returns template string with entry ID
  - **No actual AI summarization or generation is happening**

- **Test Infrastructure:**
  - Test files exist (*.test.js) for multiple modules
  - No test runner script in package.json
  - Cannot execute `npm test`
  - vitest.config.js exists but not integrated

- **Code Quality:**
  - Multiple linting warnings (19 warnings: unused variables, unused imports)
  - Missing JSDoc comments on many functions
  - Inconsistent error handling patterns

### In Progress / Next Steps

1. **Documentation Updates:** ✓ IN PROGRESS
   - Updating README.md to reflect true AI status
   - Updating AGENTS.md with accurate implementation details
   - Updating this file (DEVELOPMENT-PLAN.md)
   - Updating GoogleCloudAnchor.md

2. **Chrome AI Implementation Plan:**
   - Research: Identify correct Chrome Built-In AI API status
   - Investigate: Chrome Canary/Dev channel AI capabilities
   - Determine: Actual API namespace and methods (may be `chrome.aiOriginTrial.*` or similar)
   - Implement: Feature detection for AI availability
   - Create: Proper fallback chain (AI → extraction → static)
   - Test: On browsers with and without AI features
   - Document: Browser requirements and AI feature availability

3. **Testing Infrastructure:**
   - Add `"test": "vitest"` to package.json scripts
   - Run existing tests and document results
   - Fix any failing tests
   - Expand test coverage as needed

4. **Code Quality Improvements:**
   - Fix all 19 linting warnings
   - Remove unused variables and imports
   - Add JSDoc comments for public APIs
   - Standardize error handling

## Roadmap & Remaining Gaps

### Phase 1: Documentation & Transparency (Current)
- ✓ Audit codebase for true implementation status
- **IN PROGRESS:** Update all documentation to reflect reality
- Document gaps and create implementation plan

### Phase 2: Code Quality & Testing
- Fix linting warnings
- Configure test runner
- Run and validate existing tests
- Improve error handling consistency
- Add JSDoc documentation

### Phase 3: Chrome AI Research & Planning
- Research Chrome Built-In AI APIs (current status, availability, namespace)
- Test on Chrome Canary/Dev with AI features enabled
- Create proof-of-concept for actual AI integration
- Document browser requirements and feature detection

### Phase 4: Chrome AI Implementation
- Implement real Chrome AI API integration
- Replace fallback implementations with actual AI calls
- Maintain fallback chain for browsers without AI
- Add user messaging about AI feature availability
- Test across browser versions

### Phase 5: Production Polish
- UI/UX refinements and accessibility
- Performance optimization
- Security audit
- Expanded documentation and tutorials
- Demo video and assets

## Unified Implementation Checklist

### Core Features (Complete ✓)
- [x] File upload & payload storage improvements
- [x] Google auth token persistence
- [x] Codex entry generation, schema validation, and export
- [x] Payload existence validation and download link
- [x] Binary file support for all types
- [x] Mock and Google anchor flows
- [x] ES256 signing with WebCrypto
- [x] ni-URI encoding and integrity proofs

### Documentation (In Progress)
- [x] README.md accuracy update
- [x] AGENTS.md status correction
- [x] DEVELOPMENT-PLAN.md roadmap revision
- [ ] GoogleCloudAnchor.md review
- [ ] Add CHROME-AI-IMPLEMENTATION.md (implementation plan)

### Code Quality (Pending)
- [ ] Fix linting warnings (19 items)
- [ ] Add test runner to package.json
- [ ] Run existing tests
- [ ] Add JSDoc comments
- [ ] Standardize error handling

### Chrome AI Integration (Not Started)
- [ ] Research actual Chrome AI API
- [ ] Create feature detection
- [ ] Implement real AI summarization
- [ ] Implement real AI prompt generation
- [ ] Test fallback chain
- [ ] Document browser requirements

### Future Enhancements
- [ ] UI/UX polish and accessibility
- [ ] Error handling enhancements
- [ ] Expanded documentation and contributor guides
- [ ] Video tutorials and demos
- [ ] Final QA and production readiness

## Technical Milestones

### Completed ✓
- Manifest V3 setup with all required permissions
- Protocol core: UUID, SHA-256, ni-URI, canonicalization, signing
- Mock anchor and Google anchor selection
- Google Drive integration (upload, auth, validation)
- Schema validation before export, with feedback in popup
- Robust error handling and UI feedback for user actions
- Binary file upload support

### Pending ✗
- Actual Chrome AI API integration (currently using fallbacks only)
- Test runner configuration and execution
- Code quality improvements (linting, documentation)

## Team Assignments

See AGENTS.md for current roles and responsibilities. Key updates:
- **AI Integration role** is now marked as PENDING (not complete)
- **Documentation role** is actively updating all docs for accuracy
- **QA & Testing role** needs to configure test runner

## Progress Tracking

**This document now reflects the true state of the project as of 2025-11-01.**

Key takeaway: The lockb0x protocol implementation is solid and working. Chrome AI integration was planned but not implemented—all AI functions use simple fallback logic rather than actual AI APIs.

---

Lockb0x Codex Forge has a strong foundation in protocol implementation and Google Drive integration. The next major milestone is implementing actual Chrome Built-In AI integration to replace the current fallback implementations.

