import {
  sha256,
  niSha256,
  anchorMock,
  anchorGoogle,
  uuidv4,
} from "./lib/protocol.js";
import { summarizeContent, generateProcessTag } from "./lib/ai.js";
import { validateCodexEntry } from "./lib/validate.js";
import { signCodexEntry, buildUnsignedCodexEntry, updateCodexEntryWithStorage } from "./lib/codex-utils.js";
import { createCodexZipArchive } from "./lib/zip-archive.js";

import {
  uploadFileToGoogleDrive,
  uploadCodexEntryToGoogleDrive,
  uploadZipArchiveToGoogleDrive,
  checkDriveFileExists,
} from "./lib/drive-utils.js";
import {
  getGoogleAuthToken,
  setGoogleAuthToken,
  removeGoogleAuthToken,
  getValidGoogleAuthToken,
  fetchGoogleUserProfile,
} from "./lib/google-auth-utils.js";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GOOGLE_AUTH_REQUEST") {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        const errMsg = chrome.runtime.lastError
          ? chrome.runtime.lastError.message ||
            JSON.stringify(chrome.runtime.lastError)
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
  // Validate payload existence before export
  if (msg.type === "VALIDATE_PAYLOAD_EXISTENCE") {
    (async function () {
      try {
        const { fileId } = msg.payload;
        // Always use the latest token from storage
        const token = await getGoogleAuthToken();
        const metadata = await checkDriveFileExists({ fileId, token });
        sendResponse({ ok: true, exists: true, metadata });
      } catch (err) {
        // Centralized error handling for token expiration
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
    (async function () {
      try {
        const { bytes, filename, anchorType } = msg.payload;
        const fileBytes = new Uint8Array(bytes);
        let zipDriveInfo = null;
        let codexDriveInfo = null;
        let entry = null;
        let anchor = null;
        let subject = null;
        let processTag = null;
        let hash = null;
        let integrity = null;
        let fileText = null;
        let zipBlob = null;
        
        // Get token if Google anchor
        let freshToken = null;
        if (anchorType === "google") {
          freshToken = await getValidGoogleAuthToken();
        }
        
        // Get user email for encryption password
        let encryptionPassword = "mock"; // Default for mock anchor
        if (anchorType === "google" && freshToken) {
          try {
            const userProfile = await fetchGoogleUserProfile(freshToken);
            if (userProfile && userProfile.email) {
              encryptionPassword = userProfile.email;
            }
          } catch (err) {
            console.warn("[background] Could not fetch user profile, using 'mock' password:", err);
          }
        }
        
        // Step 1: Compute hash and integrity_proof
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
            processTag = "binary-upload";
          }
        } catch (err) {
          console.error("[background] Pre-anchor error:", err);
          sendResponse({ ok: false, error: "Pre-anchor error", details: err });
          return;
        }
        
        // Step 2: Create initial anchor (without tx/url)
        if (anchorType === "google" && freshToken) {
          try {
            anchor = await anchorGoogle(
              { id: uuidv4(), storage: { integrity_proof: integrity } },
              freshToken,
            );
          } catch (err) {
            console.error("[background] Google anchor error:", err);
            sendResponse({
              ok: false,
              error: "Google anchor error",
              details: err,
            });
            return;
          }
        } else {
          try {
            anchor = await anchorMock({
              id: uuidv4(),
              storage: { integrity_proof: integrity },
            });
          } catch (err) {
            console.error("[background] Mock anchor error:", err);
            sendResponse({
              ok: false,
              error: "Mock anchor error",
              details: err,
            });
            return;
          }
        }
        
        // Step 3: Build initial unsigned Codex entry (without storage.location)
        const codexId = uuidv4();
        entry = buildUnsignedCodexEntry({
          id: codexId,
          payloadDriveId: undefined,
          payloadDriveUrl: undefined, // Will be set after zip upload
          integrity_proof: integrity,
          org: "Codex Forge",
          process: processTag,
          artifact: filename,
          subject,
          anchor,
          createdBy: msg.payload.createdBy,
          protocol: anchorType === "google" ? "gdrive" : "local",
        });
        
        // Step 4: Sign initial codex entry
        await signCodexEntry(entry);
        
        // Step 5: Create zip archive with payload and initial codex entry
        try {
          zipBlob = await createCodexZipArchive(
            fileBytes,
            filename,
            entry,
            encryptionPassword
          );
        } catch (err) {
          console.error("[background] Zip archive creation error:", err);
          sendResponse({
            ok: false,
            error: "Zip archive creation error",
            details: err,
          });
          return;
        }
        
        // Step 6: Upload zip archive to Google Drive (if Google anchor)
        if (anchorType === "google" && freshToken) {
          try {
            zipDriveInfo = await uploadZipArchiveToGoogleDrive({
              zipBlob,
              filename: `${codexId}.zip`,
              token: freshToken,
            });
          } catch (err) {
            // If 401, try refreshing token and retry once
            if (err.message && err.message.includes("401")) {
              await removeGoogleAuthToken();
              freshToken = await getValidGoogleAuthToken();
              try {
                zipDriveInfo = await uploadZipArchiveToGoogleDrive({
                  zipBlob,
                  filename: `${codexId}.zip`,
                  token: freshToken,
                });
              } catch (err2) {
                sendResponse({
                  ok: false,
                  error: "Google Drive zip upload error (after refresh)",
                  details: err2,
                });
                return;
              }
            } else {
              sendResponse({
                ok: false,
                error: "Google Drive zip upload error",
                details: err,
              });
              return;
            }
          }
          
          // Step 7: Update codex entry with zip storage metadata
          await updateCodexEntryWithStorage(entry, {
            location: `https://drive.google.com/file/d/${zipDriveInfo.id}`,
            tx: zipDriveInfo.id,
            url: zipDriveInfo.webViewLink,
          });
        }
        
        // Step 8: Upload final codex entry to Google Drive (if Google anchor)
        if (anchorType === "google" && freshToken) {
          try {
            codexDriveInfo = await uploadCodexEntryToGoogleDrive({
              entry,
              token: freshToken,
            });
          } catch (err) {
            console.error(
              "[background] Google Drive Codex entry upload error:",
              err,
            );
            sendResponse({
              ok: false,
              error: "Google Drive Codex entry upload error",
              details: err,
            });
            return;
          }
        }
        
        console.log(
          "[background] Debug protocol before validation:",
          entry.storage.protocol,
        );
        const validation = await validateCodexEntry(entry);
        if (!validation.valid) {
          sendResponse({
            ok: false,
            error: "Schema validation failed",
            details: validation.errors,
          });
          return;
        }
        sendResponse({
          ok: true,
          entry,
          zipDriveInfo,
          zipBlob, // Include zip blob for download
          codexDriveInfo,
        });
      } catch (err) {
        console.error("[background] Unexpected error:", err);
        sendResponse({ ok: false, error: "Unexpected error", details: err });
      }
    })();
    return true;
  }
});

