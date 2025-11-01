// background.test.js
// Unit tests for background.js payload existence validation

import { checkDriveFileExists } from "../background.js";

describe("checkDriveFileExists", () => {
  it("should throw error for missing/invalid token", async () => {
    await expect(
      checkDriveFileExists({ fileId: "fakeid", token: "" }),
    ).rejects.toThrow();
  });

  it("should throw error for non-existent file", async () => {
    // This test expects a 404 from Google Drive API
    // You may need to mock fetch for CI environments
    await expect(
      checkDriveFileExists({ fileId: "nonexistentid", token: "fake-token" }),
    ).rejects.toThrow();
  });

  // Add more tests with valid token and fileId if integration testing is possible
});
