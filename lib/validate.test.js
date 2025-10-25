// Jest unit tests for validate.js
import { describe, test, expect } from 'vitest';
import { validateCodexEntry } from './validate.js';

describe('validate.js', () => {
  test('validateCodexEntry returns valid for correct entry', async () => {
    const validEntry = {
      id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      version: '0.0.2',
      storage: {
        protocol: 'gdrive',
        location: 'Qm123',
        integrity_proof: 'ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      },
      identity: {
        org: 'Codex Forge',
        process: 'test',
        artifact: 'file.txt'
      },
      anchor: {
        chain: 'gdrive:Qm123',
        tx: 'txid',
        hash_alg: 'sha-256'
      },
      signatures: []
    };
    const result = await validateCodexEntry(validEntry);
    if (!result.valid) {
      // Log errors for easier debugging
      console.error('Validation errors:', result.errors);
    }
    expect(result.valid).toBe(true);
  });

  test('validateCodexEntry returns invalid for missing required', async () => {
    const invalidEntry = { foo: 'bar' };
    const result = await validateCodexEntry(invalidEntry);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
