// popup.js - Handles popup UI logic for Lockb0x Protocol Codex Forge

// Store zip blob globally for download
let currentZipBlob = null;

// Handles Codex entry generation responses for both small and large files
function handleCodexResponse(response) {
  // Store zip blob if present
  if (response && response.zipBlob) {
    currentZipBlob = response.zipBlob;
  }
  
  // Stepper updates for small file workflow
  if (response && response.ok && response.entry) {
    updateStepper("step-upload", "done");
    updateStepper("step-hash", "done");
    updateStepper("step-anchor", "done");
    updateStepper("step-codex", "done");
    updateStepper("step-validate", "done");
    updateStepper("step-upload-codex", "done");
    updateStepper("step-success", "done");
  } else if (response && typeof response.ok !== "undefined") {
    updateStepper("step-error", "error");
    document.getElementById("step-error").style.display = "block";
  }
  console.log("[popup] Codex entry response:", response);
  if (response && response.ok && response.entry) {
    // If Google Drive zip, validate existence before export
    let zipExists = true;
    let zipValidationMsg = "";
    if (
      response.entry.storage &&
      response.entry.storage.protocol === "gdrive" &&
      response.zipDriveInfo &&
      response.zipDriveInfo.id &&
      googleAuthToken
    ) {
      (async () => {
        try {
          const validateZip = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              {
                type: "VALIDATE_PAYLOAD_EXISTENCE",
                payload: {
                  fileId: response.zipDriveInfo.id
                },
              },
              resolve,
            );
          });
          if (validateZip && validateZip.ok && validateZip.exists) {
            zipExists = true;
            zipValidationMsg = "Zip archive exists on Google Drive.";
          } else if (validateZip && validateZip.error && validateZip.error.includes('token expired')) {
            zipExists = false;
            zipValidationMsg = "Google token expired. Please sign in again.";
            await updateAuthUI();
          } else {
            zipExists = false;
            zipValidationMsg = "Zip archive NOT found on Google Drive.";
          }
        } catch (_err) {
          zipExists = false;
          zipValidationMsg = "Error validating zip archive existence.";
        }
        updateCodexUI(response, zipExists, zipValidationMsg);
      })();
    } else {
      updateCodexUI(response, zipExists, zipValidationMsg);
    }
  } else if (response && typeof response.ok !== "undefined") {
    let errorMsg = "";
    errorMsg += "Failed to generate entry.\n";
    errorMsg +=
      "Full response object:\n" + JSON.stringify(response, null, 2) + "\n";
    if (response && response.error) {
      errorMsg += "Error:\n";
      errorMsg += JSON.stringify(response.error, null, 2) + "\n";
    }
    // Always show the error array, even if empty or undefined
    if (response && "details" in response) {
      errorMsg += "Schema errors:\n";
      if (Array.isArray(response.details) && response.details.length > 0) {
        errorMsg += response.details.map((e) => e.message).join("\n") + "\n";
      } else {
        errorMsg += JSON.stringify(response.details, null, 2) + "\n";
      }
    }
    showError(errorMsg, "Check error details above and try again.");
    console.error(
      "[popup] Failed to generate entry:",
      JSON.stringify(response, null, 2),
    );
    // Log the entry object for debugging
    if (response && response.entry) {
      console.log("[popup] Entry object:", response.entry);
    }
  }
}
// Update stepper UI for each step
function updateStepper(step, status) {
  const el = document.getElementById(step);
  if (!el) return;
  const statusSpan = el.querySelector(".step-status");
  if (status === "done") {
    statusSpan.textContent = "✔";
    el.style.color = "#00796b";
  } else if (status === "active") {
    statusSpan.textContent = "...";
    el.style.color = "#0277bd";
  } else if (status === "error") {
    statusSpan.textContent = "✖";
    el.style.color = "#c62828";
  } else {
    statusSpan.textContent = "";
    el.style.color = "";
  }
}
// Utility to show error and recovery instructions in the popup
function showError(message, recovery) {
  if (statusDiv) {
    statusDiv.textContent = `Error: ${message}`;
    statusDiv.style.color = "#c62828";
    if (recovery) {
      statusDiv.textContent += `\nRecovery: ${recovery}`;
    }
  }
  if (typeof generateBtn !== 'undefined' && generateBtn) {
    generateBtn.disabled = false;
  }
  console.error("[popup] Error:", message, recovery || "");
}

