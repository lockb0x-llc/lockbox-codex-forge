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
// Utility: Check if a file exists on Google Drive by fileId and OAuth token
async function checkDriveFileExists({ fileId, token }) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,trashed`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Existence Check] ${res.status}: ${err}`);
  }
  const metadata = await res.json();
  // If file is trashed, treat as not existing
  if (metadata.trashed) {
    throw new Error('[Drive Existence Check] File is trashed');
  }
  return metadata; // { id, name, mimeType, trashed }
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
  // Use Blob for binary-safe multipart body
  const bodyParts = [
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${mimeType}\r\n\r\n`,
    new Blob([bytes], { type: mimeType }),
    closeDelim
  ];
  // Convert to FormData for fetch compatibility
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', new Blob([bytes], { type: mimeType }));
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Content-Type will be set automatically by FormData
    },
    body: formData
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Upload] ${res.status}: ${err}`);
  }
  return await res.json(); // { id, webViewLink }
}
// Google OAuth token storage
let googleAuthToken = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GOOGLE_AUTH_REQUEST') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        const errMsg = chrome.runtime.lastError ? (chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError)) : 'No token returned';
        console.error('[background] Google Auth error:', errMsg);
        sendResponse({ ok: false, error: errMsg });
      } else {
        googleAuthToken = token;
        chrome.storage.local.set({ googleAuthToken: token });
        sendResponse({ ok: true, token });
      }
    });
    return true;
  }
  // Validate payload existence before export
  if (msg.type === 'VALIDATE_PAYLOAD_EXISTENCE') {
    (async function() {
      try {
        const { fileId, token } = msg.payload;
        const metadata = await checkDriveFileExists({ fileId, token });
        sendResponse({ ok: true, exists: true, metadata });
      } catch (err) {
        sendResponse({ ok: false, exists: false, error: err.message });
      }
    })();
    return true;
  }
  if (msg.type === "CREATE_CODEX_FROM_FILE") {
    (async function() {
      try {
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
          let mimeType = 'application/octet-stream';
          if (filename.match(/\.txt$/i)) mimeType = 'text/plain';
          else if (filename.match(/\.json$/i)) mimeType = 'application/json';
          else if (filename.match(/\.md$/i)) mimeType = 'text/markdown';
          try {
            payloadDriveInfo = await uploadFileToGoogleDrive({
              bytes: fileBytes,
              filename,
              mimeType,
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
          if (filename.match(/\.(txt|md|json)$/i)) {
            fileText = new TextDecoder().decode(fileBytes);
            subject = await summarizeContent(fileText);
            processTag = await generateProcessTag(fileText);
          } else {
            fileText = null;
            subject = filename;
            processTag = 'binary-upload';
          }
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
          anchor,
          protocol: (anchorType === 'google' && payloadDriveInfo) ? 'gdrive' : 'local'
        });
        await signCodexEntry(entry);
        if (anchorType === 'google' && googleAuthToken) {
          try {
            codexDriveInfo = await uploadCodexEntryToGoogleDrive({ entry, token: googleAuthToken });
          } catch (err) {
            console.error('[background] Google Drive Codex entry upload error:', err);
            sendResponse({ ok: false, error: 'Google Drive Codex entry upload error', details: err });
            return;
          }
        }
        console.log('[background] Debug protocol before validation:', entry.storage.protocol);
        const validation = await validateCodexEntry(entry);
        if (!validation.valid) {
          sendResponse({ ok: false, error: 'Schema validation failed', details: validation.errors });
          return;
        }
        sendResponse({
          ok: true,
          entry,
          payloadDriveInfo,
          codexDriveInfo,
          codexSelfRefInfo
        });
      } catch (err) {
        console.error('[background] Unexpected error:', err);
        sendResponse({ ok: false, error: 'Unexpected error', details: err });
      }
    })();
    return true;
  }
  return false;

