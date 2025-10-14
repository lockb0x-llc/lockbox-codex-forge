
🚀 Build Plan — Codex Forge Extension Implementation Sprint

## Current Status (as of 2025-10-14)

**Step 1: Core Protocol Foundation (mock signing + mock anchor)**
✅ Complete — Protocol logic, mock anchor, and signing are implemented and working.

**Step 2: Chrome AI Metadata Generation**
✅ Complete — AI summarization and process tagging are integrated and functional.

**Step 3: Google Anchor Adapters (optional)**
🟡 In Progress — Google anchor adapter is stubbed; authentication and anchor creation logic are scaffolded. UI supports anchor selection and Google sign-in. UI feedback and error handling are implemented. Next step: integrate real Google API calls for anchor creation.

**Step 4: Schema Validation + Export Polish**
✅ Complete — Schema validation and export polish are implemented. Validation runs before export and feedback is shown in the popup UI.

For troubleshooting, feature details, and user guidance, see [README.md](../README.md).

---

We’ll use a “ship in slices” approach:
  1. Core protocol foundation (mock signing + mock anchor)
  2. Chrome AI metadata generation
  3. Google anchor adapters (optional)
  4. Schema validation + export polish

Each step is incrementally functional, so you can test and demo at any checkpoint. Unit tests for protocol, AI, and validation modules are present.

⸻

🧱 Step 1: Core Protocol Engine

Target files:
	•	lib/protocol.js
	•	background.js
	•	popup/popup.js
	•	popup/popup.html

We’ll start with Mock Anchor + Local Signing only, keeping all Google anchors commented or stubbed for now.

⸻

✅ Step 1 Deliverables

/lib/protocol.js

Implements:
	•	UUID generation
	•	SHA-256 hashing
	•	ni-URI encoding
	•	Canonicalization (RFC 8785 minimal)
	•	Local WebCrypto signing
	•	Mock anchor provider

// lib/protocol.js
export function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)
  );
}

export async function sha256(bytes) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(buf);
}

const b64u = bytes =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

export function niSha256(hashBytes) {
  return `ni:///sha-256;${b64u(hashBytes)}`;
}

export function jcsStringify(obj) {
  const sort = v =>
    (v && typeof v === "object" && !Array.isArray(v))
      ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]))
      : Array.isArray(v) ? v.map(sort) : v;
  return JSON.stringify(sort(obj));
}

export async function signEntryCanonical(canonical) {
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign","verify"]
  );
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key.privateKey,
    new TextEncoder().encode(canonical)
  );
  const signature = b64u(new Uint8Array(sigBuf));
  const jwk = await crypto.subtle.exportKey("jwk", key.publicKey);
  const kid = `jwk:${b64u(new TextEncoder().encode(JSON.stringify(jwk)))}`;
  return { alg: "ES256", kid, signature };
}

export async function anchorMock(entry) {
  const seed = new TextEncoder().encode(entry.id + (entry.storage?.integrity_proof || ""));
  const h = await sha256(seed);
  return { chain: "mock:local", tx: b64u(h), hash_alg: "sha-256" };
}


⸻

/background.js

Handles file processing → hashing → canonicalization → signing → AI summary (placeholder for now).

import { uuidv4, sha256, niSha256, jcsStringify, signEntryCanonical, anchorMock } from "./lib/protocol.js";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "CREATE_CODEX_FROM_FILE") {
      const { bytes, filename } = msg.payload;
      const fileBytes = new Uint8Array(bytes);
      const hash = await sha256(fileBytes);
      const integrity = niSha256(hash);

      const entry = {
        id: uuidv4(),
        version: "0.0.2",
        storage: {
          protocol: "local",
          location: filename,
          integrity_proof: integrity
        },
        identity: {
          org: "Codex Forge",
          process: "chrome-extension",
          artifact: filename,
          subject: "Placeholder summary (AI integration coming next)"
        },
        anchor: await anchorMock({ id: uuidv4(), storage: { integrity_proof: integrity } }),
        signatures: []
      };

      const canonical = jcsStringify(entry);
      const sig = await signEntryCanonical(canonical);
      entry.signatures.push(sig);

      sendResponse({ ok: true, entry });
    }
  })();
  return true;
});


⸻

/popup/popup.js

Manages UI actions and communicates with the background worker.

const els = {
  file: document.getElementById("fileInput"),
  gen: document.getElementById("generateBtn"),
  json: document.getElementById("jsonResult"),
  status: document.getElementById("status"),
  dl: document.getElementById("downloadBtn"),
  copy: document.getElementById("copyBtn")
};

els.gen.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!els.file.files[0]) return els.status.textContent = "Choose a file first.";

  const file = els.file.files[0];
  const bytes = new Uint8Array(await file.arrayBuffer());

  els.status.textContent = "Generating Codex Entry…";

  const res = await chrome.runtime.sendMessage({
    type: "CREATE_CODEX_FROM_FILE",
    payload: { bytes: [...bytes], filename: file.name }
  });

  if (!res?.ok) return els.status.textContent = "Generation failed.";

  els.json.textContent = JSON.stringify(res.entry, null, 2);
  els.status.textContent = "Entry created successfully ✅";
  els.dl.style.display = els.copy.style.display = "inline-block";

  els.dl.onclick = () => {
    const blob = new Blob([JSON.stringify(res.entry, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename: `${res.entry.id}.codex.json` });
  };
  els.copy.onclick = async () => {
    await navigator.clipboard.writeText(JSON.stringify(res.entry, null, 2));
    els.status.textContent = "Copied to clipboard!";
  };
});


⸻

/popup/popup.html

Minimal functional UI scaffold:

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Codex Forge</title>
  <style>
    body { font-family: sans-serif; width: 320px; padding: 1em; }
    pre { background: #111; color: #0f0; padding: 8px; height: 160px; overflow: auto; font-size: 11px; }
    button { margin-top: 8px; }
    #downloadBtn, #copyBtn { display: none; margin-right: 4px; }
  </style>
</head>
<body>
  <h3>Lockb0x Codex Forge</h3>
  <input type="file" id="fileInput" /><br>
  <button id="generateBtn">Generate Codex Entry</button>
  <div id="status"></div>
  <pre id="jsonResult"></pre>
  <button id="downloadBtn">Download JSON</button>
  <button id="copyBtn">Copy JSON</button>
</body>
<script src="popup.js"></script>
</html>


⸻

✅ After Step 1
	•	You’ll have a working Chrome extension that:
	•	Creates valid Lockb0x v0.0.2 JSON entries
	•	Generates ni:///sha-256;... hashes
	•	Signs canonically with WebCrypto
	•	Outputs a mock anchor reference
	•	Exports or copies JSON

That’s a self-contained demo already fit for hackathon submission — and a perfect foundation to layer Chrome AI and Google Anchors.

⸻

🧠 Next Step Preview

When you confirm you’ve tested Step 1 successfully, we’ll move to:

Step 2: AI Integration
	•	Implement Chrome built-in AI summarization (chrome.ai.summarizer / chrome.ai.prompt).
	•	Replace placeholder subject text with actual generated summaries.
	•	Add a visual “AI Summary” block in popup UI.
	•	Keep everything running client-side, no external services.
