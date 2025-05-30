// Popup script for extension settings
document.addEventListener("DOMContentLoaded", function () {
  const enableToggle = document.getElementById("enableToggle");
  const status = document.getElementById("status");

  // Load current settings
  chrome.storage.sync.get(["clippyEnabled"], function (result) {
    const enabled = result.clippyEnabled !== false; // Default to true
    enableToggle.classList.toggle("active", enabled);
  });

  // Toggle switch
  enableToggle.addEventListener("click", function () {
    const wasEnabled = enableToggle.classList.contains("active");
    const newEnabled = !wasEnabled;

    enableToggle.classList.toggle("active", newEnabled);

    // Save the setting
    chrome.storage.sync.set(
      {
        clippyEnabled: newEnabled,
      },
      function () {
        const statusText = newEnabled
          ? "Clippy enabled! Refresh pages to see changes."
          : "Clippy disabled. Refresh pages to apply.";

        status.textContent = statusText;
        status.style.display = "block";

        setTimeout(() => {
          status.style.display = "none";
        }, 3000);
      }
    );
  });
});
