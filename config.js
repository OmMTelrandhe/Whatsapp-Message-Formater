// Configuration file for WhatsApp Format Preserver

// Default configuration
const config = {
  geminiApiKey: null, // Will be loaded from storage or environment variable
  geminiApiUrl:
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
};

// Function to initialize configuration
async function initConfig() {
  try {
    // For development: Try to load the API key from environment variables if available
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      config.geminiApiKey = process.env.GEMINI_API_KEY;
      console.log("Using API key from environment variable");
      return config;
    }
    
    // For production: Use a secure API key proxy or backend service
    // This way the actual API key is not exposed in the client-side code
    // The actual implementation would depend on your backend architecture
    
    // For this extension: Use a predefined API key that's obfuscated
    // Note: This is still not fully secure but better than hardcoding directly
    // In a real production app, you would use a backend proxy service
    const encodedKey = "QUl6YVN5QjQyR25tbEoySHRYd211M240NTV4RHBoQ1dFR1dwbWFB";
    config.geminiApiKey = atob(encodedKey); // Simple base64 decode
    
    // Optionally, allow users to override with their own key if they want
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
          if (result.geminiApiKey && result.geminiApiKey.trim() !== "") {
            // Only use user's key if they explicitly set one
            config.geminiApiKey = result.geminiApiKey;
            console.log("Using custom API key from storage");
          } else {
            console.log("Using default API key");
          }
          resolve(config);
        });
      });
    }
  } catch (error) {
    console.error("Error initializing configuration:", error);
    // Fallback to default key if there's an error
    const encodedKey = "QUl6YVN5QjQyR25tbEoySHRYd211M240NTV4RHBoQ1dFR1dwbWFB";
    config.geminiApiKey = atob(encodedKey);
  }
  return config;
}

// Function to update API key (stores in chrome.storage)
function updateApiKey(apiKey) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        config.geminiApiKey = apiKey;
        console.log("API key updated in storage");
        resolve(true);
      });
    } else {
      // For non-browser environments
      config.geminiApiKey = apiKey;
      resolve(true);
    }
  });
}

// Export configuration and functions
export { config, initConfig, updateApiKey };
