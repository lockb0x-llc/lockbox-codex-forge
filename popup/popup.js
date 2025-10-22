// Utility to show error and recovery instructions in the popup
function showError(message, recovery) {
  statusDiv.textContent = `Error: ${message}`;
  statusDiv.style.color = '#c62828';
  if (recovery) {
    statusDiv.textContent += `\nRecovery: ${recovery}`;
  }
  console.error('[popup] Error:', message, recovery || '');
}
import { uuidv4, sha256, niSha256, jcsStringify, signEntryCanonical, anchorMock, anchorGoogle } from '../lib/protocol.js';
import { validateCodexEntry } from '../lib/validate.js';
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
  chrome.runtime.sendMessage({
    type: 'CREATE_CODEX_FROM_FILE',
    payload: {
      bytes: Array.from(extractedBytes),
      filename: file.name,
      anchorType: anchorType ? anchorType.value : 'mock',
      googleAuthToken: googleAuthToken
    }
  }, async (response) => {
    console.log('[popup] Codex entry response:', response);
    if (response && response.ok && response.entry) {
      // If Google Drive payload, validate existence before export
      let payloadExists = true;
      let payloadValidationMsg = '';
      if (response.entry.storage && response.entry.storage.protocol === 'gdrive' && response.payloadDriveInfo && response.payloadDriveInfo.id && googleAuthToken) {
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
      }
      jsonResult.textContent = JSON.stringify(response.entry, null, 2);
      downloadBtn.style.display = payloadExists ? 'inline-block' : 'none';
      copyBtn.style.display = 'inline-block';
      statusDiv.textContent += ' Codex Entry generated.';
      statusDiv.style.color = payloadExists ? '#00796b' : '#c62828';
      aiSummary.textContent += response.entry.identity.subject || '';
      certificateSummary.textContent += response.entry.certificate_summary || '';
      // Show payload download link if Drive URL is present and exists
      const payloadLink = document.getElementById('payloadDownloadLink');
      if (response.entry.storage && response.entry.storage.location && response.entry.storage.location.startsWith('https://drive.google.com/') && payloadExists) {
        payloadLink.href = response.entry.storage.location;
        payloadLink.style.display = 'inline-block';
      } else {
        payloadLink.style.display = 'none';
      }
      // Validate entry against schema
      const validation = await validateCodexEntry(response.entry);
      if (validation.valid) {
        statusDiv.textContent += ' (Schema valid)';
      } else {
        showError('Schema INVALID.', 'Check schema errors below.');
        certificateSummary.textContent += '\nSchema errors:\n' + validation.errors.map(e => e.message).join('\n');
        console.error('[popup] Schema validation errors:', validation.errors);
      }
      // Show payload existence validation result
      statusDiv.textContent += `\n${payloadValidationMsg}`;
    } else {
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
  });
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
