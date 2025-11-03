// lib/small-file-handler.js
// Utility for handling small file uploads and Codex entry creation

import {
  sha256,
  niSha256,
  anchorMock,
  anchorGoogle,
  uuidv4,
} from "./protocol.js";
import { summarizeContent, generateProcessTag } from "./ai.js";
import { validateCodexEntry } from "./validate.js";
import { signCodexEntry, buildUnsignedCodexEntry } from "./codex-utils.js";
import {
  uploadFileToGoogleDrive,
  uploadCodexEntryToGoogleDrive,
} from "./drive-utils.js";
import {
  getValidGoogleAuthToken,
  removeGoogleAuthToken,
} from "./google-auth-utils.js";

/**
 * Handles small file upload and Codex entry creation
 * @param {Object} payload - { bytes, filename, anchorType, googleAuthToken, createdBy }
 * @returns {Promise<Object>} - { ok, entry, payloadDriveInfo, codexDriveInfo, codexSelfRefInfo, error, details }
 */
export async function handleSmallFileUpload(payload) {
  try {
    const fileBytes = new Uint8Array(payload.bytes);
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
    let freshToken = null;
    if (payload.anchorType === "google") {
      freshToken = await getValidGoogleAuthToken();
    }
    if (payload.anchorType === "google" && freshToken) {
      let mimeType = "application/octet-stream";
      if (payload.filename.match(/\.txt$/i)) mimeType = "text/plain";
      else if (payload.filename.match(/\.json$/i)) mimeType = "application/json";
      else if (payload.filename.match(/\.md$/i)) mimeType = "text/markdown";
      try {
        payloadDriveInfo = await uploadFileToGoogleDrive({
          bytes: fileBytes,
          filename: payload.filename,
          mimeType,
          token: freshToken,
        });
      } catch (err) {
        // If 401, try refreshing token and retry once
        if (err.message && err.message.includes("401")) {
          await removeGoogleAuthToken();
          freshToken = await getValidGoogleAuthToken();
          try {
            payloadDriveInfo = await uploadFileToGoogleDrive({
              bytes: fileBytes,
              filename: payload.filename,
              mimeType,
              token: freshToken,
            });
          } catch (err2) {
            return { ok: false, error: "Google Drive payload upload error (after refresh)", details: err2 };
          }
        } else {
          return { ok: false, error: "Google Drive payload upload error", details: err };
        }
      }
    }
    // Step 2: Compute hash and integrity_proof
    try {
      hash = await sha256(fileBytes);
      integrity = niSha256(hash);
      if (payload.filename.match(/\.(txt|md|json)$/i)) {
        fileText = new TextDecoder().decode(fileBytes);
        subject = await summarizeContent(fileText);
        processTag = await generateProcessTag(fileText);
      } else {
        fileText = null;
        subject = payload.filename;
        processTag = "binary-upload";
      }
    } catch (err) {
      return { ok: false, error: "Pre-anchor error", details: err };
    }
    // Step 3: Anchor
    if (payload.anchorType === "google" && freshToken) {
      try {
        anchor = await anchorGoogle(
          { id: uuidv4(), storage: { integrity_proof: integrity } },
          freshToken,
        );
      } catch (err) {
        return { ok: false, error: "Google anchor error", details: err };
      }
    } else {
      try {
        anchor = await anchorMock({
          id: uuidv4(),
          storage: { integrity_proof: integrity },
        });
      } catch (err) {
        return { ok: false, error: "Mock anchor error", details: err };
      }
    }
    // Step 4: Build unsigned Codex entry
    const codexId = uuidv4();
    entry = buildUnsignedCodexEntry({
      id: codexId,
      payloadDriveId: payloadDriveInfo ? payloadDriveInfo.id : undefined,
      payloadDriveUrl: payloadDriveInfo
        ? `https://drive.google.com/file/d/${payloadDriveInfo.id}`
        : payload.filename,
      integrity_proof: integrity,
      org: "Codex Forge",
      process: processTag,
      artifact: payload.filename,
      subject,
      anchor,
      createdBy: payload.createdBy,
      protocol:
        payload.anchorType === "google" && payloadDriveInfo
          ? "gdrive"
          : "local",
    });
    await signCodexEntry(entry);
    if (payload.anchorType === "google" && freshToken) {
      try {
        codexDriveInfo = await uploadCodexEntryToGoogleDrive({
          entry,
          token: freshToken,
        });
      } catch (err) {
        return { ok: false, error: "Google Drive Codex entry upload error", details: err };
      }
    }
    const validation = await validateCodexEntry(entry);
    if (!validation.valid) {
      return { ok: false, error: "Schema validation failed", details: validation.errors };
    }
    return {
      ok: true,
      entry,
      payloadDriveInfo,
      codexDriveInfo,
      codexSelfRefInfo,
    };
  } catch (err) {
    return { ok: false, error: "Unexpected error", details: err };
  }
}