// --- Large file chunked upload support ---
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
          createdBy: msg.createdBy, // Preserve creator attribution for chunked uploads
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
        // Assemble file
        try {
          const allBytes = chunks.flat();
          const fileBytes = new Uint8Array(allBytes);
          // Reuse zip archive workflow
          let zipDriveInfo = null;
          let codexDriveInfo = null;
          let entry = null;
          let anchor = null;
          let subject = null;
          let processTag = null;
          let hash = null;
          let integrity = null;
          let fileText = null;
          let zipBlob = null;
          
          // Get token if Google anchor
          let freshToken = null;
          if (metadata.anchorType === "google") {
            freshToken = await getValidGoogleAuthToken();
          }
          
          // Get user email for encryption password
          let encryptionPassword = "mock"; // Default for mock anchor
          if (metadata.anchorType === "google" && freshToken) {
            try {
              const userProfile = await fetchGoogleUserProfile(freshToken);
              if (userProfile && userProfile.email) {
                encryptionPassword = userProfile.email;
              }
            } catch (err) {
              console.warn("[background] Could not fetch user profile, using 'mock' password:", err);
            }
          }
          
          // Step 1: Compute hash and integrity_proof
          try {
            hash = await sha256(fileBytes);
            integrity = niSha256(hash);
            if (metadata.filename.match(/\.(txt|md|json)$/i)) {
              fileText = new TextDecoder().decode(fileBytes);
              subject = await summarizeContent(fileText);
              processTag = await generateProcessTag(fileText);
            } else {
              fileText = null;
              subject = metadata.filename;
              processTag = "binary-upload";
            }
          } catch (err) {
            port.postMessage({
              ok: false,
              error: "Pre-anchor error",
              details: err,
            });
            return;
          }
          
          // Step 2: Create initial anchor
          if (metadata.anchorType === "google" && freshToken) {
            try {
              anchor = await anchorGoogle(
                { id: uuidv4(), storage: { integrity_proof: integrity } },
                freshToken,
              );
            } catch (err) {
              port.postMessage({
                ok: false,
                error: "Google anchor error",
                details: err,
              });
              return;
            }
          } else {
            try {
              anchor = await anchorMock({
                id: uuidv4(),
                storage: { integrity_proof: integrity },
              });
            } catch (err) {
              port.postMessage({
                ok: false,
                error: "Mock anchor error",
                details: err,
              });
              return;
            }
          }
          
          // Step 3: Build initial unsigned Codex entry
          const codexId = uuidv4();
          entry = buildUnsignedCodexEntry({
            id: codexId,
            payloadDriveId: undefined,
            payloadDriveUrl: undefined,
            integrity_proof: integrity,
            org: "Codex Forge",
            process: processTag,
            artifact: metadata.filename,
            subject,
            anchor,
            createdBy: metadata.createdBy,
            protocol: metadata.anchorType === "google" ? "gdrive" : "local",
          });
          
          // Step 4: Sign initial codex entry
          await signCodexEntry(entry);
          
          // Step 5: Create zip archive
          try {
            zipBlob = await createCodexZipArchive(
              fileBytes,
              metadata.filename,
              entry,
              encryptionPassword
            );
          } catch (err) {
            port.postMessage({
              ok: false,
              error: "Zip archive creation error",
              details: err,
            });
            return;
          }
          
          // Step 6: Upload zip archive to Google Drive
          if (metadata.anchorType === "google" && freshToken) {
            try {
              zipDriveInfo = await uploadZipArchiveToGoogleDrive({
                zipBlob,
                filename: `${codexId}.zip`,
                token: freshToken,
              });
            } catch (err) {
              // If 401, try refreshing token and retry once
              if (err.message && err.message.includes("401")) {
                await removeGoogleAuthToken();
                freshToken = await getValidGoogleAuthToken();
                try {
                  zipDriveInfo = await uploadZipArchiveToGoogleDrive({
                    zipBlob,
                    filename: `${codexId}.zip`,
                    token: freshToken,
                  });
                } catch (err2) {
                  port.postMessage({
                    ok: false,
                    error: "Google Drive zip upload error (after refresh)",
                    details: err2,
                  });
                  return;
                }
              } else {
                port.postMessage({
                  ok: false,
                  error: "Google Drive zip upload error",
                  details: err,
                });
                return;
              }
            }
            
            // Step 7: Update codex entry with zip storage metadata
            await updateCodexEntryWithStorage(entry, {
              location: `https://drive.google.com/file/d/${zipDriveInfo.id}`,
              tx: zipDriveInfo.id,
              url: zipDriveInfo.webViewLink,
            });
          }
          
          // Step 8: Upload final codex entry
          if (metadata.anchorType === "google" && freshToken) {
            try {
              codexDriveInfo = await uploadCodexEntryToGoogleDrive({
                entry,
                token: freshToken,
              });
            } catch (err) {
              port.postMessage({
                ok: false,
                error: "Google Drive Codex entry upload error",
                details: err,
              });
              return;
            }
          }
          const validation = await validateCodexEntry(entry);
          if (!validation.valid) {
            port.postMessage({
              ok: false,
              error: "Schema validation failed",
              details: validation.errors,
            });
            return;
          }
          port.postMessage({
            ok: true,
            entry,
            zipDriveInfo,
            zipBlob, // Include zip blob for download
            codexDriveInfo,
          });
        } catch (err) {
          port.postMessage({
            ok: false,
            error: "Unexpected error",
            details: err,
          });
        }
      }
    });
  });
