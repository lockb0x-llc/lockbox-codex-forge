// Unit tests for file-utils.js
import { describe, test, expect } from 'vitest';
import { readFile, extractPageContent } from './file-utils.js';

describe('file-utils', () => {
  test('readFile reads text file', (done) => {
    const file = new Blob(['hello'], { type: 'text/plain' });
    file.name = 'test.txt';
    readFile(file, (bytes, text) => {
      expect(new TextDecoder().decode(bytes)).toBe('hello');
      expect(text).toBe('hello');
      done();
    });
  });

  test('readFile reads binary file', (done) => {
    const file = new Blob([new Uint8Array([1,2,3])], { type: 'application/octet-stream' });
    file.name = 'test.bin';
    readFile(file, (bytes, text) => {
      expect(bytes).toEqual(new Uint8Array([1,2,3]));
      expect(text).toBe('');
      done();
    });
  });

  // extractPageContent requires browser context, so skip here
});
