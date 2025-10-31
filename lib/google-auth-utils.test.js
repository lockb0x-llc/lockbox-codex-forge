// Unit tests for google-auth-utils.js
import { loadGoogleAuthToken } from "./google-auth-utils.js";

describe("google-auth-utils", () => {
  test("loadGoogleAuthToken returns null if no token", async () => {
    // Mock chrome.storage.local.get
    global.chrome = { storage: { local: { get: (keys, cb) => cb({}) } } };
    const token = await new Promise((resolve) => {
      loadGoogleAuthToken(resolve);
    });
    expect(token).toBeNull();
  });

  test("loadGoogleAuthToken returns token if present", async () => {
    global.chrome = {
      storage: {
        local: { get: (keys, cb) => cb({ googleAuthToken: "abc123" }) },
      },
    };
    const token = await new Promise((resolve) => {
      loadGoogleAuthToken(resolve);
    });
    expect(token).toBe("abc123");
  });
});
