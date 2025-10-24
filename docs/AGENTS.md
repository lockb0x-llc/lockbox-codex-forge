# AGENTS.md — Code Review & Action Plan for Lockb0x Codex Forge

## Status Summary (as of 2025-10-20)
- See [README.md](../README.md) for current features, troubleshooting, and user guidance.
- See [DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md) for architecture, phased breakdown, and build status.

### Progress
- Protocol core and AI metadata integration are complete and working.
- Google anchor integration is complete: payloads are now saved to the authenticated user's Google Drive account, and existence is validated before export.
- Binary file upload support and robust payload storage are implemented.
- Codex entry can be downloaded as a JSON file from the popup UI.
- Schema validation and export polish are implemented and working in the popup.
- Unit testing for protocol, AI, and validation modules is implemented.

### Next Actions
- Continue improving error handling and UI feedback for all user actions. (in progress)
- Expand documentation and contributor guides as new features are added.

---

## Team Roles & Assignments (2025-10-20)
- Project Lead: Oversees development, documentation, and hackathon strategy
- AI Integration: Implements Chrome AI APIs and metadata generation
- Protocol Engineer: Develops and tests Lockb0x protocol logic
- UI/UX Designer: Designs popup and user flows, improves error feedback
- Google Cloud Integration: Handles Google anchor API, authentication, and token persistence
- QA & Testing: Conducts user testing, feedback collection, and unit test expansion
- Documentation: Updates README, guides, and verification instructions

## Hackathon Deliverable Assignments
- File upload & payload storage: Protocol Engineer, UI/UX Designer
- Error handling & UI feedback: UI/UX Designer, QA & Testing
- Google auth token persistence: Google Cloud Integration
- Workflow & reference consistency: Protocol Engineer
- Schema validation & export polish: Protocol Engineer, QA & Testing
- Testing & QA for new features: QA & Testing
- Documentation & contributor guide updates: Documentation, Project Lead
- README overhaul: Project Lead
- Demo assets: UI/UX Designer
- User feedback/testing summary: QA & Testing
- Competitive analysis: Project Lead
- Roadmap: Protocol Engineer
- Submission checklist: Project Lead

## Progress Tracking
See DEVELOPMENT-PLAN.md for unified checklist and milestone status. Update roles and assignments as needed for hackathon readiness.
