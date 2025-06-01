const style = document.createElement("style");
style.textContent = `
  .wfp-message-wrapper {
    position: relative;
    display: inline-block;
    max-width: 100%;
    width: 100%;
  }

  .wfp-buttons {
    position: absolute;
    top: 0;
    right: -42px;
    display: flex;
    opacity: 0;
    transition: opacity 0.2s;
    background: white;
    border-radius: 18px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    padding: 3px;
    z-index: 1000;
  }
  
  .wfp-button {
    background: transparent;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #54656f;
    font-size: 16px;
    transition: all 0.2s;
  }
  
  .wfp-button:hover {
    background: #f5f6f6;
    color: #00a884;
  }
  
  .wfp-markdown::after {
    content: "M↓";
    font-size: 14px;
    font-weight: bold;
  }

  .wfp-word::after {
    content: "Wd";
    font-size: 14px;
    font-weight: bold;
  }
  
  .wfp-ai::after {
    content: "</>";
    font-size: 14px;
    font-weight: bold;
  }
  
  .wfp-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #25D366;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 500;
    display: flex;
    align-items: center;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 14px;
  }
  
  .wfp-notification.show {
    transform: translateY(0);
    opacity: 1;
  }
  
  .wfp-notification.loading {
    background-color: #34B7F1;
  }
  
  .wfp-notification.error {
    background-color: #F15C6D;
  }
  
  .wfp-notification::before {
    content: "✓";
    margin-right: 10px;
    font-size: 18px;
  }
  
  .wfp-notification.loading::before {
    content: "⟳";
    animation: spin 1s linear infinite;
  }
  
  .wfp-notification.error::before {
    content: "!";
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes wfp-fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

const notification = document.createElement("div");
notification.className = "wfp-notification";
document.body.appendChild(notification);

const processedMessages = new WeakSet();

function processMessage(messageElement) {
  if (processedMessages.has(messageElement)) return;

  if (!isValidMessageElement(messageElement)) return;

  const contentContainer = findContentContainer(messageElement);
  if (!contentContainer) return;

  const wrapper = document.createElement("div");
  wrapper.className = "wfp-message-wrapper";

  contentContainer.parentNode.insertBefore(wrapper, contentContainer);
  wrapper.appendChild(contentContainer);

  processedMessages.add(messageElement);

  const buttons = document.createElement("div");
  buttons.className = "wfp-buttons";

  const wordFormatButton = document.createElement("button");
  wordFormatButton.className = "wfp-button wfp-word";
  wordFormatButton.title = "Copy as Word Format (AI)";

  const aiButton = document.createElement("button");
  aiButton.className = "wfp-button wfp-ai";
  aiButton.title = "Copy as AI-Formatted Code";

  buttons.appendChild(wordFormatButton);
  buttons.appendChild(aiButton);
  wrapper.appendChild(buttons);

  wrapper.addEventListener("mouseenter", () => {
    buttons.style.opacity = "1";
  });

  wrapper.addEventListener("mouseleave", () => {
    buttons.style.opacity = "0";
  });

  wordFormatButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const text = getMessageText(contentContainer);
    copyAsAIFormattedHtml(text);
  });

  aiButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const text = getMessageText(contentContainer);
    copyAsAIFormattedCode(text);
  });
}

function isValidMessageElement(element) {
  return (
    element &&
    element.nodeType === Node.ELEMENT_NODE &&
    (element.getAttribute("data-id") ||
      element.getAttribute("data-pre-plain-text") ||
      element.classList.contains("message-in") ||
      element.classList.contains("message-out"))
  );
}

function findContentContainer(element) {
  const selectors = [
    'div[data-testid="msg-container"]',
    "div.copyable-text",
    "div.selectable-text",
    "div[data-pre-plain-text]",
    "div.message-in",
    "div.message-out",
    "span.selectable-text",
  ];

  for (const selector of selectors) {
    const container =
      element.querySelector(selector) || element.closest(selector);
    if (container) return container;
  }

  return element;
}

function getMessageText(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let text = "";
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim()) {
      text += node.nodeValue + "\n";
    }
  }

  return text.trim();
}

// Removed copyAsCode function
// function copyAsCode(text) {
//   const formatted = "```\n" + text + "\n```";
//   copyToClipboard(formatted);
//   showNotification("Code copied with formatting!");
// }

// NOTE: This function is likely no longer used if "Copy as Markdown" was replaced by "Copy as Word Format (AI)"
// If you still want a non-AI markdown option, keep this function.
function copyAsMarkdown(text) {
  const formatted = "```markdown\n" + text + "\n```";
  copyToClipboard(formatted);
  showNotification("Markdown copied with formatting!");
}

// NEW: Function to copy as AI-formatted HTML (for Word-style)
async function copyAsAIFormattedHtml(text) {
  showLoadingNotification("Formatting for Word with AI...");

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getApiKey" }, resolve);
    });

    if (!response.apiKey) {
      const apiKey = prompt(
        "Please enter your Gemini API key to use AI formatting:"
      );
      if (!apiKey) {
        showErrorNotification("API key is required for AI formatting");
        return;
      }

      const setKeyResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "setApiKey", apiKey }, resolve);
      });
      if (!setKeyResponse.success) {
        showErrorNotification("Failed to save API key");
        return;
      }
    }

    // Send request to background script for HTML formatting
    const formatResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "formatHtml", text }, resolve);
    });

    if (formatResponse.success) {
      const formattedHtml = formatResponse.formattedHtml;
      // Copy HTML to clipboard using the new robust function
      await copyHtmlToClipboard(formattedHtml); // Await the clipboard operation
      showNotification("AI-formatted rich text copied!");
    } else {
      showErrorNotification(
        `Error: ${formatResponse.error || "Failed to format for Word"}`
      );
    }
  } catch (error) {
    console.error("Error in copyAsAIFormattedHtml:", error);
    showErrorNotification("An unexpected error occurred during formatting.");
  }
}

// MODIFIED: Function to copy HTML to clipboard using navigator.clipboard.write
async function copyHtmlToClipboard(htmlString) {
  try {
    const blobHtml = new Blob([htmlString], { type: "text/html" });
    const blobPlain = new Blob([htmlString.replace(/<[^>]*>/g, "")], {
      type: "text/plain",
    }); // Simple way to get plain text from HTML

    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobPlain,
      }),
    ]);
    console.log("HTML and plain text copied to clipboard.");
  } catch (err) {
    console.error("Failed to copy HTML using ClipboardItem:", err);
    // Fallback if ClipboardItem is not supported or fails
    // This old method might not always put rich text on clipboard reliably
    const textarea = document.createElement("textarea");
    textarea.value = htmlString;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      console.warn("Copied via document.execCommand (fallback).");
    } catch (execErr) {
      console.error("Failed to copy via execCommand (fallback):", execErr);
      // Final fallback to plain text only if execCommand also fails
      navigator.clipboard
        .writeText(htmlString)
        .then(() => {
          console.warn("Copied as plain text (final fallback).");
        })
        .catch((finalErr) => {
          console.error("Failed to copy even plain text:", finalErr);
        });
    }
    document.body.removeChild(textarea);
  }
}

function copyAsAIFormattedCode(text) {
  showLoadingNotification("Formatting code with AI...");

  // First check if API key is set
  chrome.runtime.sendMessage({ action: "getApiKey" }, (response) => {
    if (!response.apiKey) {
      // Prompt user to enter API key
      const apiKey = prompt(
        "Please enter your Gemini API key to use AI formatting:"
      );
      if (!apiKey) {
        showErrorNotification("API key is required for AI formatting");
        return;
      }

      // Save the API key
      chrome.runtime.sendMessage(
        { action: "setApiKey", apiKey },
        (response) => {
          if (response.success) {
            // Now proceed with formatting
            sendToGeminiForCode(text); // Renamed function for clarity
          } else {
            showErrorNotification("Failed to save API key");
          }
        }
      );
    } else {
      // API key exists, proceed with formatting
      sendToGeminiForCode(text); // Renamed function for clarity
    }
  });
}

// Renamed and adjusted function to specifically handle code formatting
function sendToGeminiForCode(text) {
  chrome.runtime.sendMessage({ action: "formatCode", text }, (response) => {
    if (response.success) {
      const formattedCode = response.formattedCode;
      copyToClipboard(formattedCode);
      showNotification("AI-formatted code copied to clipboard!");
    } else {
      showErrorNotification(
        `Error: ${response.error || "Failed to format code"}`
      );
    }
  });
}

// Keeping copyToClipboard for plain text copies
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Failed to copy:", err);
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  });
}

function showNotification(message) {
  notification.textContent = message;
  notification.className = "wfp-notification show";

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function showLoadingNotification(message) {
  notification.textContent = message;
  notification.className = "wfp-notification loading show";
}

function showErrorNotification(message) {
  notification.textContent = message;
  notification.className = "wfp-notification error show";

  setTimeout(() => {
    notification.classList.remove("show");
    notification.classList.remove("error");
  }, 5000);
}

// Process existing messages
function processExistingMessages() {
  const selectors = [
    'div[data-testid="msg-container"]', // New WhatsApp messages
    'div[data-id^="false_"]', // Standard messages
    'div[data-id^="true_"]', // Group messages
    "div[data-pre-plain-text]", // Older versions
    "div.message-in", // Incoming messages
    "div.message-out", // Outgoing messages
    'div[class*="message-"]',
    'div[data-testid^="msg-"]',
    'div[role="row"]', // For message rows
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach(processMessage);
  });
}

// Watch for new messages
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check if node is a message or contains messages
        if (
          node.matches(
            'div[data-testid="msg-container"], div[data-id^="false_"], div[data-id^="true_"], div[data-pre-plain-text], div.message-in, div.message-out, div[class*="message-"], div[data-testid^="msg-"], div[role="row"]'
          )
        ) {
          processMessage(node);
        }
        // Check for messages inside the node
        node
          .querySelectorAll(
            'div[data-testid="msg-container"], div[data-id^="false_"], div[data-id^="true_"], div[data-pre-plain-text], div.message-in, div.message-out, div[class*="message-"], div[data-testid^="msg-"], div[role="row"]'
          )
          .forEach(processMessage);
      }
    });
  });
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial processing after delay to allow WhatsApp to load
setTimeout(() => {
  processExistingMessages();
}, 2000);
