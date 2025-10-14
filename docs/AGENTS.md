
# AGENTS.md — Code Review & Action Plan for Lockb0x Codex Forge

## Status Summary (as of 2025-10-14)

- See [README.md](../README.md) for current features, troubleshooting, and user guidance.
- See [DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md) for architecture, phased breakdown, and build status.

### Progress
- Protocol core and AI metadata integration are complete and working.
- Google anchor integration is in progress (adapter stubbed, UI/auth logic present; UI feedback and error handling improved).
- Schema validation and export polish are implemented and working in the popup.
- Unit testing for protocol, AI, and validation modules is implemented.

### Next Actions
- Complete Google anchor API integration for production use.
- Continue to polish UI and error feedback for anchor and AI flows.
- Expand unit tests for anchor and edge cases.

---

### 1. Manifest & Service Worker
- ✅ Manifest now declares background.js as a module (fixes registration error).
- ✅ All required permissions are present: "identity", "storage", "activeTab", "scripting", "contextMenus", "downloads".

### 2. Message Passing & Async Handling
- ✅ Message passing between popup and background is implemented.
- ✅ All async message listeners in background.js use `return true;` for proper callback handling.
- ✅ Robust error handling and logging for all message responses is implemented.

### 3. Google Authentication & Anchor Integration
- ✅ Chrome Identity API logic scaffolded in background.js.
- ✅ Google sign-in flow tested; UI and error feedback improved.
- ⚠️ Google anchor adapter is stubbed; needs real API integration for production.
- ✅ UI clearly indicates anchor type and authentication status.

### 4. AI Metadata Generation
- ✅ AI summarization and process tagging logic present (lib/ai.js).
- ⚠️ Ensure Chrome AI APIs are available and handle fallback gracefully.
- ⚠️ Add error feedback if AI APIs fail or are unavailable (UI and logging improved).

### 5. UI Feedback & Error Handling
- ✅ Status and error messages shown in popup.
- ✅ Console logging added for debugging.
- ✅ All user actions (file upload, sign-in, entry generation) provide clear feedback and error messages.

### 6. Permissions & Manifest Completeness
- ✅ Manifest includes all required permissions and host permissions, including "identity" for Google sign-in.

### 7. Schema Validation & Export Polish
- ✅ Lockb0x v0.0.2 schema validation is implemented and runs before export; feedback is shown in popup.
- ✅ Exported JSON is canonical and signed.

### 8. Unit Testing & Modularity
- ✅ Protocol and AI logic are modularized, and unit tests for protocol, AI, and validation modules are present.
- ⚠️ Expand unit tests for anchor and edge cases.

---

## Action Plan for AI Agents & Contributors

1. **Permissions:**
   - Add and verify all required permissions in manifest.json.
2. **Async Handling:**
   - Ensure all async message listeners use `return true;`.
   - Add error handling and logging for all message responses.
3. **Google Integration:**
   - Test and polish Google sign-in flow.
   - Implement real Google anchor API integration.
   - Improve UI for anchor selection and authentication status.
4. **AI Metadata:**
   - Test Chrome AI API calls and handle errors/fallbacks.
   - Provide user feedback for AI failures.
5. **UI Feedback:**
   - Ensure all actions provide clear status and error messages.
6. **Schema Validation:**
   - Implement Lockb0x schema validation before export.
   - Display validation results in popup.
7. **Testing:**
   - Add unit tests for protocol, anchor, and AI logic.
8. **Documentation:**
   - Update README and docs with troubleshooting, usage, and contribution guidelines.

---

This file is for all AI agents and contributors to track, fix, and improve the extension for hackathon and production readiness.
