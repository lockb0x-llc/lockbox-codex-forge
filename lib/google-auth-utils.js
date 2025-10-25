// Google authentication utility functions

export function loadGoogleAuthToken(callback) {
  chrome.storage.local.get(['googleAuthToken'], (result) => {
    if (result && result.googleAuthToken) {
      callback(result.googleAuthToken);
    } else {
      callback(null);
    }
  });
}

export function requestGoogleAuth(statusDiv, authStatus, callback) {
  statusDiv.textContent = 'Signing in to Google...';
  chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH_REQUEST' }, (response) => {
    if (response && response.ok && response.token) {
      chrome.storage.local.set({ googleAuthToken: response.token });
      statusDiv.textContent = 'Google sign-in successful.';
      statusDiv.style.color = '#00796b';
      authStatus.textContent = 'Google Authenticated';
      authStatus.style.color = '#00796b';
      callback(response.token);
    } else {
      statusDiv.textContent = 'Google sign-in failed.';
      statusDiv.style.color = '#c62828';
      authStatus.textContent = 'Google Not Signed In';
      authStatus.style.color = '#c62828';
      callback(null);
    }
  });
}

export function refreshGoogleAuthToken(currentToken, statusDiv, callback) {
  if (!currentToken) {
    console.warn('[popup] No Google Auth token to refresh');
    callback(null);
    return;
  }
  chrome.identity.removeCachedAuthToken({ token: currentToken }, function() {
    chrome.identity.getAuthToken({ interactive: true }, function(newToken) {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error refreshing Google Auth token.';
        callback(null);
        return;
      }
      statusDiv.textContent = 'Google Auth token refreshed.';
      callback(newToken);
    });
  });
}
