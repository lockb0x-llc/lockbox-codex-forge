# Lockb0x Codex Forge Zip Archive Workflow

## Overview

The Zip Archive feature enhances Lockb0x Codex Forge by packaging the payload and codex entry into a single, verifiable archive. This solidifies the lockb0x protocol's handling and authentication process, ensuring robust provenance and integrity for digital artifacts.

## Workflow Steps

1. **Payload Preparation**
   - The payload is obtained from either file upload or content extraction.
   - Payload metadata, identity metadata, and creator metadata are included in the codex entry.
   - The codex entry includes its own metadata: `id`, `version`, `datetime` (initial creation), and an initial signature covering all metadata.

2. **Zip Archive Creation**
   - The payload is added to a new zip file (the "Zip Archive") using the features in `lib/zip-archive.js`.
   - No compression is applied; files are stored as-is for integrity.
   - The current Lockb0x Codex Entry JSON is added as an archive-level comment in the zip.
   - The zip contains:
     - The payload file (original filename)
     - `codex-entry.json` (with `storage.location` excluded)

3. **Upload to Google Drive**
   - The Zip Archive is uploaded to Google Drive.
   - The Lockb0x Codex Entry is updated with storage metadata (protocol, location, integrity proof).
   - A new signature is generated and appended to the signature block, covering the updated codex entry.

4. **Final Codex Entry Handling**
   - The final Lockb0x Codex Entry (with updated storage and signatures) is uploaded to Google Drive.
   - The final codex entry is made available for download or copying to clipboard.

## Implementation Details

- The zip archive is created using the `createCodexZipArchive` function in `lib/zip-archive.js`.
- Archive-level comment contains the full codex entry JSON for provenance.
- The codex entry inside the zip excludes `storage.location` to avoid circular references.
- All cryptographic operations (hashing, signing) follow the lockb0x protocol.
- The workflow ensures that every step is verifiable and auditable.

## Benefits

- **Integrity:** Payload and codex entry are packaged together, reducing risk of tampering.
- **Provenance:** Archive-level comment and metadata provide a clear audit trail.
- **Interoperability:** Zip format is widely supported and easy to verify.
- **Automation:** The workflow is designed for seamless integration with Google Drive and future cloud providers.

## Future Enhancements

- Support for additional cloud storage providers (e.g., OneDrive)
- Enhanced metadata tagging and search
- Automated verification tools for zip archives
- UI improvements for archive creation and download

---

For implementation details, see `lib/zip-archive.js` and the main workflow in `background.js` and `popup.js`.