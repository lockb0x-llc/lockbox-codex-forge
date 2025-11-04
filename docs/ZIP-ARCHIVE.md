# Lockb0x Codex Forge Zip Archive Workflow

## Overview

The Zip Archive feature enhances Lockb0x Codex Forge by packaging the payload and codex entry into a single, verifiable archive. This solidifies the lockb0x protocol's handling and authentication process, ensuring robust provenance and integrity for digital artifacts.

## Workflow Steps

1. **Payload Preparation**
   - The payload is obtained from either file upload or content extraction.
   - Payload metadata, identity metadata, and creator metadata are included in the initial codex entry.
   - The codex entry includes its own metadata: `id`, `version`, `datetime` (initial creation), and an initial signature covering all metadata.

2. **Zip Archive Creation**
   - The payload is added to a new zip file (the "Zip Archive") using the features in `lib/zip-archive.js`.
   - No compression is applied; files are stored as-is for integrity (STORE mode).
   - The archive is encrypted with AES-256 encryption using:
     - The current user's email address if they are authenticated and have selected the Google Anchor
     - The password "mock" if they are using the Mock Anchor
   - The current Lockb0x Codex Entry JSON (with `storage.location`, `anchor.tx`, and `anchor.url` excluded) is added as an archive-level comment in the zip.
   - The zip contains:
     - The payload file (with its original filename)
     - `codex-entry.json` (with `storage.location`, `anchor.tx`, and `anchor.url` excluded)

3. **Upload to Google Drive**
   - The Zip Archive is uploaded to Google Drive (if Google Anchor is selected).
   - The Lockb0x Codex Entry is updated with storage and anchor metadata (protocol, location, integrity proof, tx, url).
   - A new signature is generated and appended to the signature block, covering the updated codex entry.

4. **Final Codex Entry Handling**
   - The final Lockb0x Codex Entry (with updated storage, anchor, and dual signatures) is uploaded to Google Drive.
   - The final codex entry and zip archive are both made available for download or copying to clipboard in the popup UI.

## Implementation Details

- The zip archive is created using the `createCodexZipArchive` function in `lib/zip-archive.js`.
- Archive-level comment contains the full final codex entry JSON for provenance and verification.
- The codex entry inside the zip excludes `storage.location`, `anchor.tx`, and `anchor.url` because these are not known at the time the Zip Archive is created, since it has not been uploaded yet.
- The zip archive is encrypted with AES-256 encryption using either the user's Google email or the password 'mock'.
- No compression is applied - files are stored using the STORE method to preserve integrity.
- All cryptographic operations (hashing, signing) follow the lockb0x protocol.
- The workflow ensures that every step is verifiable and auditable.
- Dual signature approach:
  1. First signature: covers initial codex entry before zip creation
  2. Second signature: covers updated codex entry after zip upload with storage metadata

## Benefits

- **Integrity:** Payload and codex entry are packaged together, reducing risk of tampering.
- **Encryption:** Archive is password-protected with AES-256 encryption for security.
- **Provenance:** Archive-level comment and metadata provide a clear audit trail with dual signatures.
- **Interoperability:** Zip format is widely supported and easy to verify.
- **Automation:** The workflow is designed for seamless integration with Google Drive and future cloud providers.

## Verification Process

To verify a Lockb0x Codex zip archive:

1. **Extract the Archive:** Use the password (Google email or 'mock') to decrypt and extract the zip
2. **Verify Payload:** Compare the extracted payload file with the original
3. **Check Codex Entry:** The `codex-entry.json` in the zip should match the final codex entry except for:
   - `storage.location` (not present in zip version)
   - `anchor.tx` (not present in zip version)
   - `anchor.url` (not present in zip version)
4. **Verify Archive Comment:** Extract and parse the archive-level comment to get the full final codex entry
5. **Hash Verification:** Compute SHA-256 hash of the payload and compare with `integrity_proof` in the codex entry
6. **Signature Verification:** Validate both ES256 signatures:
   - First signature: validates initial codex entry
   - Second signature: validates updated codex entry with storage metadata

## Future Enhancements

- Support for additional cloud storage providers (e.g., OneDrive)
- Enhanced metadata tagging and search
- Automated verification tools for zip archives
- UI improvements for archive creation and download

---

For implementation details, see `lib/zip-archive.js` and the main workflow in `background.js` and `popup.js`.