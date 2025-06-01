import { config, initConfig, updateApiKey } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initConfig();
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveButton");
  const statusElement = document.getElementById("status");

  if (config.geminiApiKey) {
    apiKeyInput.value = config.geminiApiKey;
  }

  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter a valid API key", "error");
      return;
    }

    updateApiKey(apiKey).then(() => {
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
