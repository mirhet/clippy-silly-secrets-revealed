// Content script that injects Clippy into websites
(function () {
  "use strict";

  // Check if Clippy is already injected
  if (window.clippyInjected) {
    return;
  }
  window.clippyInjected = true;

  // Get user settings from storage
  chrome.storage.sync.get(
    ["clippyEnabled", "aiProvider", "apiKey"],
    function (result) {
      const isEnabled = result.clippyEnabled !== false; // Default to enabled

      if (!isEnabled) {
        return;
      }

      // Create iframe for Clippy
      const iframe = document.createElement("iframe");
      iframe.src = chrome.runtime.getURL("clippy-app.html");
      iframe.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      width: 320px !important;
      height: 240px !important;
      border: none !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      background: transparent !important;
      transition: all 0.3s ease !important;
    `;
      iframe.id = "clippy-extension-iframe";

      // Insert into page
      document.body.appendChild(iframe);

      // Enable pointer events only for Clippy area
      iframe.onload = function () {
        iframe.style.pointerEvents = "auto";

        // Get page content for context - now including full HTML
        const pageContent = {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
          // Get the body content of the page (limiting size to avoid memory issues)
          bodyContent: document.body
            ? document.body.innerHTML.slice(0, 50000)
            : "", // First 50k chars of body HTML
          // Keep some structured data for fallback
          headings: Array.from(document.querySelectorAll("h1, h2, h3"))
            .slice(0, 5)
            .map((h) => h.textContent?.trim())
            .filter(Boolean),
          description:
            document.querySelector('meta[name="description"]')?.content || "",
        };

        // Send website context to Clippy
        iframe.contentWindow.postMessage(
          {
            type: "WEBSITE_CONTEXT",
            data: {
              ...pageContent,
              aiProvider: result.aiProvider || "openai",
              apiKey: result.apiKey || "",
            },
          },
          "*"
        );
      };

      // Listen for messages from Clippy
      window.addEventListener("message", function (event) {
        if (event.data.type === "CLIPPY_TOGGLE") {
          const iframe = document.getElementById("clippy-extension-iframe");
          if (iframe) {
            iframe.style.display =
              iframe.style.display === "none" ? "block" : "none";
          }
        } else if (event.data.type === "SAVE_CONFIG") {
          console.log("Content script - Saving config:", event.data.data);
          // Save configuration to chrome storage
          chrome.storage.sync.set(
            {
              aiProvider: event.data.data.aiProvider,
              apiKey: event.data.data.apiKey,
            },
            function () {
              console.log("Clippy settings saved to Chrome storage");

              // Reload settings and send updated context to iframe
              chrome.storage.sync.get(
                ["aiProvider", "apiKey"],
                function (updatedResult) {
                  console.log(
                    "Content script - Reloaded from storage:",
                    updatedResult
                  );
                  const pageContent = {
                    url: window.location.href,
                    title: document.title,
                    domain: window.location.hostname,
                    // Get the body content of the page (limiting size to avoid memory issues)
                    bodyContent: document.body
                      ? document.body.innerHTML.slice(0, 50000)
                      : "", // First 50k chars of body HTML
                    // Keep some structured data for fallback
                    headings: Array.from(
                      document.querySelectorAll("h1, h2, h3")
                    )
                      .slice(0, 5)
                      .map((h) => h.textContent?.trim())
                      .filter(Boolean),
                    description:
                      document.querySelector('meta[name="description"]')
                        ?.content || "",
                  };

                  const contextData = {
                    ...pageContent,
                    aiProvider: updatedResult.aiProvider || "openai",
                    apiKey: updatedResult.apiKey || "",
                  };

                  console.log(
                    "Content script - Sending updated context:",
                    contextData
                  );

                  iframe.contentWindow.postMessage(
                    {
                      type: "WEBSITE_CONTEXT",
                      data: contextData,
                    },
                    "*"
                  );
                }
              );
            }
          );
        }
      });
    }
  );

  // Listen for toggle messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TOGGLE_CLIPPY") {
      const iframe = document.getElementById("clippy-extension-iframe");
      if (iframe) {
        iframe.style.display =
          iframe.style.display === "none" ? "block" : "none";
      }
    }
  });
})();
