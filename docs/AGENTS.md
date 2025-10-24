# AGENTS.md — Code Review & Action Plan for Lockb0x Codex Forge

## Status Summary (as of 2025-10-24)
- See [README.md](../README.md) for current features, troubleshooting, and user guidance.
- See [DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md) for architecture, phased breakdown, and build status.

### Progress
- Core protocol, AI metadata, and Google anchor integration are complete and working.
- Binary file upload and robust payload storage (Google Drive) are implemented and validated.
- Codex entry generation, schema validation, and export polish are fully functional in the popup UI.
- Reliable Google auth token persistence and payload existence validation are implemented.
- UI feedback, stepper status, and error handling are robust, with incremental updates and recovery instructions.
- Unit testing for protocol, AI, validation, anchor logic, and payload existence is in place.

### Next Actions
- UI/UX polish: improve layout, accessibility, and feedback clarity
- Error handling: refine messages and recovery instructions for all user actions
- Documentation: expand contributor guides, troubleshooting, and verification instructions
- Edge case and anchor testing: expand unit tests for Google anchor and payload validation
- Finalize for hackathon/demo/production submission

---

## Team Roles & Assignments (2025-10-24)
- **Project Lead:** Oversees development, documentation, roadmap, and hackathon strategy
- **AI Integration:** Implements and tests Chrome AI APIs, metadata generation, and fallback logic
- **Protocol Engineer:** Develops and tests Lockb0x protocol logic, anchor flows, and schema validation
- **UI/UX Designer:** Designs popup UI, stepper, and user flows; improves accessibility and error feedback
- **Google Cloud Integration:** Handles Google anchor API, Drive integration, authentication, and token persistence
- **QA & Testing:** Conducts user testing, feedback collection, and expands unit/integration tests for all flows
- **Documentation:** Updates README, contributor guides, troubleshooting, and verification instructions

## Hackathon Deliverable Assignments
- File upload & payload storage: Protocol Engineer, UI/UX Designer
- Error handling & UI feedback: UI/UX Designer, QA & Testing
- Google auth token persistence: Google Cloud Integration
- Workflow & reference consistency: Protocol Engineer
- Schema validation & export polish: Protocol Engineer, QA & Testing
- Testing & QA for new features: QA & Testing
- Documentation & contributor guide updates: Documentation, Project Lead
- README overhaul: Project Lead, Documentation
- Demo assets: UI/UX Designer
- User feedback/testing summary: QA & Testing
- Competitive analysis: Project Lead
- Roadmap: Protocol Engineer, Project Lead
- Submission checklist: Project Lead
- UI/UX polish and accessibility: UI/UX Designer, QA & Testing
- Error handling enhancements: Protocol Engineer, UI/UX Designer, QA & Testing

## Progress Tracking
See DEVELOPMENT-PLAN.md for unified checklist and milestone status. Update roles and assignments as needed for hackathon readiness and future releases.
