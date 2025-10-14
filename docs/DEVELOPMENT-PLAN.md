
# 🚀 Codex Forge: AI-Assisted Lockb0x Entry Creator

**Project Goal:** A Chrome Extension (Manifest V3) that streamlines the creation of valid Lockb0x Codex Entries (v0.0.2) from web content or user-uploaded files, using Chrome's built-in AI for automated metadata generation.

## Build Status (as of 2025-10-14)

- **Protocol Core (mock anchor, signing):** ✅ Complete
- **AI Metadata Integration:** ✅ Complete
- **Google Anchor Integration:** 🟡 In Progress (adapter stubbed, UI and auth logic present)
- **Schema Validation & Export Polish:** 🟡 Planned
- **Unit Testing:** 🟡 Planned

For troubleshooting, feature details, and user/contributor guidance, see [README.md](../README.md).

## 1\. Architecture and Components (Manifest V3)

The application follows the Manifest V3 architecture, isolating concerns into three main scripts.

| Component | File Path | Role | Key Interactions |
| :--- | :--- | :--- | :--- |
| **Manifest** | `manifest.json` | Configuration and Permissions. | Declares Service Worker, Popup, Permissions (`storage`, `activeTab`, `scripting`), and `host_permissions`. |
| **Service Worker** | `background.js` | **Protocol Engine / Core Logic.** | Computes hashes, handles canonicalization, generates UUIDs, and manages the Lockb0x JSON structure. Listens for messages from the Popup. |
| **Popup UI** | `popup/popup.html`, `popup/popup.js` | **User Interface / Controller.** | Captures user input (e.g., file upload, anchor selection), initiates all background tasks, and displays results (JSON/Certificate). |
| **Content Script** | (Injected via `scripting` API) | **Page Interaction / Data Capture.** | Injected into the current page to extract text/content for hashing and AI summarization. |

-----

## 2\. Core Protocol Libraries & Dependencies

Since we are running in the Service Worker and Browser environment, dependencies must be compatible with Node.js/Browser/ES Module environments.

| Dependency (Simulated) | Purpose | Location of Use |
| :--- | :--- | :--- |
| **UUID Generator** | Generates the `id` (UUIDv4) field. | `background.js` (Service Worker) |
| **SHA-256 Hashing Utility** | Computes the integrity proof hash. | `background.js` (Service Worker) |
| **RFC 8785 Canonicalizer** | Enforces JSON Canonicalization Scheme (JCS) before signing. | `background.js` (Service Worker) |
| **Web Crypto API** | Used for SHA-256 hashing and optional ECDSA/Ed25519 signing. | `background.js` (Service Worker) |
| **Lockb0x Schema Validator** | Checks the final JSON structure against v0.0.2 spec. | `background.js` / `popup.js` |

-----

## 3\. Implementation Plan: Feature Breakdown

### Phase 1: Foundation and Protocol Core (Service Worker)

The Service Worker (`background.js`) contains all the heavy, non-UI protocol logic.

| ID | Task | Details |
| :--- | :--- | :--- |
| **P1.1** | **Service Worker Setup** | Initialize the `background.js` Service Worker. Set up listener for `chrome.runtime.onMessage`. |
| **P1.2** | **UUID Generation** | Implement a function to generate and return a UUIDv4 for the `id` field. |
| **P1.3** | **SHA-256 Hashing** | Implement a function using **Web Crypto** to compute SHA-256 over raw file bytes or captured text. |
| **P1.4** | **NI-URI Encoding** | Transform the raw hash bytes into the **RFC 6920 `ni:///sha-256;...`** format for `storage.integrity_proof`. |
| **P1.5** | **Canonicalization (JCS)** | Implement the **RFC 8785** JSON Canonicalization function. This must be applied to the entry *before* the signature is computed. |
| **P1.6** | **Core Entry Assembly** | Create the main function (`createCodexEntry(data, metadata)`) that populates all non-AI, fixed fields: `version: "0.0.2"`, `storage.integrity_proof`, and a mock `anchor` stub. |

-----


### Phase 2: Chrome AI Integration and Metadata

This phase integrates Chrome's built-in AI APIs to populate the `identity` object and certificate summary.

