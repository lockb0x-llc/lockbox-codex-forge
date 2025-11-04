// lib/codex-workflow.js
// Lockb0x Codex Forge: End-to-end workflow for payload and codex entry archiving and upload

import { signCodexEntry } from './codex-utils.js';
import { createCodexZipArchive } from './zip-archive.js';
import { uploadFileToGoogleDrive } from './drive-utils.js';

/**
 * Processes a codex entry and payload: updates entry, creates zip, uploads zip to Google Drive
 * @param {Uint8Array} payloadBytes - The payload file content as bytes
 * @param {string} payloadFilename - Original filename for the payload
 * @param {object} codexEntry - The codex entry object (with storage/anchor info to update)
 * @param {object} storageMetadata - { location, tx, url } to update in codexEntry
 * @param {string} driveToken - Google Drive OAuth token
 * @returns {Promise<{ updatedEntry, driveResult, zipBlob }>} - Updated entry, Drive upload result, and zip blob
 */
export async function processCodexEntryAndArchive({ payloadBytes, payloadFilename, codexEntry, storageMetadata, driveToken }) {
  // 1. Update codex entry with storage and anchor info
  if (storageMetadata.location) codexEntry.storage.location = storageMetadata.location;
  if (storageMetadata.tx) codexEntry.anchor.tx = storageMetadata.tx;
  if (storageMetadata.url) codexEntry.anchor.url = storageMetadata.url;
  // 2. Append new covering signature
  await signCodexEntry(codexEntry);

  // 3. Create zip archive
  const zipBlob = await createCodexZipArchive(payloadBytes, payloadFilename, codexEntry);

  // 4. Upload zip to Google Drive
  const driveResult = await uploadFileToGoogleDrive({
    bytes: await zipBlob.arrayBuffer(),
    filename: `${codexEntry.id}.zip`,
    mimeType: 'application/zip',
    token: driveToken,
  });

  return { updatedEntry: codexEntry, driveResult, zipBlob };
}
