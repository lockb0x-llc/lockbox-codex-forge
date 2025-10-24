// Handles Codex entry generation responses for both small and large files
function handleCodexResponse(response) {
  // Stepper updates for small file workflow
  if (response && response.ok && response.entry) {
    updateStepper('step-upload','done');
    updateStepper('step-hash','done');
    updateStepper('step-anchor','done');
    updateStepper('step-codex','done');
    updateStepper('step-validate','done');
    updateStepper('step-upload-codex','done');
    updateStepper('step-success','done');
  } else if (response && typeof response.ok !== 'undefined') {
    updateStepper('step-error','error');
    document.getElementById('step-error').style.display = 'block';
  }
  console.log('[popup] Codex entry response:', response);
  if (response && response.ok && response.entry) {
    // If Google Drive payload, validate existence before export
    let payloadExists = true;
    let payloadValidationMsg = '';
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
        updateCodexUI(response, payloadExists, payloadValidationMsg);
      })();
    } else {
      updateCodexUI(response, payloadExists, payloadValidationMsg);
    }
  } else if (response && typeof response.ok !== 'undefined') {
    let errorMsg = '';
    errorMsg += 'Failed to generate entry.\n';
    errorMsg += 'Full response object:\n' + JSON.stringify(response, null, 2) + '\n';
    if (response && response.error) {
      errorMsg += 'Error:\n';
      errorMsg += JSON.stringify(response.error, null, 2) + '\n';
    }
    // Always show the error array, even if empty or undefined
    if (response && 'details' in response) {
      errorMsg += 'Schema errors:\n';
      if (Array.isArray(response.details) && response.details.length > 0) {
        errorMsg += response.details.map(e => e.message).join('\n') + '\n';
      } else {
        errorMsg += JSON.stringify(response.details, null, 2) + '\n';
      }
    }
    showError(errorMsg, 'Check error details above and try again.');
    console.error('[popup] Failed to generate entry:', JSON.stringify(response, null, 2));
    // Log the entry object for debugging
    if (response && response.entry) {
      console.log('[popup] Entry object:', response.entry);
    }
  }
}
// Update stepper UI for each step
function updateStepper(step, status) {
  const el = document.getElementById(step);
  if (!el) return;
  const statusSpan = el.querySelector('.step-status');
  if (status === 'done') {
    statusSpan.textContent = '✔';
    el.style.color = '#00796b';
  } else if (status === 'active') {
    statusSpan.textContent = '...';
    el.style.color = '#0277bd';
  } else if (status === 'error') {
    statusSpan.textContent = '✖';
    el.style.color = '#c62828';
  } else {
    statusSpan.textContent = '';
    el.style.color = '';
  }
}
// Utility to show error and recovery instructions in the popup
function showError(message, recovery) {
  statusDiv.textContent = `Error: ${message}`;
  statusDiv.style.color = '#c62828';
  if (recovery) {
    statusDiv.textContent += `\nRecovery: ${recovery}`;
  }
  console.error('[popup] Error:', message, recovery || '');
}

  // Update Codex UI with entry and payload status
  function updateCodexUI(response, payloadExists, payloadValidationMsg) {
    // Show Codex entry JSON
    if (jsonResult) {
      jsonResult.textContent = response && response.entry ? JSON.stringify(response.entry, null, 2) : '';
      jsonResult.style.display = response && response.entry ? 'block' : 'none';
    }
    // Show certificate summary if present
    if (certificateSummary) {
      certificateSummary.textContent = response && response.entry && response.entry.certificate ?
        'Certificate: ' + JSON.stringify(response.entry.certificate, null, 2) : '';
      certificateSummary.style.display = response && response.entry && response.entry.certificate ? 'block' : 'none';
    }
    // Show AI summary if present
    if (aiSummary) {
      aiSummary.textContent = response && response.entry && response.entry.ai ?
        'AI Summary: ' + JSON.stringify(response.entry.ai, null, 2) : '';
      aiSummary.style.display = response && response.entry && response.entry.ai ? 'block' : 'none';
    }
    // Show payload validation message if provided
    if (payloadValidationMsg && statusDiv) {
      statusDiv.textContent = payloadValidationMsg;
      statusDiv.style.color = payloadExists ? '#00796b' : '#c62828';
    }
    // Show success message
    if (response && response.ok && response.entry && statusDiv) {
      statusDiv.textContent = 'Codex entry generated successfully.' + (payloadValidationMsg ? ('\n' + payloadValidationMsg) : '');
      statusDiv.style.color = '#00796b';
    }
  }