| ID | Task | Chrome API | Lockb0x Field |
| :--- | :--- | :--- | :--- |
| **P2.1** | **Content Extraction** | `chrome.scripting.executeScript` | Collect all visible text from the `activeTab` or read uploaded file contents. |
| **P2.2** | **AI Subject Generation** | **`chrome.summarizer` / `Prompt API`** | Summarize the extracted content to fill **`identity.subject`** (human-readable description). **Flag this output as AI-generated.** |
| **P2.3** | **Process Tagging** | **`Prompt API` / `Writer API`** | Generate a concise tag (e.g., "AI-Summarized-Web-Page", "File-Upload-Hashed") for **`identity.process`**. |
| **P2.4** | **Anchor Selection** | N/A | Add UI and logic to select between mock and Google anchor. |
| **P2.5** | **Certificate Summary** | **`Prompt API`** | Pass the final JSON object to the Prompt API to generate the polished, natural-language "Certificate Summary" for the UX. |

-----

### Phase 3: Google Anchor Integration & Authentication

This phase enables real Google Anchor creation and Google authentication for users with Google accounts and Drive access.

| ID | Task | API/Component | Lockb0x Field |
| :--- | :--- | :--- | :--- |
| **P3.1** | **Google OAuth Authentication** | Chrome Identity API | Authenticate user with Google account. |
| **P3.2** | **Google Anchor Adapter** | Google Cloud Anchor API (or Drive API) | Generate anchor object using Google anchor data. |
| **P3.3** | **Anchor Selection UI** | Popup UI | Allow user to select anchor type (mock or Google). |
| **P3.4** | **Error Handling & Fallback** | All | Gracefully handle authentication or anchor creation errors. |
| **P3.5** | **Documentation & Flow** | Docs/README | Document Google flow and use-case for Lockb0x protocol. |

-----

### Iterative Implementation Plan

1. **Scaffold Google Anchor Adapter:**
    - Add stubbed function in `lib/protocol.js` for Google anchor creation.
    - Document expected input/output and error handling.

2. **Implement Google Authentication:**
    - Use Chrome Identity API to authenticate user and obtain Google OAuth token.
    - Store token securely for anchor creation.

3. **Integrate Google Anchor Creation:**
    - Use Google APIs to create and retrieve anchor data.
    - Update entry creation flow to use Google anchor when selected.

4. **Update UI for Anchor Selection:**
    - Add dropdown or toggle in popup UI for anchor type selection.
    - Display anchor details in generated entry.

5. **Test & Polish:**
    - Test end-to-end Google anchor flow.
    - Handle errors and provide user feedback.
    - Update documentation and README with Google flow instructions.

-----

### Phase 3: UI, Signing, and Export

This phase focuses on user interaction, cryptographic security, and final delivery.

| ID | Task | Details |
| :--- | :--- | :--- |
| **P3.1** | **UI Scaffolding** | Finalize `popup.html`/`popup.js`. Create the interface elements: File/Page selection, Anchor dropdown, JSON display area, and Certificate display area. |
| **P3.2** | **Local Signing Simulation** | Use **Web Crypto** to generate a local, ephemeral ECDSA keypair. Compute the signature over the **JCS-canonicalized** entry and populate the `signatures` array. |
| **P3.3** | **Dynamic JSON/Certificate Display** | Update the `popup.js` to receive the final JSON and AI Certificate Summary from the Service Worker and render them cleanly in the popup. |
| **P3.4** | **Validation Feedback** | Implement pre-export validation against the Lockb0x v0.0.2 schema patterns. Provide clear, supportive error messages if validation fails. |
| **P3.5** | **Export Functions** | Add buttons for "Download Entry" (outputting the `.codex.json` file) and "Copy to Clipboard" (copying the canonical JSON string). |

-----

## 4\. Required Manifest V3 Permissions

The following permissions are critical for the Lockb0x Forge to operate:

```json
"permissions": [
    "storage",          
    "activeTab",        
    "scripting",        
    "contextMenus"      
],
"host_permissions": [
    "<all_urls>"
],
"optional_permissions": [
    "downloads"         
]
```