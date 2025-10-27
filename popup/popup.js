import { uuidv4, sha256, niSha256, jcsStringify, signEntryCanonical, anchorMock, anchorGoogle } from '../lib/protocol.js';
import { updateCodexUI, showError, validateAndShowEntry } from '../lib/codex-ui-utils.js';
import { refreshGoogleAuthToken, loadGoogleAuthToken } from '../lib/google-auth-utils.js';
import { readFile } from '../lib/file-utils.js';

// popup.js - Handles popup UI logic for Lockb0x Protocol Codex Forge

const fileInput = document.getElementById('fileInput');
const extractPageBtn = document.getElementById('extractPageBtn');
const anchorType = document.getElementById('anchorType');
const googleSignInBtn = document.getElementById('googleSignInBtn');
let googleLogOutBtn = document.getElementById('googleLogOutBtn');
if (!googleLogOutBtn) {
  googleLogOutBtn = document.createElement('button');
  googleLogOutBtn.id = 'googleLogOutBtn';
  googleLogOutBtn.textContent = 'Log out';
  googleLogOutBtn.style.display = 'none';
  googleSignInBtn.parentNode.insertBefore(googleLogOutBtn, googleSignInBtn.nextSibling);
}
const generateBtn = document.getElementById('generateBtn');
const entryForm = document.getElementById('entryForm');
const jsonResult = document.getElementById('jsonResult');
const certificateSummary = document.getElementById('certificateSummary');
const aiSummary = document.getElementById('aiSummary');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const statusDiv = document.getElementById('status');

let extractedData = '';
let extractedBytes = null;
let metadata = {};
let googleAuthToken = null;

// Load token from chrome.storage on startup
chrome.storage.local.get(['googleAuthToken'], (result) => {
  if (result && result.googleAuthToken) {
    googleAuthToken = result.googleAuthToken;
  }
});

const userProfileDiv = document.createElement('div');
userProfileDiv.id = 'userProfile';
userProfileDiv.style.display = 'none';
userProfileDiv.style.marginTop = '8px';
statusDiv.parentNode.insertBefore(userProfileDiv, statusDiv);

function fetchGoogleProfile(token) {
  return fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(profile => {
      if (!profile || !profile.names || !profile.emailAddresses) return null;
      return {
        name: profile.names[0].displayName,
        email: profile.emailAddresses[0].value,
        photo: profile.photos && profile.photos[0] ? profile.photos[0].url : null
      };
    })
    .catch(() => null);
}

async function updateAuthUI() {
  const anchorIsGoogle = anchorType && anchorType.value === 'google';
  if (!anchorIsGoogle) {
    googleSignInBtn.style.display = 'none';
    googleLogOutBtn.style.display = 'none';
    userProfileDiv.style.display = 'none';
    authStatus.textContent = 'Using Mock Anchor';
    authStatus.style.color = '#616161';
    return;
  }
  if (googleAuthToken) {
    googleSignInBtn.style.display = 'none';
    googleLogOutBtn.style.display = 'inline-block';
    authStatus.textContent = 'Google Authenticated';
    authStatus.style.color = '#00796b';
    userProfileDiv.textContent = 'Loading profile...';
    userProfileDiv.style.display = 'block';
    const profile = await fetchGoogleProfile(googleAuthToken);
    if (profile) {
      userProfileDiv.innerHTML = `<img src="${profile.photo}" alt="avatar" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;"> <span style="font-weight:bold;">${profile.name}</span> <span style="color:#616161;">(${profile.email})</span>`;
    } else {
      userProfileDiv.textContent = 'Google profile unavailable.';
    }
  } else {
    googleSignInBtn.style.display = 'inline-block';
    googleLogOutBtn.style.display = 'none';
    userProfileDiv.style.display = 'none';
    authStatus.textContent = 'Google Not Signed In';
    authStatus.style.color = '#c62828';
  }
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  console.log('[popup] File input changed:', file);
  if (!file) {
    showError('No file selected.', 'Please choose a file to upload.');
    return;
  }
  const isText = file.type.startsWith('text') || file.name.match(/\.(txt|md|json)$/i);
  const reader = new FileReader();
  reader.onload = function(evt) {
    if (isText) {
      extractedData = evt.target.result;
      extractedBytes = new TextEncoder().encode(extractedData);
    } else {
      extractedBytes = new Uint8Array(evt.target.result);
      extractedData = '';
    }
    statusDiv.textContent = `Loaded file: ${file.name}`;
    statusDiv.style.color = '#00796b';
    console.log('[popup] File loaded:', file.name);
  };
  reader.onerror = function(err) {
    showError('Error reading file.', 'Try a different file or check file format.');
    console.error('[popup] FileReader error:', err);
  };
  if (isText) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
});


