// lib/ai.js
// AI integration utilities for Lockb0x Codex Forge
/**
 * Summarizes the given text using the Chrome Summarizer API.
 * @param {string} text - The text to summarize.
 * @returns {Promise<string>} - The summary result.
 */
export async function summarizeText(text) {
  if (!chrome.summarizer || !chrome.summarizer.summarize) {
    throw new Error(
      "Chrome Summarizer API is not available. Please use Chrome Canary or Dev channel.",
    );
  }
  try {
    const result = await chrome.summarizer.summarize({ text });
    return result.summary;
  } catch (err) {
    throw new Error("Summarization failed: " + err.message);
  }
}

export async function summarizeContent(text) {
  if (typeof chrome !== "undefined" && chrome.ai && chrome.ai.summarizer) {
    try {
      const result = await chrome.ai.summarizer.summarize({ text });
      return result.summary || `AI Summary: ${text.slice(0, 100)}...`;
    } catch (_error) {
      // Chrome AI not available or failed, fallback to text truncation
      return `AI Summary (fallback): ${text.slice(0, 100)}...`;
    }
  }
  // Fallback if API not available: return first 100 characters
  return `Extracted Text: ${text.slice(0, 100)}...`;
}

export async function generateProcessTag(text) {
  if (typeof chrome !== "undefined" && chrome.ai && chrome.ai.prompt) {
    try {
      const prompt = `Generate a concise process tag for this content.`;
      const result = await chrome.ai.prompt.generate({ prompt, input: text });
      return (
        result.tag ||
        (text.length > 1000 ? "AI-Summarized-Web-Page" : "File-Upload-Hashed")
      );
    } catch (_error) {
      // Chrome AI not available or failed, fallback to static process tags
      return text.length > 1000
        ? "AI-Summarized-Web-Page"
        : "File-Upload-Hashed";
    }
  }
  // Fallback if API not available: return static process tags based on content length
  return text.length > 1000 ? "AI-Summarized-Web-Page" : "File-Upload-Hashed";
}

export async function generateCertificateSummary(entry) {
  if (typeof chrome !== "undefined" && chrome.ai && chrome.ai.prompt) {
    try {
      const prompt = `Summarize this Lockb0x Codex entry in natural language for a certificate.`;
      const result = await chrome.ai.prompt.generate({
        prompt,
        input: JSON.stringify(entry),
      });
      return result.summary || `Certificate Summary for entry ${entry.id}`;
    } catch (_error) {
      // Chrome AI not available or failed, fallback to template string
      return `Certificate Summary for entry ${entry.id}`;
    }
  }
  // Fallback if API not available: return basic template with entry ID
  return `Certificate Summary for entry ${entry.id}`;
}
