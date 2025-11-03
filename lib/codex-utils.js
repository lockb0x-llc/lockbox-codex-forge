// lib/codex-utils.js

/*
  Codex Entry Builder
  -------------------
  This module builds Codex entries that conform to the schema in schema/codex-entry.json.
  Reference valid entries: docs/codex-entry.json, docs/generated-sample-*.codex.json

  Schema highlights:
    - id: UUIDv4 (required)
    - version: "0.0.2" (required)
    - storage: protocol, location, integrity_proof (required)
      - protocol: "gdrive" is valid for Google Drive payloads
    - identity: org, process, artifact (required), subject (optional)
    - anchor: chain, tx, hash_alg (required), url, timestamp (optional)
    - signatures: array of signature objects (required)
    - previous_id: optional

  Always ensure builder matches schema and reference files for compatibility.
*/
import { jcsStringify, signEntryCanonical } from "./protocol.js";

export async function signCodexEntry(entry) {
  const canonical = jcsStringify(entry);
  const sig = await signEntryCanonical(canonical);
  entry.signatures.push(sig);
  return entry;
}

/**
 * Update codex entry with storage/anchor metadata and append a new signature
 * @param {object} entry - The codex entry to update
 * @param {object} storageMetadata - Storage metadata to add (location, tx, url)
 * @returns {Promise<object>} - The updated and re-signed codex entry
 */
export async function updateCodexEntryWithStorage(entry, storageMetadata) {
  // Update storage.location if provided
  if (storageMetadata.location) {
    entry.storage.location = storageMetadata.location;
  }
  
  // Update anchor.tx and anchor.url if provided
  if (storageMetadata.tx) {
    entry.anchor.tx = storageMetadata.tx;
  }
  if (storageMetadata.url) {
    entry.anchor.url = storageMetadata.url;
  }
  
  // Append new signature covering the updated entry
  await signCodexEntry(entry);
  
  return entry;
}

export function buildUnsignedCodexEntry({
  id,
  version = "0.0.2",
  payloadDriveId,
  payloadDriveUrl,
  integrity_proof,
  org = "Codex Forge",
  process,
  artifact,
  subject,
  anchor,
  createdBy,
  storageProtocol = "gdrive",
}) {
  // Only include 'subject' in identity if provided
  const identity = { org, process, artifact };
  if (subject) identity.subject = subject;
  return {
    id,
    version,
    storage: {
      protocol: storageProtocol,
      location:
        payloadDriveUrl ||
        (payloadDriveId
          ? `https://drive.google.com/file/d/${payloadDriveId}`
          : undefined),
      integrity_proof,
    },
    identity,
    anchor,
    signatures: [],
    createdBy,
  };
}

// Removed makeCodexEntrySelfReferential export to fix import error