extractPageBtn && extractPageBtn.addEventListener('click', () => {
  statusDiv.textContent = 'Extracting page content...';
  statusDiv.style.color = '#00796b';
  console.log('[popup] Extract Page Content button clicked');
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (tab.url && tab.url.startsWith('chrome://')) {
      showError('Cannot extract content from chrome:// URLs.', 'Switch to a regular web page and try again.');
      console.warn('[popup] Attempted to extract from chrome:// URL:', tab.url);
      return;
    }
    // Get page text and meta description
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => {
        const text = document.body.innerText;
        let metaDesc = '';
        const meta = document.querySelector('meta[name="description"]');
        if (meta && meta.content) metaDesc = meta.content;
        return { text, metaDesc };
      }
    }, async (results) => {
      console.log('[popup] Scripting results:', results);
      if (results && results[0] && results[0].result) {
        extractedData = results[0].result.text;
        extractedBytes = new TextEncoder().encode(extractedData);
        let summary = '';
        let screenshotUrl = '';
        // Try Summarizer API
        try {
          summary = await summarizeText(extractedData);
        } catch (err) {
          // Fallback: use meta description or first 100 chars
          if (results[0].result.metaDesc) {
            summary = results[0].result.metaDesc;
          } else {
            summary = extractedData.slice(0, 100);
          }
          // Try to capture screenshot
          try {
            screenshotUrl = await new Promise((resolve, reject) => {
              chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) reject(chrome.runtime.lastError);
                else resolve(dataUrl);
              });
            });
          } catch (e) {
            screenshotUrl = '';
          }
        }
        aiSummary.textContent = summary;
        aiSummary.style.display = 'block';
        if (screenshotUrl) {
          // Show screenshot below summary
          let img = document.getElementById('pageScreenshot');
          if (!img) {
            img = document.createElement('img');
            img.id = 'pageScreenshot';
            img.style.maxWidth = '100%';
            img.style.marginTop = '8px';
            aiSummary.parentNode.insertBefore(img, aiSummary.nextSibling);
          }
          img.src = screenshotUrl;
          img.style.display = 'block';
        }
        statusDiv.textContent = screenshotUrl ? 'Page content extracted (fallback: screenshot and summary).' : 'Page content extracted and summarized.';
        statusDiv.style.color = '#00796b';
      } else {
        showError('Failed to extract page content.', 'Reload the page or check permissions.');
        console.error('[popup] Failed to extract page content:', results);
      }
    });
  });
});



// Show/hide Google sign-in button based on anchor type
const authStatus = document.getElementById('authStatus');
if (anchorType && googleSignInBtn && authStatus) {
  authStatus.textContent = 'Google Authenticated';
  authStatus.style.color = '#00796b';
}

anchorType.addEventListener('change', updateAuthUI);
googleSignInBtn.addEventListener('click', () => {
  statusDiv.textContent = 'Signing in with Google...';
  chrome.identity.getAuthToken({ interactive: true }, async function(token) {
    if (chrome.runtime.lastError || !token) {
      let errorMsg = 'Google sign-in failed.';
      if (chrome.runtime.lastError && chrome.runtime.lastError.message) {
        errorMsg += `\nDetails: ${chrome.runtime.lastError.message}`;
        if (chrome.runtime.lastError.message.includes('OAuth2 not granted') || chrome.runtime.lastError.message.includes('revoked')) {
          errorMsg += '\nRecovery: Try signing in again or check your Google account permissions.';
        }
      }
      showError(statusDiv, errorMsg);
      authStatus.textContent = 'Google Not Signed In';
      authStatus.style.color = '#c62828';
      userProfileDiv.style.display = 'none';
      return;
    }
    googleAuthToken = token;
    chrome.storage.local.set({ googleAuthToken: token });
    await updateAuthUI();
    statusDiv.textContent = 'Google sign-in successful.';
  });
});

