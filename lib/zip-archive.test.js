// lib/zip-archive.test.js
// Unit tests for zip-archive.js

import { createCodexZipArchive } from './zip-archive.js';
import JSZip from './JSZip/jszip.js';

describe('zip-archive', () => {
  // Sample codex entry for testing
  const sampleCodexEntry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    version: '0.0.2',
    storage: {
      protocol: 'gdrive',
      location: 'https://drive.google.com/file/d/abc123',
      integrity_proof: 'ni:///sha-256;dGVzdGhhc2g',
    },
    identity: {
      org: 'Test Org',
      process: 'Test Process',
      artifact: 'test.txt',
    },
    anchor: {
      chain: 'google:drive',
      tx: 'tx123',
      hash_alg: 'sha-256',
    },
    signatures: [
      {
        alg: 'ES256',
        kid: 'test-key',
        signature: 'test-signature',
      },
    ],
  };

  const samplePayloadBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  const samplePayloadFilename = 'test.txt';

  test('creates a valid zip archive with payload and codex entry', async () => {
    const zipBlob = await createCodexZipArchive(
      samplePayloadBytes,
      samplePayloadFilename,
      sampleCodexEntry
    );

    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.type).toBe('application/zip');

    // Read the zip and verify contents
    const zip = await JSZip.loadAsync(zipBlob);

    // Check that the payload file exists
    const payloadFile = zip.file(samplePayloadFilename);
    expect(payloadFile).toBeTruthy();

    // Verify payload content
    const payloadContent = await payloadFile.async('uint8array');
    expect(payloadContent).toEqual(samplePayloadBytes);

    // Check that codex-entry.json exists
    const codexFile = zip.file('codex-entry.json');
    expect(codexFile).toBeTruthy();

    // Verify codex-entry.json content (storage.location should be excluded)
    const codexContent = await codexFile.async('string');
    const codexJson = JSON.parse(codexContent);
    expect(codexJson.storage.location).toBeUndefined();
    expect(codexJson.storage.protocol).toBe('gdrive');
    expect(codexJson.storage.integrity_proof).toBe('ni:///sha-256;dGVzdGhhc2g');
    expect(codexJson.id).toBe(sampleCodexEntry.id);
  });

  test('sets archive-level comment to full codex entry', async () => {
    const zipBlob = await createCodexZipArchive(
      samplePayloadBytes,
      samplePayloadFilename,
      sampleCodexEntry
    );

    // Read the zip and check the comment
    const zip = await JSZip.loadAsync(zipBlob);
    const comment = zip.comment;

    expect(comment).toBeTruthy();
    const commentJson = JSON.parse(comment);
    expect(commentJson).toEqual(sampleCodexEntry);
    // Verify that the comment INCLUDES storage.location
    expect(commentJson.storage.location).toBe(
      'https://drive.google.com/file/d/abc123'
    );
  });

  test('throws error if payloadBytes is not a Uint8Array', async () => {
    await expect(
      createCodexZipArchive('invalid', samplePayloadFilename, sampleCodexEntry)
    ).rejects.toThrow('payloadBytes must be a Uint8Array');
  });

  test('throws error if payloadFilename is not a string', async () => {
    await expect(
      createCodexZipArchive(samplePayloadBytes, null, sampleCodexEntry)
    ).rejects.toThrow('payloadFilename must be a non-empty string');
  });

  test('throws error if codexEntry is not an object', async () => {
    await expect(
      createCodexZipArchive(samplePayloadBytes, samplePayloadFilename, null)
    ).rejects.toThrow('codexEntry must be an object');
  });

  test('handles codex entry without storage.location', async () => {
    const codexWithoutLocation = {
      ...sampleCodexEntry,
      storage: {
        protocol: 'local',
        integrity_proof: 'ni:///sha-256;dGVzdGhhc2g',
        // no location field
      },
    };

    const zipBlob = await createCodexZipArchive(
      samplePayloadBytes,
      samplePayloadFilename,
      codexWithoutLocation
    );

    const zip = await JSZip.loadAsync(zipBlob);
    const codexFile = zip.file('codex-entry.json');
    const codexContent = await codexFile.async('string');
    const codexJson = JSON.parse(codexContent);

    expect(codexJson.storage.location).toBeUndefined();
    expect(codexJson.storage.protocol).toBe('local');
  });

  test('handles binary payload correctly', async () => {
    const binaryPayload = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
    const binaryFilename = 'binary.bin';

    const zipBlob = await createCodexZipArchive(
      binaryPayload,
      binaryFilename,
      sampleCodexEntry
    );

    const zip = await JSZip.loadAsync(zipBlob);
    const payloadFile = zip.file(binaryFilename);
    const payloadContent = await payloadFile.async('uint8array');

    expect(payloadContent).toEqual(binaryPayload);
  });

  test('preserves all codex entry fields except storage.location', async () => {
    const zipBlob = await createCodexZipArchive(
      samplePayloadBytes,
      samplePayloadFilename,
      sampleCodexEntry
    );

    const zip = await JSZip.loadAsync(zipBlob);
    const codexFile = zip.file('codex-entry.json');
    const codexContent = await codexFile.async('string');
    const codexJson = JSON.parse(codexContent);

    // Check all fields are present except storage.location
    expect(codexJson.id).toBe(sampleCodexEntry.id);
    expect(codexJson.version).toBe(sampleCodexEntry.version);
    expect(codexJson.storage.protocol).toBe(sampleCodexEntry.storage.protocol);
    expect(codexJson.storage.integrity_proof).toBe(
      sampleCodexEntry.storage.integrity_proof
    );
    expect(codexJson.identity).toEqual(sampleCodexEntry.identity);
    expect(codexJson.anchor).toEqual(sampleCodexEntry.anchor);
    expect(codexJson.signatures).toEqual(sampleCodexEntry.signatures);
  });

  test('creates zip with special characters in filename', async () => {
    const specialFilename = 'test file-name_123.pdf';

    const zipBlob = await createCodexZipArchive(
      samplePayloadBytes,
      specialFilename,
      sampleCodexEntry
    );

    const zip = await JSZip.loadAsync(zipBlob);
    const payloadFile = zip.file(specialFilename);
    expect(payloadFile).toBeTruthy();
  });
});
