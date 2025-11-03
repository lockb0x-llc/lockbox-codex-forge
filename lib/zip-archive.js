// lib/zip-archive.js
// Zip Archive Utility for Lockb0x Codex Forge
// Creates a .zip archive containing:
//   1. Payload file with its original filename
//   2. codex-entry.json (codex entry with storage.location excluded)
//   3. Archive-level comment set to the codex entry JSON

import JSZip from './JSZip/jszip.js';

/**
 * Creates a zip archive containing the payload and codex entry
 * @param {Uint8Array} payloadBytes - The payload file content as bytes
 * @param {string} payloadFilename - Original filename for the payload
 * @param {object} codexEntry - The codex entry object
 * @returns {Promise<Blob>} - A Blob containing the zip archive, ready for download/storage
 * 
 * @example
 * // Example usage in popup.js or background.js:
 * import { createCodexZipArchive } from './lib/zip-archive.js';
 * 
 * // Prepare the payload
 * const payloadBytes = new Uint8Array([...]); // Your file content
 * const payloadFilename = 'document.pdf';
 * 
 * // Prepare the codex entry (with storage.location present)
 * const codexEntry = {
 *   id: "123e4567-e89b-12d3-a456-426614174000",
 *   version: "0.0.2",
 *   storage: {
 *     protocol: "gdrive",
 *     location: "https://drive.google.com/file/d/abc123",
 *     integrity_proof: "ni:///sha-256;..."
 *   },
 *   identity: { org: "Example", process: "Upload", artifact: "document.pdf" },
 *   anchor: { chain: "google:drive", tx: "xyz", hash_alg: "sha-256" },
 *   signatures: [...]
 * };
 * 
 * // Create the zip archive
 * const zipBlob = await createCodexZipArchive(payloadBytes, payloadFilename, codexEntry);
 * 
 * // Download the zip archive
 * const url = URL.createObjectURL(zipBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `${codexEntry.id}.zip`;
 * a.click();
 * URL.revokeObjectURL(url);
 */
export async function createCodexZipArchive(payloadBytes, payloadFilename, codexEntry) {
  // Validate inputs
  if (!payloadBytes || !(payloadBytes instanceof Uint8Array)) {
    throw new Error('payloadBytes must be a Uint8Array');
  }
  if (!payloadFilename || typeof payloadFilename !== 'string') {
    throw new Error('payloadFilename must be a non-empty string');
  }
  if (!codexEntry || typeof codexEntry !== 'object') {
    throw new Error('codexEntry must be an object');
  }

  // Create a deep copy of the codex entry and exclude storage.location
  const codexEntryCopy = structuredClone(codexEntry);
  if (codexEntryCopy.storage && codexEntryCopy.storage.location) {
    delete codexEntryCopy.storage.location;
  }

  // Create a new JSZip instance
  const zip = new JSZip();

  // Add the payload file with its original filename
  zip.file(payloadFilename, payloadBytes);

  // Add the codex entry as codex-entry.json (with storage.location excluded)
  zip.file('codex-entry.json', codexEntryJson);

  // Add the codex entry as codex-entry.json (with storage.location excluded)
  const codexEntryJson = JSON.stringify(codexEntryCopy, null, 2);
  zip.file('codex-entry.json', codexEntryJson);

  // Set the archive-level comment to the full codex entry (stringified JSON)
  const archiveComment = JSON.stringify(codexEntry);

  // Generate the zip file as a Blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    comment: archiveComment,
  });

  return zipBlob;
}
