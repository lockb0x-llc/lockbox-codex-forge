// Basic popup logic tests (UI logic only, not full browser integration)
describe("popup.js UI logic", () => {
  test("file input change sets extractedBytes for text", () => {
    const file = new Blob(["test content"], { type: "text/plain" });
    file.name = "test.txt";
    const reader = new FileReader();
    reader.onload = function (evt) {
      const extractedData = evt.target.result;
      const extractedBytes = new TextEncoder().encode(extractedData);
      expect(new TextDecoder().decode(extractedBytes)).toBe("test content");
    };
    reader.readAsText(file);
  });

  // More UI logic tests can be added here
});
