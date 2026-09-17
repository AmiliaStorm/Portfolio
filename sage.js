const sage = document.getElementById("sage");
const sageBody = document.getElementById("sageBody");
const sageBubble = document.getElementById("sageBubble");
const sagePanel = document.getElementById("sagePanel");
const sageClose = document.getElementById("sageClose");
const sageMessages = document.getElementById("sageMessages");
const sageForm = document.getElementById("sageForm");
const sageInput = document.getElementById("sageInput");

const actionButtons = document.querySelectorAll(
  "[data-sage-action]"
);


// ==========================================================
// SAGE brain endpoint (Cloudflare Worker → OpenAI API)
// Only called when local keyword matching finds nothing —
// known intents (projects/skills/about/etc.) stay instant
// and free via getResponseForInput() below.
// ==========================================================

const SAGE_API_URL = "https://sage-api.amiliast.workers.dev";

// Short rolling history so follow-up questions have context.
// Not persisted across page loads — resets on refresh.
const conversationHistory = [];


// ==========================================================
// SAGE state
// ==========================================================

const state = {
  panelOpen: false,

  activeSection: "hero",

  currentTargetElement: null,

  bubbleTimeout: null,

  // Cools down after a state change so setState() calls from the
  // chat flow (thinking/talking) don't get immediately stomped by
  // something else — e.g. don't drop back to idle mid-reply.
  stateLockUntil: 0
};


// ==========================================================
// Talk to the avatar's state machine, with a short lock so
// rapid-fire calls (e.g. a local reply immediately followed by
// handleAction) don't fight each other.
// ==========================================================

function setAvatarState(name, lockMs = 0) {

  if (!window.SAGEAvatar) return;

  if (performance.now() < state.stateLockUntil && lockMs === 0) {
    return;
  }

  window.SAGEAvatar.setState(name);

  if (lockMs > 0) {
    state.stateLockUntil = performance.now() + lockMs;
  }

}


// ==========================================================
// Follow her real rendered position every frame instead of
// computing an independent path — sage-avatar.js is now the
// single source of truth for where she actually is.
// ==========================================================

function followAvatarPosition() {

  const pos =
    window.SAGEAvatar?.getScreenPosition?.();

  if (pos) {

    sage.style.transform =
      `translate3d(${pos.x - 48}px, ${pos.y - 48}px, 0)`;

  }

  requestAnimationFrame(followAvatarPosition);

}


// ==========================================================
// Temporary local portfolio knowledge
// ==========================================================

const localKnowledge = {
  projects:
    "Amilia’s strongest highlighted projects include COVID-19 single-cell transcriptomics, the Biological Age Predictor, and the Cell Function Explorer.",

  skills:
    "Amilia’s portfolio combines bioinformatics, data analysis, machine learning, software development, and scientific visualization.",

  about:
    "Amilia is a bioinformatics student focused on computational biology, scientific software, and turning biological complexity into understandable tools and insights.",

  cv:
    "You can open Amilia’s resume directly from the portfolio."
};


// ==========================================================
// Chat messages
// ==========================================================

function addMessage(role, text) {
  const message = document.createElement("div");

  message.className =
    role === "user"
      ? "sage__message sage__message--user"
      : "sage__message sage__message--sage";

  message.textContent = text;

  sageMessages.appendChild(message);

  sageMessages.scrollTop =
    sageMessages.scrollHeight;

  return message;
}


// ==========================================================
// Typing indicator (shown while waiting on the AI fallback)
// ==========================================================

function showTyping() {
  const el = addMessage("sage", "…");
  el.classList.add("sage__message--typing");
  return el;
}

function removeTyping(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}


// ==========================================================
// SAGE speech bubble
// ==========================================================

function showBubble(text, duration = 2600) {
  sageBubble.textContent = text;

  sageBubble.classList.add("is-visible");

  clearTimeout(state.bubbleTimeout);

  state.bubbleTimeout = setTimeout(() => {

    if (!state.panelOpen) {
      sageBubble.classList.remove("is-visible");
    }

  }, duration);
}


// ==========================================================
// Chat panel
// ==========================================================

function openPanel() {
  state.panelOpen = true;

  sagePanel.classList.add("is-open");

  sagePanel.setAttribute(
    "aria-hidden",
    "false"
  );

  sageBody.setAttribute(
    "aria-expanded",
    "true"
  );

  sage.classList.add("sage--active");

  sageBubble.classList.remove(
    "is-visible"
  );

  setAvatarState("curious");

  sageInput.focus();
}


function closePanel() {
  state.panelOpen = false;

  sagePanel.classList.remove(
    "is-open"
  );

  sagePanel.setAttribute(
    "aria-hidden",
    "true"
  );

  sageBody.setAttribute(
    "aria-expanded",
    "false"
  );

  sage.classList.remove(
    "sage--active"
  );

  setAvatarState("idle");
}


