// ...existing code...
import { checkDriveFileExists } from "./lib/drive-utils.js";
import {
  getGoogleAuthToken,
  setGoogleAuthToken,
  removeGoogleAuthToken,
  getValidGoogleAuthToken,
  fetchGoogleUserProfile,
} from "./lib/google-auth-utils.js";
import { handleLargeFileUpload } from "./lib/large-file-handler.js";
import { handleSmallFileUpload } from "./lib/small-file-handler.js";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GOOGLE_AUTH_REQUEST") {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        const errMsg = chrome.runtime.lastError
          ? chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError)
          : "No token returned";
        console.error("[background] Google Auth error:", errMsg);
        sendResponse({ ok: false, error: errMsg });
      } else {
        await setGoogleAuthToken(token);
        sendResponse({ ok: true, token });
      }
    });
    return true;
  }
  if (msg.type === "VALIDATE_PAYLOAD_EXISTENCE") {
    (async function () {
      try {
        const { fileId } = msg.payload;
        const token = await getGoogleAuthToken();
        const metadata = await checkDriveFileExists({ fileId, token });
        sendResponse({ ok: true, exists: true, metadata });
      } catch (err) {
        if (err.message && err.message.includes('401')) {
          await removeGoogleAuthToken();
          sendResponse({ ok: false, exists: false, error: 'Google token expired. Please sign in again.' });
        } else {
          sendResponse({ ok: false, exists: false, error: err.message });
        }
      }
    })();
    return true;
  }
  if (msg.type === "CREATE_CODEX_FROM_FILE") {
    if (!["GOOGLE_AUTH_REQUEST", "VALIDATE_PAYLOAD_EXISTENCE", "CREATE_CODEX_FROM_FILE"].includes(msg.type)) {
      sendResponse({ ok: false, error: "Unknown message type" });
      return false;
    }
    (async function () {
      const result = await handleSmallFileUpload({ ...msg.payload });
      if (result.ok) {
        sendResponse({
          ok: true,
          entry: result.entry,
          payloadDriveInfo: result.payloadDriveInfo,
          codexDriveInfo: result.codexDriveInfo,
          codexSelfRefInfo: result.codexSelfRefInfo,
        });
      } else {
        sendResponse({
          ok: false,
          error: result.error,
          details: result.details,
        });
      }
    })();
    return true;
  }
});

chrome.runtime.onConnect.addListener(function (port) {
  let chunks = [];
  let metadata = {};
  port.onMessage.addListener(async function (msg) {
    if (msg.type === "START_LARGE_FILE_UPLOAD") {
      metadata = {
        filename: msg.filename,
        anchorType: msg.anchorType,
        googleAuthToken: msg.googleAuthToken,
        totalChunks: msg.totalChunks,
        createdBy: msg.createdBy,
      };
      chunks = [];
      port.postMessage({ status: "started" });
    } else if (msg.type === "LARGE_FILE_CHUNK") {
      chunks[msg.chunkIndex] = msg.chunk;
      port.postMessage({
        status: "chunk-received",
        chunkIndex: msg.chunkIndex,
      });
    } else if (msg.type === "END_LARGE_FILE_UPLOAD") {
      const result = await handleLargeFileUpload(metadata, chunks);
      if (result.ok) {
        port.postMessage({
          ok: true,
          entry: result.entry,
          payloadDriveInfo: result.payloadDriveInfo,
          codexDriveInfo: result.codexDriveInfo,
          codexSelfRefInfo: result.codexSelfRefInfo,
        });
      } else {
        port.postMessage({
          ok: false,
          error: result.error,
          details: result.details,
        });
      }
    }
  });
});
