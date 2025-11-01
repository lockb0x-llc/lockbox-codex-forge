// Jest unit tests for ai.js
import {
  summarizeContent,
  generateProcessTag,
  generateCertificateSummary,
} from "./ai.js";

describe("ai.js", () => {
  test("summarizeContent returns a string", async () => {
    const summary = await summarizeContent("Hello world.");
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });

  test("generateProcessTag returns a string", async () => {
    const tag = await generateProcessTag("Test process");
    expect(typeof tag).toBe("string");
    expect(tag.length).toBeGreaterThan(0);
  });

  test("generateCertificateSummary returns a string", async () => {
    const entry = { id: "test", identity: { subject: "test subject" } };
    const summary = await generateCertificateSummary(entry);
    expect(typeof summary).toBe("string");
  });
});
