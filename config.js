const config = {
  geminiApiKey: null,
  geminiApiUrl:
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
};

async function initConfig() {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      config.geminiApiKey = process.env.GEMINI_API_KEY;
      console.log("Using API key from environment variable");
      return config;
    }
    
    const encodedKey = "QUl6YVN5QjQyR25tbEoySHRYd211M240NTV4RHBoQ1dFR1dwbWFB";
    config.geminiApiKey = atob(encodedKey);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
          if (result.geminiApiKey && result.geminiApiKey.trim() !== "") {
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
    const encodedKey = "QUl6YVN5QjQyR25tbEoySHRYd211M240NTV4RHBoQ1dFR1dwbWFB";
    config.geminiApiKey = atob(encodedKey);
  }
  return config;
}

function updateApiKey(apiKey) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        config.geminiApiKey = apiKey;
        console.log("API key updated in storage");
        resolve(true);
      });
    } else {
      config.geminiApiKey = apiKey;
      resolve(true);
    }
  });
}

export { config, initConfig, updateApiKey };