// Update Codex UI with entry and payload status
function updateCodexUI(response, payloadExists, payloadValidationMsg) {
  // Show Codex entry JSON
  if (jsonResult) {
    jsonResult.textContent =
      response && response.entry ? JSON.stringify(response.entry, null, 2) : "";
    jsonResult.style.display = response && response.entry ? "block" : "none";
  }
  // Show certificate summary if present
  if (certificateSummary) {
    certificateSummary.textContent =
      response && response.entry && response.entry.certificate
        ? "Certificate: " + JSON.stringify(response.entry.certificate, null, 2)
        : "";
    certificateSummary.style.display =
      response && response.entry && response.entry.certificate
        ? "block"
        : "none";
  }
  // Show AI summary if present
  if (aiSummary) {
    aiSummary.textContent =
      response && response.entry && response.entry.ai
        ? "AI Summary: " + JSON.stringify(response.entry.ai, null, 2)
        : "";
    aiSummary.style.display =
      response && response.entry && response.entry.ai ? "block" : "none";
  }
  // Show payload validation message if provided
  if (payloadValidationMsg && statusDiv) {
    statusDiv.textContent = payloadValidationMsg;
    statusDiv.style.color = payloadExists ? "#00796b" : "#c62828";
  }
  // Show success message and update button visibility
  if (response && response.ok && response.entry && statusDiv) {
    statusDiv.textContent =
      "Codex entry generated successfully." +
      (payloadValidationMsg ? "\n" + payloadValidationMsg : "");
    statusDiv.style.color = "#00796b";
    // Hide generate button, show download/copy buttons
    if (generateBtn) generateBtn.style.display = "none";
    if (downloadBtn) downloadBtn.style.display = "inline-block";
    if (downloadZipBtn) {
      downloadZipBtn.style.display = currentZipBlob ? "inline-block" : "none";
    }
    if (copyBtn) copyBtn.style.display = "inline-block";
    
    // Update payload link to point to zip on Drive
    const payloadLink = document.getElementById("payloadDownloadLink");
    if (payloadLink && response.zipDriveInfo && response.zipDriveInfo.webViewLink) {
      payloadLink.href = response.zipDriveInfo.webViewLink;
      payloadLink.style.display = "inline-block";
    } else if (payloadLink) {
      payloadLink.style.display = "none";
    }
  }
}

