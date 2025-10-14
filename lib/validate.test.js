// Jest unit tests for validate.js
import { validateCodexEntry } from './validate.js';

describe('validate.js', () => {
  test('validateCodexEntry returns valid for correct entry', async () => {
    const validEntry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      version: '0.0.2',
      storage: {
        protocol: 'ipfs',
        location: 'Qm123',
        integrity_proof: 'ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      },
      identity: {
        org: 'Codex Forge',
        process: 'test',
        artifact: 'file.txt',
        subject: 'Test file'
      },
      anchor: {
        chain: 'ipfs:Qm123',
        tx: 'txid',
        hash_alg: 'sha-256'
      },
      signatures: []
    };
    const result = await validateCodexEntry(validEntry);
    expect(result.valid).toBe(true);
  });

  test('validateCodexEntry returns invalid for missing required', async () => {
    const invalidEntry = { foo: 'bar' };
    const result = await validateCodexEntry(invalidEntry);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
