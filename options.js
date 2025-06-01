// Options page script for WhatsApp Format Preserver

// Import configuration module
import { config, initConfig, updateApiKey } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize configuration
  await initConfig();
  // Get elements
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveButton");
  const statusElement = document.getElementById("status");

  // Load API key from config
  if (config.geminiApiKey) {
    apiKeyInput.value = config.geminiApiKey;
  }

  // Save API key when button is clicked
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter a valid API key", "error");
      return;
    }

    // Save API key using the config module
    updateApiKey(apiKey).then(() => {
      // Notify background script
      chrome.runtime.sendMessage(
        { action: "setApiKey", apiKey },
        (response) => {
          if (response && response.success) {
            showStatus("API key saved successfully!", "success");
          } else {
            showStatus("Error saving API key", "error");
          }
        }
      );
    });
  });

  function showStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = "status";

    if (type === "success") {
      statusElement.classList.add("success");
    } else if (type === "error") {
      statusElement.classList.add("error");
    }

    // Hide status after 3 seconds
    setTimeout(() => {
      statusElement.className = "status";
    }, 3000);
  }
});
