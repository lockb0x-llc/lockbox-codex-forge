// popup.js - Handles popup UI logic for Lockb0x Protocol Codex Forge
import { summarizeText } from "../lib/ai.js";
import { readFile, extractPageContent } from "../lib/file-utils.js";
import {
  setStatusMessage,
  toggleButtonVisibility,
  showJsonResult,
  showCertificateSummary,
  showAISummary,
  updateStepper
} from "./popup-ui.js";

import {
  getGoogleAuthToken,
  setGoogleAuthToken,
  removeGoogleAuthToken,
  fetchGoogleUserProfile,
} from "../lib/google-auth-utils.js";

const fileInput = document.getElementById("fileInput");
const extractPageBtn = document.getElementById("extractPageBtn");
const anchorType = document.getElementById("anchorType");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const generateBtn = document.getElementById("generateBtn");
const entryForm = document.getElementById("entryForm");
const jsonResult = document.getElementById("jsonResult");
const aiSummary = document.getElementById("aiSummary");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const statusDiv = document.getElementById("status");

let googleAuthToken = null;
let googleLogOutBtn = document.getElementById("googleLogOutBtn");

let extractedData = "";
let extractedBytes = null;

// Handles Codex entry generation responses for both small and large files
function handleCodexResponse(response) {
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
    // If Google Drive payload, validate existence before export
    let payloadExists = true;
    let payloadValidationMsg = "";
    if (
      response.entry.storage &&
      response.entry.storage.protocol === "gdrive" &&
      response.payloadDriveInfo &&
      response.payloadDriveInfo.id &&
      googleAuthToken
    ) {
      (async () => {
        try {
          const validatePayload = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              {
                type: "VALIDATE_PAYLOAD_EXISTENCE",
                payload: {
                  fileId: response.payloadDriveInfo.id
                },
              },
              resolve,
            );
          });
          if (validatePayload && validatePayload.ok && validatePayload.exists) {
            payloadExists = true;
            payloadValidationMsg = "Payload exists on Google Drive.";
          } else if (validatePayload && validatePayload.error && validatePayload.error.includes('token expired')) {
            payloadExists = false;
            payloadValidationMsg = "Google token expired. Please sign in again.";
            await updateAuthUI();
          } else {
            payloadExists = false;
            payloadValidationMsg = "Payload NOT found on Google Drive.";
          }
        } catch (_err) {
          payloadExists = false;
          payloadValidationMsg = "Error validating payload existence.";
        }
        updateCodexUI(response, payloadExists, payloadValidationMsg);
      })();
    } else {
      updateCodexUI(response, payloadExists, payloadValidationMsg);
    }
  } else if (response && typeof response.ok !== "undefined") {
    let errorMsg = "Failed to generate entry.\n";
    errorMsg += "Full response object:\n" + JSON.stringify(response, null, 2) + "\n";
    if (response && response.error) {
      errorMsg += "Error:\n" + JSON.stringify(response.error, null, 2) + "\n";
    }
    if (response && "details" in response) {
      errorMsg += "Schema errors:\n";
      if (Array.isArray(response.details) && response.details.length > 0) {
        errorMsg += response.details.map((e) => e.message).join("\n") + "\n";
      } else {
        errorMsg += JSON.stringify(response.details, null, 2) + "\n";
      }
    }
    setStatusMessage(errorMsg, "error", "Check error details above and try again.");
    console.error("[popup] Failed to generate entry:", JSON.stringify(response, null, 2));
    if (response && response.entry) {
      console.log("[popup] Entry object:", response.entry);
    }
  }
}
// Update stepper UI for each step
// Utility to show error and recovery instructions in the popup
function showError(message, recovery) {
  setStatusMessage(`Error: ${message}`, "error", recovery);
  if (typeof generateBtn !== 'undefined' && generateBtn) {
    generateBtn.disabled = false;
  }
  console.error("[popup] Error:", message, recovery || "");
}

