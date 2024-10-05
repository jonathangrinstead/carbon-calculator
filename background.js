console.log("Background script loaded");

let totalBytes = 0;
let isCollecting = false;

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (isCollecting && !details.fromCache) {
      totalBytes += details.contentLength;
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCollecting") {
    totalBytes = 0;
    isCollecting = true;
    chrome.tabs.reload(request.tabId);
  } else if (request.action === "getTotalBytes") {
    isCollecting = false;
    sendResponse({ totalBytes: totalBytes });
  }
  return true; // Indicates we will respond asynchronously
});
