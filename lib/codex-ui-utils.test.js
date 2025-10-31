// Unit tests for codex-ui-utils.js
import { showError, updateCodexUI } from "./codex-ui-utils.js";

describe("codex-ui-utils", () => {
  test("showError sets statusDiv text and color", () => {
    const statusDiv = { textContent: "", style: { color: "" } };
    showError(statusDiv, "Test error", "Try again");
    expect(statusDiv.textContent).toContain("Error: Test error");
    expect(statusDiv.textContent).toContain("Recovery: Try again");
    expect(statusDiv.style.color).toBe("#c62828");
  });

  test("updateCodexUI sets UI elements for valid entry", () => {
    // Mock DOM for payloadDownloadLink
    document.body.innerHTML = `<a id="payloadDownloadLink"></a>`;
    const statusDiv = { textContent: "", style: { color: "" } };
    const jsonResult = { textContent: "" };
    const downloadBtn = { style: { display: "" } };
    const copyBtn = { style: { display: "" } };
    const aiSummary = { textContent: "" };
    const certificateSummary = { textContent: "" };
    const domRefs = {
      statusDiv,
      jsonResult,
      downloadBtn,
      copyBtn,
      aiSummary,
      certificateSummary,
    };
    const entry = {
      entry: {
        identity: {
          subject: "subject",
          org: "org",
          process: "proc",
          artifact: "art",
        },
        certificate_summary: "cert",
        storage: {
          location: "https://drive.google.com/file",
          protocol: "gdrive",
          integrity_proof:
            "ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: "0.0.2",
        anchor: { chain: "gdrive:Qm123", tx: "txid", hash_alg: "sha-256" },
        signatures: [],
      },
    };
    updateCodexUI(domRefs, entry, true, "Payload exists");
    expect(jsonResult.textContent).toContain("subject");
    expect(downloadBtn.style.display).toBe("inline-block");
    expect(copyBtn.style.display).toBe("inline-block");
    expect(statusDiv.style.color).toBe("#00796b");
    expect(aiSummary.textContent).toContain("subject");
    expect(certificateSummary.textContent).toContain("cert");
    const payloadLink = document.getElementById("payloadDownloadLink");
    expect(payloadLink).not.toBeNull();
    expect(payloadLink.style.display).toBe("inline-block");
    expect(payloadLink.href).toBe("https://drive.google.com/file");
  });
});
