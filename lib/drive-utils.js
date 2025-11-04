// Google Drive utility functions

export async function checkDriveFileExists({ fileId, token }) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,trashed`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Existence Check] ${res.status}: ${err}`);
  }
  const metadata = await res.json();
  if (metadata.trashed) {
    throw new Error("[Drive Existence Check] File is trashed");
  }
  return metadata;
}

export async function uploadFileToGoogleDrive({
  bytes,
  filename,
  mimeType = "application/octet-stream",
  token,
}) {
  const metadata = {
    name: filename,
    mimeType,
  };
  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  formData.append("file", new Blob([bytes], { type: mimeType }));
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Upload] ${res.status}: ${err}`);
  }
  return await res.json();
}

export async function uploadCodexEntryToGoogleDrive({
  entry,
  token,
  uploadFileFn,
}) {
  const json = JSON.stringify(entry, null, 2);
  const bytes = new TextEncoder().encode(json);
  return await (uploadFileFn || uploadFileToGoogleDrive)({
    bytes,
    filename: `${entry.id}.codex.json`,
    mimeType: "application/json",
    token,
  });
}

/**
 * Upload zip archive to Google Drive
 * @param {Blob} zipBlob - The zip archive blob
 * @param {string} filename - Filename for the zip archive
 * @param {string} token - Google auth token
 * @returns {Promise<object>} - Drive file metadata (id, webViewLink)
 */
export async function uploadZipArchiveToGoogleDrive({
  zipBlob,
  filename,
  token,
}) {
  const metadata = {
    name: filename,
    mimeType: "application/zip",
  };
  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  formData.append("file", zipBlob);
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Drive Zip Upload] ${res.status}: ${err}`);
  }
  return await res.json();
}