function togglePanel() {

  if (state.panelOpen) {
    closePanel();
  } else {
    openPanel();
  }

}


// ==========================================================
// Highlighting
// ==========================================================

function clearHighlight() {

  if (state.currentTargetElement) {

    state.currentTargetElement.classList.remove(
      "sage-highlight"
    );

    state.currentTargetElement = null;
  }

}


function highlightElement(element) {

  clearHighlight();

  if (!element) return;

  state.currentTargetElement = element;

  element.classList.add(
    "sage-highlight"
  );

  setTimeout(() => {

    if (
      state.currentTargetElement === element
    ) {
      clearHighlight();
    }

  }, 2400);
}


// ==========================================================
// Portfolio navigation
// ==========================================================

function goToSection(id) {

  const section =
    document.getElementById(id);

  if (!section) return;

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  highlightElement(section);
}


// ==========================================================
// Resume
// ==========================================================

function openResume() {

  const resumeLink =
    document.querySelector(
      '.nav a[href$=".pdf"]'
    ) ||
    document.querySelector(
      'a[href$=".pdf"]'
    );

  if (!resumeLink) {

    addMessage(
      "sage",
      "I can’t find the resume link right now."
    );

    return;
  }

  window.open(
    resumeLink.href,
    "_blank",
    "noopener,noreferrer"
  );
}


// ==========================================================
// SAGE actions
// ==========================================================

function handleAction(
  action,
  options = {}
) {

  const {
    addReply = true
  } = options;


  switch (action) {

    case "projects":

      if (addReply) {

        addMessage(
          "sage",
          localKnowledge.projects
        );

      }

      goToSection("projects");

      showBubble(
        "Let me show you the projects ✦",
        2200
      );

      break;


    case "skills":

      if (addReply) {

        addMessage(
          "sage",
          localKnowledge.skills
        );

      }

      goToSection("skills");

      showBubble(
        "Here are the key skills.",
        2200
      );

      break;


    case "about":

      if (addReply) {

        addMessage(
          "sage",
          localKnowledge.about
        );

      }

      goToSection("about");

      showBubble(
        "This section gives more context.",
        2200
      );

      break;


    case "cv":

      if (addReply) {

        addMessage(
          "sage",
          localKnowledge.cv
        );

      }

      openResume();

      break;


    default:

      if (addReply) {

        addMessage(
          "sage",
          "I’m still learning how to help with that."
        );

      }

  }

}


// ==========================================================
// Temporary local brain
// Returns a match object, or null if nothing matched — a null
// result is what triggers the AI fallback in the submit handler.
// ==========================================================

function getResponseForInput(input) {

  const q =
    input.toLowerCase();


  if (
    q.includes("covid") ||
    q.includes("single-cell") ||
    q.includes("single cell") ||
    q.includes("scrna")
  ) {

    return {
      reply:
        "The COVID-19 Single-Cell Transcriptomics project analyses more than 81,000 peripheral blood immune cells using single-cell RNA sequencing and Seurat.",

      action: "projects"
    };

  }


  if (
    q.includes("biological age") ||
    q.includes("mortality") ||
    q.includes("random forest")
  ) {

    return {
      reply:
        "The Biological Age Predictor combines biomarker data, mortality modelling, SQL, and machine learning using a Random Forest model.",

      action: "projects"
    };

  }


  if (
    q.includes("cell explorer") ||
    q.includes("cell function") ||
    q.includes("three.js") ||
    q.includes("blender") ||
    q.includes("3d")
  ) {

    return {
      reply:
        "The Cell Function Explorer is an interactive 3D biological visualization project using JavaScript, Three.js, WebGL, and scientific visualization.",

      action: "projects"
    };

  }


  if (
    q.includes("project") ||
    q.includes("portfolio") ||
    q.includes("work")
  ) {

    return {
      reply:
        localKnowledge.projects,

      action: "projects"
    };

  }


  if (
    q.includes("skill") ||
    q.includes("tools") ||
    q.includes("technology") ||
    q.includes("technologies") ||
    q.includes("programming")
  ) {

    return {
      reply:
        localKnowledge.skills,

      action: "skills"
    };

  }


  if (
    q.includes("about") ||
    q.includes("who is") ||
    q.includes("amilia")
  ) {

    return {
      reply:
        localKnowledge.about,

      action: "about"
    };

  }


  if (
    q.includes("cv") ||
    q.includes("resume")
  ) {

    return {
      reply:
        localKnowledge.cv,

      action: "cv"
    };

  }


  if (
    q.includes("data") ||
    q.includes("machine learning")
  ) {

    return {
      reply:
        "A strong example is the Biological Age Predictor, which combines biomarker data, mortality modelling, SQL, and machine learning.",

      action: "projects"
    };

  }


  return null;

}


