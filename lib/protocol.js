// Google Anchor Adapter (stub)
export async function anchorGoogle(entry, googleAuthToken) {
  // TODO: Implement Google Cloud Anchor creation using Google APIs and OAuth token
  // Example: Use Google Drive API or other anchor service
  // Input: entry (Codex entry object), googleAuthToken (OAuth token)
  // Output: anchor object { chain: 'google:drive', tx: '<driveId or anchorId>', hash_alg: 'sha-256' }
  // Error handling: throw or return error object if API call fails
  throw new Error('Google anchor integration not yet implemented.');
}
// lib/protocol.js
// Protocol utilities for Lockb0x Codex Forge

// UUIDv4 generator
export function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)
  );
}

// SHA-256 hashing utility
export async function sha256(bytes) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(buf);
}

// Base64url encoding
const b64u = bytes =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,'');

// ni:///sha-256;... encoding
export function niSha256(hashBytes) {
  return `ni:///sha-256;${b64u(hashBytes)}`;
}

// RFC 8785 minimal canonicalization
export function jcsStringify(obj) {
  const sort = v =>
    (v && typeof v === "object" && !Array.isArray(v))
      ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]))
      : Array.isArray(v) ? v.map(sort) : v;
  return JSON.stringify(sort(obj));
}

// Local WebCrypto signing
export async function signEntryCanonical(canonical) {
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign","verify"]
  );
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key.privateKey,
    new TextEncoder().encode(canonical)
  );
  const signature = b64u(new Uint8Array(sigBuf));
  const jwk = await crypto.subtle.exportKey("jwk", key.publicKey);
  const kid = `jwk:${b64u(new TextEncoder().encode(JSON.stringify(jwk)))}`;
  return { alg: "ES256", kid, signature };
}

// Mock anchor provider
export async function anchorMock(entry) {
  const seed = new TextEncoder().encode(entry.id + (entry.storage?.integrity_proof || ""));
  const h = await sha256(seed);
  return { chain: "mock:local", tx: b64u(h), hash_alg: "sha-256" };
}
