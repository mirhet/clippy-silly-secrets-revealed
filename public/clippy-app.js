// Global state
let websiteContext = null;
let settings = { aiProvider: "openai", apiKey: "" };
let isGenerating = false;
let tipInterval = null;
let isConfigOpen = false;

// Prompt configuration
const promptConfig = {
  system: `You are Clippy, the classic Microsoft Office assistant. You provide helpful tips about websites in your classic cheerful and slightly condescending style. Your tips should be:
- Actually useful but delivered in Clippy's signature style
- Start with "It looks like..." or "I see..." 
- Enthusiastic about pointing out helpful website features or content
- Keep responses under 200 characters
- Focus on actionable insights when possible`,

  user: (
    context
  ) => `Analyze this website context and give me a helpful Clippy-style tip: ${context}. 
Focus on specific content, elements or features that users might find useful. Be enthusiastic and make it genuinely helpful.`,
};

// Helper function to extract clean text content from HTML
function extractCleanText(htmlContent) {
  if (!htmlContent) return "";

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  // Get text content and clean it up
  let text = tempDiv.textContent || tempDiv.innerText || "";

  // Remove extra whitespace and normalize
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Pre-written tips for fallback
const prewrittenTips = [
  "It looks like you're browsing a website! Did you know websites contain information?",
  "I see you're using a computer! Computers are excellent for computing things.",
  "This webpage appears to have text on it. Text is made of letters and words!",
  "I notice you're reading! Reading involves looking at words with your eyes.",
  "It looks like you're on the internet! The internet connects computers together.",
  "I see this page has colors! Colors help make things visible to humans.",
  "This website seems to load when you visit it. Loading is how websites appear!",
  "I detect you have a web browser! Browsers are for browsing the web.",
  "It looks like you're viewing content! Content is what goes inside websites.",
  "I notice this page has a layout! Layouts organize where things go on pages.",
  "This website appears to have buttons! Buttons are clickable interface elements.",
  "I see you're using a mouse or touchpad! These help you interact with computers.",
  "It looks like this page scrolls! Scrolling lets you see more content below.",
  "I notice this website has a URL! URLs tell your browser where to find pages.",
];

// Listen for messages from content script
window.addEventListener("message", function (event) {
  if (event.data.type === "WEBSITE_CONTEXT") {
    console.log("Received WEBSITE_CONTEXT:", event.data.data);
    websiteContext = event.data.data;
    settings.aiProvider = event.data.data.aiProvider || "openai";
    settings.apiKey = event.data.data.apiKey || "";
    console.log("Updated settings from context:", settings);
    updateUI();
    console.log("Received website context:", websiteContext);

    // Start automatic tip generation
    startTipInterval();
  }
});

function startTipInterval() {
  // Clear any existing interval
  if (tipInterval) {
    clearInterval(tipInterval);
  }

  // Check if we have an API key, if not, show config immediately
  if (!settings.apiKey) {
    setTimeout(() => {
      showMessage(
        "Welcome! Let's set up your API key to get personalized tips.",
        "error"
      );
      // Auto-open configuration after a brief delay
      setTimeout(() => {
        if (!isConfigOpen) {
          toggleConfig();
        }
      }, 1500);
    }, 1000);
    return;
  }

  // Generate first tip after 3 seconds
  setTimeout(() => {
    generateTip();

    // Then generate tips every 10 seconds
    tipInterval = setInterval(() => {
      generateTip();
    }, 10000);
  }, 2000);
}

function generateTip() {
  if (isGenerating || isConfigOpen) return;

  if (settings.apiKey) {
    getAITip();
  } else {
    if (!isConfigOpen) {
      toggleConfig();
    }
  }
}

function updateUI() {
  // Update configuration display if open
  if (isConfigOpen) {
    updateConfigUI();
  }
}

function updateConfigUI() {
  const aiProvider = document.getElementById("configAiProvider");
  const apiKey = document.getElementById("configApiKey");
  const apiHelp = document.getElementById("configApiHelp");

  // Only update dropdown if it's not already set by user interaction
  if (
    aiProvider &&
    aiProvider.value !== settings.aiProvider &&
    !aiProvider.dataset.userModified
  ) {
    aiProvider.value = settings.aiProvider;
  }
  if (apiKey) apiKey.value = settings.apiKey;

  // Update help text based on current selection (not stored setting)
  const currentProvider = aiProvider ? aiProvider.value : settings.aiProvider;
  if (apiHelp) {
    switch (currentProvider) {
      case "openai":
        apiHelp.textContent =
          "Get your API key from https://platform.openai.com/api-keys";
        break;
      case "gemini":
        apiHelp.textContent =
          "Get your API key from https://makersuite.google.com/app/apikey";
        break;
      default:
        apiHelp.textContent =
          "Select an AI provider to enable automatic intelligent tips";
    }
  }
}

// function setGeneratingState(generating) {
//   isGenerating = generating;
//   const messageEl = document.getElementById("clippyMessage");
//   const characterEl = document.getElementById("clippyAvatar");

//   if (generating) {
//     messageEl.classList.add("generating");
//     characterEl.classList.add("generating");

//     const providerText = "Thinking of something spectacularly obvious...";

//     messageEl.innerHTML = `<span class="loading-spinner"></span>${providerText}`;
//   } else {
//     messageEl.classList.remove("generating");
//     characterEl.classList.remove("generating");
//   }
// }

function showMessage(message, type = "normal") {
  const messageEl = document.getElementById("clippyMessage");
  messageEl.classList.remove("generating", "error-message", "success-message");

  if (type === "error") {
    messageEl.classList.add("error-message");
  }

  messageEl.textContent = message;
}

function toggleClippy() {
  window.parent.postMessage({ type: "CLIPPY_TOGGLE" }, "*");
}

function toggleConfig() {
  isConfigOpen = !isConfigOpen;
  const configPanel = document.getElementById("configPanel");
  const mainPanel = document.getElementById("mainPanel");
  const container = document.querySelector(".clippy-container");
  const aiProvider = document.getElementById("configAiProvider");

  if (isConfigOpen) {
    configPanel.style.display = "flex";
    mainPanel.style.display = "none";
    container.classList.add("config-mode");

    // Reset user modification flag when opening config
    if (aiProvider) {
      aiProvider.dataset.userModified = "false";
    }

    updateConfigUI();
  } else {
    configPanel.style.display = "none";
    mainPanel.style.display = "block";
    container.classList.remove("config-mode");
  }
}

function saveConfig() {
  const aiProvider = document.getElementById("configAiProvider").value;
  const apiKey = document.getElementById("configApiKey").value.trim();

  console.log("saveConfig - Reading values:", { aiProvider, apiKey });
  console.log(
    "saveConfig - Dropdown element:",
    document.getElementById("configAiProvider")
  );
  console.log(
    "saveConfig - Selected index:",
    document.getElementById("configAiProvider").selectedIndex
  );

  settings.aiProvider = aiProvider;
  settings.apiKey = apiKey;

  console.log("saveConfig - Updated settings:", settings);

  // Save to chrome storage
  window.parent.postMessage(
    {
      type: "SAVE_CONFIG",
      data: { aiProvider, apiKey },
    },
    "*"
  );

  // Show success message briefly, then close
  const status = document.getElementById("configStatus");
  status.textContent = "Settings saved successfully!";
  status.style.display = "block";

  // Close config panel and trigger immediate API call if we have an API key
  setTimeout(() => {
    status.style.display = "none";
    toggleConfig(); // Close config panel

    // Trigger immediate API call if we now have an API key
    if (settings.apiKey) {
      setTimeout(() => {
        generateTip();
        // Also restart the tip interval for regular updates
        startTipInterval();
      }, 500);
    }
  }, 500);
}

function getTip() {
  if (isGenerating) return;

  const randomTip =
    prewrittenTips[Math.floor(Math.random() * prewrittenTips.length)];
  showMessage(randomTip);
}

async function generateOpenAITip(apiKey, context) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: promptConfig.system,
        },
        {
          role: "user",
          content: promptConfig.user(context),
        },
      ],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || prewrittenTips[0];
}

