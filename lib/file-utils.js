// File reading and extraction utility functions

export function readFile(file, callback) {
  const isText = file.type.startsWith('text') || file.name.match(/\.(txt|md|json)$/i);
  const reader = new FileReader();
  reader.onload = function(evt) {
    if (isText) {
      callback(new TextEncoder().encode(evt.target.result), evt.target.result);
    } else {
      callback(new Uint8Array(evt.target.result), '');
    }
  };
  reader.onerror = function(err) {
    callback(null, null, err);
  };
  if (isText) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

export function extractPageContent(tabId, callback) {
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    func: () => document.body.innerText
  }, (results) => {
    if (results && results[0] && results[0].result) {
      callback(new TextEncoder().encode(results[0].result), results[0].result);
    } else {
      callback(null, null, new Error('Failed to extract page content'));
    }
  });
}
