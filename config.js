// Configuration file for WhatsApp Format Preserver

// Default configuration
const config = {
  geminiApiKey: null, // Will be loaded from storage or environment variable
  geminiApiUrl:
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
};

// Function to initialize configuration
async function initConfig() {
  // Always use the API key from environment variable
  // This is hardcoded in the extension and not configurable by users
  config.geminiApiKey = "AIzaSyB42GnmlJ2HtXwmu3n455xDphCWEGWpmaA"; // API key from .env file
  console.log("Using hardcoded Gemini API key");
  return config;
}

// Function to update API key (now a no-op since we use hardcoded key)
function updateApiKey(apiKey) {
  // This function is kept for compatibility but doesn't actually update the API key
  return new Promise((resolve) => {
    // The API key is hardcoded and cannot be changed by users
    resolve(true);
  });
}

// Export configuration and functions
export { config, initConfig, updateApiKey };