// Update Codex UI with entry and payload status
function updateCodexUI(response, payloadExists, payloadValidationMsg) {
  showJsonResult(response && response.entry ? response.entry : null);
  showCertificateSummary(response && response.entry && response.entry.certificate ? response.entry.certificate : null);
  showAISummary(response && response.entry && response.entry.ai ? response.entry.ai : null);
  if (payloadValidationMsg) {
    setStatusMessage(payloadValidationMsg, payloadExists ? "success" : "error");
  }
  if (response && response.ok && response.entry) {
    setStatusMessage(
      "Codex entry generated successfully." + (payloadValidationMsg ? "\n" + payloadValidationMsg : ""),
      "success"
    );
    toggleButtonVisibility("generateBtn", false);
    toggleButtonVisibility("downloadBtn", true);
    toggleButtonVisibility("copyBtn", true);
  }
}

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



// Load token from chrome.storage on startup
getGoogleAuthToken().then((token) => {
  googleAuthToken = token;
  updateAuthUI();
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
    chrome.storage.local.get(["googleUserProfile"], async (result) => {
      let profile = result.googleUserProfile;
      if (!profile) {
        profile = await fetchGoogleUserProfile(googleAuthToken);
      }
      if (profile && profile.name && profile.email && profile.picture) {
        userProfileDiv.innerHTML = `<img src="${profile.picture}" alt="avatar" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;"> <span style="font-weight:bold;">${profile.name}</span> <span style="color:#616161;">(${profile.email})</span>`;
      } else {
        userProfileDiv.textContent = "Google profile unavailable. Please sign in again.";
        setStatusMessage("Google profile unavailable. Try signing in again.", "error");
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
  if (!file) {
    setStatusMessage("No file selected.", "error", "Please choose a file to upload.");
    return;
  }
  readFile(file, (bytes, data, err) => {
    if (err) {
      setStatusMessage("Error reading file.", "error", "Try a different file or check file format.");
      console.error("[popup] FileReader error:", err);
      extractedData = "";
      extractedBytes = null;
      return;
    }
    extractedBytes = bytes;
    extractedData = data;
    setStatusMessage(`Loaded file: ${file.name}`, "success");
    console.log("[popup] File loaded:", file.name);
  });
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
          "Switch to a regular web page and try again."
        );
        console.warn("[popup] Attempted to extract from chrome:// URL:", tab.url);
        return;
      }
      // Use shared utility for extraction
      extractPageContent(tab.id, async (bytes, data, err) => {
        if (err) {
          showError(
            "Failed to extract page content.",
            "Reload the page or check permissions."
          );
          console.error("[popup] Failed to extract page content:", err);
          return;
        }
        extractedData = data;
        extractedBytes = bytes;
        let summary = "";
        let screenshotUrl = "";
        try {
          summary = await summarizeText(extractedData);
        } catch (_err) {
          summary = extractedData.slice(0, 100);
          try {
            screenshotUrl = await new Promise((resolve, reject) => {
              chrome.tabs.captureVisibleTab(
                tab.windowId,
                { format: "png" },
                (dataUrl) => {
                  if (chrome.runtime.lastError || !dataUrl)
                    reject(chrome.runtime.lastError);
                  else resolve(dataUrl);
                }
              );
            });
          } catch (_e) {
            screenshotUrl = "";
          }
        }
        aiSummary.textContent = summary;
        aiSummary.style.display = "block";
        if (screenshotUrl) {
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
      });
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
    setStatusMessage("Signing in to Google...", "info");
    console.log("[popup] Google sign-in button clicked");
    chrome.runtime.sendMessage(
      { type: "GOOGLE_AUTH_REQUEST" },
      async (response) => {
        console.log("[popup] Google sign-in response:", response);
        if (response && response.ok && response.token) {
          googleAuthToken = response.token;
          await setGoogleAuthToken(response.token);
          await fetchGoogleUserProfile(response.token);
          setStatusMessage("Google sign-in successful.", "success");
          updateAuthUI();
        } else {
          setStatusMessage("Google sign-in failed.", "error", "Check your Chrome login or try again.");
          updateAuthUI();
          console.error("[popup] Google sign-in failed:", response);
        }
      },
    );
  });
}

googleLogOutBtn.addEventListener("click", async () => {
  setStatusMessage("Logging out from Google...", "info");
  if (!googleAuthToken) {
    updateAuthUI();
    return;
  }
  chrome.identity.removeCachedAuthToken(
    { token: googleAuthToken },
    async function () {
      await removeGoogleAuthToken();
      googleAuthToken = null;
      setStatusMessage("Logged out from Google.", "success");
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