const fileInput = document.getElementById("fileInput");
const extractPageBtn = document.getElementById("extractPageBtn");
const anchorType = document.getElementById("anchorType");
const googleSignInBtn = document.getElementById("googleSignInBtn");
let googleLogOutBtn = document.getElementById("googleLogOutBtn");
if (!googleLogOutBtn) {
  googleLogOutBtn = document.createElement("button");
  googleLogOutBtn.id = "googleLogOutBtn";
  googleLogOutBtn.textContent = "Log out";
  googleLogOutBtn.style.display = "none";
  googleSignInBtn.parentNode.insertBefore(
    googleLogOutBtn,
    googleSignInBtn.nextSibling,
  );
}
const generateBtn = document.getElementById("generateBtn");
const entryForm = document.getElementById("entryForm");
const jsonResult = document.getElementById("jsonResult");
const certificateSummary = document.getElementById("certificateSummary");
const aiSummary = document.getElementById("aiSummary");
const downloadBtn = document.getElementById("downloadBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const copyBtn = document.getElementById("copyBtn");
const statusDiv = document.getElementById("status");

let extractedData = "";
let extractedBytes = null;
let metadata = {};

import {
  getGoogleAuthToken,
  setGoogleAuthToken,
  removeGoogleAuthToken,
} from "../lib/google-auth-utils.js";

let googleAuthToken = null;

// Load token from chrome.storage on startup
getGoogleAuthToken().then((token) => {
  googleAuthToken = token;
});

const userProfileDiv = document.createElement("div");
userProfileDiv.id = "userProfile";
userProfileDiv.style.display = "none";
userProfileDiv.style.marginTop = "8px";

const authStatus = document.getElementById("authStatus");
// Insert userProfileDiv directly after authStatus
if (authStatus && authStatus.parentNode) {
  authStatus.parentNode.insertBefore(userProfileDiv, authStatus.nextSibling);
}

function fetchGoogleProfile(token) {
  return fetch(
    "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
    .then((res) => res.json())
    .then((profile) => {
      if (!profile || !profile.names || !profile.emailAddresses) return null;
      return {
        name: profile.names[0].displayName,
        email: profile.emailAddresses[0].value,
        photo:
          profile.photos && profile.photos[0] ? profile.photos[0].url : null,
      };
    })
    .catch(() => null);
}

async function updateAuthUI() {
  const anchorIsGoogle = anchorType && anchorType.value === "google";
  if (!anchorIsGoogle) {
    googleSignInBtn.style.display = "none";
    googleLogOutBtn.style.display = "none";
    userProfileDiv.style.display = "none";
    authStatus.textContent = "Using Mock Anchor";
    authStatus.style.color = "#616161";
    return;
  }
  if (googleAuthToken) {
    googleSignInBtn.style.display = "none";
    googleLogOutBtn.style.display = "inline-block";
    authStatus.textContent = "Google Authenticated";
    authStatus.style.color = "#00796b";
    userProfileDiv.textContent = "Loading profile...";
    userProfileDiv.style.display = "block";
    // Try to load profile from chrome.storage first
    chrome.storage.local.get(["googleUserProfile"], async (result) => {
      let profile = result.googleUserProfile;
      if (!profile) {
        // If not cached, fetch from Google
        const { fetchGoogleUserProfile } = await import("../lib/google-auth-utils.js");
        profile = await fetchGoogleUserProfile(googleAuthToken);
      }
      if (profile && profile.name && profile.email && profile.picture) {
        userProfileDiv.innerHTML = `<img src="${profile.picture}" alt="avatar" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;"> <span style="font-weight:bold;">${profile.name}</span> <span style="color:#616161;">(${profile.email})</span>`;
      } else {
        userProfileDiv.textContent = "Google profile unavailable. Please sign in again.";
        statusDiv.textContent = "Google profile unavailable. Try signing in again.";
      }
    });
  } else {
    googleSignInBtn.style.display = "inline-block";
    googleLogOutBtn.style.display = "none";
    userProfileDiv.style.display = "none";
    authStatus.textContent = "Google Not Signed In";
    authStatus.style.color = "#c62828";
  }
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  console.log("[popup] File input changed:", file);
  if (!file) {
    showError("No file selected.", "Please choose a file to upload.");
    return;
  }
  const isText =
    file.type.startsWith("text") || file.name.match(/\.(txt|md|json)$/i);
  const reader = new FileReader();
  reader.onload = function (evt) {
    if (isText) {
      extractedData = evt.target.result;
      extractedBytes = new TextEncoder().encode(extractedData);
    } else {
      extractedBytes = new Uint8Array(evt.target.result);
      extractedData = "";
    }
    statusDiv.textContent = `Loaded file: ${file.name}`;
    statusDiv.style.color = "#00796b";
    console.log("[popup] File loaded:", file.name);
  };
  reader.onerror = function (err) {
    showError(
      "Error reading file.",
      "Try a different file or check file format.",
    );
    console.error("[popup] FileReader error:", err);
  };
  if (isText) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
});

extractPageBtn &&
  extractPageBtn.addEventListener("click", () => {
    statusDiv.textContent = "Extracting page content...";
    statusDiv.style.color = "#00796b";
    console.log("[popup] Extract Page Content button clicked");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab.url && tab.url.startsWith("chrome://")) {
        showError(
          "Cannot extract content from chrome:// URLs.",
          "Switch to a regular web page and try again.",
        );
        console.warn(
          "[popup] Attempted to extract from chrome:// URL:",
          tab.url,
        );
        return;
      }
      // Get page text and meta description
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const text = document.body.innerText;
            let metaDesc = "";
            const meta = document.querySelector('meta[name="description"]');
            if (meta && meta.content) metaDesc = meta.content;
            return { text, metaDesc };
          },
        },
        async (results) => {
          console.log("[popup] Scripting results:", results);
          if (results && results[0] && results[0].result) {
            extractedData = results[0].result.text;
            extractedBytes = new TextEncoder().encode(extractedData);
            let summary = "";
            let screenshotUrl = "";
            // Try Summarizer API
            try {
              summary = await summarizeText(extractedData);
            } catch (_err) {
              // Fallback: use meta description or first 100 chars
              if (results[0].result.metaDesc) {
                summary = results[0].result.metaDesc;
              } else {
                summary = extractedData.slice(0, 100);
              }
              // Try to capture screenshot
              try {
                screenshotUrl = await new Promise((resolve, reject) => {
                  chrome.tabs.captureVisibleTab(
                    tab.windowId,
                    { format: "png" },
                    (dataUrl) => {
                      if (chrome.runtime.lastError || !dataUrl)
                        reject(chrome.runtime.lastError);
                      else resolve(dataUrl);
                    },
                  );
                });
              } catch (_e) {
                screenshotUrl = "";
              }
            }
            aiSummary.textContent = summary;
            aiSummary.style.display = "block";
            if (screenshotUrl) {
              // Show screenshot below summary
              let img = document.getElementById("pageScreenshot");
              if (!img) {
                img = document.createElement("img");
                img.id = "pageScreenshot";
                img.style.maxWidth = "100%";
                img.style.marginTop = "8px";
                aiSummary.parentNode.insertBefore(img, aiSummary.nextSibling);
              }
              img.src = screenshotUrl;
              img.style.display = "block";
            }
            statusDiv.textContent = screenshotUrl
              ? "Page content extracted (fallback: screenshot and summary)."
              : "Page content extracted and summarized.";
            statusDiv.style.color = "#00796b";
          } else {
            showError(
              "Failed to extract page content.",
              "Reload the page or check permissions.",
            );
            console.error("[popup] Failed to extract page content:", results);
          }
        },
      );
    });
  });

