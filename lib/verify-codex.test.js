// lib/verify-codex.test.js
import { describe, it, expect } from 'vitest';
import {
  extractZipArchive,
  verifyPayloadIntegrity,
  verifyCodexSignatures,
  verifyCodexEntry,
  verifyZipArchive,
} from './verify-codex.js';
import { createCodexZipArchive } from './zip-archive.js';
import { sha256, niSha256, signEntryCanonical } from './protocol.js';

describe('verify-codex', () => {
  // Helper to create a test codex entry
  async function createTestCodexEntry(payloadBytes) {
    const hashBytes = await sha256(payloadBytes);
    const integrity_proof = niSha256(hashBytes);

    const entry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      version: '0.0.2',
      storage: {
        protocol: 'gdrive',
        location: 'https://drive.google.com/file/d/test123',
        integrity_proof,
      },
      identity: {
        org: 'Test Org',
        process: 'Test Process',
        artifact: 'test.txt',
      },
      anchor: {
        chain: 'mock:local',
        tx: 'test-tx-123',
        hash_alg: 'sha-256',
      },
      signatures: [],
    };

    return entry;
  }

  // Helper to sign a codex entry
  async function signTestEntry(entry) {
    const entryWithoutSigs = structuredClone(entry);
    delete entryWithoutSigs.signatures;
    
    const canonical = jcsStringify(entryWithoutSigs);
    const sig = await signEntryCanonical(canonical);
    entry.signatures.push(sig);
    
    return entry;
  }

  // Helper: RFC 8785 canonicalization
  function jcsStringify(obj) {
    const sort = (v) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, sort(v[k])]),
          )
        : Array.isArray(v)
          ? v.map(sort)
          : v;
    return JSON.stringify(sort(obj));
  }

  describe('extractZipArchive', () => {
    it('extracts payload and codex entry from zip', async () => {
      const payloadBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const codexEntry = await createTestCodexEntry(payloadBytes);
      const zipBlob = await createCodexZipArchive(payloadBytes, 'test.bin', codexEntry);

      const result = await extractZipArchive(zipBlob);

      expect(result.payload).toEqual(payloadBytes);
      expect(result.payloadFilename).toBe('test.bin');
      expect(result.codexEntry).toBeDefined();
      expect(result.codexEntry.id).toBe(codexEntry.id);
    });

    it('throws error if codex-entry.json is missing', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      zip.file('test.txt', 'test data');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      await expect(extractZipArchive(zipBlob)).rejects.toThrow(
        'codex-entry.json not found in zip archive'
      );
    });

    it('throws error if no payload file found', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      zip.file('codex-entry.json', JSON.stringify({ id: 'test' }));
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      await expect(extractZipArchive(zipBlob)).rejects.toThrow(
        'No payload file found in zip archive'
      );
    });
  });

  describe('verifyPayloadIntegrity', () => {
    it('verifies matching payload hash', async () => {
      const payloadBytes = new Uint8Array([10, 20, 30, 40, 50]);
      const codexEntry = await createTestCodexEntry(payloadBytes);

      const result = await verifyPayloadIntegrity(payloadBytes, codexEntry);

      expect(result.valid).toBe(true);
      expect(result.computedHash).toBe(result.expectedHash);
    });

    it('fails when payload hash does not match', async () => {
      const payloadBytes = new Uint8Array([10, 20, 30, 40, 50]);
      const wrongPayload = new Uint8Array([99, 88, 77, 66, 55]);
      const codexEntry = await createTestCodexEntry(payloadBytes);

      const result = await verifyPayloadIntegrity(wrongPayload, codexEntry);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
      expect(result.computedHash).not.toBe(result.expectedHash);
    });

    it('fails when integrity_proof is missing', async () => {
      const payloadBytes = new Uint8Array([1, 2, 3]);
      const codexEntry = { storage: {} };

      const result = await verifyPayloadIntegrity(payloadBytes, codexEntry);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing storage.integrity_proof');
    });
  });

  describe('verifyCodexSignatures', () => {
    it('verifies valid ES256 signature', async () => {
      const payloadBytes = new Uint8Array([5, 10, 15, 20]);
      let codexEntry = await createTestCodexEntry(payloadBytes);
      codexEntry = await signTestEntry(codexEntry);

      const result = await verifyCodexSignatures(codexEntry);

      expect(result.valid).toBe(true);
      expect(result.verifiedSignatures).toBe(1);
    });

    it('fails when signatures array is missing', async () => {
      const codexEntry = { id: 'test', version: '0.0.2' };

      const result = await verifyCodexSignatures(codexEntry);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing signatures array');
    });

    it('fails when signatures array is empty', async () => {
      const codexEntry = {
        id: 'test',
        version: '0.0.2',
        signatures: [],
      };

      const result = await verifyCodexSignatures(codexEntry);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('has no signatures');
    });
  });

  describe('verifyCodexEntry', () => {
    it('verifies complete valid codex entry', async () => {
      const payloadBytes = new Uint8Array([100, 200, 50, 75]);
      let codexEntry = await createTestCodexEntry(payloadBytes);
      codexEntry = await signTestEntry(codexEntry);

      const result = await verifyCodexEntry(payloadBytes, codexEntry);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.details.integrity.valid).toBe(true);
      expect(result.details.signatures.valid).toBe(true);
    });

    it('fails when both integrity and signature are invalid', async () => {
      const payloadBytes = new Uint8Array([1, 2, 3]);
      const wrongPayload = new Uint8Array([9, 8, 7]);
      let codexEntry = await createTestCodexEntry(payloadBytes);
      // Don't sign it - no signatures

      const result = await verifyCodexEntry(wrongPayload, codexEntry);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('verifyZipArchive', () => {
    it('verifies complete valid zip archive', async () => {
      const payloadBytes = new Uint8Array([50, 100, 150, 200]);
      let codexEntry = await createTestCodexEntry(payloadBytes);
      codexEntry = await signTestEntry(codexEntry);
      const zipBlob = await createCodexZipArchive(payloadBytes, 'data.bin', codexEntry);

      const result = await verifyZipArchive(zipBlob);

      // Debug: log result if not valid
      if (!result.valid) {
        console.log('Verification failed:', result);
      }

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.payloadFilename).toBe('data.bin');
      expect(result.codexEntry).toBeDefined();
    });

    it('fails when zip archive is invalid', async () => {
      const invalidZip = new Blob(['not a zip file']);

      const result = await verifyZipArchive(invalidZip);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