import { uuidv4, sha256, niSha256, jcsStringify, signEntryCanonical, anchorMock, anchorGoogle } from '../lib/protocol.js';
import { validateCodexEntry } from '../lib/validate.js';
import { summarizeText } from '../lib/ai.js';
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
    }, async (results) => {
      console.log('[popup] Scripting results:', results);
      if (results && results[0] && results[0].result) {
        extractedData = results[0].result;
        extractedBytes = new TextEncoder().encode(extractedData);
        // Use Summarizer API for summary
        try {
          const summary = await summarizeText(extractedData);
          aiSummary.textContent = summary;
          aiSummary.style.display = 'block';
          statusDiv.textContent = 'Page content extracted and summarized.';
          statusDiv.style.color = '#00796b';
        } catch (err) {
          aiSummary.textContent = '';
          aiSummary.style.display = 'none';
          statusDiv.textContent = 'Page content extracted, but summarization failed.';
          statusDiv.style.color = '#c62828';
          console.error('[popup] Summarizer API error:', err);
        }
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
  anchorType.addEventListener('change', () => {
    console.log('[popup] Anchor type changed:', anchorType.value);
    if (anchorType.value === 'google') {
      googleSignInBtn.style.display = 'inline-block';
      authStatus.textContent = googleAuthToken ? 'Google Authenticated' : 'Google Not Signed In';
      authStatus.style.color = googleAuthToken ? '#00796b' : '#c62828';
    } else {
      googleSignInBtn.style.display = 'none';
      googleAuthToken = null;
      authStatus.textContent = 'Using Mock Anchor';
      authStatus.style.color = '#616161';
    }
  });
  // Initialize status
  anchorType.dispatchEvent(new Event('change'));
}

// Handle Google sign-in

if (googleSignInBtn && authStatus) {
  googleSignInBtn.addEventListener('click', () => {
    statusDiv.textContent = 'Signing in to Google...';
    console.log('[popup] Google sign-in button clicked');
    chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH_REQUEST' }, (response) => {
      console.log('[popup] Google sign-in response:', response);
      if (response && response.ok && response.token) {
        googleAuthToken = response.token;
        chrome.storage.local.set({ googleAuthToken: response.token });
        statusDiv.textContent = 'Google sign-in successful.';
        statusDiv.style.color = '#00796b';
        authStatus.textContent = 'Google Authenticated';
        authStatus.style.color = '#00796b';
      } else {
        showError('Google sign-in failed.', 'Check your Chrome login or try again.');
        authStatus.textContent = 'Google Not Signed In';
        authStatus.style.color = '#c62828';
        console.error('[popup] Google sign-in failed:', response);
      }
    });
  });
}


entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Prepare file/bytes and determine large file
  const file = fileInput.files[0];
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const LARGE_FILE_THRESHOLD = 3 * 1024 * 1024; // 3MB
  const bytes = extractedBytes ? extractedBytes : (file ? new Uint8Array() : null);
  const filename = file ? file.name : 'extracted.txt';
  const isLargeFile = bytes && bytes.length > LARGE_FILE_THRESHOLD;
  if (isLargeFile) {
    // Wake up service worker before Port connection
    chrome.runtime.sendMessage({ type: 'PING' }, function(response) {
      if (chrome.runtime.lastError) {
        console.warn('[popup] PING lastError:', chrome.runtime.lastError.message);
      }
      // Use Port-based chunked transfer
      const port = chrome.runtime.connect();
      let sentChunks = 0;
      let totalChunks = Math.ceil(bytes.length / CHUNK_SIZE);
      statusDiv.textContent = `Uploading large file in ${totalChunks} chunks...`;
      updateStepper('step-upload','active');
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
        statusDiv.textContent = `Uploading chunk ${sentChunks} of ${totalChunks}...`;
      }
      // Signal completion
      port.postMessage({ type: 'END_LARGE_FILE_UPLOAD' });
      port.onMessage.addListener(function(msg) {
        handleCodexResponse(msg);
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
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.warn('[popup] CREATE_CODEX_FROM_FILE lastError:', chrome.runtime.lastError.message);
      }
      handleCodexResponse(response);
    });
  }
}
);

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
