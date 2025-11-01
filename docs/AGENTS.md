
# AGENTS.md — Code Review & Action Plan for Lockb0x Codex Forge

## Status Summary (Updated 2025-11-01)

- See [README.md](../README.md) for current features, troubleshooting, and user guidance.
- See [DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md) for architecture, phased breakdown, and build status.

### What's Working ✓

- **Lockb0x Protocol Core:** UUID generation, SHA-256 hashing, ni-URI encoding, JSON canonicalization (RFC 8785), ES256 signing
- **Google Drive Integration:** Payload storage, anchor creation, authentication, token persistence, existence validation
- **Mock Anchor Flow:** Local/offline anchor generation for testing
- **Codex Entry Workflow:** Complete pipeline from upload to export with schema validation
- **UI/UX:** Stepper feedback, error handling, recovery instructions, export/download features

### What's Not Implemented ✗

- **Chrome Built-In AI Features:**
  - No integration with experimental `chrome.ai.summarizer` API
  - No integration with experimental `chrome.ai.prompt` API
  - All AI functions (`summarizeContent`, `generateProcessTag`, `generateCertificateSummary`) currently use text truncation fallbacks
  - Documentation incorrectly claimed AI features were implemented
- **Testing Infrastructure:**
  - Test files exist but no test runner script in package.json
  - Cannot run `npm test` without configuration
- **Code Quality:**
  - Multiple linting warnings (unused variables)
  - Need cleanup and documentation improvements

### Next Actions

1. **Documentation Cleanup (IN PROGRESS):**
   - ✓ Update README.md to reflect true AI implementation status
   - Update AGENTS.md (this file) with accurate status
   - Update DEVELOPMENT-PLAN.md with realistic roadmap
   - Update GoogleCloudAnchor.md

2. **Chrome AI Implementation Plan:**
   - Research current Chrome Built-In AI API status and availability
   - Determine correct API namespace and methods
   - Implement feature detection for AI capabilities
   - Create proper fallback chain: AI → text extraction → static defaults
   - Add error handling for browsers without AI support
   - Test on Chrome Canary/Dev channels with AI features enabled

3. **Testing Infrastructure:**
   - Add test runner script to package.json
   - Configure test framework (vitest config exists)
   - Run existing tests and fix any failures

4. **Code Quality:**
   - Fix all linting warnings
   - Remove unused variables and imports
   - Add JSDoc comments for public APIs

5. **Future Enhancements:**
   - UI/UX polish and accessibility improvements
   - Expanded error handling and user guidance
   - Video tutorials and demos
   - Production-grade deployment preparation

---

## Team Roles & Assignments

- **Project Lead:** Oversees development, documentation, roadmap, and strategy
- **AI Integration (PENDING):** Will implement Chrome Built-In AI when APIs are stable/available
- **Protocol Engineer:** Maintains protocol logic, anchor flows, and schema validation
- **UI/UX Designer:** Designs popup UI, stepper, and user flows; improves accessibility
- **Google Cloud Integration:** Maintains Google Drive API, authentication, and token persistence
- **QA & Testing:** Conducts user testing, maintains test infrastructure, collects feedback
- **Documentation:** Maintains README, contributor guides, troubleshooting docs

## Hackathon Deliverable Assignments

- File upload & payload storage: ✓ Complete (Protocol Engineer, UI/UX Designer)
- Error handling & UI feedback: ✓ Complete (UI/UX Designer, QA & Testing)
- Google auth token persistence: ✓ Complete (Google Cloud Integration)
- Workflow & reference consistency: ✓ Complete (Protocol Engineer)
- Schema validation & export polish: ✓ Complete (Protocol Engineer, QA & Testing)
- Documentation updates: **IN PROGRESS** (Documentation, Project Lead)
- Chrome AI integration: **NOT STARTED** (AI Integration - pending API availability)
- Test infrastructure: **PARTIAL** (QA & Testing - files exist, need runner config)
- Code quality cleanup: **PENDING** (All team members)

## Progress Tracking

See DEVELOPMENT-PLAN.md for unified checklist and milestone status. This document now reflects the true state of implementation as of 2025-11-01.

