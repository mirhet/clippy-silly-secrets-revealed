// Background script for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    clippyEnabled: true,
    aiProvider: "openai",
    apiKey: "",
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Toggle Clippy visibility
  chrome.tabs.sendMessage(tab.id, {
    type: "TOGGLE_CLIPPY",
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SETTINGS") {
    chrome.storage.sync.get(
      ["clippyEnabled", "aiProvider", "apiKey"],
      (result) => {
        sendResponse(result);
      }
    );
    return true; // Indicates async response
  }

  if (request.type === "SAVE_SETTINGS") {
    chrome.storage.sync.set(request.data, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Default settings
const defaultSettings = {
  aiProvider: "openai",
  apiKey: "",
};
