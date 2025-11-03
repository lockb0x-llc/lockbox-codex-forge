// lib/zip-archive.js
// Zip Archive Utility for Lockb0x Codex Forge
// Creates a .zip archive containing:
//   1. Payload file with its original filename
//   2. codex-entry.json (codex entry with storage.location, anchor.tx, anchor.url excluded)
//   3. Archive-level comment set to the codex entry JSON

import JSZip from './JSZip/jszip.js';

// Constants
const CODEX_ENTRY_FILENAME = 'codex-entry.json';
const ZIP_COMPRESSION = 'STORE'; // No compression for integrity preservation

/**
 * Creates a zip archive containing the payload and codex entry
 * @param {Uint8Array} payloadBytes - The payload file content as bytes
 * @param {string} payloadFilename - Original filename for the payload
 * @param {object} codexEntry - The codex entry object
 * @param {string} password - Password for encryption (user's email or 'mock')
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
 * // Create the zip archive with encryption
 * const password = 'user@example.com'; // or 'mock' for mock anchor
 * const zipBlob = await createCodexZipArchive(payloadBytes, payloadFilename, codexEntry, password);
 * 
 * // Download the zip archive
 * const url = URL.createObjectURL(zipBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `${codexEntry.id}.zip`;
 * a.click();
 * URL.revokeObjectURL(url);
 */
export async function createCodexZipArchive(payloadBytes, payloadFilename, codexEntry, password) {
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
  if (!password || typeof password !== 'string') {
    throw new Error('password must be a non-empty string');
  }

  // Create a deep copy of the codex entry and exclude storage.location, anchor.tx, and anchor.url
  const codexEntryCopy = structuredClone(codexEntry);
  if (codexEntryCopy.storage && codexEntryCopy.storage.location) {
    delete codexEntryCopy.storage.location;
  }
  if (codexEntryCopy.anchor && codexEntryCopy.anchor.tx) {
    delete codexEntryCopy.anchor.tx;
  }
  if (codexEntryCopy.anchor && codexEntryCopy.anchor.url) {
    delete codexEntryCopy.anchor.url;
  }

  // Create a new JSZip instance
  const zip = new JSZip();

  // Add the payload file with its original filename (no compression)
  zip.file(payloadFilename, payloadBytes, { compression: ZIP_COMPRESSION });

  // Add the codex entry as codex-entry.json (with storage.location, anchor.tx, anchor.url excluded)
  const codexEntryJson = JSON.stringify(codexEntryCopy, null, 2);
  zip.file(CODEX_ENTRY_FILENAME, codexEntryJson, { compression: ZIP_COMPRESSION });

  // Set the archive-level comment to the full codex entry (stringified JSON)
  const archiveComment = JSON.stringify(codexEntry);

  // Generate the zip file as a Blob with encryption
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    comment: archiveComment,
    compression: ZIP_COMPRESSION, // No compression
    encryptStrength: 3, // AES-256 encryption
    password: password, // Encrypt with user's email or 'mock'
  });

  return zipBlob;
}
