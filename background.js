// Utility: Make Codex entry self-referential, re-sign, and update file on Drive
async function makeCodexEntrySelfReferential({ entry, codexFileId, token }) {
  // Update storage.location to point to the Codex entry's own Drive file
  const codexUrl = `https://drive.google.com/file/d/${codexFileId}`;
  entry.storage.location = codexUrl;
  // Remove old signatures and re-sign
  entry.signatures = [];
  await signCodexEntry(entry);
  // Update the file on Drive
  const json = JSON.stringify(entry, null, 2);
  const bytes = new TextEncoder().encode(json);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const metadata = {
    name: `${entry.id}.codex.json`,
    mimeType: 'application/json'
  };
  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    json +
    closeDelim;
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${codexFileId}?uploadType=multipart&fields=id,webViewLink`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Update] ${res.status}: ${err}`);
  }
  return await res.json(); // { id, webViewLink }
}
// Utility: Upload Codex entry JSON to Google Drive and return fileId and webViewLink
async function uploadCodexEntryToGoogleDrive({ entry, token }) {
  const json = JSON.stringify(entry, null, 2);
  const bytes = new TextEncoder().encode(json);
  return await uploadFileToGoogleDrive({
    bytes,
    filename: `${entry.id}.codex.json`,
    mimeType: 'application/json',
    token
  });
}
// Utility: Canonicalize and sign a Codex entry, appending the signature
async function signCodexEntry(entry) {
  const canonical = jcsStringify(entry);
  const sig = await signEntryCanonical(canonical);
  entry.signatures.push(sig);
  return entry;
}
// Utility: Build unsigned Codex entry with Google Drive payload info
function buildUnsignedCodexEntry({
  id,
  version = "0.0.2",
  payloadDriveId,
  payloadDriveUrl,
  integrity_proof,
  org = "Codex Forge",
  process,
  artifact,
  subject,
  anchor
}) {
  return {
    id,
    version,
    storage: {
      protocol: "gdrive",
      location: payloadDriveUrl || `https://drive.google.com/file/d/${payloadDriveId}`,
      integrity_proof
    },
    identity: {
      org,
      process,
      artifact,
      subject
    },
    anchor,
    signatures: []
  };
}
// Utility: Upload a file to Google Drive and return fileId and webViewLink
async function uploadFileToGoogleDrive({ bytes, filename, mimeType = 'application/octet-stream', token }) {
  const metadata = {
    name: filename,
    mimeType
  };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    new TextDecoder().decode(bytes) +
    closeDelim;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Upload] ${res.status}: ${err}`);
  }
  return await res.json(); // { id, webViewLink }
}
// Google OAuth token storage
let googleAuthToken = null;

// Handle Google authentication request
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GOOGLE_AUTH_REQUEST') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error('[background] Google Auth error:', chrome.runtime.lastError);
        sendResponse({ ok: false, error: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No token returned' });
      } else {
        googleAuthToken = token;
        sendResponse({ ok: true, token });
      }
    });
    return true;
  }
});
// background.js - Chrome Extension Service Worker
// Handles background tasks for Lockb0x Protocol Codex Forge

chrome.runtime.onInstalled.addListener(() => {
  console.log('Lockb0x Protocol Codex Forge extension installed.');
});



import { uuidv4, sha256, niSha256, jcsStringify, signEntryCanonical, anchorMock, anchorGoogle } from './lib/protocol.js';
import { summarizeContent, generateProcessTag, generateCertificateSummary } from './lib/ai.js';
import { validateCodexEntry } from './lib/validate.js';

// Message handler for popup/content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "CREATE_CODEX_FROM_FILE") {
        const { bytes, filename, anchorType, googleAuthToken } = msg.payload;
        const fileBytes = new Uint8Array(bytes);
        let payloadDriveInfo = null;
        let codexDriveInfo = null;
        let codexSelfRefInfo = null;
        let entry = null;
        let anchor = null;
        let subject = null;
        let processTag = null;
        let hash = null;
        let integrity = null;
        let fileText = null;
        // Step 1: Upload payload to Google Drive (if Google anchor)
        if (anchorType === 'google' && googleAuthToken) {
          try {
            payloadDriveInfo = await uploadFileToGoogleDrive({
              bytes: fileBytes,
              filename,
              mimeType: 'application/octet-stream',
              token: googleAuthToken
            });
          } catch (err) {
            console.error('[background] Google Drive payload upload error:', err);
            sendResponse({ ok: false, error: 'Google Drive payload upload error', details: err });
            return;
          }
        }
        // Step 2: Compute hash and integrity_proof
        try {
          hash = await sha256(fileBytes);
          integrity = niSha256(hash);
          fileText = new TextDecoder().decode(fileBytes);
          subject = await summarizeContent(fileText);
          processTag = await generateProcessTag(fileText);
        } catch (err) {
          console.error('[background] Pre-anchor error:', err);
          sendResponse({ ok: false, error: 'Pre-anchor error', details: err });
          return;
        }
        // Step 3: Anchor
        if (anchorType === 'google' && googleAuthToken) {
          try {
            anchor = await anchorGoogle({ id: uuidv4(), storage: { integrity_proof: integrity } }, googleAuthToken);
          } catch (err) {
            console.error('[background] Google anchor error:', err);
            sendResponse({ ok: false, error: 'Google anchor error', details: err });
            return;
          }
        } else {
          try {
            anchor = await anchorMock({ id: uuidv4(), storage: { integrity_proof: integrity } });
          } catch (err) {
            console.error('[background] Mock anchor error:', err);
            sendResponse({ ok: false, error: 'Mock anchor error', details: err });
            return;
          }
        }
        // Step 4: Build unsigned Codex entry
        const codexId = uuidv4();
        entry = buildUnsignedCodexEntry({
          id: codexId,
          payloadDriveId: payloadDriveInfo ? payloadDriveInfo.id : undefined,
          payloadDriveUrl: payloadDriveInfo ? `https://drive.google.com/file/d/${payloadDriveInfo.id}` : filename,
          integrity_proof: integrity,
          org: "Codex Forge",
          process: processTag,
          artifact: filename,
          subject,
          anchor
        });
        // Step 5: Sign Codex entry
        await signCodexEntry(entry);
        // Step 6: Upload signed Codex entry to Drive (if Google anchor)
        if (anchorType === 'google' && googleAuthToken) {
          try {
            codexDriveInfo = await uploadCodexEntryToGoogleDrive({ entry, token: googleAuthToken });
          } catch (err) {
            console.error('[background] Google Drive Codex entry upload error:', err);
            sendResponse({ ok: false, error: 'Google Drive Codex entry upload error', details: err });
            return;
          }
        }
        // Step 7: Make Codex entry self-referential (if Google anchor)
        if (anchorType === 'google' && googleAuthToken && codexDriveInfo && codexDriveInfo.id) {
          try {
            codexSelfRefInfo = await makeCodexEntrySelfReferential({ entry, codexFileId: codexDriveInfo.id, token: googleAuthToken });
          } catch (err) {
            console.error('[background] Google Drive Codex self-referential update error:', err);
            sendResponse({ ok: false, error: 'Google Drive Codex self-referential update error', details: err });
            return;
          }
        }
        // Step 8: Validate entry before sending response
        const validation = await validateCodexEntry(entry);
        if (!validation.valid) {
          sendResponse({ ok: false, error: 'Schema validation failed', details: validation.errors });
          return;
        }
        // Step 9: Return all info to UI
        sendResponse({
          ok: true,
          entry,
          payloadDriveInfo,
          codexDriveInfo,
          codexSelfRefInfo
        });
      }
    } catch (err) {
      console.error('[background] Unexpected error:', err);
      sendResponse({ ok: false, error: 'Unexpected error', details: err });
    }
  })();
  return true;
});
