// lib/verify-codex.js
// Verification utilities for Lockb0x Codex entries

import JSZip from 'jszip';
import { sha256, niSha256, jcsStringify } from './protocol.js';

/**
 * Extracts payload and codex entry from a zip archive
 * @param {Blob|ArrayBuffer} zipData - The zip archive data
 * @returns {Promise<{payload: Uint8Array, payloadFilename: string, codexEntry: object, codexEntryFromArchive: object}>}
 */
export async function extractZipArchive(zipData) {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipData);

  // Extract the full codex entry from the archive comment (for signature verification)
  let codexEntry = null;
  if (loadedZip.comment) {
    try {
      codexEntry = JSON.parse(loadedZip.comment);
    } catch (_err) {
      // If comment parsing fails, we'll use the file instead
    }
  }

  // Find codex-entry.json (without storage.location)
  const codexFile = zip.file('codex-entry.json');
  if (!codexFile) {
    throw new Error('codex-entry.json not found in zip archive');
  }

  const codexText = await codexFile.async('text');
  const codexEntryFromArchive = JSON.parse(codexText);

  // If we didn't get the full entry from comment, use the file version
  if (!codexEntry) {
    codexEntry = codexEntryFromArchive;
  }

  // Find the payload file (any file that's not codex-entry.json)
  const files = Object.keys(zip.files).filter(name => name !== 'codex-entry.json' && !zip.files[name].dir);
  
  if (files.length === 0) {
    throw new Error('No payload file found in zip archive');
  }
  if (files.length > 1) {
    throw new Error('Multiple payload files found in zip archive. Expected exactly one.');
  }

  const payloadFilename = files[0];
  const payloadFile = zip.file(payloadFilename);
  const payloadBytes = await payloadFile.async('uint8array');

  return {
    payload: payloadBytes,
    payloadFilename,
    codexEntry, // Full entry from comment (with storage.location)
    codexEntryFromArchive, // Entry from file (without storage.location)
  };
}

/**
 * Verifies that a payload matches the integrity proof in a codex entry
 * @param {Uint8Array} payloadBytes - The payload file content
 * @param {object} codexEntry - The codex entry object
 * @returns {Promise<{valid: boolean, error?: string, computedHash?: string, expectedHash?: string}>}
 */
export async function verifyPayloadIntegrity(payloadBytes, codexEntry) {
  if (!codexEntry.storage || !codexEntry.storage.integrity_proof) {
    return {
      valid: false,
      error: 'Codex entry missing storage.integrity_proof',
    };
  }

  const expectedHash = codexEntry.storage.integrity_proof;
  
  // Compute hash of payload
  const hashBytes = await sha256(payloadBytes);
  const computedHash = niSha256(hashBytes);

  if (computedHash !== expectedHash) {
    return {
      valid: false,
      error: 'Payload hash does not match integrity_proof',
      computedHash,
      expectedHash,
    };
  }

  return {
    valid: true,
    computedHash,
    expectedHash,
  };
}

/**
 * Verifies ES256 signatures in a codex entry
 * @param {object} codexEntry - The codex entry object
 * @returns {Promise<{valid: boolean, error?: string, verifiedSignatures?: number}>}
 */
export async function verifyCodexSignatures(codexEntry) {
  if (!codexEntry.signatures || !Array.isArray(codexEntry.signatures)) {
    return {
      valid: false,
      error: 'Codex entry missing signatures array',
    };
  }

  if (codexEntry.signatures.length === 0) {
    return {
      valid: false,
      error: 'Codex entry has no signatures',
    };
  }

  // Create a copy of the entry without signatures for verification
  const entryForVerification = structuredClone(codexEntry);
  delete entryForVerification.signatures;

  // Canonicalize the entry (sort keys recursively)
  const canonical = jcsStringify(entryForVerification);
  const canonicalBytes = new TextEncoder().encode(canonical);

  let verifiedCount = 0;
  const errors = [];

  for (let i = 0; i < codexEntry.signatures.length; i++) {
    const sig = codexEntry.signatures[i];
    
    if (sig.alg !== 'ES256') {
      errors.push(`Signature ${i}: Unsupported algorithm '${sig.alg}'. Only ES256 is supported.`);
      continue;
    }

    try {
      // Extract JWK from kid
      if (!sig.kid || !sig.kid.startsWith('jwk:')) {
        errors.push(`Signature ${i}: Invalid kid format. Expected 'jwk:...'`);
        continue;
      }

      const jwkB64 = sig.kid.substring(4); // Remove 'jwk:' prefix
      const jwkBytes = base64urlDecode(jwkB64);
      const jwkJson = new TextDecoder().decode(jwkBytes);
      const jwk = JSON.parse(jwkJson);

      // Import the public key
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );

      // Decode signature from base64url
      const signatureBytes = base64urlDecode(sig.signature);

      // Verify signature
      const isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        signatureBytes,
        canonicalBytes
      );

      if (isValid) {
        verifiedCount++;
      } else {
        errors.push(`Signature ${i}: Verification failed`);
      }
    } catch (err) {
      errors.push(`Signature ${i}: ${err.message}`);
    }
  }

  if (verifiedCount === 0) {
    return {
      valid: false,
      error: `No signatures verified. Errors: ${errors.join('; ')}`,
      verifiedSignatures: 0,
    };
  }

  return {
    valid: true,
    verifiedSignatures: verifiedCount,
    totalSignatures: codexEntry.signatures.length,
  };
}

/**
 * Verifies a complete codex entry and its payload
 * @param {Uint8Array} payloadBytes - The payload file content
 * @param {object} codexEntry - The codex entry object
 * @returns {Promise<{valid: boolean, errors: string[], details: object}>}
 */
export async function verifyCodexEntry(payloadBytes, codexEntry) {
  const errors = [];
  const details = {};

  // 1. Verify payload integrity
  const integrityResult = await verifyPayloadIntegrity(payloadBytes, codexEntry);
  details.integrity = integrityResult;
  if (!integrityResult.valid) {
    errors.push(integrityResult.error);
  }

  // 2. Verify signatures
  const signatureResult = await verifyCodexSignatures(codexEntry);
  details.signatures = signatureResult;
  if (!signatureResult.valid) {
    errors.push(signatureResult.error);
  }

  return {
    valid: errors.length === 0,
    errors,
    details,
  };
}

/**
 * Verifies a zip archive containing payload and codex entry
 * @param {Blob|ArrayBuffer} zipData - The zip archive data
 * @returns {Promise<{valid: boolean, errors: string[], details: object}>}
 */
export async function verifyZipArchive(zipData) {
  try {
    // Extract files from zip
    const { payload, payloadFilename, codexEntry } = await extractZipArchive(zipData);

    // Verify the codex entry and payload
    const result = await verifyCodexEntry(payload, codexEntry);
    
    return {
      ...result,
      payloadFilename,
      codexEntry,
    };
  } catch (err) {
    return {
      valid: false,
      errors: [err.message],
      details: {},
    };
  }
}

// Helper: Base64url decode
function base64urlDecode(str) {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Decode base64 to bytes
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}
