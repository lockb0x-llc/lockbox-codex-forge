import { uuidv4, sha256, niSha256, jcsStringify, signEntryCanonical, anchorMock, anchorGoogle } from '../lib/protocol.js';
import { updateCodexUI, showError, validateAndShowEntry } from '../lib/codex-ui-utils.js';
import { refreshGoogleAuthToken, loadGoogleAuthToken } from '../lib/google-auth-utils.js';
import { readFile } from '../lib/file-utils.js';

// popup.js - Handles popup UI logic for Lockb0x Protocol Codex Forge

const fileInput = document.getElementById('fileInput');
const extractPageBtn = document.getElementById('extractPageBtn');
const anchorType = document.getElementById('anchorType');
const googleSignInBtn = document.getElementById('googleSignInBtn');
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
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => document.body.innerText
    }, (results) => {
      console.log('[popup] Scripting results:', results);
      if (results && results[0] && results[0].result) {
        extractedData = results[0].result;
        extractedBytes = new TextEncoder().encode(extractedData);
        statusDiv.textContent = 'Page content extracted.';
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


entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('[popup] Generate Codex Entry button clicked');
  const file = fileInput.files[0];
  if (!extractedBytes && !file) {
    showError('No data to process.', 'Upload a file or extract page content first.');
    console.warn('[popup] No data to process');
    return;
  }
  metadata = {
    anchorType: anchorType ? anchorType.value : 'mock',
    googleAuthToken: googleAuthToken
    // Add more metadata fields as needed
  };
  statusDiv.textContent = 'Generating Codex Entry...';
  statusDiv.style.color = '#00796b';
  aiSummary.textContent = '';
  certificateSummary.textContent = '';

  // --- Large file support ---
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const LARGE_FILE_THRESHOLD = 3 * 1024 * 1024; // 3MB
  const bytes = extractedBytes ? extractedBytes : new Uint8Array();
  const isLargeFile = bytes && bytes.length > LARGE_FILE_THRESHOLD;
  const filename = file ? file.name : (() => {
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
if (!googleAuthToken) {
  chrome.identity.getAuthToken({ interactive: false }, function(token) {
    if (token) googleAuthToken = token;
  });
}

// Example: Call refreshGoogleAuth() when you need to refresh the token
