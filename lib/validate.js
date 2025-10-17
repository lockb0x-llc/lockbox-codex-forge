
// Minimal custom validator for Lockb0x Codex Entry v0.0.2
export async function validateCodexEntry(entry) {
  const errors = [];

  // Required top-level fields
  const requiredFields = ["id", "version", "storage", "identity", "anchor"];
  for (const field of requiredFields) {
    if (!(field in entry)) errors.push({ message: `Missing required field: ${field}` });
  }

  // id: UUIDv4
  if (entry.id && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(entry.id)) {
    errors.push({ message: "Invalid id format (must be UUIDv4)" });
  }

  // version
  if (entry.version && entry.version !== "0.0.2") {
    errors.push({ message: "Invalid version (must be '0.0.2')" });
  }

  // storage
  if (entry.storage) {
    const s = entry.storage;
    const sReq = ["protocol", "location", "integrity_proof"];
    for (const f of sReq) {
      if (!(f in s)) errors.push({ message: `storage: missing required field ${f}` });
    }
    if (s.protocol && !["ipfs", "https", "http", "s3", "filecoin", "arweave"].includes(s.protocol)) {
      errors.push({ message: "storage: invalid protocol" });
    }
    if (s.integrity_proof && !/^ni:\/\/\/sha-256;[A-Za-z0-9_-]{43,}$/.test(s.integrity_proof)) {
      errors.push({ message: "storage: invalid integrity_proof format" });
    }
    if (s.encryption && (!s.encryption.alg || typeof s.encryption.alg !== "string")) {
      errors.push({ message: "storage: encryption.alg required and must be string" });
    }
  }

  // identity
  if (entry.identity) {
    const i = entry.identity;
    const iReq = ["org", "process", "artifact"];
    for (const f of iReq) {
      if (!(f in i)) errors.push({ message: `identity: missing required field ${f}` });
    }
  }

  // anchor
  if (entry.anchor) {
    const a = entry.anchor;
    const aReq = ["chain", "tx", "hash_alg"];
    for (const f of aReq) {
      if (!(f in a)) errors.push({ message: `anchor: missing required field ${f}` });
    }
    if (a.chain && !/^[a-z0-9]+:[a-zA-Z0-9_-]+$/.test(a.chain)) {
      errors.push({ message: "anchor: invalid chain format" });
    }
    if (a.hash_alg && !["sha-256", "sha3-256", "blake3"].includes(a.hash_alg)) {
      errors.push({ message: "anchor: invalid hash_alg" });
    }
  }

  // signatures (optional)
  if (entry.signatures) {
    if (!Array.isArray(entry.signatures)) {
      errors.push({ message: "signatures must be an array" });
    } else {
      for (const sig of entry.signatures) {
        const sigReq = ["alg", "kid", "signature"];
        for (const f of sigReq) {
          if (!(f in sig)) errors.push({ message: `signature: missing required field ${f}` });
        }
      }
    }
  }

  // previous_id (optional)
  if (entry.previous_id && typeof entry.previous_id !== "string") {
    errors.push({ message: "previous_id must be a string" });
  }

  // No additional properties allowed at top level
  const allowedTop = ["id", "version", "storage", "identity", "anchor", "signatures", "previous_id"];
  for (const k of Object.keys(entry)) {
    if (!allowedTop.includes(k)) errors.push({ message: `Unexpected top-level property: ${k}` });
  }

  return { valid: errors.length === 0, errors };
}
