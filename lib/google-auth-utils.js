// Returns a valid Google Auth token, refreshing if necessary
export async function getValidGoogleAuthToken() {
  let token = await getGoogleAuthToken();
  if (!token) {
    token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: true }, (newToken) => {
        resolve(newToken);
      });
    });
    if (token) await setGoogleAuthToken(token);
  }
  return token;
}
// Fetch Google user profile info using OAuth token
export async function fetchGoogleUserProfile(token) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: "Bearer " + token },
      },
    );
    if (!response.ok) throw new Error("Failed to fetch user profile");
    const profile = await response.json();
    // profile: { email, name, picture, ... }
    chrome.storage.local.set({ googleUserProfile: profile });
    return profile;
  } catch (err) {
    console.error("[auth] Error fetching Google user profile:", err);
    return null;
  }
}
// Google authentication utility functions

// Centralized Google Auth Token utilities
export function getGoogleAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['googleAuthToken'], (result) => {
      resolve(result.googleAuthToken || null);
    });
  });
}

export function setGoogleAuthToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ googleAuthToken: token }, () => {
      resolve();
    });
  });
}

export function removeGoogleAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['googleAuthToken'], () => {
      resolve();
    });
  });
}

export function loadGoogleAuthToken(callback) {
  chrome.storage.local.get(["googleAuthToken"], (result) => {
    if (result && result.googleAuthToken) {
      callback(result.googleAuthToken);
    } else {
      callback(null);
    }
  });
}

export function requestGoogleAuth(statusDiv, authStatus, callback) {
  statusDiv.textContent = "Signing in to Google...";
  chrome.runtime.sendMessage({ type: "GOOGLE_AUTH_REQUEST" }, (response) => {
    if (response && response.ok && response.token) {
      chrome.storage.local.set({ googleAuthToken: response.token });
      statusDiv.textContent = "Google sign-in successful.";
      statusDiv.style.color = "#00796b";
      authStatus.textContent = "Google Authenticated";
      authStatus.style.color = "#00796b";
      callback(response.token);
    } else {
      statusDiv.textContent = "Google sign-in failed.";
      statusDiv.style.color = "#c62828";
      authStatus.textContent = "Google Not Signed In";
      authStatus.style.color = "#c62828";
      callback(null);
    }
  });
}

export function refreshGoogleAuthToken(currentToken, statusDiv, callback) {
  if (!currentToken) {
    console.warn("[popup] No Google Auth token to refresh");
    callback(null);
    return;
  }
  chrome.identity.removeCachedAuthToken({ token: currentToken }, function () {
    chrome.identity.getAuthToken({ interactive: true }, function (newToken) {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = "Error refreshing Google Auth token.";
        callback(null);
        return;
      }
      statusDiv.textContent = "Google Auth token refreshed.";
      callback(newToken);
    });
  });
}
