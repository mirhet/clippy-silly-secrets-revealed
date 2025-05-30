// Clippy iframe script
(function () {
  "use strict";

  let currentWebsite = "this website";
  let pageContext = {};
  let aiProvider = "openai";
  let apiKey = "";
  let isGenerating = false;

  const fallbackTips = [
    "Did you know this website has pixels? That's how you can see it!",
    "I notice you're using a browser. Browsers browse things!",
    "This webpage appears to be on the internet. Fascinating!",
    "Pro tip: The scroll wheel scrolls things. Revolutionary!",
    "I see you're reading text. Text contains letters, which form words!",
    "This website uses colors. Colors are like feelings but for your eyes!",
    "Fun fact: Clicking things makes them clickable!",
    "I detect you have eyes. Perfect for seeing websites with!",
    "This page loads when you load it. Incredible technology!",
    "Did you know websites are made of code? Code is like recipes but nerdier!",
    "I notice this website has a layout. Layouts arrange things!",
    "This page uses fonts. Fonts are shapes that represent sounds!",
    "I see buttons here. Buttons are clickable rectangles of possibility!",
    "This website has content. Content is stuff that fills empty spaces!",
  ];

  const speechBubble = document.getElementById("speechBubble");
  const bubbleContent = document.getElementById("bubbleContent");
  const newTipBtn = document.getElementById("newTipBtn");
  const closeBubbleBtn = document.getElementById("closeBubbleBtn");
  const clippyCharacter = document.getElementById("clippyCharacter");

  // Generate AI tip using selected provider
  async function generateAITip() {
    if (!apiKey) {
      return "Please configure your API key in settings to get tips Click me ---->";
    }

    const prompt = `You are Clippy, the overly enthusiastic but completely useless Microsoft Office assistant. Give a hilariously unhelpful "tip" about this website: ${currentWebsite}. 

Website context:
- URL: ${pageContext.url}
- Title: ${pageContext.title}
- Main headings: ${pageContext.headings?.join(", ") || "None found"}
- Description: ${pageContext.description || "No description"}

Be cheerful, slightly condescending, and state the obvious as if it's profound wisdom. Keep it under 120 characters. Sound excited about mundane things.`;

    try {
      let response;

      if (aiProvider === "openai") {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content:
                  "You are Clippy, the overly enthusiastic but completely useless Microsoft Office assistant.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.9,
          }),
        });

        if (!response.ok) throw new Error("OpenAI API request failed");
        const data = await response.json();
        return data.choices[0]?.message?.content || getRandomFallbackTip();
      } else if (aiProvider === "gemini") {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
                      text: prompt,
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

        if (!response.ok) throw new Error("Gemini API request failed");
        const data = await response.json();
        return (
          data.candidates[0]?.content?.parts[0]?.text || getRandomFallbackTip()
        );
      }
    } catch (error) {
      console.log("Using fallback tip due to error:", error);
      return getRandomFallbackTip();
    }
  }

  function getRandomFallbackTip() {
    return fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
  }

  async function showNewTip() {
    if (isGenerating) return;

    isGenerating = true;
    bubbleContent.innerHTML = `
      <div class="generating">
        <div class="spinner"></div>
        <span>Thinking of something useless...</span>
      </div>
    `;
    speechBubble.classList.remove("hidden");

    try {
      const tip = await generateAITip();

      setTimeout(() => {
        bubbleContent.textContent = tip;
      }, 1000);
    } catch (error) {
      console.error("Error generating tip:", error);
      setTimeout(() => {
        bubbleContent.textContent = getRandomFallbackTip();
      }, 1000);
    } finally {
      // Reset the generating flag after a delay to account for the display transition
      setTimeout(() => {
        isGenerating = false;
      }, 1000);
    }
  }

  // Event listeners
  newTipBtn.addEventListener("click", showNewTip);

  closeBubbleBtn.addEventListener("click", () => {
    speechBubble.classList.add("hidden");
  });

  clippyCharacter.addEventListener("click", () => {
    if (speechBubble.classList.contains("hidden")) {
      showNewTip();
    } else {
      speechBubble.classList.add("hidden");
    }
  });

  // Listen for messages from content script
  window.addEventListener("message", function (event) {
    if (event.data.type === "WEBSITE_CONTEXT") {
      const data = event.data.data;
      currentWebsite = `${data.title} (${data.domain})`;
      pageContext = data;
      aiProvider = data.aiProvider;
      apiKey = data.apiKey;

      // Show initial tip after context is set
      setTimeout(showNewTip, 1000);
    }
  });

  // Auto-generate tips periodically
  setInterval(() => {
    if (!speechBubble.classList.contains("hidden") && !isGenerating) {
      showNewTip();
    }
  }, 20000);
})();
