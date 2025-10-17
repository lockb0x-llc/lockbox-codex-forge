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
        let hash, integrity, fileText, subject, processTag, anchor, entry, sig;
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


        // Use 'https' for Google Drive storage protocol
        // Use a placeholder for Google Drive file URL/ID in location
        let storageProtocol = anchorType === 'google' ? 'https' : 'local';
        let storageLocation = anchorType === 'google'
          ? 'https://drive.google.com/file/d/DRIVE_FILE_ID' // TODO: Replace with actual Drive file ID
          : filename;

        entry = {
          id: uuidv4(),
          version: "0.0.2",
          storage: {
            protocol: storageProtocol,
            location: storageLocation,
            integrity_proof: integrity // niSha256(hash) already matches required format
          },
          identity: {
            org: "Codex Forge",
            process: processTag,
            artifact: filename,
            subject
          },
          anchor,
          signatures: []
        };

        entry = {
          id: uuidv4(),
          version: "0.0.2",
          storage: {
            protocol: storageProtocol,
            location: storageLocation,
            integrity_proof: integrity // niSha256(hash) already matches required format
          },
          identity: {
            org: "Codex Forge",
            process: processTag,
            artifact: filename,
            subject
          }
        };

        // Debug: Print protocol and integrity_proof values
        console.log('[background] Debug protocol:', entry.storage.protocol);
        console.log('[background] Debug integrity_proof:', entry.storage.integrity_proof);

        // Validate entry before sending response
        const validation = await validateCodexEntry(entry);
        console.log('[background] Schema validation errors:', validation.errors);
        if (!validation.valid) {
          sendResponse({ ok: false, error: 'Schema validation failed', details: validation.errors });
          return;
        }
        sendResponse({ ok: true, entry });
      }
    } catch (err) {
      console.error('[background] Unexpected error:', err);
      sendResponse({ ok: false, error: 'Unexpected error', details: err });
    }
  })();
  return true;
});
