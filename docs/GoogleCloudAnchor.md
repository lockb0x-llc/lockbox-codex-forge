
# Lockb0x Codex Forge — Google Cloud Anchor Integration

## Overview

Google Cloud Anchor integration enables secure, verifiable storage of Codex payloads in the authenticated user's Google Drive account. All file types (text, PDF, JSON, binary) are supported, and payload existence is validated before export. The extension provides robust error handling and UI feedback for all anchor and upload flows.

## Current Status (Updated 2025-11-01)

### Implemented and Working ✓
- **Google Drive Payload Storage:** Binary file uploads work reliably across all file types
- **Authentication:** OAuth2 integration with secure token storage in chrome.storage
- **Anchor Creation:** Anchor metadata stored as JSON files in Google Drive
- **Existence Validation:** Pre-export validation confirms payload files exist in Drive
- **Error Handling:** Comprehensive error messages and UI feedback for all failure scenarios
- **Token Persistence:** Auth tokens persist across browser sessions for better UX

### Technical Details
- Uses Google Drive API v3 with multipart upload
- Supports both payload files and anchor metadata files
- Implements proper boundary-based multipart encoding
- Returns file IDs and webViewLink URLs for reference
- Validates file existence before allowing Codex entry export

### Known Limitations
- No automatic token refresh (user must re-authenticate on expiry)
- Large file uploads (>10MB) use chunked upload but could be optimized
- No retry logic for transient network failures

## Integration with Lockb0x Protocol

The Google anchor implementation follows the lockb0x protocol specification:

```javascript
{
  "anchor": {
    "chain": "google:drive",        // Custom chain identifier for Google Drive
    "tx": "<drive-file-id>",         // Google Drive file ID of anchor metadata
    "url": "<webViewLink>",          // Public/shareable link to anchor file
    "hash_alg": "sha-256",           // Hash algorithm used
    "timestamp": "<ISO-8601>"        // Creation timestamp
  }
}
```

### Workflow
1. User uploads file or extracts page content
2. File is hashed (SHA-256) to generate integrity proof
3. File is uploaded to user's Google Drive
4. Anchor metadata (containing codex ID, timestamp, integrity proof) is created
5. Anchor metadata is uploaded to Google Drive
6. Anchor reference is added to Codex entry
7. Before export, payload existence in Drive is validated
8. Codex entry is finalized and can be exported

## Contributor Guide

### When Updating Google Anchor Logic
- Ensure existence validation remains robust (check file metadata, not just API success)
- Maintain user-friendly error messages (distinguish auth failures from upload failures)
- Test with various file sizes and types
- Verify token persistence across sessions
- Update DEVELOPMENT-PLAN.md and AGENTS.md with progress

### Testing Google Integration
- Test with new Google account (no existing Drive files)
- Test with expired auth tokens
- Test with large files (>5MB)
- Test with various MIME types
- Test network failure scenarios
- Verify payload download links work correctly

### Common Issues and Solutions
- **Token Expiry:** Currently requires user to re-authenticate; consider implementing refresh token flow
- **Large File Uploads:** May timeout; chunked upload is implemented but could use progress feedback
- **Quota Limits:** Google Drive API has quota limits; consider caching and batching requests
- **CORS Issues:** Using chrome.identity API avoids CORS; don't switch to manual OAuth flow

## Hackathon Plan Integration

- **Completed Milestones:**
  - ✓ Google OAuth2 integration
  - ✓ Drive API payload upload
  - ✓ Anchor metadata creation
  - ✓ Token persistence
  - ✓ Existence validation
  - ✓ Error handling and UI feedback

- **Future Enhancements:**
  - Automatic token refresh
  - Upload progress indicators for large files
  - Retry logic for network failures
  - Batch operations for multiple files
  - Drive folder organization (dedicated Lockb0x folder)
  - Metadata tagging for easier search

## References

- See DEVELOPMENT-PLAN.md for unified checklist and technical milestones
- See AGENTS.md for team assignments
- See README.md for user-facing documentation

## Security Considerations

- **Token Storage:** OAuth tokens stored in chrome.storage.local (encrypted by Chrome)
- **Scope Minimization:** Only requests necessary Drive scopes (drive.file, userinfo.email)
- **No Token Exposure:** Tokens never logged or exposed in client-side code
- **HTTPS Only:** All Drive API calls use HTTPS
- **User Consent:** Explicit OAuth consent flow for Drive access

---

**Status:** Google Drive integration is complete and working. This is a major success for the project and demonstrates the viability of using Drive as a storage/anchor backend for the lockb0x protocol.

