
# AGENTS.md — Code Review & Action Plan for Lockb0x Codex Forge

## Status Summary (Updated 2025-11-01)

- See [README.md](../README.md) for current features, troubleshooting, and user guidance.
- See [ZIP-ARCHIVE.md](./ZIP-ARCHIVE.md) for zip archive workflow and implementation details.
- See [DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md) for architecture, phased breakdown, and build status.

### What's Working ✓

- **Lockb0x Protocol Core:** UUID generation, SHA-256 hashing, ni-URI encoding, JSON canonicalization (RFC 8785), ES256 signing
- **Google Drive Integration:** Payload storage, anchor creation, authentication, token persistence, existence validation
- **Mock Anchor Flow:** Local/offline anchor generation for testing
- **Codex Entry Workflow:** Complete pipeline from upload to export with schema validation
- **UI/UX:** Stepper feedback, error handling, recovery instructions, export/download features

### What's Not Implemented ✗

**Zip Archive Workflow:** Implementation in progress; this is the top priority for the next release and required before marketplace publication.
- **Testing Infrastructure:**
  - Test files exist but no test runner script in package.json
  - Cannot run `npm test` without configuration
- **Code Quality:**
  - Multiple linting warnings (unused variables)
  - Need cleanup and documentation improvements

### Next Actions

1. **Zip Archive Implementation (TOP PRIORITY):**
   - Complete and validate the zip archive workflow (see ZIP-ARCHIVE.md)
   - Integrate zip archive creation into extension operations
   - Update all documentation and user guidance to reflect this workflow

2. **Testing Infrastructure:**
   - Add test runner script to package.json
   - Configure test framework (vitest config exists)
   - Run existing tests and fix any failures

3. **Code Quality:**
   - Fix all linting warnings
   - Remove unused variables and imports
   - Add JSDoc comments for public APIs

4. **Future Enhancements:**
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





