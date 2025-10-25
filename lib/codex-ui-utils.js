// Codex UI utility functions
import { validateCodexEntry } from './validate.js';

export function showError(statusDiv, message, recovery) {
  statusDiv.textContent = `Error: ${message}`;
  statusDiv.style.color = '#c62828';
  if (recovery) {
    statusDiv.textContent += `\nRecovery: ${recovery}`;
  }
  console.error('[popup] Error:', message, recovery || '');
}

export async function validateAndShowEntry(statusDiv, certificateSummary, response) {
  const validation = await validateCodexEntry(response.entry);
  if (validation.valid) {
    statusDiv.textContent += ' (Schema valid)';
  } else {
    showError(statusDiv, 'Schema INVALID.', 'Check schema errors below.');
    certificateSummary.textContent += '\nSchema errors:\n' + validation.errors.map(e => e.message).join('\n');
    console.error('[popup] Schema validation errors:', validation.errors);
  }
}

export function updateCodexUI({ statusDiv, jsonResult, downloadBtn, copyBtn, aiSummary, certificateSummary }, response, payloadExists, payloadValidationMsg) {
  jsonResult.textContent = JSON.stringify(response.entry, null, 2);
  downloadBtn.style.display = payloadExists ? 'inline-block' : 'none';
  copyBtn.style.display = 'inline-block';
  statusDiv.textContent += ' Codex Entry generated.';
  statusDiv.style.color = payloadExists ? '#00796b' : '#c62828';
  aiSummary.textContent += response.entry.identity.subject || '';
  certificateSummary.textContent += response.entry.certificate_summary || '';
  // Show payload download link if Drive URL is present and exists
  const payloadLink = document.getElementById('payloadDownloadLink');
  if (response.entry.storage && response.entry.storage.location && response.entry.storage.location.startsWith('https://drive.google.com/') && payloadExists) {
    payloadLink.href = response.entry.storage.location;
    payloadLink.style.display = 'inline-block';
  } else {
    payloadLink.style.display = 'none';
  }
  validateAndShowEntry(statusDiv, certificateSummary, response);
  statusDiv.textContent += `\n${payloadValidationMsg}`;
}