// Already declared above: const authStatus = document.getElementById("authStatus");
if (anchorType && googleSignInBtn && authStatus) {
  anchorType.addEventListener("change", () => {
    updateAuthUI();
  });
  updateAuthUI();
}

// Handle Google sign-in

if (googleSignInBtn && authStatus) {
  googleSignInBtn.addEventListener("click", async () => {
    statusDiv.textContent = "Signing in to Google...";
    console.log("[popup] Google sign-in button clicked");
    chrome.runtime.sendMessage(
      { type: "GOOGLE_AUTH_REQUEST" },
      async (response) => {
        console.log("[popup] Google sign-in response:", response);
        if (response && response.ok && response.token) {
          googleAuthToken = response.token;
          await setGoogleAuthToken(response.token);
          // Fetch and store user profile
          const { fetchGoogleUserProfile } = await import(
            "../lib/google-auth-utils.js"
          );
          await fetchGoogleUserProfile(response.token);
          statusDiv.textContent = "Google sign-in successful.";
          statusDiv.style.color = "#00796b";
          updateAuthUI();
        } else {
          showError(
            "Google sign-in failed.",
            "Check your Chrome login or try again.",
          );
          updateAuthUI();
          console.error("[popup] Google sign-in failed:", response);
        }
      },
    );
  });
}

googleLogOutBtn.addEventListener("click", async () => {
  statusDiv.textContent = "Logging out from Google...";
  if (!googleAuthToken) {
    updateAuthUI();
    return;
  }
  chrome.identity.removeCachedAuthToken(
    { token: googleAuthToken },
    async function () {
      await removeGoogleAuthToken();
      googleAuthToken = null;
      statusDiv.textContent = "Logged out from Google.";
      await updateAuthUI();
    },
  );
});


entryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  // Always get the latest token before any Google API call
  googleAuthToken = await getGoogleAuthToken();
  // Block if Google Anchor is selected and not signed in
  if (anchorType && anchorType.value === "google" && !googleAuthToken) {
    showError(
      "Google sign-in required before generating Codex entry.",
      "Please sign in with Google and try again.",
    );
    return;
  }
  // Disable button and show spinner cursor
  generateBtn.disabled = true;
  document.body.style.cursor = "wait";
  // Prepare file/bytes and determine large file
  const file = fileInput.files[0];
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const LARGE_FILE_THRESHOLD = 3 * 1024 * 1024; // 3MB
  const bytes = extractedBytes
    ? extractedBytes
    : file
      ? new Uint8Array()
      : null;
  const filename = file ? file.name : "extracted.txt";
  // Guard against empty input
  if (!bytes || bytes.length === 0) {
    showError(
      "No file or extracted content available.",
      "Please select a file or extract page content before generating a Codex entry.",
    );
    return;
  }
  // Get createdBy info
  let createdBy = { type: "mock" };
  if (anchorType && anchorType.value === "google" && googleAuthToken) {
    // Try to get user profile from chrome.storage.local
    createdBy = await new Promise((resolve) => {
      chrome.storage.local.get(["googleUserProfile"], (result) => {
        if (result && result.googleUserProfile) {
          resolve({
            type: "google",
            email: result.googleUserProfile.email,
            name: result.googleUserProfile.name,
            picture: result.googleUserProfile.picture,
          });
        } else {
          resolve({ type: "google", email: "unknown" });
        }
      });
    });
  }
  const isLargeFile = bytes && bytes.length > LARGE_FILE_THRESHOLD;
  if (isLargeFile) {
    // Wake up service worker before Port connection
    chrome.runtime.sendMessage({ type: "PING" }, function (_response) {
      if (chrome.runtime.lastError) {
        // Silently log for diagnostics; no user impact if upload proceeds
        console.warn(
          "[popup] PING lastError (safe to ignore if upload succeeds):",
          chrome.runtime.lastError.message,
        );
        // Do not update UI or interrupt workflow
      }
      // Use Port-based chunked transfer
      const port = chrome.runtime.connect();
      let sentChunks = 0;
      let totalChunks = Math.ceil(bytes.length / CHUNK_SIZE);
      statusDiv.textContent = `Uploading large file in ${totalChunks} chunks...`;
      updateStepper("step-upload", "active");
      // Send metadata first
      port.postMessage({
        type: "START_LARGE_FILE_UPLOAD",
        filename,
        anchorType: anchorType ? anchorType.value : "mock",
        googleAuthToken: googleAuthToken,
        totalChunks,
        createdBy,
      });
      // Send chunks
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        port.postMessage({
          type: "LARGE_FILE_CHUNK",
          chunkIndex: sentChunks,
          chunk: Array.from(chunk),
        });
        sentChunks++;
        statusDiv.textContent = `Uploading chunk ${sentChunks} of ${totalChunks}...`;
      }
      // Signal completion
      port.postMessage({ type: "END_LARGE_FILE_UPLOAD" });
      port.onMessage.addListener(function (msg) {
        handleCodexResponse(msg);
        // Re-enable button and restore cursor
        generateBtn.disabled = false;
        document.body.style.cursor = "";
      });
    });
  } else {
    // Use existing sendMessage workflow for small files
    chrome.runtime.sendMessage(
      {
        type: "CREATE_CODEX_FROM_FILE",
        payload: {
          bytes: Array.from(bytes),
          filename,
          anchorType: anchorType ? anchorType.value : "mock",
          googleAuthToken: googleAuthToken,
          createdBy,
        },
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.warn(
            "[popup] CREATE_CODEX_FROM_FILE lastError:",
            chrome.runtime.lastError.message,
          );
        }
        handleCodexResponse(response);
        // Re-enable button and restore cursor
        generateBtn.disabled = false;
        document.body.style.cursor = "";
      },
    );
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([jsonResult.textContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codex-entry.json";
  a.click();
  URL.revokeObjectURL(url);
});

downloadZipBtn.addEventListener("click", () => {
  if (!currentZipBlob) {
    statusDiv.textContent = "No zip archive available for download.";
    statusDiv.style.color = "#c62828";
    return;
  }
  
  // Extract codex ID from the entry for filename
  let codexId = "codex";
  try {
    const entry = JSON.parse(jsonResult.textContent);
    if (entry && entry.id) {
      codexId = entry.id;
    }
  } catch (err) {
    console.warn("[popup] Could not parse codex entry for ID:", err);
  }
  
  const url = URL.createObjectURL(currentZipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${codexId}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  statusDiv.textContent = "Zip archive downloaded.";
  statusDiv.style.color = "#00796b";
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(jsonResult.textContent);
  statusDiv.textContent = "Copied to clipboard.";
});

// Revoke and refresh Google Auth token on demand
// eslint-disable-next-line no-unused-vars
const refreshGoogleAuth = () => {
  if (!googleAuthToken) {
    console.warn("[popup] No Google Auth token to refresh");
    return;
  }
  chrome.identity.removeCachedAuthToken(
    { token: googleAuthToken },
    function () {
      console.log("[popup] Removed cached auth token");
      // Optionally, you can get a new token immediately
      chrome.identity.getAuthToken({ interactive: true }, function (newToken) {
        if (chrome.runtime.lastError) {
          console.error(
            "[popup] Error getting new auth token:",
            chrome.runtime.lastError,
          );
          return;
        }
        googleAuthToken = newToken;
        console.log("[popup] Got new auth token:", googleAuthToken);
        statusDiv.textContent = "Google Auth token refreshed.";
      });
    },
  );
};

// On extension load or popup open
function initializeAuthUI() {
  updateAuthUI();
}

// Remove automatic token request on load
initializeAuthUI();
