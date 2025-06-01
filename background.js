import { config, initConfig, updateApiKey } from "./config.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "formatCode") {
    formatTextWithGemini(request.text, "code")
      .then((formattedCode) => {
        sendResponse({ success: true, formattedCode });
      })
      .catch((error) => {
        console.error("Error formatting code:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  } else if (request.action === "formatHtml") {
    formatTextWithGemini(request.text, "html")
      .then((formattedHtml) => {
        sendResponse({ success: true, formattedHtml });
      })
      .catch((error) => {
        console.error("Error formatting HTML:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === "setApiKey") {
    updateApiKey(request.apiKey).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "getApiKey") {
    sendResponse({ apiKey: config.geminiApiKey || "" });
    return true;
  }
});

initConfig().then(() => {
  console.log("Configuration initialized");
});

async function formatTextWithGemini(textToFormat, type) {
  if (!config.geminiApiKey) {
    throw new Error(
      "Gemini API key not set. Please set it in the extension options."
    );
  }

  let prompt = "";
  if (type === "code") {
    prompt = `Format the following code to make it well-structured, properly indented, and ready to run in an IDE. Only return the formatted code without any explanations or markdown formatting:\n\n${textToFormat}`;
  } else if (type === "html") {
    prompt = `Convert the following text into well-formatted HTML suitable for display in a rich text editor like Microsoft Word. Include appropriate HTML tags for headings (h1, h2, etc.), paragraphs (p), lists (ul, ol, li), bold (strong), italics (em), and code blocks (pre, code). Do not include any HTML boilerplate like <html>, <head>, or <body>. Just return the structured HTML content:\n\n${textToFormat}`;
  } else {
    throw new Error("Invalid formatting type specified.");
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  try {
    const response = await fetch(
      `${config.geminiApiUrl}?key=${config.geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API Error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract the formatted content from the response
    if (
      data.candidates &&
      data.candidates[0]?.content?.parts &&
      data.candidates[0].content.parts[0]?.text
    ) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error(`Error calling Gemini API for ${type} formatting:`, error);
    throw error;
  }
}