// ==========================================================
// AI fallback
// ==========================================================

async function getAIResponse(message) {

  try {

    const response = await fetch(SAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error("Worker responded with " + response.status);
    }

    const data = await response.json();

    return (
      data.reply ||
      "I couldn't quite process that — try rephrasing, or use one of the quick topics below."
    );

  } catch (err) {

    console.error("SAGE AI fallback failed:", err);

    return "I'm having trouble reaching my full knowledge right now. I can still help with projects, skills, Amilia's background, and her resume.";

  }

}


// ==========================================================
// Section awareness
// ==========================================================

function observeSections() {

  const observed = [];


  const hero =
    document.querySelector(".hero");


  if (hero) {

    hero.dataset.sageSection =
      "hero";

    observed.push(hero);

  }


  [
    "projects",
    "skills",
    "about"
  ].forEach((id) => {

    const el =
      document.getElementById(id);


    if (el) {

      el.dataset.sageSection =
        id;

      observed.push(el);

    }

  });


  const footer =
    document.querySelector(
      ".footer"
    );


  if (footer) {

    footer.dataset.sageSection =
      "footer";

    observed.push(footer);

  }


  const observer =
    new IntersectionObserver(

      (entries) => {

        const visible =
          entries
            .filter(
              (entry) =>
                entry.isIntersecting
            )

            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            );


        if (!visible.length) {
          return;
        }


        const nextSection =
          visible[0]
            .target
            .dataset
            .sageSection;


        if (
          !nextSection ||
          nextSection ===
            state.activeSection
        ) {

          return;

        }


        state.activeSection =
          nextSection;


        // Don't interrupt while chat is open
        if (state.panelOpen) {
          return;
        }


        const hints = {

          hero:
            "Hi — I’m SAGE ✦",

          projects:
            "Want help choosing a project?",

          skills:
            "These are the core skill areas.",

          about:
            "This section gives more background.",

          footer:
            "Need a link or contact point?"

        };


        showBubble(
          hints[nextSection] ||
            "I’m here if you need me.",

          1800
        );

      },

      {
        threshold: [
          0.3,
          0.55,
          0.75
        ]
      }

    );


  observed.forEach(
    (el) =>
      observer.observe(el)
  );

}


// ==========================================================
// SAGE click
// ==========================================================

sageBody.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    togglePanel();

  }
);


// ==========================================================
// Close chat
// ==========================================================

sageClose.addEventListener(
  "click",
  closePanel
);


// ==========================================================
// Suggestions
// ==========================================================

actionButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.sageAction;

        handleAction(action);

      }
    );

  }
);


// ==========================================================
// User sends chat message
// ==========================================================

sageForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const message =
      sageInput.value.trim();


    if (!message) {
      return;
    }


    addMessage(
      "user",
      message
    );


    sageInput.value = "";


    const result =
      getResponseForInput(
        message
      );

    if (result) {

      setAvatarState("talking", 2200);

      setTimeout(() => {

        addMessage(
          "sage",
          result.reply
        );

        conversationHistory.push(
          { role: "user", content: message },
          { role: "assistant", content: result.reply }
        );

        
        // Don't add the same reply twice.
        if (result.action) {

          handleAction(
            result.action,
            {
              addReply: false
            }
          );

        }

      }, 420);

      return;

    }



    setAvatarState("thinking", 60000);

    const typingEl = showTyping();

    getAIResponse(message).then((reply) => {

      removeTyping(typingEl);

      addMessage("sage", reply);

      conversationHistory.push(
        { role: "user", content: message },
        { role: "assistant", content: reply }
      );

      setAvatarState("talking", 2200);

    });

  }
);


// ==========================================================
// Click outside chat
// ==========================================================

document.addEventListener(
  "click",
  (event) => {

    const clickedInsidePanel =
      sagePanel.contains(
        event.target
      );


    const clickedBody =
      sageBody.contains(
        event.target
      );


    if (
      !clickedInsidePanel &&
      !clickedBody &&
      state.panelOpen
    ) {

      closePanel();

    }

  }
);


// ==========================================================
// Start SAGE
// ==========================================================

window.addEventListener(
  "load",
  () => {

    observeSections();


    requestAnimationFrame(
      followAvatarPosition
    );


    // Initial greeting
    showBubble(
      "Hi — I’m SAGE ✦",
      2500
    );


    // Second hint
    setTimeout(() => {

      showBubble(
        "Click me to explore the portfolio.",
        2600
      );

    }, 4200);

  }
);