googleLogOutBtn.addEventListener('click', () => {
  statusDiv.textContent = 'Logging out from Google...';
  if (!googleAuthToken) {
    updateAuthUI();
    return;
  }
  chrome.identity.removeCachedAuthToken({ token: googleAuthToken }, function() {
    chrome.storage.local.remove('googleAuthToken', async () => {
      googleAuthToken = null;
      statusDiv.textContent = 'Logged out from Google.';
      await updateAuthUI();
    });
  });
});


entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Block if Google Anchor is selected and not signed in
  if (anchorType && anchorType.value === 'google' && !googleAuthToken) {
    showError('Google sign-in required before generating Codex entry.', 'Please sign in with Google and try again.');
    return;
  }
  // Prepare file/bytes and determine large file
  const file = fileInput.files[0];
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const LARGE_FILE_THRESHOLD = 3 * 1024 * 1024; // 3MB
  const bytes = extractedBytes ? extractedBytes : (file ? new Uint8Array() : null);
  const filename = file
    ? file.name
    : (() => {
        let pageTitle = '';
        try {
          pageTitle = document.title.replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 40);
        } catch (e) {
          pageTitle = 'untitled';
        }
        const now = new Date();
        const y = String(now.getFullYear()).slice(-2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `ce-current--${pageTitle}-${y}${m}${d}.txt`;
      })();
  const isLargeFile = bytes && bytes.length > LARGE_FILE_THRESHOLD;

  function handleCodexResponse(response) {
  // Robust error handling: always update UI for both success and error cases
  // - If response.ok and response.entry, update UI with entry details
  // - If error or schema validation fails, show error details and recovery instructions
    console.log('[popup] Codex entry response:', response);
    if (response && response.ok && response.entry) {
      // If Google Drive payload, validate existence before export
      let payloadExists = true;
      let payloadValidationMsg = '';
      const domRefs = { statusDiv, jsonResult, downloadBtn, copyBtn, aiSummary, certificateSummary };
      if (response.entry.storage && response.entry.storage.protocol === 'gdrive' && response.payloadDriveInfo && response.payloadDriveInfo.id && googleAuthToken) {
        (async () => {
          try {
            const validatePayload = await new Promise((resolve) => {
              chrome.runtime.sendMessage({
                type: 'VALIDATE_PAYLOAD_EXISTENCE',
                payload: {
                  fileId: response.payloadDriveInfo.id,
                  token: googleAuthToken
                }
              }, resolve);
            });
            if (validatePayload && validatePayload.ok && validatePayload.exists) {
              payloadExists = true;
              payloadValidationMsg = 'Payload exists on Google Drive.';
            } else {
              payloadExists = false;
              payloadValidationMsg = 'Payload NOT found on Google Drive.';
            }
          } catch (err) {
            payloadExists = false;
            payloadValidationMsg = 'Error validating payload existence.';
          }
          updateCodexUI(domRefs, response, payloadExists, payloadValidationMsg);
        })();
      } else {
        updateCodexUI(domRefs, response, payloadExists, payloadValidationMsg);
      }
    } else {
      // Always show schema validation errors and any error details
      let errorMsg = 'Failed to generate entry.';
      let recoveryMsg = 'Check error details below and try again.';
      if (Array.isArray(response.details) && response.details.length > 0) {
        errorMsg += '\nSchema validation errors:';
        errorMsg += '\n' + response.details.map(e => '- ' + e.message).join('\n');
        recoveryMsg = 'Please fix the schema errors above.';
      } else if (response.error) {
        errorMsg += `\nError: ${response.error}`;
        if (response.details && typeof response.details === 'string') {
          errorMsg += `\nDetails: ${response.details}`;
        }
      }
      showError(statusDiv, errorMsg, recoveryMsg);
      // Optionally, log errors to console for developer visibility
      console.error('[popup] Codex entry error:', response);
    }

    if (isLargeFile) {
      // Wake up service worker before Port connection
      chrome.runtime.sendMessage({ type: 'PING' }, () => {
        // Use Port-based chunked transfer
        const port = chrome.runtime.connect();
        let sentChunks = 0;
        let totalChunks = Math.ceil(bytes.length / CHUNK_SIZE);
        statusDiv.textContent = `Uploading large file in ${totalChunks} chunks...`;
        // Progress bar setup
        let progressBar = document.getElementById('uploadProgressBar');
        if (!progressBar) {
          progressBar = document.createElement('progress');
          progressBar.id = 'uploadProgressBar';
          progressBar.max = totalChunks;
          progressBar.value = 0;
          statusDiv.parentNode.insertBefore(progressBar, statusDiv.nextSibling);
        } else {
          progressBar.max = totalChunks;
          progressBar.value = 0;
          progressBar.style.display = 'block';
        }
        // Disable form during upload
        entryForm.querySelectorAll('input, button, select').forEach(el => el.disabled = true);
        // Send metadata first
        port.postMessage({
          type: 'START_LARGE_FILE_UPLOAD',
          filename,
          anchorType: anchorType ? anchorType.value : 'mock',
          googleAuthToken: googleAuthToken,
          totalChunks
        });
        // Send chunks
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
          const chunk = bytes.slice(i, i + CHUNK_SIZE);
          port.postMessage({
            type: 'LARGE_FILE_CHUNK',
            chunkIndex: sentChunks,
            chunk: Array.from(chunk)
          });
          sentChunks++;
        }
        // Signal completion
        port.postMessage({ type: 'END_LARGE_FILE_UPLOAD' });
        port.onMessage.addListener((msg) => {
          if (msg.status === 'started') {
            statusDiv.textContent = 'Upload started...';
          } else if (msg.status === 'chunk-received') {
            statusDiv.textContent = `Chunk ${msg.chunkIndex + 1} of ${totalChunks} uploaded...`;
            progressBar.value = msg.chunkIndex + 1;
            if (msg.chunkIndex + 1 === totalChunks) {
              statusDiv.textContent = 'All chunks uploaded. Processing file...';
              progressBar.value = totalChunks;
            }
          } else if (msg.status === 'processing') {
            statusDiv.textContent = 'Processing file and computing hash...';
          } else if (msg.status === 'drive-upload') {
            statusDiv.textContent = 'Uploading payload to Google Drive...';
          } else if (msg.status === 'codex-generation') {
            statusDiv.textContent = 'Generating Codex entry...';
          } else if (msg.ok === false) {
            showError(statusDiv, `Error: ${msg.error}`, 'Check error details above and try again.');
            progressBar.style.display = 'none';
            entryForm.querySelectorAll('input, button, select').forEach(el => el.disabled = false);
          } else if (msg.ok === true) {
            statusDiv.textContent = 'Codex entry generated!';
            progressBar.style.display = 'none';
            entryForm.querySelectorAll('input, button, select').forEach(el => el.disabled = false);
            jsonResult.textContent = JSON.stringify(msg.entry, null, 2);
            // Show download/copy buttons, display entry, etc.
            const domRefs = { statusDiv, jsonResult, downloadBtn, copyBtn, aiSummary, certificateSummary };
            updateCodexUI(domRefs, msg, true, 'Payload exists on Google Drive.');
          }
        });
      });
    } else {
      // Use existing sendMessage workflow for small files
      chrome.runtime.sendMessage({
        type: 'CREATE_CODEX_FROM_FILE',
        payload: {
          bytes: Array.from(bytes),
          filename,
          anchorType: anchorType ? anchorType.value : 'mock',
          googleAuthToken: googleAuthToken
        }
      }, handleCodexResponse);
    }
  }

});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([jsonResult.textContent], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'codex-entry.json';
  a.click();
  URL.revokeObjectURL(url);
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(jsonResult.textContent);
  statusDiv.textContent = 'Copied to clipboard.';
});

// Revoke and refresh Google Auth token on demand
const refreshGoogleAuth = () => {
  if (!googleAuthToken) {
    console.warn('[popup] No Google Auth token to refresh');
    return;
  }
  chrome.identity.removeCachedAuthToken({ token: googleAuthToken }, function() {
    console.log('[popup] Removed cached auth token');
    // Optionally, you can get a new token immediately
    chrome.identity.getAuthToken({ interactive: true }, function(newToken) {
      if (chrome.runtime.lastError) {
        console.error('[popup] Error getting new auth token:', chrome.runtime.lastError);
        return;
      }
      googleAuthToken = newToken;
      console.log('[popup] Got new auth token:', googleAuthToken);
      statusDiv.textContent = 'Google Auth token refreshed.';
    });
  });
};

// On extension load or popup open
function initializeAuthUI() {
  updateAuthUI();
}

if (!googleAuthToken) {
  chrome.identity.getAuthToken({ interactive: false }, async function(token) {
    if (token) {
      googleAuthToken = token;
    }
    initializeAuthUI();
  });
} else {
  initializeAuthUI();
}

// Example: Call refreshGoogleAuth() when you need to refresh the token
