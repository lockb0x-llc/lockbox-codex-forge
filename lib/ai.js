// lib/ai.js
// AI integration utilities for Lockb0x Codex Forge


export async function summarizeContent(text) {
  if (typeof chrome !== 'undefined' && chrome.ai && chrome.ai.summarizer) {
    try {
      const result = await chrome.ai.summarizer.summarize({ text });
      return result.summary || `AI Summary: ${text.slice(0, 100)}...`;
    } catch (e) {
      return `AI Summary (fallback): ${text.slice(0, 100)}...`;
    }
  }
  // Fallback if API not available
  return `AI Summary: ${text.slice(0, 100)}...`;
}


export async function generateProcessTag(text) {
  if (typeof chrome !== 'undefined' && chrome.ai && chrome.ai.prompt) {
    try {
      const prompt = `Generate a concise process tag for this content.`;
      const result = await chrome.ai.prompt.generate({ prompt, input: text });
      return result.tag || (text.length > 1000 ? 'AI-Summarized-Web-Page' : 'File-Upload-Hashed');
    } catch (e) {
      return text.length > 1000 ? 'AI-Summarized-Web-Page' : 'File-Upload-Hashed';
    }
  }
  // Fallback
  return text.length > 1000 ? 'AI-Summarized-Web-Page' : 'File-Upload-Hashed';
}


export async function generateCertificateSummary(entry) {
  if (typeof chrome !== 'undefined' && chrome.ai && chrome.ai.prompt) {
    try {
      const prompt = `Summarize this Lockb0x Codex entry in natural language for a certificate.`;
      const result = await chrome.ai.prompt.generate({ prompt, input: JSON.stringify(entry) });
      return result.summary || `Certificate Summary for entry ${entry.id}`;
    } catch (e) {
      return `Certificate Summary for entry ${entry.id}`;
    }
  }
  // Fallback
  return `Certificate Summary for entry ${entry.id}`;
}
