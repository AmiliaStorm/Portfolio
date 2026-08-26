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
// SAGE state
// ==========================================================

const state = {
  panelOpen: false,

  activeSection: "hero",

  // Start SAGE farther inside the viewport
  currentX: window.innerWidth - 330,
  currentY: 190,

  targetX: window.innerWidth - 330,
  targetY: 190,

  lastMoveAt: 0,

  currentTargetElement: null,

  bubbleTimeout: null
};


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
// ==========================================================

function getResponseForInput(input) {

  const q =
    input.toLowerCase();


  // --------------------------------------------------------
  // Specific projects first
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // General projects
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // Skills
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // About
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // Resume
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // Machine learning / data
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // Unknown
  // --------------------------------------------------------

  return {
    reply:
      "I can currently help with projects, skills, Amilia’s background, and portfolio navigation. My full AI knowledge layer is still being built.",

    action: null
  };

}


// ==========================================================
// Safe movement zones
// ==========================================================

function getSafeZone(sectionName) {

  const vw =
    window.innerWidth;

  const vh =
    window.innerHeight;


  // Mobile
  if (vw <= 700) {

    return {
      x: vw - 110,
      y: 150,

      radiusX: 15,
      radiusY: 30
    };

  }


  // Desktop
  const map = {

    hero: {
      x: vw - 330,
      y: 190,

      radiusX: 35,
      radiusY: 45
    },


    projects: {
      x: vw - 320,
      y: 235,

      radiusX: 45,
      radiusY: 45
    },


    skills: {
      x: vw - 340,
      y: 230,

      radiusX: 45,
      radiusY: 45
    },


    about: {
      x: vw - 330,
      y: vh - 230,

      radiusX: 45,
      radiusY: 40
    },


    footer: {
      x: vw - 320,
      y: vh - 190,

      radiusX: 40,
      radiusY: 35
    }

  };


  return (
    map[sectionName] ||
    map.hero
  );

}


// ==========================================================
// Choose new movement target
// ==========================================================

function setNewTarget() {

  const zone =
    getSafeZone(
      state.activeSection
    );


  const offsetX =
    (Math.random() * 2 - 1) *
    zone.radiusX;


  const offsetY =
    (Math.random() * 2 - 1) *
    zone.radiusY;


  // Hard safety boundaries
  const minX = 120;

  const maxX =
    window.innerWidth <= 700
      ? window.innerWidth - 90
      : window.innerWidth - 280;


  const minY = 110;

  const maxY =
    window.innerHeight - 120;


  state.targetX =
    Math.max(
      minX,
      Math.min(
        zone.x + offsetX,
        maxX
      )
    );


  state.targetY =
    Math.max(
      minY,
      Math.min(
        zone.y + offsetY,
        maxY
      )
    );

}


// ==========================================================
// Floating animation
// ==========================================================

function animate() {

  const dx =
    state.targetX -
    state.currentX;


  const dy =
    state.targetY -
    state.currentY;


  // Smooth movement
  state.currentX +=
    dx * 0.025;


  state.currentY +=
    dy * 0.025;


  sage.style.transform =
    `translate3d(
      ${state.currentX}px,
      ${state.currentY}px,
      0
    )`;


  const now =
    performance.now();


  // Pick a new target every few seconds
  if (
    !state.panelOpen &&
    now - state.lastMoveAt > 3800
  ) {

    setNewTarget();

    state.lastMoveAt =
      now;

  }


  requestAnimationFrame(
    animate
  );

}


// ==========================================================
// Section awareness
// ==========================================================

function observeSections() {

  const observed = [];


  // --------------------------------------------------------
  // Hero
  // --------------------------------------------------------

  const hero =
    document.querySelector(".hero");


  if (hero) {

    hero.dataset.sageSection =
      "hero";

    observed.push(hero);

  }


  // --------------------------------------------------------
  // Main sections
  // --------------------------------------------------------

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


  // --------------------------------------------------------
  // Footer
  // --------------------------------------------------------

  const footer =
    document.querySelector(
      ".footer"
    );


  if (footer) {

    footer.dataset.sageSection =
      "footer";

    observed.push(footer);

  }


  // --------------------------------------------------------
  // Observer
  // --------------------------------------------------------

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


        setNewTarget();


        state.lastMoveAt =
          performance.now();


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
// Suggested actions
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


    // Small delay makes SAGE feel less robotic
    setTimeout(() => {

      addMessage(
        "sage",
        result.reply
      );


      // Important:
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
// Window resize
// ==========================================================

window.addEventListener(
  "resize",
  () => {

    // Keep SAGE safely inside viewport
    state.currentX =
      Math.max(
        120,
        Math.min(
          state.currentX,
          window.innerWidth - 280
        )
      );


    state.currentY =
      Math.max(
        110,
        Math.min(
          state.currentY,
          window.innerHeight - 120
        )
      );


    setNewTarget();

  }
);


// ==========================================================
// Start SAGE
// ==========================================================

window.addEventListener(
  "load",
  () => {

    // Desktop
    if (
      window.innerWidth > 700
    ) {

      state.currentX =
        window.innerWidth - 330;

      state.currentY =
        190;

    }

    // Mobile
    else {

      state.currentX =
        window.innerWidth - 110;

      state.currentY =
        150;

    }


    state.targetX =
      state.currentX;


    state.targetY =
      state.currentY;


    state.lastMoveAt =
      performance.now();


    observeSections();


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


    requestAnimationFrame(
      animate
    );

  }
);