async function generateGeminiTip(apiKey, context) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${promptConfig.system}

${promptConfig.user(context)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || prewrittenTips[0];
}

async function getAITip() {
  if (isGenerating) return;

  if (!settings.apiKey) {
    showMessage(
      "Please configure your API key in settings to get tips! Click me ---->",
      "error"
    );
    return;
  }

  // Prevent concurrent requests
  isGenerating = true;

  try {
    // Create context string from website information
    let context;

    if (websiteContext?.bodyContent) {
      // Extract clean text content without HTML tags
      const cleanText = extractCleanText(websiteContext.bodyContent);
      const textSnippet = cleanText.slice(0, 15000); // Use first 5k chars for context
      context = `a webpage with the following text content: ${textSnippet}`;
    } else if (websiteContext?.title) {
      // Fallback to title and domain if body content not available
      context = `"${websiteContext.title}" on ${websiteContext.domain}`;
    } else {
      context = `the website ${websiteContext?.domain || "this website"}`;
    }

    let aiTip;

    switch (settings.aiProvider) {
      case "openai":
        aiTip = await generateOpenAITip(settings.apiKey, context);
        break;
      case "gemini":
        aiTip = await generateGeminiTip(settings.apiKey, context);
        break;
      default:
        throw new Error("Unknown AI provider");
    }

    showMessage(aiTip, "success");
  } catch (error) {
    console.error("AI request failed:", error);

    // More specific error messages
    let errorMessage = "It looks like there's a problem with the AI service!";
    if (
      error.message.includes("401") ||
      error.message.includes("unauthorized")
    ) {
      errorMessage =
        "It looks like your API key isn't working! Check your settings.";
    } else if (
      error.message.includes("429") ||
      error.message.includes("quota")
    ) {
      errorMessage =
        "It looks like you've used up your API quota! Try again later.";
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      errorMessage =
        "It looks like there's a network problem! Check your connection.";
    }

    showMessage(errorMessage, "error");

    // Show fallback tip after a shorter delay
    setTimeout(() => {
      const fallbackTip =
        prewrittenTips[Math.floor(Math.random() * prewrittenTips.length)];
      showMessage(fallbackTip);
    }, 2000);
  } finally {
    // Always reset the generating flag
    isGenerating = false;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Clippy loaded and ready!");

  // Add event listeners
  document
    .querySelector(".close-button")
    .addEventListener("click", toggleClippy);
  document
    .getElementById("clippyAvatar")
    .addEventListener("click", toggleConfig);
  document
    .getElementById("saveConfigBtn")
    .addEventListener("click", saveConfig);
  document
    .getElementById("cancelConfigBtn")
    .addEventListener("click", toggleConfig);
  document
    .getElementById("configAiProvider")
    .addEventListener("change", function () {
      // Mark that user has manually changed the selection
      this.dataset.userModified = "true";
      updateConfigUI();
    });

  // Start random blinking
  startBlinking();
});

// Random blinking functionality
function startBlinking() {
  const eyes = document.querySelectorAll(".eye");

  function blink() {
    eyes.forEach((eye) => {
      eye.style.transform = "scaleY(0.1)";
    });

    setTimeout(() => {
      eyes.forEach((eye) => {
        eye.style.transform = "scaleY(1)";
      });
    }, 150);
  }

  // Blink at random intervals
  function scheduleNextBlink() {
    const delay = Math.random() * 4000 + 2000; // Between 2-6 seconds
    setTimeout(() => {
      blink();
      scheduleNextBlink();
    }, delay);
  }

  scheduleNextBlink();
}
